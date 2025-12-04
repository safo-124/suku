"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { PLAN_CONFIGS, SubscriptionPlan, SubscriptionStatus } from "../_lib/plans"

export type { SubscriptionPlan, SubscriptionStatus } from "../_lib/plans"

export type SchoolSubscription = {
  id: string
  name: string
  slug: string
  email: string | null
  subscriptionPlan: SubscriptionPlan
  subscriptionStatus: SubscriptionStatus
  trialEndsAt: Date | null
  maxStudents: number
  maxTeachers: number
  isActive: boolean
  createdAt: Date
  _count: {
    users: number
  }
}

export type SubscriptionFilter = {
  search?: string
  plan?: SubscriptionPlan | "ALL"
  status?: SubscriptionStatus | "ALL"
  page?: number
  limit?: number
}

export async function getSubscriptions(filters: SubscriptionFilter = {}) {
  try {
    const {
      search = "",
      plan = "ALL",
      status = "ALL",
      page = 1,
      limit = 10,
    } = filters

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ]
    }

    if (plan !== "ALL") {
      where.subscriptionPlan = plan
    }

    if (status !== "ALL") {
      where.subscriptionStatus = status
    }

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          maxStudents: true,
          maxTeachers: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.school.count({ where }),
    ])

    return {
      success: true,
      subscriptions: schools as unknown as SchoolSubscription[],
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error)
    return { success: false, error: "Failed to fetch subscriptions" }
  }
}

export async function getSubscriptionStats() {
  try {
    const [
      total,
      planStatsRaw,
      statusStatsRaw,
      trialExpiringSoon,
      revenueEstimate,
    ] = await Promise.all([
      prisma.school.count(),
      prisma.school.groupBy({
        by: ["subscriptionPlan"],
        _count: { subscriptionPlan: true },
      }),
      prisma.school.groupBy({
        by: ["subscriptionStatus"],
        _count: { subscriptionStatus: true },
      }),
      prisma.school.count({
        where: {
          subscriptionStatus: "TRIAL",
          trialEndsAt: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            gte: new Date(),
          },
        },
      }),
      prisma.school.findMany({
        where: {
          subscriptionStatus: { in: ["ACTIVE", "TRIAL"] },
        },
        select: { subscriptionPlan: true },
      }),
    ])

    // Calculate plan breakdown
    const planStats = planStatsRaw as unknown as Array<{ subscriptionPlan: SubscriptionPlan; _count: { subscriptionPlan: number } }>
    const planBreakdown: Partial<Record<SubscriptionPlan, number>> = {}
    for (const stat of planStats) {
      planBreakdown[stat.subscriptionPlan] = stat._count.subscriptionPlan
    }

    // Calculate status breakdown
    const statusStats = statusStatsRaw as unknown as Array<{ subscriptionStatus: SubscriptionStatus; _count: { subscriptionStatus: number } }>
    const statusBreakdown: Partial<Record<SubscriptionStatus, number>> = {}
    for (const stat of statusStats) {
      statusBreakdown[stat.subscriptionStatus] = stat._count.subscriptionStatus
    }

    // Estimate MRR (Monthly Recurring Revenue)
    let mrr = 0
    for (const school of revenueEstimate) {
      const plan = school.subscriptionPlan as SubscriptionPlan
      mrr += PLAN_CONFIGS[plan]?.price || 0
    }

    return {
      success: true,
      stats: {
        total,
        planBreakdown,
        statusBreakdown,
        trialExpiringSoon,
        mrr,
      },
    }
  } catch (error) {
    console.error("Failed to fetch subscription stats:", error)
    return { success: false, error: "Failed to fetch subscription stats" }
  }
}

export async function updateSubscription(
  schoolId: string,
  data: {
    subscriptionPlan?: SubscriptionPlan
    subscriptionStatus?: SubscriptionStatus
    trialEndsAt?: Date | null
  }
) {
  try {
    const updateData: Record<string, unknown> = { ...data }

    // Update max limits based on plan
    if (data.subscriptionPlan) {
      const planConfig = PLAN_CONFIGS[data.subscriptionPlan]
      updateData.maxStudents = planConfig.maxStudents
      updateData.maxTeachers = planConfig.maxTeachers
    }

    await prisma.school.update({
      where: { id: schoolId },
      data: updateData,
    })

    revalidatePath("/super-admin/subscriptions")
    revalidatePath(`/super-admin/schools/${schoolId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update subscription:", error)
    return { success: false, error: "Failed to update subscription" }
  }
}

export async function extendTrial(schoolId: string, days: number) {
  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { trialEndsAt: true },
    })

    const baseDate = school?.trialEndsAt || new Date()
    const newTrialEnd = new Date(baseDate)
    newTrialEnd.setDate(newTrialEnd.getDate() + days)

    await prisma.school.update({
      where: { id: schoolId },
      data: {
        trialEndsAt: newTrialEnd,
        subscriptionStatus: "TRIAL",
      },
    })

    revalidatePath("/super-admin/subscriptions")
    return { success: true, newTrialEnd }
  } catch (error) {
    console.error("Failed to extend trial:", error)
    return { success: false, error: "Failed to extend trial" }
  }
}

export async function cancelSubscription(schoolId: string) {
  try {
    await prisma.school.update({
      where: { id: schoolId },
      data: {
        subscriptionStatus: "CANCELLED",
        isActive: false,
      },
    })

    revalidatePath("/super-admin/subscriptions")
    return { success: true }
  } catch (error) {
    console.error("Failed to cancel subscription:", error)
    return { success: false, error: "Failed to cancel subscription" }
  }
}

export async function reactivateSubscription(schoolId: string) {
  try {
    await prisma.school.update({
      where: { id: schoolId },
      data: {
        subscriptionStatus: "ACTIVE",
        isActive: true,
      },
    })

    revalidatePath("/super-admin/subscriptions")
    return { success: true }
  } catch (error) {
    console.error("Failed to reactivate subscription:", error)
    return { success: false, error: "Failed to reactivate subscription" }
  }
}
