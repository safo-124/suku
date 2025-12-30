"use server"

import prisma from "@/lib/prisma"
import { verifySchoolAccess } from "@/lib/auth"
import { UserRole, AttendanceStatus } from "@/app/generated/prisma/client"

// Get overview of attendance grouped by levels and classes
export async function getSchoolAttendanceOverview(date?: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  const targetDate = date ? new Date(date) : new Date()
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  try {
    // Get current academic year
    const academicYear = await prisma.academicYear.findFirst({
      where: {
        schoolId: auth.school.id,
        isCurrent: true,
      },
    })

    if (!academicYear) {
      return { success: false, error: "No current academic year found" }
    }

    // Get all school levels
    const schoolLevels = await prisma.schoolLevel.findMany({
      where: { schoolId: auth.school.id },
      orderBy: { order: "asc" },
    })

    // Get all classes for current academic year
    const classes = await prisma.class.findMany({
      where: {
        schoolId: auth.school.id,
        academicYearId: academicYear.id,
      },
      orderBy: [
        { gradeDefinition: { order: "asc" } },
        { section: "asc" },
      ],
    })

    // Get class teacher info
    const classTeacherIds = classes.filter(c => c.classTeacherId).map(c => c.classTeacherId!)
    const classTeachers = classTeacherIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: classTeacherIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : []
    const teacherMap = new Map(classTeachers.map(t => [t.id, t]))

    // Get grade definitions
    const gradeDefIds = classes.filter(c => c.gradeDefinitionId).map(c => c.gradeDefinitionId!)
    const gradeDefinitions = gradeDefIds.length > 0
      ? await prisma.gradeDefinition.findMany({
          where: { id: { in: gradeDefIds } },
        })
      : []
    const gradeDefMap = new Map(gradeDefinitions.map(g => [g.id, g]))

    // Get all student counts per class
    const classIds = classes.map(c => c.id)
    const studentCounts = await prisma.studentProfile.groupBy({
      by: ["classId"],
      where: { classId: { in: classIds } },
      _count: { id: true },
    }) as unknown as Array<{ classId: string | null; _count: { id: number } }>
    const studentCountMap = new Map(
      studentCounts
        .filter(s => s.classId !== null)
        .map(s => [s.classId as string, s._count.id])
    )

    // Get all attendance records for this date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        classId: { in: classIds },
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    // Group attendance by class and status
    const attendanceByClass = new Map<string, Map<AttendanceStatus, number>>()
    for (const record of attendanceRecords) {
      if (!attendanceByClass.has(record.classId)) {
        attendanceByClass.set(record.classId, new Map())
      }
      const classAttendance = attendanceByClass.get(record.classId)!
      classAttendance.set(record.status, (classAttendance.get(record.status) || 0) + 1)
    }

    // Build class data
    const classesWithAttendance = classes.map(c => {
      const totalStudents = studentCountMap.get(c.id) || 0
      const classAttendance = attendanceByClass.get(c.id) || new Map()
      const present = classAttendance.get("PRESENT" as AttendanceStatus) || 0
      const absent = classAttendance.get("ABSENT" as AttendanceStatus) || 0
      const late = classAttendance.get("LATE" as AttendanceStatus) || 0
      const excused = classAttendance.get("EXCUSED" as AttendanceStatus) || 0
      const marked = present + absent + late + excused
      const teacher = c.classTeacherId ? teacherMap.get(c.classTeacherId) : null
      const gradeDef = c.gradeDefinitionId ? gradeDefMap.get(c.gradeDefinitionId) : null

      return {
        id: c.id,
        name: c.name,
        section: c.section,
        schoolLevelId: c.schoolLevelId,
        gradeDefinition: gradeDef ? { name: gradeDef.name, shortName: gradeDef.shortName } : null,
        classTeacher: teacher ? `${teacher.firstName} ${teacher.lastName}` : null,
        totalStudents,
        markedCount: marked,
        isComplete: marked === totalStudents && totalStudents > 0,
        stats: {
          present,
          absent,
          late,
          excused,
        },
      }
    })

    // Group classes by level - explicitly type the level data structure
    type ClassWithAttendance = typeof classesWithAttendance[number]
    type LevelWithClasses = {
      id: string
      name: string
      shortName: string
      order: number
      classes: ClassWithAttendance[]
    }
    
    const levelMap = new Map<string, LevelWithClasses>(
      schoolLevels.map(l => [l.id, { 
        id: l.id,
        name: l.name,
        shortName: l.shortName,
        order: l.order,
        classes: [],
      }])
    )

    // Add "Unassigned" level for classes without a level
    const unassignedLevel: LevelWithClasses = {
      id: "unassigned",
      name: "Unassigned",
      shortName: "N/A",
      order: 999,
      classes: [],
    }

    for (const classData of classesWithAttendance) {
      if (classData.schoolLevelId && levelMap.has(classData.schoolLevelId)) {
        levelMap.get(classData.schoolLevelId)!.classes.push(classData)
      } else {
        unassignedLevel.classes.push(classData)
      }
    }

    // Convert to array and add unassigned if it has classes
    const levels = [...levelMap.values()]
    if (unassignedLevel.classes.length > 0) {
      levels.push(unassignedLevel)
    }

    // Calculate overall stats
    const overallStats = {
      totalClasses: classes.length,
      totalStudents: classesWithAttendance.reduce((sum, c) => sum + c.totalStudents, 0),
      classesCompleted: classesWithAttendance.filter(c => c.isComplete).length,
      present: classesWithAttendance.reduce((sum, c) => sum + c.stats.present, 0),
      absent: classesWithAttendance.reduce((sum, c) => sum + c.stats.absent, 0),
      late: classesWithAttendance.reduce((sum, c) => sum + c.stats.late, 0),
      excused: classesWithAttendance.reduce((sum, c) => sum + c.stats.excused, 0),
    }

    return {
      success: true,
      date: targetDate.toISOString().split("T")[0],
      levels,
      overallStats,
    }
  } catch (error) {
    console.error("Error fetching attendance overview:", error)
    return { success: false, error: "Failed to fetch attendance overview" }
  }
}

