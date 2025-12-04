"use server"

import prisma from "@/lib/prisma"
import { PLAN_CONFIGS, SubscriptionPlan } from "@/app/super-admin/subscriptions/_lib/plans"

export type TimeRange = "7d" | "30d" | "90d" | "1y" | "all"

export type AnalyticsData = {
  overview: {
    totalSchools: number
    totalUsers: number
    activeSchools: number
    mrr: number
    schoolGrowth: number
    userGrowth: number
  }
  charts: {
    schoolsOverTime: { date: string; count: number }[]
    usersOverTime: { date: string; count: number }[]
    revenueOverTime: { date: string; amount: number }[]
  }
  distributions: {
    planDistribution: { plan: string; count: number; percentage: number }[]
    statusDistribution: { status: string; count: number; percentage: number }[]
    roleDistribution: { role: string; count: number; percentage: number }[]
  }
  topSchools: {
    id: string
    name: string
    slug: string
    userCount: number
    plan: string
    createdAt: Date
  }[]
}

function getDateRange(range: TimeRange): Date {
  const now = new Date()
  switch (range) {
    case "7d":
      return new Date(now.setDate(now.getDate() - 7))
    case "30d":
      return new Date(now.setDate(now.getDate() - 30))
    case "90d":
      return new Date(now.setDate(now.getDate() - 90))
    case "1y":
      return new Date(now.setFullYear(now.getFullYear() - 1))
    case "all":
      return new Date(2020, 0, 1) // Beginning of time for this app
  }
}

function generateDateLabels(range: TimeRange): string[] {
  const labels: string[] = []
  const now = new Date()
  let days: number
  let step: number

  switch (range) {
    case "7d":
      days = 7
      step = 1
      break
    case "30d":
      days = 30
      step = 1
      break
    case "90d":
      days = 90
      step = 7
      break
    case "1y":
      days = 365
      step = 30
      break
    default:
      days = 365
      step = 30
  }

  for (let i = days; i >= 0; i -= step) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    labels.push(date.toISOString().split("T")[0])
  }

  return labels
}

