"use server"

import prisma from "@/lib/prisma"
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  getSession,
  type AuthResult,
} from "@/lib/auth"
import { UserRole } from "@/app/generated/prisma/client"

// Get school info by slug (for login page display)
export async function getSchoolBySlug(slug: string) {
  if (!slug) {
    return null
  }

  try {
    const school = await prisma.school.findUnique({
      where: { slug: slug.toLowerCase() },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        phone: true,
        email: true,
        address: true,
        isActive: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
      },
    })

    return school
  } catch (error) {
    console.error("Error fetching school:", error)
    return null
  }
}

// Login action for students
export async function loginAsStudent(
  email: string,
  password: string,
  schoolSlug: string
): Promise<AuthResult> {
  try {
    // Validate inputs
    if (!email || !password) {
      return { success: false, error: "Email and password are required" }
    }

    if (!schoolSlug) {
      return { success: false, error: "School not found" }
    }

    // Find the school
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug.toLowerCase() },
    })

    if (!school) {
      return { success: false, error: "School not found" }
    }

    if (!school.isActive) {
      return { success: false, error: "This school is currently inactive. Please contact support." }
    }

    // Find the student user
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        schoolId: school.id,
        role: UserRole.STUDENT,
      },
      include: {
        studentProfile: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return { success: false, error: "Invalid email or password" }
    }

    if (!user.isActive) {
      return { success: false, error: "Your account has been deactivated. Please contact your administrator." }
    }

    if (!user.passwordHash) {
      return { success: false, error: "Password not set. Please contact your administrator." }
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return { success: false, error: "Invalid email or password" }
    }

    // Create session with role-specific cookie
    await createSession(user.id, user.role)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        schoolId: user.schoolId,
        schoolSlug: school.slug,
        schoolName: school.name,
      },
    }
  } catch (error) {
    console.error("Student login error:", error)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}

// Logout action - destroys only the student session
export async function logoutStudent(): Promise<void> {
  await destroySession(UserRole.STUDENT)
}

// Get current student session
// Get current student session - checks student-specific cookie
export async function getCurrentStudent() {
  const session = await getSession(UserRole.STUDENT)
  
  if (!session || session.user.role !== UserRole.STUDENT) {
    return null
  }
  
  return session
}

// Change password
export async function changeStudentPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession(UserRole.STUDENT)
    if (!session || session.user.role !== UserRole.STUDENT) {
      return { success: false, error: "Not authenticated" }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !user.passwordHash) {
      return { success: false, error: "User not found" }
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash)
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" }
    }

    // Validate new password
    if (newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters" }
    }

    // Hash and update
    const hashedPassword = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    })

    return { success: true }
  } catch (error) {
    console.error("Change password error:", error)
    return { success: false, error: "Failed to change password" }
  }
}