// Get detailed attendance for a specific class
export async function getClassAttendance(classId: string, date?: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  const targetDate = date ? new Date(date) : new Date()
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  try {
    // Get class info
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: auth.school.id,
      },
    })

    if (!classData) {
      return { success: false, error: "Class not found" }
    }

    // Get class teacher
    let classTeacher = null
    if (classData.classTeacherId) {
      classTeacher = await prisma.user.findUnique({
        where: { id: classData.classTeacherId },
        select: { id: true, firstName: true, lastName: true },
      })
    }

    // Get grade definition
    let gradeDefinition = null
    if (classData.gradeDefinitionId) {
      gradeDefinition = await prisma.gradeDefinition.findUnique({
        where: { id: classData.gradeDefinitionId },
      })
    }

    // Get school level
    let schoolLevel = null
    if (classData.schoolLevelId) {
      schoolLevel = await prisma.schoolLevel.findUnique({
        where: { id: classData.schoolLevelId },
      })
    }

    // Get students in class
    const studentProfiles = await prisma.studentProfile.findMany({
      where: { classId },
    })

    const userIds = studentProfiles.map(s => s.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    // Get attendance for this date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        classId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })
    const attendanceMap = new Map(attendanceRecords.map(a => [a.studentId, a]))

    // Get who marked the attendance
    const markedByIds = [...new Set(attendanceRecords.filter(a => a.markedById).map(a => a.markedById!))]
    const markedByUsers = markedByIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: markedByIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : []
    const markedByMap = new Map(markedByUsers.map(u => [u.id, u]))

    // Sort students by name
    const sortedStudents = studentProfiles.sort((a, b) => {
      const userA = userMap.get(a.userId)
      const userB = userMap.get(b.userId)
      const firstNameCompare = (userA?.firstName || "").localeCompare(userB?.firstName || "")
      if (firstNameCompare !== 0) return firstNameCompare
      return (userA?.lastName || "").localeCompare(userB?.lastName || "")
    })

    // Build student attendance list
    const students = sortedStudents.map(s => {
      const user = userMap.get(s.userId)
      const record = attendanceMap.get(s.id)
      const markedBy = record?.markedById ? markedByMap.get(record.markedById) : null

      return {
        id: s.id,
        userId: s.userId,
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        studentId: s.studentId,
        avatar: user?.avatar || null,
        status: record?.status || null,
        remarks: record?.notes || null,
        markedBy: markedBy ? `${markedBy.firstName} ${markedBy.lastName}` : null,
        markedAt: record?.updatedAt || null,
      }
    })

    // Calculate stats
    const stats = {
      total: students.length,
      present: students.filter(s => s.status === "PRESENT").length,
      absent: students.filter(s => s.status === "ABSENT").length,
      late: students.filter(s => s.status === "LATE").length,
      excused: students.filter(s => s.status === "EXCUSED").length,
      notMarked: students.filter(s => !s.status).length,
    }

    return {
      success: true,
      date: targetDate.toISOString().split("T")[0],
      class: {
        id: classData.id,
        name: classData.name,
        section: classData.section,
        gradeDefinition: gradeDefinition ? {
          name: gradeDefinition.name,
          shortName: gradeDefinition.shortName,
        } : null,
        schoolLevel: schoolLevel ? {
          name: schoolLevel.name,
          shortName: schoolLevel.shortName,
        } : null,
        classTeacher: classTeacher ? `${classTeacher.firstName} ${classTeacher.lastName}` : null,
      },
      students,
      stats,
    }
  } catch (error) {
    console.error("Error fetching class attendance:", error)
    return { success: false, error: "Failed to fetch class attendance" }
  }
}

