"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import { SubscriptionPlan, SubscriptionStatus, UserRole } from "@/app/generated/prisma/client"

export interface CreateSchoolInput {
  name: string
  slug: string
  email?: string
  phone?: string
  address?: string
  subscriptionPlan: SubscriptionPlan
  maxStudents: number
  maxTeachers: number
}

export interface CreateSchoolAdminInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  password?: string // For initial setup, will be hashed
}

export interface CreateSchoolWithAdminInput extends CreateSchoolInput {
  admin?: CreateSchoolAdminInput
}

export interface UpdateSchoolInput extends Partial<CreateSchoolInput> {
  id: string
}

// Check if a slug is available
export async function checkSlugAvailability(slug: string, excludeId?: string) {
  try {
    const existingSchool = await prisma.school.findFirst({
      where: {
        slug: slug.toLowerCase(),
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    })
    return { available: !existingSchool }
  } catch (error) {
    console.error("Error checking slug:", error)
    return { available: false, error: "Failed to check availability" }
  }
}

// Check if an email is available for a new user
export async function checkEmailAvailability(email: string, excludeId?: string) {
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    })
    return { available: !existingUser }
  } catch (error) {
    console.error("Error checking email:", error)
    return { available: false, error: "Failed to check availability" }
  }
}

// Password hashing is now handled by lib/auth.ts hashPassword function

// Generate a temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function createSchool(data: CreateSchoolWithAdminInput) {
  try {
    // Check if slug is already taken
    const existingSchool = await prisma.school.findUnique({
      where: { slug: data.slug },
    })

    if (existingSchool) {
      return { success: false, error: "This subdomain is already taken" }
    }

    // If admin data is provided, check email availability
    if (data.admin?.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.admin.email.toLowerCase() },
      })
      if (existingUser) {
        return { success: false, error: "Admin email is already registered" }
      }
    }

    // Create school with optional admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the school
      const school = await tx.school.create({
        data: {
          name: data.name,
          slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          subscriptionPlan: data.subscriptionPlan,
          subscriptionStatus: SubscriptionStatus.TRIAL,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          maxStudents: data.maxStudents,
          maxTeachers: data.maxTeachers,
        },
      })

      let admin = null
      let tempPassword = null

      // Create school admin if provided
      if (data.admin) {
        tempPassword = data.admin.password || generateTempPassword()
        const hashedPwd = await hashPassword(tempPassword)
        
        admin = await tx.user.create({
          data: {
            email: data.admin.email.toLowerCase(),
            firstName: data.admin.firstName,
            lastName: data.admin.lastName,
            phone: data.admin.phone || null,
            passwordHash: hashedPwd,
            role: UserRole.SCHOOL_ADMIN,
            schoolId: school.id,
            isActive: true,
            emailVerified: false,
          },
        })
      }

      return { school, admin, tempPassword }
    })

    revalidatePath("/super-admin/schools")
    return { 
      success: true, 
      school: result.school, 
      admin: result.admin,
      tempPassword: result.tempPassword // Return temp password so it can be shown once
    }
  } catch (error) {
    console.error("Error creating school:", error)
    return { success: false, error: "Failed to create school" }
  }
}

export async function updateSchool(data: UpdateSchoolInput) {
  try {
    // If slug is being updated, check it's not taken
    if (data.slug) {
      const existingSchool = await prisma.school.findFirst({
        where: {
          slug: data.slug,
          NOT: { id: data.id },
        },
      })

      if (existingSchool) {
        return { success: false, error: "This subdomain is already taken" }
      }
    }

    const school = await prisma.school.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug?.toLowerCase().replace(/[^a-z0-9-]/g, ""),
        email: data.email,
        phone: data.phone,
        address: data.address,
        subscriptionPlan: data.subscriptionPlan,
        maxStudents: data.maxStudents,
        maxTeachers: data.maxTeachers,
      },
    })

    revalidatePath("/super-admin/schools")
    revalidatePath(`/super-admin/schools/${data.id}`)
    return { success: true, school }
  } catch (error) {
    console.error("Error updating school:", error)
    return { success: false, error: "Failed to update school" }
  }
}

