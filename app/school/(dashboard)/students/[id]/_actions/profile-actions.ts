"use server"

import prisma from "@/lib/prisma"
import { verifySchoolAccess } from "@/lib/auth"
import { UserRole, AttendanceStatus } from "@/app/generated/prisma/client"

// Get student with full profile details
export async function getStudentProfile(studentId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Get student user
    const user = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: auth.school.id,
        role: UserRole.STUDENT,
      },
    })

    if (!user) {
      return { success: false, error: "Student not found" }
    }

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
    })

    if (!studentProfile) {
      return { success: false, error: "Student profile not found" }
    }

    // Get class info
    let classInfo = null
    if (studentProfile.classId) {
      const classData = await prisma.class.findUnique({
        where: { id: studentProfile.classId },
      })
      if (classData) {
        // Get class teacher
        let classTeacher = null
        if (classData.classTeacherId) {
          classTeacher = await prisma.user.findUnique({
            where: { id: classData.classTeacherId },
            select: { id: true, firstName: true, lastName: true },
          })
        }
        // Get grade definition
        let gradeDef = null
        if (classData.gradeDefinitionId) {
          gradeDef = await prisma.gradeDefinition.findUnique({
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
        classInfo = {
          id: classData.id,
          name: classData.name,
          section: classData.section,
          gradeDefinition: gradeDef ? { name: gradeDef.name, shortName: gradeDef.shortName } : null,
          schoolLevel: schoolLevel ? { name: schoolLevel.name, shortName: schoolLevel.shortName } : null,
          classTeacher: classTeacher ? `${classTeacher.firstName} ${classTeacher.lastName}` : null,
        }
      }
    }

    // Get parent links
    const parentLinks = await prisma.parentStudent.findMany({
      where: { studentId: studentProfile.id },
    })
    
    const parentIds = parentLinks.map(pl => pl.parentId)
    const parentProfiles = parentIds.length > 0
      ? await prisma.parentProfile.findMany({
          where: { id: { in: parentIds } },
        })
      : []
    
    const parentUserIds = parentProfiles.map(p => p.userId)
    const parentUsers = parentUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: parentUserIds } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        })
      : []
    
    const parentUserMap = new Map(parentUsers.map(u => [u.id, u]))
    
    const parents = parentProfiles.map(p => {
      const user = parentUserMap.get(p.userId)
      return {
        id: p.id,
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: user?.phone || null,
        relationship: p.relationship,
        occupation: p.occupation,
      }
    })

    // Get enrollments
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { studentId: studentProfile.id },
      orderBy: { createdAt: "desc" },
    })
    
    const enrollmentClassIds = enrollments.map(e => e.classId)
    const enrollmentClasses = enrollmentClassIds.length > 0
      ? await prisma.class.findMany({
          where: { id: { in: enrollmentClassIds } },
        })
      : []
    const classMap = new Map(enrollmentClasses.map(c => [c.id, c]))
    
    const enrollmentYearIds = enrollments.map(e => e.academicYearId)
    const enrollmentYears = enrollmentYearIds.length > 0
      ? await prisma.academicYear.findMany({
          where: { id: { in: enrollmentYearIds } },
        })
      : []
    const yearMap = new Map(enrollmentYears.map(y => [y.id, y]))

    const enrollmentHistory = enrollments.map(e => ({
      id: e.id,
      className: classMap.get(e.classId)?.name || "Unknown",
      academicYear: yearMap.get(e.academicYearId)?.name || "Unknown",
      status: e.status,
      enrolledAt: e.enrolledAt,
    }))

    return {
      success: true,
      student: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
        profile: {
          id: studentProfile.id,
          studentId: studentProfile.studentId,
          dateOfBirth: studentProfile.dateOfBirth,
          gender: studentProfile.gender,
          bloodGroup: studentProfile.bloodGroup,
          address: studentProfile.address,
          admissionDate: studentProfile.admissionDate,
          repeatCount: studentProfile.repeatCount,
        },
        class: classInfo,
        parents,
        enrollments: enrollmentHistory,
      },
    }
  } catch (error) {
    console.error("Error fetching student profile:", error)
    return { success: false, error: "Failed to fetch student profile" }
  }
}

