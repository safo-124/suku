"use server"

import prisma from "@/lib/prisma"
import { UserRole } from "@/app/generated/prisma/client"
import { revalidatePath } from "next/cache"

export type UserWithSchool = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatar: string | null
  role: UserRole
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
  school: {
    id: string
    name: string
    slug: string
  } | null
}

export type UsersFilter = {
  search?: string
  role?: UserRole | "ALL"
  schoolId?: string | "ALL"
  status?: "ACTIVE" | "INACTIVE" | "ALL"
  page?: number
  limit?: number
}

export type UserStats = {
  total: number
  active: number
  inactive: number
  roleBreakdown: Partial<Record<UserRole, number>>
  recentUsers: unknown[]
}

export async function getUsers(filters: UsersFilter = {}) {
  try {
    const {
      search = "",
      role = "ALL",
      schoolId = "ALL",
      status = "ALL",
      page = 1,
      limit = 10,
    } = filters

    const where: Record<string, unknown> = {}

    // Search filter
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ]
    }

    // Role filter
    if (role !== "ALL") {
      where.role = role
    }

    // School filter
    if (schoolId !== "ALL") {
      if (schoolId === "NONE") {
        where.schoolId = null
      } else {
        where.schoolId = schoolId
      }
    }

    // Status filter
    if (status !== "ALL") {
      where.isActive = status === "ACTIVE"
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          school: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return {
      success: true,
      users: users as unknown as UserWithSchool[],
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return { success: false, error: "Failed to fetch users" }
  }
}

export async function getUserStats() {
  try {
    const [
      total,
      activeCount,
      roleStatsRaw,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          school: { select: { name: true } },
        },
      }),
    ])

    // Cast to work around Prisma Accelerate type issues
    const roleStats = roleStatsRaw as unknown as Array<{ role: UserRole; _count: { role: number } }>
    const roleBreakdown: Partial<Record<UserRole, number>> = {}
    for (const stat of roleStats) {
      roleBreakdown[stat.role] = stat._count.role
    }

    return {
      success: true as const,
      stats: {
        total,
        active: activeCount,
        inactive: total - activeCount,
        roleBreakdown,
        recentUsers,
      } as UserStats,
    }
  } catch (error) {
    console.error("Failed to fetch user stats:", error)
    return { success: false, error: "Failed to fetch user stats" }
  }
}

export async function getSchoolsForFilter() {
  try {
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    })
    return { success: true, schools }
  } catch (error) {
    console.error("Failed to fetch schools:", error)
    return { success: false, error: "Failed to fetch schools" }
  }
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    })

    revalidatePath("/super-admin/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to update user status:", error)
    return { success: false, error: "Failed to update user status" }
  }
}

export async function updateUserRole(userId: string, role: UserRole) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    })

    revalidatePath("/super-admin/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to update user role:", error)
    return { success: false, error: "Failed to update user role" }
  }
}

export async function deleteUser(userId: string) {
  try {
    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath("/super-admin/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete user:", error)
    return { success: false, error: "Failed to delete user" }
  }
}

export async function getUserById(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    return { success: true, user: user as unknown as UserWithSchool }
  } catch (error) {
    console.error("Failed to fetch user:", error)
    return { success: false, error: "Failed to fetch user" }
  }
}