export async function getAnalytics(range: TimeRange = "30d"): Promise<{ success: boolean; data?: AnalyticsData; error?: string }> {
  try {
    const startDate = getDateRange(range)
    const previousStartDate = new Date(startDate)
    previousStartDate.setTime(previousStartDate.getTime() - (Date.now() - startDate.getTime()))

    // Get overview counts
    const [
      totalSchools,
      totalUsers,
      activeSchools,
      previousSchools,
      previousUsers,
      allActiveSchools,
      planStatsRaw,
      statusStatsRaw,
      roleStatsRaw,
      topSchoolsRaw,
      schoolsByDate,
      usersByDate,
    ] = await Promise.all([
      // Current period counts
      prisma.school.count(),
      prisma.user.count(),
      prisma.school.count({ where: { isActive: true } }),
      // Previous period for growth
      prisma.school.count({
        where: { createdAt: { lt: startDate } },
      }),
      prisma.user.count({
        where: { createdAt: { lt: startDate } },
      }),
      // For MRR calculation
      prisma.school.findMany({
        where: { subscriptionStatus: { in: ["ACTIVE", "TRIAL"] } },
        select: { subscriptionPlan: true },
      }),
      // Distributions
      prisma.school.groupBy({
        by: ["subscriptionPlan"],
        _count: { subscriptionPlan: true },
      }),
      prisma.school.groupBy({
        by: ["subscriptionStatus"],
        _count: { subscriptionStatus: true },
      }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
      // Top schools
      prisma.school.findMany({
        take: 10,
        orderBy: { users: { _count: "desc" } },
        select: {
          id: true,
          name: true,
          slug: true,
          subscriptionPlan: true,
          createdAt: true,
          _count: { select: { users: true } },
        },
      }),
      // Schools over time
      prisma.school.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      // Users over time
      prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ])

    // Calculate MRR
    let mrr = 0
    for (const school of allActiveSchools) {
      const plan = school.subscriptionPlan as SubscriptionPlan
      mrr += PLAN_CONFIGS[plan]?.price || 0
    }

    // Calculate growth percentages
    const schoolGrowth = previousSchools > 0 
      ? Math.round(((totalSchools - previousSchools) / previousSchools) * 100) 
      : 100
    const userGrowth = previousUsers > 0 
      ? Math.round(((totalUsers - previousUsers) / previousUsers) * 100) 
      : 100

    // Process plan distribution
    const planStats = planStatsRaw as unknown as Array<{ subscriptionPlan: string; _count: { subscriptionPlan: number } }>
    const planDistribution = planStats.map((stat) => ({
      plan: stat.subscriptionPlan,
      count: stat._count.subscriptionPlan,
      percentage: Math.round((stat._count.subscriptionPlan / totalSchools) * 100) || 0,
    }))

    // Process status distribution
    const statusStats = statusStatsRaw as unknown as Array<{ subscriptionStatus: string; _count: { subscriptionStatus: number } }>
    const statusDistribution = statusStats.map((stat) => ({
      status: stat.subscriptionStatus,
      count: stat._count.subscriptionStatus,
      percentage: Math.round((stat._count.subscriptionStatus / totalSchools) * 100) || 0,
    }))

    // Process role distribution
    const roleStats = roleStatsRaw as unknown as Array<{ role: string; _count: { role: number } }>
    const roleDistribution = roleStats.map((stat) => ({
      role: stat.role,
      count: stat._count.role,
      percentage: Math.round((stat._count.role / totalUsers) * 100) || 0,
    }))

    // Process top schools
    const topSchools = (topSchoolsRaw as unknown as Array<{
      id: string
      name: string
      slug: string
      subscriptionPlan: string
      createdAt: Date
      _count: { users: number }
    }>).map((school) => ({
      id: school.id,
      name: school.name,
      slug: school.slug,
      userCount: school._count.users,
      plan: school.subscriptionPlan,
      createdAt: school.createdAt,
    }))

    // Generate time series data
    const dateLabels = generateDateLabels(range)
    
    // Aggregate schools by date
    const schoolCounts = new Map<string, number>()
    let runningSchoolCount = previousSchools
    for (const label of dateLabels) {
      const schoolsOnDate = schoolsByDate.filter(
        (s) => s.createdAt.toISOString().split("T")[0] === label
      ).length
      runningSchoolCount += schoolsOnDate
      schoolCounts.set(label, runningSchoolCount)
    }

    // Aggregate users by date
    const userCounts = new Map<string, number>()
    let runningUserCount = previousUsers
    for (const label of dateLabels) {
      const usersOnDate = usersByDate.filter(
        (u) => u.createdAt.toISOString().split("T")[0] === label
      ).length
      runningUserCount += usersOnDate
      userCounts.set(label, runningUserCount)
    }

    // Generate chart data
    const schoolsOverTime = dateLabels.map((date) => ({
      date,
      count: schoolCounts.get(date) || 0,
    }))

    const usersOverTime = dateLabels.map((date) => ({
      date,
      count: userCounts.get(date) || 0,
    }))

    // Revenue over time (simplified - assumes constant MRR for demo)
    const revenueOverTime = dateLabels.map((date, i) => ({
      date,
      amount: Math.round(mrr * (0.7 + (i / dateLabels.length) * 0.3)), // Simulate growth
    }))

    return {
      success: true,
      data: {
        overview: {
          totalSchools,
          totalUsers,
          activeSchools,
          mrr,
          schoolGrowth,
          userGrowth,
        },
        charts: {
          schoolsOverTime,
          usersOverTime,
          revenueOverTime,
        },
        distributions: {
          planDistribution,
          statusDistribution,
          roleDistribution,
        },
        topSchools,
      },
    }
  } catch (error) {
    console.error("Failed to fetch analytics:", error)
    return { success: false, error: "Failed to fetch analytics" }
  }
}