// Get attendance history for a date range
export async function getAttendanceHistory(startDate: string, endDate: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Get current academic year
    const academicYear = await prisma.academicYear.findFirst({
      where: {
        schoolId: auth.school.id,
        isCurrent: true,
      },
    })

    if (!academicYear) {
      return { success: false, error: "No current academic year found" }
    }

    // Get all classes
    const classes = await prisma.class.findMany({
      where: {
        schoolId: auth.school.id,
        academicYearId: academicYear.id,
      },
    })
    const classIds = classes.map(c => c.id)

    // Get attendance records in date range
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        classId: { in: classIds },
        date: {
          gte: start,
          lte: end,
        },
      },
    })

    // Group by date
    const dateMap = new Map<string, { present: number; absent: number; late: number; excused: number }>()
    
    for (const record of attendanceRecords) {
      const dateStr = record.date.toISOString().split("T")[0]
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { present: 0, absent: 0, late: 0, excused: 0 })
      }
      const dateStat = dateMap.get(dateStr)!
      switch (record.status) {
        case "PRESENT":
          dateStat.present++
          break
        case "ABSENT":
          dateStat.absent++
          break
        case "LATE":
          dateStat.late++
          break
        case "EXCUSED":
          dateStat.excused++
          break
      }
    }

    // Convert to sorted array
    const history = [...dateMap.entries()]
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return {
      success: true,
      history,
    }
  } catch (error) {
    console.error("Error fetching attendance history:", error)
    return { success: false, error: "Failed to fetch attendance history" }
  }
}

// Helper: Calculate working days between two dates
function calculateWorkingDays(
  startDate: Date, 
  endDate: Date, 
  excludeSaturday: boolean = true,
  excludeSunday: boolean = true
): number {
  let count = 0
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
  
  while (current <= end) {
    const dayOfWeek = current.getDay() // 0 = Sunday, 6 = Saturday
    const isSaturday = dayOfWeek === 6
    const isSunday = dayOfWeek === 0
    
    const shouldExclude = (excludeSaturday && isSaturday) || (excludeSunday && isSunday)
    
    if (!shouldExclude) {
      count++
    }
    
    current.setDate(current.getDate() + 1)
  }
  
  return count
}

