"use server"

import { cookies, headers } from "next/headers"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { UserRole } from "@/app/generated/prisma/client"

// Session types
export interface SessionUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  schoolId: string | null
  schoolSlug?: string
  schoolName?: string
}

export interface Session {
  user: SessionUser
  expires: Date
}

// Cookie settings
const SESSION_COOKIE_NAME = "suku_session"
const SESSION_EXPIRY_DAYS = 7

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate a secure session token
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

// Create a new session for a user
export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken()
  const expires = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      sessionToken: token,
      userId,
      expires,
    },
  })

  // Set the cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  })

  return token
}

// Get the current session
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: {
      user: {
        include: {
          school: {
            select: {
              slug: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!session || session.expires < new Date()) {
    // Session expired or not found, clean up cookie
    cookieStore.delete(SESSION_COOKIE_NAME)
    if (session) {
      await prisma.session.delete({ where: { sessionToken: token } }).catch(() => {})
    }
    return null
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      role: session.user.role,
      schoolId: session.user.schoolId,
      schoolSlug: session.user.school?.slug,
      schoolName: session.user.school?.name,
    },
    expires: session.expires,
  }
}

// Destroy the current session
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (token) {
    await prisma.session.delete({ where: { sessionToken: token } }).catch(() => {})
    cookieStore.delete(SESSION_COOKIE_NAME)
  }
}

// Get the current school from subdomain (for school portal)
export async function getCurrentSchoolSlug(): Promise<string | null> {
  const headersList = await headers()
  
  // First check the x-school-slug header set by proxy
  const slugHeader = headersList.get("x-school-slug")
  if (slugHeader) {
    return slugHeader
  }
  
  // Fallback to referer URL parsing (for dev mode with query params)
  const referer = headersList.get("referer")
  if (referer) {
    try {
      const url = new URL(referer)
      const subdomain = url.searchParams.get("subdomain")
      if (subdomain && subdomain !== "admin" && subdomain !== "www") {
        return subdomain
      }
    } catch {
      // Invalid URL, ignore
    }
  }
  
  return null
}

// Get the current school from the database
export async function getCurrentSchool() {
  const slug = await getCurrentSchoolSlug()
  if (!slug) {
    return null
  }

  const school = await prisma.school.findUnique({
    where: { slug },
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
      maxStudents: true,
      maxTeachers: true,
    },
  })

  return school
}

// Verify that the current user has access to the school
export async function verifySchoolAccess(requiredRoles?: UserRole[]): Promise<{
  success: boolean
  session?: Session
  school?: Awaited<ReturnType<typeof getCurrentSchool>>
  error?: string
}> {
  const session = await getSession()

  if (!session) {
    return { success: false, error: "Not authenticated" }
  }

  // Super admin has access to everything
  if (session.user.role === UserRole.SUPER_ADMIN) {
    const school = await getCurrentSchool()
    return { success: true, session, school }
  }

  // Check role if specified
  if (requiredRoles && !requiredRoles.includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" }
  }

  // Get current school from subdomain
  const schoolSlug = await getCurrentSchoolSlug()
  if (!schoolSlug) {
    return { success: false, error: "School not found" }
  }

  // Verify user belongs to this school
  if (session.user.schoolSlug !== schoolSlug) {
    return { success: false, error: "Access denied to this school" }
  }

  const school = await getCurrentSchool()
  if (!school?.isActive) {
    return { success: false, error: "School is inactive" }
  }

  return { success: true, session, school }
}

// Require authentication - throws redirect if not authenticated
export async function requireAuth(requiredRoles?: UserRole[]) {
  const result = await verifySchoolAccess(requiredRoles)
  
  if (!result.success) {
    // In a real app, this would redirect
    throw new Error(result.error || "Authentication required")
  }
  
  return result
}

// Types for auth responses
export interface AuthResult {
  success: boolean
  error?: string
  user?: SessionUser
}