export async function toggleSchoolStatus(schoolId: string, isActive: boolean) {
  try {
    await prisma.school.update({
      where: { id: schoolId },
      data: { isActive },
    })

    revalidatePath("/super-admin/schools")
    return { success: true }
  } catch (error) {
    console.error("Error toggling school status:", error)
    return { success: false, error: "Failed to update school status" }
  }
}

export async function deleteSchool(schoolId: string) {
  try {
    await prisma.school.delete({
      where: { id: schoolId },
    })

    revalidatePath("/super-admin/schools")
    return { success: true }
  } catch (error) {
    console.error("Error deleting school:", error)
    return { success: false, error: "Failed to delete school" }
  }
}

export async function updateSchoolSubscription(
  schoolId: string,
  plan: SubscriptionPlan,
  status: SubscriptionStatus
) {
  try {
    // Set limits based on plan
    let maxStudents = 50
    let maxTeachers = 10

    switch (plan) {
      case "BASIC":
        maxStudents = 100
        maxTeachers = 20
        break
      case "PROFESSIONAL":
        maxStudents = 500
        maxTeachers = 50
        break
      case "ENTERPRISE":
        maxStudents = 10000
        maxTeachers = 500
        break
    }

    await prisma.school.update({
      where: { id: schoolId },
      data: {
        subscriptionPlan: plan,
        subscriptionStatus: status,
        maxStudents,
        maxTeachers,
      },
    })

    revalidatePath("/super-admin/schools")
    revalidatePath(`/super-admin/schools/${schoolId}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating subscription:", error)
    return { success: false, error: "Failed to update subscription" }
  }
}

// Get school admins for a school
export async function getSchoolAdmins(schoolId: string) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        schoolId,
        role: UserRole.SCHOOL_ADMIN,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, admins }
  } catch (error) {
    console.error("Error fetching school admins:", error)
    return { success: false, error: "Failed to fetch admins", admins: [] }
  }
}

// Create a school admin for an existing school
export async function createSchoolAdmin(schoolId: string, data: CreateSchoolAdminInput) {
  try {
    // Check email availability
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })
    if (existingUser) {
      return { success: false, error: "Email is already registered" }
    }

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    })
    if (!school) {
      return { success: false, error: "School not found" }
    }

    const tempPassword = data.password || generateTempPassword()
    const hashedPwd = await hashPassword(tempPassword)

    const admin = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        passwordHash: hashedPwd,
        role: UserRole.SCHOOL_ADMIN,
        schoolId: schoolId,
        isActive: true,
        emailVerified: false,
      },
    })

    revalidatePath(`/super-admin/schools/${schoolId}`)
    return { 
      success: true, 
      admin,
      tempPassword // Return so it can be displayed once
    }
  } catch (error) {
    console.error("Error creating school admin:", error)
    return { success: false, error: "Failed to create admin" }
  }
}

// Update a school admin
export async function updateSchoolAdmin(
  adminId: string, 
  data: Partial<Omit<CreateSchoolAdminInput, 'password'>> & { isActive?: boolean }
) {
  try {
    // If email is being updated, check availability
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email.toLowerCase(),
          NOT: { id: adminId },
        },
      })
      if (existingUser) {
        return { success: false, error: "Email is already registered" }
      }
    }

    const admin = await prisma.user.update({
      where: { id: adminId },
      data: {
        ...(data.email && { email: data.email.toLowerCase() }),
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    revalidatePath(`/super-admin/schools/${admin.schoolId}`)
    return { success: true, admin }
  } catch (error) {
    console.error("Error updating school admin:", error)
    return { success: false, error: "Failed to update admin" }
  }
}

// Reset school admin password
export async function resetSchoolAdminPassword(adminId: string) {
  try {
    const tempPassword = generateTempPassword()
    const hashedPwd = await hashPassword(tempPassword)

    await prisma.user.update({
      where: { id: adminId },
      data: {
        passwordHash: hashedPwd,
      },
    })

    return { success: true, tempPassword }
  } catch (error) {
    console.error("Error resetting password:", error)
    return { success: false, error: "Failed to reset password" }
  }
}

// Delete school admin
export async function deleteSchoolAdmin(adminId: string) {
  try {
    const admin = await prisma.user.delete({
      where: { id: adminId },
    })

    revalidatePath(`/super-admin/schools/${admin.schoolId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting school admin:", error)
    return { success: false, error: "Failed to delete admin" }
  }
}