// Get academic periods with attendance configuration
export async function getAcademicPeriodsWithAttendance() {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    const academicYear = await prisma.academicYear.findFirst({
      where: {
        schoolId: auth.school.id,
        isCurrent: true,
      },
    })

    if (!academicYear) {
      return { success: false, error: "No current academic year found" }
    }

    const periods = await prisma.academicPeriod.findMany({
      where: { academicYearId: academicYear.id },
      orderBy: { order: "asc" },
    })

    // Calculate suggested days for each period
    const periodsWithConfig = periods.map(period => {
      const suggestedDays = calculateWorkingDays(
        period.startDate, 
        period.endDate, 
        period.excludeSaturday,
        period.excludeSunday
      )
      
      return {
        id: period.id,
        name: period.name,
        order: period.order,
        startDate: period.startDate,
        endDate: period.endDate,
        totalSchoolDays: period.totalSchoolDays,
        excludeSaturday: period.excludeSaturday,
        excludeSunday: period.excludeSunday,
        suggestedDays, // Auto-calculated
      }
    })

    return {
      success: true,
      academicYear: {
        id: academicYear.id,
        name: academicYear.name,
      },
      periods: periodsWithConfig,
    }
  } catch (error) {
    console.error("Error fetching periods:", error)
    return { success: false, error: "Failed to fetch periods" }
  }
}

// Update period attendance configuration
export async function updatePeriodAttendanceConfig(
  periodId: string,
  data: {
    totalSchoolDays: number
    excludeSaturday: boolean
    excludeSunday: boolean
  }
) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify period belongs to school
    const period = await prisma.academicPeriod.findFirst({
      where: { id: periodId },
      include: {
        academicYear: true,
      },
    })

    if (!period || period.academicYear.schoolId !== auth.school.id) {
      return { success: false, error: "Period not found" }
    }

    await prisma.academicPeriod.update({
      where: { id: periodId },
      data: {
        totalSchoolDays: data.totalSchoolDays,
        excludeSaturday: data.excludeSaturday,
        excludeSunday: data.excludeSunday,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating period config:", error)
    return { success: false, error: "Failed to update period configuration" }
  }
}

// Get comprehensive attendance stats for a period
export async function getPeriodAttendanceStats(periodId?: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Get current academic year
    const academicYear = await prisma.academicYear.findFirst({
      where: {
        schoolId: auth.school.id,
        isCurrent: true,
      },
    })

    if (!academicYear) {
      return { success: false, error: "No current academic year found" }
    }

    // Get the period (current one if not specified)
    const period = periodId 
      ? await prisma.academicPeriod.findFirst({
          where: { id: periodId, academicYearId: academicYear.id },
        })
      : await prisma.academicPeriod.findFirst({
          where: {
            academicYearId: academicYear.id,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        }) || await prisma.academicPeriod.findFirst({
          where: { academicYearId: academicYear.id },
          orderBy: { order: "desc" },
        })

    if (!period) {
      return { success: false, error: "No academic period found" }
    }

    // Get all classes
    const classes = await prisma.class.findMany({
      where: {
        schoolId: auth.school.id,
        academicYearId: academicYear.id,
      },
    })

    const classIds = classes.map(c => c.id)

    // Get total students per class
    const studentCounts = await prisma.studentProfile.groupBy({
      by: ["classId"],
      where: { classId: { in: classIds } },
      _count: { id: true },
    }) as unknown as Array<{ classId: string | null; _count: { id: number } }>
    
    const totalStudents = studentCounts.reduce((sum, sc) => sum + sc._count.id, 0)

    // Get attendance records for the period
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        classId: { in: classIds },
        date: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
    })

    // Calculate stats
    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    }

    for (const record of attendanceRecords) {
      switch (record.status) {
        case "PRESENT": stats.present++; break
        case "ABSENT": stats.absent++; break
        case "LATE": stats.late++; break
        case "EXCUSED": stats.excused++; break
      }
    }

    // Count unique days marked
    const uniqueDates = new Set(attendanceRecords.map(r => r.date.toISOString().split("T")[0]))
    const daysMarked = uniqueDates.size

    // Calculate overall attendance rate
    const totalExpectedAttendance = totalStudents * period.totalSchoolDays
    const presentCount = stats.present + stats.late // Late still counts as present
    const attendanceRate = totalExpectedAttendance > 0 
      ? Math.round((presentCount / (stats.present + stats.absent + stats.late + stats.excused)) * 100)
      : 0

    return {
      success: true,
      period: {
        id: period.id,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        totalSchoolDays: period.totalSchoolDays,
      },
      summary: {
        totalStudents,
        totalClasses: classes.length,
        totalSchoolDays: period.totalSchoolDays,
        daysMarked,
        daysRemaining: period.totalSchoolDays - daysMarked,
        progressPercent: period.totalSchoolDays > 0 
          ? Math.round((daysMarked / period.totalSchoolDays) * 100) 
          : 0,
      },
      stats,
      attendanceRate,
    }
  } catch (error) {
    console.error("Error fetching period attendance stats:", error)
    return { success: false, error: "Failed to fetch attendance stats" }
  }
}

