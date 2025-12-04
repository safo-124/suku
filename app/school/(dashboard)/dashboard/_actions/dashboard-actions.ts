"use server"

import prisma from "@/lib/prisma"

// Demo school ID - in production this would come from auth session
const DEMO_SCHOOL_ID = "demo-school-id"

export type DashboardStats = {
  students: {
    total: number
    active: number
    newThisMonth: number
    trend: number
  }
  teachers: {
    total: number
    active: number
    subjects: number
  }
  classes: {
    total: number
    averageSize: number
  }
  attendance: {
    todayRate: number
    weeklyAverage: number
    absentToday: number
  }
  fees: {
    collected: number
    pending: number
    collectionRate: number
  }
  recentActivity: {
    id: string
    type: "enrollment" | "attendance" | "fee" | "message" | "assignment"
    title: string
    description: string
    timestamp: Date
  }[]
  upcomingEvents: {
    id: string
    title: string
    date: Date
    type: "exam" | "holiday" | "meeting" | "event"
  }[]
  attendanceByClass: {
    className: string
    present: number
    absent: number
    rate: number
  }[]
}

export async function getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    // In production, you would fetch from database based on authenticated school
    // For now, return mock data for demo
    
    const stats: DashboardStats = {
      students: {
        total: 842,
        active: 820,
        newThisMonth: 23,
        trend: 5.2,
      },
      teachers: {
        total: 48,
        active: 45,
        subjects: 12,
      },
      classes: {
        total: 24,
        averageSize: 35,
      },
      attendance: {
        todayRate: 94.5,
        weeklyAverage: 93.2,
        absentToday: 45,
      },
      fees: {
        collected: 125000,
        pending: 32000,
        collectionRate: 79.6,
      },
      recentActivity: [
        {
          id: "1",
          type: "enrollment",
          title: "New Student Enrolled",
          description: "Sarah Johnson joined Grade 5A",
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        },
        {
          id: "2",
          type: "attendance",
          title: "Attendance Submitted",
          description: "Grade 8B attendance marked by Mr. Smith",
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
        },
        {
          id: "3",
          type: "fee",
          title: "Fee Payment Received",
          description: "$450 received from James Wilson (Grade 6A)",
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
        },
        {
          id: "4",
          type: "assignment",
          title: "Assignment Graded",
          description: "Math Quiz results published for Grade 7A",
          timestamp: new Date(Date.now() - 1000 * 60 * 90),
        },
        {
          id: "5",
          type: "message",
          title: "Parent Message",
          description: "New inquiry from parent regarding events",
          timestamp: new Date(Date.now() - 1000 * 60 * 120),
        },
      ],
      upcomingEvents: [
        {
          id: "1",
          title: "Mid-Term Examinations",
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          type: "exam",
        },
        {
          id: "2",
          title: "Parent-Teacher Meeting",
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
          type: "meeting",
        },
        {
          id: "3",
          title: "Winter Break",
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
          type: "holiday",
        },
        {
          id: "4",
          title: "Annual Sports Day",
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
          type: "event",
        },
      ],
      attendanceByClass: [
        { className: "Grade 5A", present: 32, absent: 3, rate: 91.4 },
        { className: "Grade 5B", present: 34, absent: 1, rate: 97.1 },
        { className: "Grade 6A", present: 30, absent: 5, rate: 85.7 },
        { className: "Grade 6B", present: 33, absent: 2, rate: 94.3 },
        { className: "Grade 7A", present: 31, absent: 4, rate: 88.6 },
        { className: "Grade 7B", present: 35, absent: 0, rate: 100 },
      ],
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error)
    return { success: false, error: "Failed to fetch dashboard statistics" }
  }
}

export async function getQuickStats(): Promise<{
  success: boolean
  data?: {
    pendingApprovals: number
    unreadMessages: number
    overdueFees: number
    lowAttendanceAlerts: number
  }
  error?: string
}> {
  try {
    return {
      success: true,
      data: {
        pendingApprovals: 8,
        unreadMessages: 12,
        overdueFees: 15,
        lowAttendanceAlerts: 3,
      },
    }
  } catch (error) {
    console.error("Failed to fetch quick stats:", error)
    return { success: false, error: "Failed to fetch quick stats" }
  }
}