// Get student attendance summary
export async function getStudentAttendanceSummary(studentId: string, academicYearId?: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Get student profile
    const studentProfile = await prisma.studentProfile.findFirst({
      where: {
        userId: studentId,
        user: { schoolId: auth.school.id },
      },
    })

    if (!studentProfile) {
      return { success: false, error: "Student not found" }
    }

    // Get current academic year if not specified
    let yearId = academicYearId
    if (!yearId) {
      const currentYear = await prisma.academicYear.findFirst({
        where: { schoolId: auth.school.id, isCurrent: true },
      })
      yearId = currentYear?.id
    }

    if (!yearId) {
      return { success: false, error: "No academic year found" }
    }

    // Get academic year date range
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: yearId },
    })

    if (!academicYear) {
      return { success: false, error: "Academic year not found" }
    }

    // Get all attendance records for this student in the year
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId: studentProfile.id,
        date: {
          gte: academicYear.startDate,
          lte: academicYear.endDate,
        },
      },
      orderBy: { date: "desc" },
    })

    // Calculate stats
    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter(a => a.status === AttendanceStatus.PRESENT).length,
      absent: attendanceRecords.filter(a => a.status === AttendanceStatus.ABSENT).length,
      late: attendanceRecords.filter(a => a.status === AttendanceStatus.LATE).length,
      excused: attendanceRecords.filter(a => a.status === AttendanceStatus.EXCUSED).length,
    }

    const attendanceRate = stats.total > 0
      ? Math.round(((stats.present + stats.late) / stats.total) * 100)
      : 0

    // Get recent attendance (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentAttendance = attendanceRecords
      .filter(a => new Date(a.date) >= thirtyDaysAgo)
      .map(a => ({
        date: a.date,
        status: a.status,
        notes: a.notes,
      }))

    return {
      success: true,
      academicYear: academicYear.name,
      stats,
      attendanceRate,
      recentAttendance,
    }
  } catch (error) {
    console.error("Error fetching attendance summary:", error)
    return { success: false, error: "Failed to fetch attendance summary" }
  }
}