// Get attendance summary per student for a class (for class teacher and reports)
export async function getClassAttendanceSummary(classId: string, periodId?: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Get the class
    const classData = await prisma.class.findFirst({
      where: { id: classId, schoolId: auth.school.id },
    })

    if (!classData) {
      return { success: false, error: "Class not found" }
    }

    // Get the period
    let period: { id: string; name: string; startDate: Date; endDate: Date; totalSchoolDays: number } | null = null
    
    if (periodId) {
      period = await prisma.academicPeriod.findFirst({
        where: { id: periodId },
        select: { id: true, name: true, startDate: true, endDate: true, totalSchoolDays: true },
      })
    } else {
      // Get current period
      const academicYear = await prisma.academicYear.findFirst({
        where: { schoolId: auth.school.id, isCurrent: true },
      })
      
      if (academicYear) {
        period = await prisma.academicPeriod.findFirst({
          where: {
            academicYearId: academicYear.id,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
          select: { id: true, name: true, startDate: true, endDate: true, totalSchoolDays: true },
        }) || await prisma.academicPeriod.findFirst({
          where: { academicYearId: academicYear.id },
          orderBy: { order: "desc" },
          select: { id: true, name: true, startDate: true, endDate: true, totalSchoolDays: true },
        })
      }
    }

    if (!period) {
      return { success: false, error: "No academic period found" }
    }

    // Get all students in the class
    const students = await prisma.studentProfile.findMany({
      where: { classId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        user: { lastName: "asc" },
      },
    })

    // Get attendance records for all students in this period
    const studentIds = students.map(s => s.id)
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        classId,
        date: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
    })

    // Group attendance by student
    const attendanceByStudent = new Map<string, { present: number; absent: number; late: number; excused: number }>()
    
    for (const record of attendanceRecords) {
      if (!attendanceByStudent.has(record.studentId)) {
        attendanceByStudent.set(record.studentId, { present: 0, absent: 0, late: 0, excused: 0 })
      }
      const stats = attendanceByStudent.get(record.studentId)!
      switch (record.status) {
        case "PRESENT": stats.present++; break
        case "ABSENT": stats.absent++; break
        case "LATE": stats.late++; break
        case "EXCUSED": stats.excused++; break
      }
    }

    // Build student summaries
    const studentSummaries = students.map(student => {
      const stats = attendanceByStudent.get(student.id) || { present: 0, absent: 0, late: 0, excused: 0 }
      const totalMarked = stats.present + stats.absent + stats.late + stats.excused
      const presentCount = stats.present + stats.late // Late still counts as present for percentage
      const attendancePercent = totalMarked > 0 
        ? Math.round((presentCount / totalMarked) * 100)
        : 0
      
      // Type assertion for included user relation
      const studentWithUser = student as typeof student & { 
        user: { id: string; firstName: string; lastName: string; avatar: string | null } 
      }
      
      return {
        id: student.id,
        userId: student.userId,
        studentId: student.studentId,
        firstName: studentWithUser.user.firstName,
        lastName: studentWithUser.user.lastName,
        avatar: studentWithUser.user.avatar,
        stats,
        totalMarked,
        totalSchoolDays: period.totalSchoolDays,
        attendancePercent,
      }
    })

    return {
      success: true,
      period: {
        id: period.id,
        name: period.name,
        totalSchoolDays: period.totalSchoolDays,
      },
      students: studentSummaries,
    }
  } catch (error) {
    console.error("Error fetching class attendance summary:", error)
    return { success: false, error: "Failed to fetch attendance summary" }
  }
}

