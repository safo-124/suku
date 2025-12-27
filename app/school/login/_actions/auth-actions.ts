"use server"

import { redirect } from "next/navigation"
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

// Login action
export async function loginToSchool(
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

    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        schoolId: school.id,
        role: {
          in: [UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
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
      mustResetPassword: user.mustResetPassword,
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
    console.error("Login error:", error)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}

// Logout action - destroys session for the current user's role
export async function logoutFromSchool(): Promise<void> {
  const session = await getSession()
  if (session) {
    await destroySession(session.user.role)
  } else {
    // Fallback: destroy all sessions
    await destroySession()
  }
}

// Get current user session for school admin
export async function getCurrentUser() {
  // First try to get school admin session specifically
  const schoolAdminSession = await getSession(UserRole.SCHOOL_ADMIN)
  if (schoolAdminSession) {
    return schoolAdminSession
  }
  // Fallback to any session for backwards compatibility
  return getSession()
}

// Change password
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession()
    if (!session) {
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

    // Hash and update, and clear the mustResetPassword flag
    const hashedPassword = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        passwordHash: hashedPassword,
        mustResetPassword: false,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Change password error:", error)
    return { success: false, error: "Failed to change password" }
  }
}

// Set new password (for forced password reset - doesn't require old password)
export async function setNewPassword(
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, error: "Not authenticated" }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Only allow this if the user must reset their password
    if (!user.mustResetPassword) {
      return { success: false, error: "Password reset not required" }
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return { success: false, error: "Passwords do not match" }
    }

    // Validate new password
    if (newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" }
    }

    // Hash and update, and clear the mustResetPassword flag
    const hashedPassword = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        passwordHash: hashedPassword,
        mustResetPassword: false,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Set new password error:", error)
    return { success: false, error: "Failed to set new password" }
  }
}

// Request password reset (sends email with reset link)
export async function requestPasswordReset(
  email: string,
  schoolSlug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug.toLowerCase() },
    })

    if (!school) {
      // Don't reveal if school exists
      return { success: true }
    }

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        schoolId: school.id,
      },
    })

    if (!user) {
      // Don't reveal if user exists
      return { success: true }
    }

    // In a real app, generate reset token and send email
    // For now, just return success
    // TODO: Implement email sending with reset token

    return { success: true }
  } catch (error) {
    console.error("Password reset request error:", error)
    return { success: false, error: "Failed to process request" }
  }
}

// Create a demo user for testing (development only)
export async function createDemoSchoolAdmin(
  schoolSlug: string
): Promise<{ success: boolean; email?: string; password?: string; error?: string }> {
  if (process.env.NODE_ENV === "production") {
    return { success: false, error: "Not available in production" }
  }

  try {
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug.toLowerCase() },
    })

    if (!school) {
      return { success: false, error: "School not found" }
    }

    const email = `admin@${schoolSlug}.demo`
    const password = "password123"
    const hashedPassword = await hashPassword(password)

    // Check if demo user exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    })

    if (existingUser) {
      // Update password
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { passwordHash: hashedPassword },
      })
    } else {
      // Create new demo user
      await prisma.user.create({
        data: {
          email,
          firstName: "Demo",
          lastName: "Admin",
          passwordHash: hashedPassword,
          role: UserRole.SCHOOL_ADMIN,
          schoolId: school.id,
          isActive: true,
          emailVerified: true,
        },
      })
    }

    return { success: true, email, password }
  } catch (error) {
    console.error("Create demo user error:", error)
    return { success: false, error: "Failed to create demo user" }
  }
}