// Get comprehensive student grades with weights and comments
export async function getStudentGradesSummary(studentId: string, periodId?: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Get student profile
    const studentProfile = await prisma.studentProfile.findFirst({
      where: {
        userId: studentId,
        user: { schoolId: auth.school.id },
      },
    })

    if (!studentProfile) {
      return { success: false, error: "Student not found" }
    }

    // Get academic periods
    const periods = await prisma.academicPeriod.findMany({
      where: {
        academicYear: {
          schoolId: auth.school.id,
          isCurrent: true,
        },
      },
      orderBy: { startDate: "desc" },
    })

    const selectedPeriodId = periodId || periods[0]?.id

    if (!selectedPeriodId) {
      return { success: true, periods: [], grades: [], subjectSummaries: [], reportCard: null }
    }

    // Get exam results for the period
    const examResults = await prisma.examResult.findMany({
      where: {
        studentId: studentProfile.id,
        academicPeriodId: selectedPeriodId,
      },
    })

    // Get class subjects with grade weights
    const classSubjectIds = [...new Set(examResults.map(e => e.classSubjectId))]
    const classSubjects = classSubjectIds.length > 0
      ? await prisma.classSubject.findMany({
          where: { id: { in: classSubjectIds } },
        })
      : []
    
    // Get subject info
    const subjectIds = classSubjects.map(cs => cs.subjectId)
    const subjects = subjectIds.length > 0
      ? await prisma.subject.findMany({
          where: { id: { in: subjectIds } },
        })
      : []
    const subjectMap = new Map(subjects.map(s => [s.id, s]))
    
    // Get teacher info
    const teacherIds = classSubjects.map(cs => cs.teacherId).filter(Boolean) as string[]
    const teachers = teacherIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: teacherIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : []
    const teacherMap = new Map(teachers.map(t => [t.id, t]))
    
    // Create class subject map with weights
    const classSubjectMap = new Map(classSubjects.map(cs => {
      const subject = subjectMap.get(cs.subjectId)
      const teacher = cs.teacherId ? teacherMap.get(cs.teacherId) : null
      return [cs.id, {
        subjectName: subject?.name || "Unknown",
        subjectCode: subject?.code || null,
        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : null,
        weights: {
          homeworkWeight: Number(cs.homeworkWeight),
          classworkWeight: Number(cs.classworkWeight),
          testWeight: Number(cs.testWeight),
          quizWeight: Number(cs.quizWeight),
          examWeight: Number(cs.examWeight),
          classTestWeight: Number(cs.classTestWeight),
          midTermWeight: Number(cs.midTermWeight),
          endOfTermWeight: Number(cs.endOfTermWeight),
          assignmentWeight: Number(cs.assignmentWeight),
          projectWeight: Number(cs.projectWeight),
        },
      }]
    }))

    // Exam type labels and weight mapping
    const examTypeLabels: Record<string, string> = {
      'HOMEWORK': 'Homework',
      'CLASSWORK': 'Classwork',
      'TEST': 'Test',
      'QUIZ': 'Quiz',
      'EXAM': 'Exam',
      'CLASS_TEST': 'Class Test',
      'MID_TERM': 'Mid-Term',
      'END_OF_TERM': 'End of Term',
      'ASSIGNMENT': 'Assignment',
      'PROJECT': 'Project',
    }

    const examTypeToWeightKey: Record<string, string> = {
      'HOMEWORK': 'homeworkWeight',
      'CLASSWORK': 'classworkWeight',
      'TEST': 'testWeight',
      'QUIZ': 'quizWeight',
      'EXAM': 'examWeight',
      'CLASS_TEST': 'classTestWeight',
      'MID_TERM': 'midTermWeight',
      'END_OF_TERM': 'endOfTermWeight',
      'ASSIGNMENT': 'assignmentWeight',
      'PROJECT': 'projectWeight',
    }

    // Build individual grades list
    type WeightsType = { homeworkWeight: number; classworkWeight: number; testWeight: number; quizWeight: number; examWeight: number; classTestWeight: number; midTermWeight: number; endOfTermWeight: number; assignmentWeight: number; projectWeight: number }
    const grades = examResults.map(er => {
      const csData = classSubjectMap.get(er.classSubjectId)
      const weightKey = examTypeToWeightKey[er.examType] as keyof WeightsType | undefined
      const weight = csData && weightKey ? csData.weights[weightKey] : 0
      
      return {
        id: er.id,
        classSubjectId: er.classSubjectId,
        subjectName: csData?.subjectName || "Unknown",
        subjectCode: csData?.subjectCode || null,
        teacherName: csData?.teacherName || null,
        examType: er.examType,
        examTypeLabel: examTypeLabels[er.examType] || er.examType,
        score: Number(er.score),
        maxScore: Number(er.maxScore),
        percentage: Number(er.maxScore) > 0 ? Math.round((Number(er.score) / Number(er.maxScore)) * 100) : 0,
        grade: er.grade,
        remarks: er.remarks,
        weight,
      }
    })

    // Calculate grade helper
    const calculateGrade = (percentage: number): string => {
      if (percentage >= 80) return "A"
      if (percentage >= 70) return "B"
      if (percentage >= 60) return "C"
      if (percentage >= 50) return "D"
      if (percentage >= 40) return "E"
      return "F"
    }

    // Build subject summaries with weighted scores
    const subjectSummaries = Array.from(classSubjectMap.entries()).map(([classSubjectId, csData]) => {
      const subjectGrades = grades.filter(g => g.classSubjectId === classSubjectId)
      
      // Calculate weighted average
      let weightedScore = 0
      let totalWeight = 0
      
      for (const grade of subjectGrades) {
        if (grade.weight > 0) {
          weightedScore += grade.percentage * (grade.weight / 100)
          totalWeight += grade.weight
        }
      }
      
      const finalScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : null
      
      // Get active weights (non-zero)
      const activeWeights = Object.entries(csData.weights)
        .filter(([_, value]) => value > 0)
        .map(([key, value]) => {
          const examType = Object.entries(examTypeToWeightKey).find(([_, wKey]) => wKey === key)?.[0]
          return {
            examType: examType || key,
            examTypeLabel: examType ? examTypeLabels[examType] : key,
            weight: value as number,
          }
        })
      
      return {
        classSubjectId,
        subjectName: csData.subjectName,
        subjectCode: csData.subjectCode,
        teacherName: csData.teacherName,
        examResults: subjectGrades,
        activeWeights,
        weightedScore: finalScore,
        grade: finalScore !== null ? calculateGrade(finalScore) : null,
        completedWeight: totalWeight,
      }
    })

    // Get report card
    const reportCard = await prisma.reportCard.findFirst({
      where: {
        studentId: studentProfile.id,
        academicPeriodId: selectedPeriodId,
      },
    })

    return {
      success: true,
      periods: periods.map(p => ({ id: p.id, name: p.name })),
      selectedPeriodId,
      grades,
      subjectSummaries,
      reportCard: reportCard ? {
        totalScore: reportCard.totalScore ? Number(reportCard.totalScore) : null,
        averageScore: reportCard.averageScore ? Number(reportCard.averageScore) : null,
        position: reportCard.position,
        passStatus: reportCard.passStatus,
        attendancePercentage: reportCard.attendancePercentage ? Number(reportCard.attendancePercentage) : null,
      } : null,
    }
  } catch (error) {
    console.error("Error fetching grades summary:", error)
    return { success: false, error: "Failed to fetch grades summary" }
  }
}
