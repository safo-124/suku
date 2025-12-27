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

// Cookie settings - use role-specific cookies to allow multiple logins
const SESSION_COOKIE_PREFIX = "suku_session"
const SESSION_EXPIRY_DAYS = 7

// Get cookie name based on role
function getSessionCookieName(role: UserRole): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return `${SESSION_COOKIE_PREFIX}_admin`
    case UserRole.SCHOOL_ADMIN:
      return `${SESSION_COOKIE_PREFIX}_school_admin`
    case UserRole.TEACHER:
      return `${SESSION_COOKIE_PREFIX}_teacher`
    case UserRole.STUDENT:
      return `${SESSION_COOKIE_PREFIX}_student`
    case UserRole.PARENT:
      return `${SESSION_COOKIE_PREFIX}_parent`
    default:
      return `${SESSION_COOKIE_PREFIX}_user`
  }
}

// All possible session cookie names for checking/cleanup
const ALL_SESSION_COOKIES = [
  `${SESSION_COOKIE_PREFIX}_admin`,
  `${SESSION_COOKIE_PREFIX}_school_admin`,
  `${SESSION_COOKIE_PREFIX}_teacher`,
  `${SESSION_COOKIE_PREFIX}_student`,
  `${SESSION_COOKIE_PREFIX}_parent`,
  `${SESSION_COOKIE_PREFIX}_user`,
  "suku_session", // Legacy cookie for migration
]

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
export async function createSession(userId: string, role: UserRole): Promise<string> {
  const token = generateSessionToken()
  const expires = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      sessionToken: token,
      userId,
      expires,
    },
  })

  // Set the role-specific cookie
  const cookieStore = await cookies()
  const cookieName = getSessionCookieName(role)
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  })

  return token
}

// Get the current session - checks role-specific cookie or all cookies
export async function getSession(forRole?: UserRole): Promise<Session | null> {
  const cookieStore = await cookies()
  
  // If a specific role is requested, check only that cookie
  if (forRole) {
    const cookieName = getSessionCookieName(forRole)
    const token = cookieStore.get(cookieName)?.value
    if (token) {
      return getSessionFromToken(token, cookieName, cookieStore)
    }
    return null
  }
  
  // Otherwise, check all role-specific cookies
  for (const cookieName of ALL_SESSION_COOKIES) {
    const token = cookieStore.get(cookieName)?.value
    if (token) {
      const session = await getSessionFromToken(token, cookieName, cookieStore)
      if (session) {
        return session
      }
    }
  }
  
  return null
}

// Helper to get session from a specific token
async function getSessionFromToken(
  token: string, 
  cookieName: string, 
  cookieStore: Awaited<ReturnType<typeof cookies>>
): Promise<Session | null> {
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
    cookieStore.delete(cookieName)
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

// Get session for a specific role (useful for portals)
export async function getSessionForRole(role: UserRole): Promise<Session | null> {
  return getSession(role)
}

// Destroy the current session - can specify role to destroy specific session
export async function destroySession(forRole?: UserRole): Promise<void> {
  const cookieStore = await cookies()
  
  if (forRole) {
    // Destroy only the specific role's session
    const cookieName = getSessionCookieName(forRole)
    const token = cookieStore.get(cookieName)?.value
    if (token) {
      await prisma.session.delete({ where: { sessionToken: token } }).catch(() => {})
      cookieStore.delete(cookieName)
    }
  } else {
    // Destroy all sessions (for complete logout)
    for (const cookieName of ALL_SESSION_COOKIES) {
      const token = cookieStore.get(cookieName)?.value
      if (token) {
        await prisma.session.delete({ where: { sessionToken: token } }).catch(() => {})
        cookieStore.delete(cookieName)
      }
    }
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
  
  // Fallback to session (for Vercel deployments where headers may not persist)
  const session = await getSession()
  if (session?.user?.schoolSlug) {
    return session.user.schoolSlug
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
  let session: Session | null = null
  
  // If specific roles are required, try to find a session for one of those roles first
  if (requiredRoles && requiredRoles.length > 0) {
    for (const role of requiredRoles) {
      session = await getSession(role)
      if (session) break
    }
    
    // If no session found for required roles, return error
    if (!session) {
      // Check if there's any session at all (for better error message)
      const anySession = await getSession()
      if (anySession) {
        return { success: false, error: "Insufficient permissions" }
      }
      return { success: false, error: "Not authenticated" }
    }
  } else {
    // No specific role required, get any session
    session = await getSession()
    if (!session) {
      return { success: false, error: "Not authenticated" }
    }
  }

  // Super admin has access to everything
  if (session.user.role === UserRole.SUPER_ADMIN) {
    const school = await getCurrentSchool()
    return { success: true, session, school }
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
  mustResetPassword?: boolean
  user?: SessionUser
}