// Calculate and update attendance percentage for report cards
export async function calculateAttendanceForReportCards(periodId: string, classId?: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Get the period
    const period = await prisma.academicPeriod.findFirst({
      where: { id: periodId },
      include: {
        academicYear: true,
      },
    })

    if (!period || period.academicYear.schoolId !== auth.school.id) {
      return { success: false, error: "Period not found" }
    }

    // Get classes to process
    const classes = classId 
      ? await prisma.class.findMany({
          where: { id: classId, schoolId: auth.school.id },
        })
      : await prisma.class.findMany({
          where: { 
            schoolId: auth.school.id,
            academicYearId: period.academicYearId,
          },
        })

    const classIds = classes.map(c => c.id)

    // Get all students
    const students = await prisma.studentProfile.findMany({
      where: { classId: { in: classIds } },
    })

    // Get all attendance records for the period
    const studentIds = students.map(s => s.id)
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        classId: { in: classIds },
        date: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
    })

    // Calculate attendance per student
    const attendanceByStudent = new Map<string, { present: number; absent: number; late: number; excused: number }>()
    
    for (const record of attendanceRecords) {
      if (!attendanceByStudent.has(record.studentId)) {
        attendanceByStudent.set(record.studentId, { present: 0, absent: 0, late: 0, excused: 0 })
      }
      const stats = attendanceByStudent.get(record.studentId)!
      switch (record.status) {
        case "PRESENT": stats.present++; break
        case "ABSENT": stats.absent++; break
        case "LATE": stats.late++; break
        case "EXCUSED": stats.excused++; break
      }
    }

    // Update or create report cards with attendance percentages
    let updatedCount = 0
    
    for (const student of students) {
      const stats = attendanceByStudent.get(student.id) || { present: 0, absent: 0, late: 0, excused: 0 }
      const totalMarked = stats.present + stats.absent + stats.late + stats.excused
      const presentCount = stats.present + stats.late
      
      // Calculate percentage based on marked days (or total school days if more marked)
      const denominator = Math.max(totalMarked, period.totalSchoolDays)
      const attendancePercentage = denominator > 0 
        ? Math.round((presentCount / denominator) * 100 * 100) / 100  // Keep 2 decimals
        : 0

      await prisma.reportCard.upsert({
        where: {
          studentId_academicPeriodId: {
            studentId: student.id,
            academicPeriodId: periodId,
          },
        },
        update: {
          attendancePercentage,
        },
        create: {
          studentId: student.id,
          academicPeriodId: periodId,
          attendancePercentage,
        },
      })
      updatedCount++
    }

    return { 
      success: true, 
      message: `Updated attendance for ${updatedCount} students` 
    }
  } catch (error) {
    console.error("Error calculating attendance for reports:", error)
    return { success: false, error: "Failed to calculate attendance" }
  }
}
