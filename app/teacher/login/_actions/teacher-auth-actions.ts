"use server"

import prisma from "@/lib/prisma"
import {
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

// Login action for teachers
export async function loginAsTeacher(
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

    // Find the teacher user
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        schoolId: school.id,
        role: UserRole.TEACHER,
      },
      include: {
        teacherProfile: true,
        classTeacherOf: {
          select: {
            id: true,
            name: true,
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
    console.error("Teacher login error:", error)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}

// Logout action - destroys only the teacher session
export async function logoutTeacher(): Promise<void> {
  await destroySession(UserRole.TEACHER)
}

// Get current teacher session - checks teacher-specific cookie
export async function getCurrentTeacher() {
  const session = await getSession(UserRole.TEACHER)
  
  if (!session || session.user.role !== UserRole.TEACHER) {
    return null
  }
  
  return session
}
