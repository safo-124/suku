"use server"

import prisma from "@/lib/prisma"
import { getSession, hashPassword, verifyPassword } from "@/lib/auth"
import { UserRole, AttendanceStatus } from "@/app/generated/prisma/client"
import { revalidatePath } from "next/cache"

// Verify teacher access - uses teacher-specific session cookie
async function verifyTeacherAccess() {
  const session = await getSession(UserRole.TEACHER)
  
  if (!session) {
    return { success: false, error: "Not authenticated" }
  }
  
  if (session.user.role !== UserRole.TEACHER) {
    return { success: false, error: "Access denied" }
  }
  
  return { success: true, session }
}

// Get teacher info including class teacher status
export async function getTeacherInfo() {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    // Use separate queries for Prisma Accelerate compatibility
    const user = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
    })
    
    if (!user) {
      return { success: false, error: "User not found" }
    }
    
    const [teacherProfile, classTeacherOf, classSubjects] = await Promise.all([
      prisma.teacherProfile.findUnique({ where: { userId: user.id } }),
      prisma.class.findMany({
        where: { classTeacherId: user.id },
        select: { id: true, name: true, gradeLevel: true, section: true },
      }),
      prisma.classSubject.findMany({
        where: { teacherId: user.id },
      })
    ])
    
    // Get class and subject data for class subjects
    const classIds = [...new Set(classSubjects.map(cs => cs.classId))]
    const subjectIds = [...new Set(classSubjects.map(cs => cs.subjectId))]
    
    const [classes, subjects] = await Promise.all([
      classIds.length > 0 
        ? prisma.class.findMany({
            where: { id: { in: classIds } },
            select: { id: true, name: true }
          })
        : Promise.resolve([]),
      subjectIds.length > 0
        ? prisma.subject.findMany({
            where: { id: { in: subjectIds } },
            select: { id: true, name: true, code: true }
          })
        : Promise.resolve([])
    ])
    
    const classMap = new Map(classes.map(c => [c.id, c]))
    const subjectMap = new Map(subjects.map(s => [s.id, s]))
    
    return {
      success: true,
      isClassTeacher: classTeacherOf.length > 0,
      classTeacherOf,
      subjectsTeaching: classSubjects.map(cs => {
        const classData = classMap.get(cs.classId)
        const subject = subjectMap.get(cs.subjectId)
        return {
          id: cs.id,
          classId: cs.classId,
          className: classData?.name || "",
          subjectId: cs.subjectId,
          subjectName: subject?.name || "",
          subjectCode: subject?.code || "",
        }
      }),
      profile: teacherProfile,
    }
  } catch (error) {
    console.error("Error fetching teacher info:", error)
    return { success: false, error: "Failed to fetch teacher info" }
  }
}

// Get teacher dashboard data
export async function getTeacherDashboard() {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    // Use separate queries for Prisma Accelerate compatibility
    const user = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
    })
    
    if (!user) {
      return { success: false, error: "User not found" }
    }
    
    const [teacherProfile, classTeacherOf, classSubjects] = await Promise.all([
      prisma.teacherProfile.findUnique({ where: { userId: user.id } }),
      prisma.class.findMany({ 
        where: { classTeacherId: user.id },
      }),
      prisma.classSubject.findMany({
        where: { teacherId: user.id },
      })
    ])
    
    // Get student counts for class teacher classes
    const classIds = classTeacherOf.map(c => c.id)
    let studentCountMap = new Map<string, number>()
    if (classIds.length > 0) {
      const students = await prisma.studentProfile.findMany({
        where: { classId: { in: classIds } },
        select: { classId: true }
      })
      for (const student of students) {
        if (student.classId) {
          studentCountMap.set(student.classId, (studentCountMap.get(student.classId) || 0) + 1)
        }
      }
    }
    
    // Count unique students taught
    const taughtClassIds = classSubjects.map(cs => cs.classId)
    const uniqueStudentsCount = taughtClassIds.length > 0 ? await prisma.studentProfile.count({
      where: { classId: { in: taughtClassIds } },
    }) : 0
    
    // Get today's timetable with separate queries
    const today = new Date()
    const dayOfWeek = today.getDay()
    
    const rawTimetableSlots = await prisma.timetableSlot.findMany({
      where: {
        teacherId: user.id,
        dayOfWeek: dayOfWeek,
      },
    })
    
    // Get related data for timetable
    const periodIds = rawTimetableSlots.map(s => s.periodId)
    const timetableClassIds = rawTimetableSlots.map(s => s.classId)
    const classSubjectIds = rawTimetableSlots.filter(s => s.classSubjectId).map(s => s.classSubjectId!)
    
    const [periods, classes, timetableClassSubjects] = await Promise.all([
      periodIds.length > 0 ? prisma.period.findMany({ 
        where: { id: { in: periodIds } },
        orderBy: { order: "asc" }
      }) : Promise.resolve([]),
      timetableClassIds.length > 0 ? prisma.class.findMany({ 
        where: { id: { in: timetableClassIds } }
      }) : Promise.resolve([]),
      classSubjectIds.length > 0 ? prisma.classSubject.findMany({
        where: { id: { in: classSubjectIds } },
        include: { subject: true }
      }) : Promise.resolve([])
    ])
    
    const periodMap = new Map(periods.map(p => [p.id, p]))
    const classMap = new Map(classes.map(c => [c.id, c]))
    const classSubjectMap = new Map(timetableClassSubjects.map(cs => [cs.id, cs]))
    
    // Sort slots by period order
    const sortedSlots = rawTimetableSlots.sort((a, b) => {
      const periodA = periodMap.get(a.periodId)
      const periodB = periodMap.get(b.periodId)
      return (periodA?.order || 0) - (periodB?.order || 0)
    })
    
    // Get pending assignments to grade
    const pendingSubmissions = await prisma.assignmentSubmission.count({
      where: {
        assignment: {
          createdById: user.id,
        },
        isGraded: false,
        submittedAt: { not: null },
      },
    })
    
    // Get unread messages
    const unreadMessages = await prisma.message.count({
      where: {
        receiverId: user.id,
        isRead: false,
      },
    })
    
    // Get class teacher specific data
    let classTeacherData = null
    if (classTeacherOf.length > 0) {
      const classId = classTeacherOf[0].id
      
      // Today's attendance for my class
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      const endOfToday = new Date()
      endOfToday.setHours(23, 59, 59, 999)
      
      const todayAttendance = await prisma.attendance.findMany({
        where: {
          classId: classId,
          date: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      })
      
      const attendanceMarked = todayAttendance.length > 0
      const presentCount = todayAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length
      const absentCount = todayAttendance.filter(a => a.status === AttendanceStatus.ABSENT).length
      
      classTeacherData = {
        className: classTeacherOf[0].name,
        totalStudents: studentCountMap.get(classId) || 0,
        attendanceMarked,
        presentToday: presentCount,
        absentToday: absentCount,
      }
    }
    
    return {
      success: true,
      data: {
        teacher: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatar: user.avatar,
          employeeId: teacherProfile?.employeeId || null,
        },
        stats: {
          subjectsTeaching: classSubjects.length,
          classesTeaching: new Set(classSubjects.map(cs => cs.classId)).size,
          studentsTeaching: uniqueStudentsCount,
          pendingSubmissions,
          unreadMessages,
        },
        todaySchedule: sortedSlots.map(slot => {
          const period = periodMap.get(slot.periodId)
          const slotClass = classMap.get(slot.classId)
          const classSubject = slot.classSubjectId ? classSubjectMap.get(slot.classSubjectId) : null
          
          return {
            id: slot.id,
            periodName: period?.name || "",
            startTime: period?.startTime || "",
            endTime: period?.endTime || "",
            isBreak: period?.isBreak || false,
            className: slotClass?.name || "",
            subjectName: classSubject?.subject?.name || null,
            room: slot.roomNumber,
          }
        }),
        isClassTeacher: classTeacherOf.length > 0,
        classTeacherData,
      },
    }
  } catch (error) {
    console.error("Error fetching dashboard:", error)
    return { success: false, error: "Failed to fetch dashboard data" }
  }
}

// Get subjects I teach
export async function getMySubjects() {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    // Use separate queries for Prisma Accelerate compatibility
    const rawClassSubjects = await prisma.classSubject.findMany({
      where: {
        teacherId: auth.session.user.id,
      },
    })
    
    // Get related data
    const classIds = [...new Set(rawClassSubjects.map(cs => cs.classId))]
    const subjectIds = [...new Set(rawClassSubjects.map(cs => cs.subjectId))]
    const classSubjectIds = rawClassSubjects.map(cs => cs.id)
    
    const [classes, subjects, studentProfiles, assignments] = await Promise.all([
      prisma.class.findMany({
        where: { id: { in: classIds } },
        include: { schoolLevel: true }
      }),
      prisma.subject.findMany({
        where: { id: { in: subjectIds } }
      }),
      classIds.length > 0 
        ? prisma.studentProfile.findMany({
            where: { classId: { in: classIds } },
            select: { classId: true }
          })
        : Promise.resolve([]),
      classSubjectIds.length > 0
        ? prisma.assignment.findMany({
            where: { classSubjectId: { in: classSubjectIds } },
            select: { classSubjectId: true }
          })
        : Promise.resolve([])
    ])
    
    const classMap = new Map(classes.map(c => [c.id, c]))
    const subjectMap = new Map(subjects.map(s => [s.id, s]))
    
    // Count students per class
    const studentCountMap = new Map<string, number>()
    for (const student of studentProfiles) {
      if (student.classId) {
        studentCountMap.set(student.classId, (studentCountMap.get(student.classId) || 0) + 1)
      }
    }
    
    // Count assignments per class subject
    const assignmentCountMap = new Map<string, number>()
    for (const assignment of assignments) {
      if (assignment.classSubjectId) {
        assignmentCountMap.set(assignment.classSubjectId, (assignmentCountMap.get(assignment.classSubjectId) || 0) + 1)
      }
    }
    
    // Sort by class name, then subject name
    const sortedClassSubjects = rawClassSubjects.sort((a, b) => {
      const classA = classMap.get(a.classId)
      const classB = classMap.get(b.classId)
      const subjectA = subjectMap.get(a.subjectId)
      const subjectB = subjectMap.get(b.subjectId)
      
      const classCompare = (classA?.name || "").localeCompare(classB?.name || "")
      if (classCompare !== 0) return classCompare
      return (subjectA?.name || "").localeCompare(subjectB?.name || "")
    })
    
    return {
      success: true,
      subjects: sortedClassSubjects.map(cs => {
        const classData = classMap.get(cs.classId)
        const subject = subjectMap.get(cs.subjectId)
        
        return {
          id: cs.id,
          classId: cs.classId,
          className: classData?.name || "",
          classLevel: classData?.schoolLevel?.name || null,
          subjectId: cs.subjectId,
          subjectName: subject?.name || "",
          subjectCode: subject?.code || "",
          studentCount: studentCountMap.get(cs.classId) || 0,
          assignmentCount: assignmentCountMap.get(cs.id) || 0,
        }
      }),
    }
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return { success: false, error: "Failed to fetch subjects" }
  }
}

// Get students in a specific class-subject
export async function getSubjectStudents(classSubjectId: string) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    // Verify teacher teaches this subject
    const classSubject = await prisma.classSubject.findFirst({
      where: {
        id: classSubjectId,
        teacherId: auth.session.user.id,
      },
      include: {
        class: true,
        subject: true,
      },
    })
    
    if (!classSubject) {
      return { success: false, error: "You don't teach this subject" }
    }
    
    // Get students in this class - use separate queries
    const studentProfiles = await prisma.studentProfile.findMany({
      where: {
        classId: classSubject.classId,
      },
    })
    
    const userIds = studentProfiles.map(s => s.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        isActive: true,
      },
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
    })
    
    const userMap = new Map(users.map(u => [u.id, u]))
    
    // Sort students by user first name, last name
    const sortedStudents = studentProfiles.sort((a, b) => {
      const userA = userMap.get(a.userId)
      const userB = userMap.get(b.userId)
      const firstNameCompare = (userA?.firstName || "").localeCompare(userB?.firstName || "")
      if (firstNameCompare !== 0) return firstNameCompare
      return (userA?.lastName || "").localeCompare(userB?.lastName || "")
    })
    
    return {
      success: true,
      classSubject: {
        id: classSubject.id,
        className: classSubject.class.name,
        subjectName: classSubject.subject.name,
        subjectCode: classSubject.subject.code,
      },
      students: sortedStudents.map(s => {
        const user = userMap.get(s.userId)
        return {
          id: s.id,
          userId: s.userId,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          email: user?.email || "",
          avatar: user?.avatar || null,
          studentId: s.studentId,
          isActive: user?.isActive || false,
        }
      }),
    }
  } catch (error) {
    console.error("Error fetching students:", error)
    return { success: false, error: "Failed to fetch students" }
  }
}

// Get grades for a specific class-subject the teacher teaches
export async function getSubjectGrades(classSubjectId: string, periodId?: string) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    // Verify teacher teaches this subject
    const classSubject = await prisma.classSubject.findFirst({
      where: {
        id: classSubjectId,
        teacherId: auth.session.user.id,
      },
      include: {
        class: true,
        subject: true,
      },
    })
    
    if (!classSubject) {
      return { success: false, error: "You don't teach this subject" }
    }
    
    // Get academic periods for the school
    const academicPeriods = await prisma.academicPeriod.findMany({
      where: {
        academicYear: {
          schoolId: auth.session.user.schoolId!,
        },
      },
      orderBy: { startDate: "desc" },
    })
    
    const selectedPeriodId = periodId || academicPeriods[0]?.id
    
    // Get students in this class
    const studentProfiles = await prisma.studentProfile.findMany({
      where: {
        classId: classSubject.classId,
      },
    })
    
    const userIds = studentProfiles.map(s => s.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
    })
    
    const userMap = new Map(users.map(u => [u.id, u]))
    
    // Get exam results for this class-subject and period
    const studentIds = studentProfiles.map(s => s.id)
    let examResults: Array<{
      id: string
      studentId: string
      examType: string
      score: number
      maxScore: number
      grade: string | null
      remarks: string | null
    }> = []
    
    if (selectedPeriodId && studentIds.length > 0) {
      const rawResults = await prisma.examResult.findMany({
        where: {
          classSubjectId: classSubjectId,
          academicPeriodId: selectedPeriodId,
          studentId: { in: studentIds },
        },
      })
      
      examResults = rawResults.map(r => ({
        id: r.id,
        studentId: r.studentId,
        examType: r.examType,
        score: Number(r.score),
        maxScore: Number(r.maxScore),
        grade: r.grade,
        remarks: r.remarks,
      }))
    }
    
    // Group exam results by student
    const resultsByStudent = new Map<string, typeof examResults>()
    for (const result of examResults) {
      const existing = resultsByStudent.get(result.studentId) || []
      existing.push(result)
      resultsByStudent.set(result.studentId, existing)
    }
    
    // Sort students by name
    const sortedStudents = studentProfiles.sort((a, b) => {
      const userA = userMap.get(a.userId)
      const userB = userMap.get(b.userId)
      const firstNameCompare = (userA?.firstName || "").localeCompare(userB?.firstName || "")
      if (firstNameCompare !== 0) return firstNameCompare
      return (userA?.lastName || "").localeCompare(userB?.lastName || "")
    })
    
    return {
      success: true,
      classSubject: {
        id: classSubject.id,
        className: classSubject.class.name,
        subjectName: classSubject.subject.name,
        subjectCode: classSubject.subject.code,
        // Grade weight configuration
        homeworkWeight: Number(classSubject.homeworkWeight),
        classworkWeight: Number(classSubject.classworkWeight),
        testWeight: Number(classSubject.testWeight),
        quizWeight: Number(classSubject.quizWeight),
        examWeight: Number(classSubject.examWeight),
        classTestWeight: Number(classSubject.classTestWeight),
        midTermWeight: Number(classSubject.midTermWeight),
        endOfTermWeight: Number(classSubject.endOfTermWeight),
        assignmentWeight: Number(classSubject.assignmentWeight),
        projectWeight: Number(classSubject.projectWeight),
      },
      academicPeriods: academicPeriods.map(ap => ({
        id: ap.id,
        name: ap.name,
      })),
      selectedPeriodId,
      students: sortedStudents.map(s => {
        const user = userMap.get(s.userId)
        const results = resultsByStudent.get(s.id) || []
        
        return {
          id: s.id,
          userId: s.userId,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          studentId: s.studentId,
          isActive: user?.isActive || false,
          examResults: results,
        }
      }),
    }
  } catch (error) {
    console.error("Error fetching subject grades:", error)
    return { success: false, error: "Failed to fetch grades" }
  }
}

// Save or update a student's grade for a specific subject
export async function saveStudentGrade(data: {
  classSubjectId: string
  studentId: string
  periodId: string
  examType: string
  score: number
  maxScore: number
  grade?: string
  remarks?: string
}) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    // Verify teacher teaches this subject
    const classSubject = await prisma.classSubject.findFirst({
      where: {
        id: data.classSubjectId,
        teacherId: auth.session.user.id,
      },
    })
    
    if (!classSubject) {
      return { success: false, error: "You don't teach this subject" }
    }
    
    // Check if result already exists
    const existingResult = await prisma.examResult.findFirst({
      where: {
        classSubjectId: data.classSubjectId,
        studentId: data.studentId,
        academicPeriodId: data.periodId,
        examType: data.examType,
      },
    })
    
    if (existingResult) {
      // Update existing
      await prisma.examResult.update({
        where: { id: existingResult.id },
        data: {
          score: data.score,
          maxScore: data.maxScore,
          grade: data.grade,
          remarks: data.remarks,
        },
      })
    } else {
      // Create new
      await prisma.examResult.create({
        data: {
          classSubjectId: data.classSubjectId,
          studentId: data.studentId,
          academicPeriodId: data.periodId,
          examType: data.examType,
          score: data.score,
          maxScore: data.maxScore,
          grade: data.grade,
          remarks: data.remarks,
        },
      })
    }
    
    revalidatePath(`/teacher/my-subjects/${data.classSubjectId}/grades`)
    
    return { success: true }
  } catch (error) {
    console.error("Error saving grade:", error)
    return { success: false, error: "Failed to save grade" }
  }
}

// Update grade weight configuration for a class-subject
export async function updateGradeWeights(data: {
  classSubjectId: string
  homeworkWeight: number
  classworkWeight: number
  testWeight: number
  quizWeight: number
  examWeight: number
  classTestWeight: number
  midTermWeight: number
  endOfTermWeight: number
  assignmentWeight: number
  projectWeight: number
}) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  // Validate that weights sum to 100
  const totalWeight = data.homeworkWeight + data.classworkWeight + data.testWeight + 
                      data.quizWeight + data.examWeight + data.classTestWeight + 
                      data.midTermWeight + data.endOfTermWeight + 
                      data.assignmentWeight + data.projectWeight
  if (Math.abs(totalWeight - 100) > 0.01) {
    return { success: false, error: `Grade weights must total 100%. Current total: ${totalWeight}%` }
  }
  
  // Validate individual weights are non-negative
  const allWeights = [data.homeworkWeight, data.classworkWeight, data.testWeight, 
                      data.quizWeight, data.examWeight, data.classTestWeight,
                      data.midTermWeight, data.endOfTermWeight, 
                      data.assignmentWeight, data.projectWeight]
  if (allWeights.some(w => w < 0)) {
    return { success: false, error: "Grade weights cannot be negative" }
  }
  
  try {
    // Verify teacher teaches this subject
    const classSubject = await prisma.classSubject.findFirst({
      where: {
        id: data.classSubjectId,
        teacherId: auth.session.user.id,
      },
    })
    
    if (!classSubject) {
      return { success: false, error: "You don't teach this subject" }
    }
    
    // Update the grade weights
    await prisma.classSubject.update({
      where: { id: data.classSubjectId },
      data: {
        homeworkWeight: data.homeworkWeight,
        classworkWeight: data.classworkWeight,
        testWeight: data.testWeight,
        quizWeight: data.quizWeight,
        examWeight: data.examWeight,
        classTestWeight: data.classTestWeight,
        midTermWeight: data.midTermWeight,
        endOfTermWeight: data.endOfTermWeight,
        assignmentWeight: data.assignmentWeight,
        projectWeight: data.projectWeight,
      },
    })
    
    revalidatePath(`/teacher/my-subjects/${data.classSubjectId}/grades`)
    
    return { success: true }
  } catch (error) {
    console.error("Error updating grade weights:", error)
    return { success: false, error: "Failed to update grade weights" }
  }
}

// ============================================
// CLASS TEACHER FUNCTIONS
// ============================================

// Get my class details (for class teachers)
export async function getMyClass() {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    // Use separate queries for Prisma Accelerate compatibility
    const myClass = await prisma.class.findFirst({
      where: {
        classTeacherId: auth.session.user.id,
      },
    })
    
    if (!myClass) {
      return { success: false, error: "You are not assigned as a class teacher" }
    }
    
    // Get related data
    const [schoolLevel, academicYear, studentCount, classSubjects] = await Promise.all([
      myClass.schoolLevelId 
        ? prisma.schoolLevel.findUnique({ where: { id: myClass.schoolLevelId } })
        : Promise.resolve(null),
      myClass.academicYearId
        ? prisma.academicYear.findUnique({ where: { id: myClass.academicYearId } })
        : Promise.resolve(null),
      prisma.studentProfile.count({ where: { classId: myClass.id } }),
      prisma.classSubject.findMany({ where: { classId: myClass.id } })
    ])
    
    // Get subjects and teachers for class subjects
    const subjectIds = classSubjects.map(cs => cs.subjectId)
    const teacherIds = classSubjects.filter(cs => cs.teacherId).map(cs => cs.teacherId!)
    
    const [subjects, teachers] = await Promise.all([
      prisma.subject.findMany({ where: { id: { in: subjectIds } } }),
      teacherIds.length > 0 
        ? prisma.user.findMany({
            where: { id: { in: teacherIds } },
            select: { id: true, firstName: true, lastName: true }
          })
        : Promise.resolve([])
    ])
    
    const subjectMap = new Map(subjects.map(s => [s.id, s]))
    const teacherMap = new Map(teachers.map(t => [t.id, t]))
    
    return {
      success: true,
      class: {
        id: myClass.id,
        name: myClass.name,
        gradeLevel: myClass.gradeLevel,
        section: myClass.section,
        level: schoolLevel?.name || null,
        academicYear: academicYear?.name || null,
        studentCount,
        subjects: classSubjects.map(cs => {
          const subject = subjectMap.get(cs.subjectId)
          const teacher = cs.teacherId ? teacherMap.get(cs.teacherId) : null
          return {
            id: cs.id,
            subjectName: subject?.name || "",
            subjectCode: subject?.code || "",
            teacherName: teacher 
              ? `${teacher.firstName} ${teacher.lastName}`
              : "Not assigned",
          }
        }),
      },
    }
  } catch (error) {
    console.error("Error fetching class:", error)
    return { success: false, error: "Failed to fetch class" }
  }
}

// Get all students in my class
export async function getMyClassStudents() {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const myClass = await prisma.class.findFirst({
      where: {
        classTeacherId: auth.session.user.id,
      },
    })
    
    if (!myClass) {
      return { success: false, error: "You are not assigned as a class teacher" }
    }
    
    // Get students using separate queries
    const studentProfiles = await prisma.studentProfile.findMany({
      where: {
        classId: myClass.id,
      },
    })
    
    // Get user data
    const userIds = studentProfiles.map(s => s.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
      },
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
    })
    const userMap = new Map(users.map(u => [u.id, u]))
    
    // Get parent links
    const studentIds = studentProfiles.map(s => s.id)
    const parentLinks = await prisma.parentStudent.findMany({
      where: { studentId: { in: studentIds } },
    })
    
    // Get parent profiles
    const parentProfileIds = [...new Set(parentLinks.map(pl => pl.parentId))]
    const parentProfiles = parentProfileIds.length > 0 
      ? await prisma.parentProfile.findMany({
          where: { id: { in: parentProfileIds } },
        })
      : []
    
    // Get parent users
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
    const parentProfileMap = new Map(parentProfiles.map(p => [p.id, { ...p, user: parentUserMap.get(p.userId) }]))
    
    // Group parent links by student
    const parentLinksByStudent = new Map<string, typeof parentLinks>()
    for (const link of parentLinks) {
      const existing = parentLinksByStudent.get(link.studentId) || []
      parentLinksByStudent.set(link.studentId, [...existing, link])
    }
    
    // Sort students by user name
    const sortedStudents = studentProfiles.sort((a, b) => {
      const userA = userMap.get(a.userId)
      const userB = userMap.get(b.userId)
      const firstNameCompare = (userA?.firstName || "").localeCompare(userB?.firstName || "")
      if (firstNameCompare !== 0) return firstNameCompare
      return (userA?.lastName || "").localeCompare(userB?.lastName || "")
    })
    
    return {
      success: true,
      className: myClass.name,
      students: sortedStudents.map(s => {
        const user = userMap.get(s.userId)
        const studentParentLinks = parentLinksByStudent.get(s.id) || []
        
        return {
          id: s.id,
          userId: s.userId,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          email: user?.email || "",
          phone: user?.phone || null,
          avatar: user?.avatar || null,
          studentId: s.studentId,
          dateOfBirth: s.dateOfBirth,
          gender: s.gender,
          isActive: user?.isActive || false,
          parents: studentParentLinks.map(pl => {
            const parent = parentProfileMap.get(pl.parentId)
            return {
              name: parent?.user ? `${parent.user.firstName} ${parent.user.lastName}` : "Unknown",
              email: parent?.user?.email || null,
              phone: parent?.user?.phone || null,
              relationship: parent?.relationship || null,
            }
          }),
        }
      }),
    }
  } catch (error) {
    console.error("Error fetching students:", error)
    return { success: false, error: "Failed to fetch students" }
  }
}

// Get attendance for my class
export async function getMyClassAttendance(date?: string) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const myClass = await prisma.class.findFirst({
      where: {
        classTeacherId: auth.session.user.id,
      },
    })
    
    if (!myClass) {
      return { success: false, error: "You are not assigned as a class teacher" }
    }
    
    const targetDate = date ? new Date(date) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)
    
    // Get all students in class - use separate queries
    const studentProfiles = await prisma.studentProfile.findMany({
      where: {
        classId: myClass.id,
      },
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
    
    // Get existing attendance for this date
    const attendance = await prisma.attendance.findMany({
      where: {
        classId: myClass.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })
    
    const attendanceMap = new Map(attendance.map(a => [a.studentId, a]))
    
    // Sort students by name
    const sortedStudents = studentProfiles.sort((a, b) => {
      const userA = userMap.get(a.userId)
      const userB = userMap.get(b.userId)
      const firstNameCompare = (userA?.firstName || "").localeCompare(userB?.firstName || "")
      if (firstNameCompare !== 0) return firstNameCompare
      return (userA?.lastName || "").localeCompare(userB?.lastName || "")
    })
    
    return {
      success: true,
      className: myClass.name,
      classId: myClass.id,
      date: targetDate.toISOString().split("T")[0],
      students: sortedStudents.map(s => {
        const user = userMap.get(s.userId)
        const record = attendanceMap.get(s.id)
        return {
          id: s.id,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          studentId: s.studentId,
          avatar: user?.avatar || null,
          attendanceId: record?.id || null,
          status: record?.status || null,
          remarks: record?.notes || null,
        }
      }),
    }
  } catch (error) {
    console.error("Error fetching attendance:", error)
    return { success: false, error: "Failed to fetch attendance" }
  }
}

// Mark attendance for my class
export async function markClassAttendance(
  date: string,
  attendanceData: Array<{
    studentId: string
    status: AttendanceStatus
    remarks?: string
  }>
) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const myClass = await prisma.class.findFirst({
      where: {
        classTeacherId: auth.session.user.id,
      },
    })
    
    if (!myClass) {
      return { success: false, error: "You are not assigned as a class teacher" }
    }
    
    const targetDate = new Date(date)
    targetDate.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues
    
    // Delete existing attendance for this date
    await prisma.attendance.deleteMany({
      where: {
        classId: myClass.id,
        date: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lte: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
      },
    })
    
    // Create new attendance records
    await prisma.attendance.createMany({
      data: attendanceData.map(a => ({
        studentId: a.studentId,
        classId: myClass.id,
        date: targetDate,
        status: a.status,
        notes: a.remarks || null,
        markedById: auth.session!.user.id,
      })),
    })
    
    revalidatePath("/teacher/my-class/attendance")
    return { success: true }
  } catch (error) {
    console.error("Error marking attendance:", error)
    return { success: false, error: "Failed to mark attendance" }
  }
}

// Get comprehensive grades overview for my class (class teacher view)
export async function getMyClassGrades(periodId?: string) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    // Get the class where this teacher is the class teacher
    const myClass = await prisma.class.findFirst({
      where: {
        classTeacherId: auth.session.user.id,
      },
    })
    
    if (!myClass) {
      return { success: false, error: "You are not assigned as a class teacher" }
    }
    
    // Get class subjects with grade weights and teacher info
    const classSubjects = await prisma.classSubject.findMany({
      where: { classId: myClass.id }
    })
    
    // Get subject teachers
    const teacherIds = classSubjects.map(cs => cs.teacherId).filter(Boolean) as string[]
    const teachers = teacherIds.length > 0 
      ? await prisma.user.findMany({ 
          where: { id: { in: teacherIds } },
          select: { id: true, firstName: true, lastName: true }
        })
      : []
    const teacherMap = new Map(teachers.map(t => [t.id, t]))
    
    // Create a map of classSubject weights
    const classSubjectWeights = new Map(classSubjects.map(cs => [cs.id, {
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
    }]))
    
    const subjectIds = classSubjects.map(cs => cs.subjectId)
    const subjects = subjectIds.length > 0 
      ? await prisma.subject.findMany({ where: { id: { in: subjectIds } } })
      : []
    const subjectMap = new Map(subjects.map(s => [s.id, s]))
    
    // Get academic periods
    const academicPeriods = await prisma.academicPeriod.findMany({
      where: {
        academicYear: {
          schoolId: auth.session.user.schoolId!,
        },
      },
      orderBy: { startDate: "desc" },
    })
    
    const selectedPeriodId = periodId || academicPeriods[0]?.id
    
    // Get students
    const studentProfiles = await prisma.studentProfile.findMany({
      where: { classId: myClass.id },
    })
    
    // Get users for students
    const userIds = studentProfiles.map(s => s.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }]
    })
    const userMap = new Map(users.map(u => [u.id, u]))
    
    // Get all exam results if period selected (with remarks)
    const studentIds = studentProfiles.map(s => s.id)
    let allExamResults: Array<{
      id: string
      studentId: string
      classSubjectId: string
      examType: string
      score: number
      maxScore: number
      grade: string | null
      remarks: string | null
    }> = []
    
    let reportCardsByStudent = new Map<string, { 
      totalScore: number | null
      averageScore: number | null
      position: number | null
      passStatus: string | null 
    }>()
    
    if (selectedPeriodId && studentIds.length > 0) {
      const examResults = await prisma.examResult.findMany({
        where: {
          academicPeriodId: selectedPeriodId,
          studentId: { in: studentIds },
        },
      })
      
      allExamResults = examResults.map(er => ({
        id: er.id,
        studentId: er.studentId,
        classSubjectId: er.classSubjectId,
        examType: er.examType,
        score: Number(er.score),
        maxScore: Number(er.maxScore),
        grade: er.grade,
        remarks: er.remarks,
      }))
      
      const reportCards = await prisma.reportCard.findMany({
        where: {
          academicPeriodId: selectedPeriodId,
          studentId: { in: studentIds },
        },
      })
      
      for (const rc of reportCards) {
        reportCardsByStudent.set(rc.studentId, {
          totalScore: rc.totalScore ? Number(rc.totalScore) : null,
          averageScore: rc.averageScore ? Number(rc.averageScore) : null,
          position: rc.position,
          passStatus: rc.passStatus,
        })
      }
    }
    
    // Exam type labels
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
    
    // Exam type to weight key mapping
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
    
    // Calculate grade helper
    const calculateGrade = (percentage: number): string => {
      if (percentage >= 80) return "A"
      if (percentage >= 70) return "B"
      if (percentage >= 60) return "C"
      if (percentage >= 50) return "D"
      if (percentage >= 40) return "E"
      return "F"
    }
    
    // Sort students by name
    const sortedStudents = studentProfiles.sort((a, b) => {
      const userA = userMap.get(a.userId)
      const userB = userMap.get(b.userId)
      const firstNameCompare = (userA?.firstName || "").localeCompare(userB?.firstName || "")
      if (firstNameCompare !== 0) return firstNameCompare
      return (userA?.lastName || "").localeCompare(userB?.lastName || "")
    })
    
    // Build subjects with teacher info and weights
    const subjectsWithInfo = classSubjects.map(cs => {
      const subject = subjectMap.get(cs.subjectId)
      const teacher = cs.teacherId ? teacherMap.get(cs.teacherId) : null
      const weights = classSubjectWeights.get(cs.id)
      
      return {
        id: cs.id,
        name: subject?.name || "",
        code: subject?.code || null,
        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : null,
        weights: weights || null,
      }
    })
    
    // Build comprehensive student data
    const studentsWithGrades = sortedStudents.map(s => {
      const user = userMap.get(s.userId)
      const studentResults = allExamResults.filter(er => er.studentId === s.id)
      const reportCard = reportCardsByStudent.get(s.id)
      
      // Group results by subject
      const subjectGrades = subjectsWithInfo.map(subject => {
        const subjectResults = studentResults.filter(r => r.classSubjectId === subject.id)
        const weights = classSubjectWeights.get(subject.id)
        
        // Calculate weighted average for this subject
        let weightedScore = 0
        let totalWeight = 0
        
        // Group results by exam type with details
        const examTypeResults = subjectResults.map(r => {
          const weightKey = examTypeToWeightKey[r.examType] as keyof NonNullable<typeof weights>
          const weight = weights && weightKey ? (weights[weightKey] || 0) : 0
          
          if (weight > 0 && r.maxScore > 0) {
            const percentage = (r.score / r.maxScore) * 100
            weightedScore += percentage * (weight / 100)
            totalWeight += weight
          }
          
          return {
            examType: r.examType,
            examTypeLabel: examTypeLabels[r.examType] || r.examType,
            score: r.score,
            maxScore: r.maxScore,
            percentage: r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0,
            grade: r.grade,
            remarks: r.remarks,
            weight: weight,
          }
        })
        
        // Calculate final weighted score
        const finalScore = totalWeight > 0 
          ? Math.round((weightedScore / totalWeight) * 100) 
          : null
        
        return {
          subjectId: subject.id,
          subjectName: subject.name,
          subjectCode: subject.code,
          teacherName: subject.teacherName,
          examResults: examTypeResults,
          weightedScore: finalScore,
          grade: finalScore !== null ? calculateGrade(finalScore) : null,
          hasGrades: examTypeResults.length > 0,
        }
      })
      
      // Calculate overall average
      const subjectsWithScores = subjectGrades.filter(sg => sg.weightedScore !== null)
      const overallAverage = subjectsWithScores.length > 0
        ? Math.round(subjectsWithScores.reduce((sum, sg) => sum + (sg.weightedScore || 0), 0) / subjectsWithScores.length)
        : null
      
      return {
        id: s.id,
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        studentId: s.studentId,
        subjectGrades,
        overallAverage,
        overallGrade: overallAverage !== null ? calculateGrade(overallAverage) : null,
        reportCard: reportCard ? {
          totalScore: reportCard.totalScore,
          averageScore: reportCard.averageScore,
          position: reportCard.position,
          passStatus: reportCard.passStatus,
        } : null,
      }
    })
    
    return {
      success: true,
      className: myClass.name,
      examPeriods: academicPeriods.map(ap => ({
        id: ap.id,
        name: ap.name,
      })),
      selectedPeriodId,
      subjects: subjectsWithInfo,
      students: studentsWithGrades,
      examTypeLabels,
    }
  } catch (error) {
    console.error("Error fetching class grades:", error)
    return { success: false, error: "Failed to fetch grades" }
  }
}

// Get teacher timetable
export async function getTeacherTimetable() {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
    })
    
    if (!user) {
      return { success: false, error: "User not found" }
    }
    
    // Get periods (exclude breaks)
    const periods = await prisma.period.findMany({
      where: {
        schoolId: user.schoolId!,
        isBreak: false,
      },
      orderBy: { order: "asc" },
    })
    
    // Get timetable slots with separate queries for Prisma Accelerate compatibility
    const rawSlots = await prisma.timetableSlot.findMany({
      where: {
        teacherId: user.id,
      },
    })
    
    // Get related data
    const periodIds = [...new Set(rawSlots.map(s => s.periodId))]
    const classIds = [...new Set(rawSlots.map(s => s.classId))]
    const classSubjectIds = rawSlots.filter(s => s.classSubjectId).map(s => s.classSubjectId!)
    
    const [periodsData, classesData, classSubjectsData] = await Promise.all([
      prisma.period.findMany({ where: { id: { in: periodIds } } }),
      prisma.class.findMany({ 
        where: { id: { in: classIds } },
        include: { schoolLevel: true }
      }),
      classSubjectIds.length > 0 
        ? prisma.classSubject.findMany({
            where: { id: { in: classSubjectIds } },
            include: { subject: true }
          })
        : Promise.resolve([])
    ])
    
    const periodMap = new Map(periodsData.map(p => [p.id, p]))
    const classMap = new Map(classesData.map(c => [c.id, c]))
    const classSubjectMap = new Map(classSubjectsData.map(cs => [cs.id, cs]))
    
    // Build timetable entries in the format expected by the component
    const timetableEntries = rawSlots.map(slot => {
      const period = periodMap.get(slot.periodId)
      const classData = classMap.get(slot.classId)
      const classSubject = slot.classSubjectId ? classSubjectMap.get(slot.classSubjectId) : null
      
      return {
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        room: slot.roomNumber,
        period: period ? {
          id: period.id,
          name: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          order: period.order,
        } : null,
        subject: classSubject ? {
          id: classSubject.subject.id,
          name: classSubject.subject.name,
          code: classSubject.subject.code,
        } : null,
        class: classData ? {
          id: classData.id,
          name: classData.name,
          section: classData.section,
          grade: {
            name: classData.schoolLevel?.name || classData.gradeLevel || "",
          },
        } : null,
      }
    }).filter(entry => entry.period && entry.class) // Filter out any with missing data
    
    return {
      success: true,
      periods: periods.map(p => ({
        id: p.id,
        name: p.name,
        startTime: p.startTime,
        endTime: p.endTime,
        order: p.order,
      })),
      timetable: timetableEntries as Array<{
        id: string
        dayOfWeek: number
        room: string | null
        period: { id: string; name: string; startTime: string; endTime: string; order: number }
        subject: { id: string; name: string; code: string } | null
        class: { id: string; name: string; section: string | null; grade: { name: string } }
      }>,
    }
  } catch (error) {
    console.error("Error fetching timetable:", error)
    return { success: false, error: "Failed to fetch timetable" }
  }
}

// Get teacher profile
export async function getTeacherProfile() {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    // Use separate queries for Prisma Accelerate compatibility
    const user = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
    })
    
    if (!user) {
      return { success: false, error: "User not found" }
    }
    
    const [teacherProfile, school, classTeacherOf, subjectTeachers] = await Promise.all([
      prisma.teacherProfile.findUnique({ where: { userId: user.id } }),
      user.schoolId ? prisma.school.findUnique({ 
        where: { id: user.schoolId },
        select: { name: true }
      }) : Promise.resolve(null),
      prisma.class.findMany({
        where: { classTeacherId: user.id },
        include: { schoolLevel: true }
      }),
      prisma.classSubject.findMany({
        where: { teacherId: user.id },
        include: {
          subject: true,
          class: { include: { schoolLevel: true } }
        }
      })
    ])
    
    return {
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatar,
        teacherProfile: teacherProfile ? {
          employeeId: teacherProfile.employeeId,
          qualification: teacherProfile.qualification,
          specialization: teacherProfile.specialization,
          dateOfJoining: teacherProfile.joinDate,
          address: null, // Address not in schema
        } : null,
        school: {
          name: school?.name || "Unknown School",
        },
        classTeacherOf: classTeacherOf.map(c => ({
          id: c.id,
          name: c.name,
          grade: { name: c.schoolLevel?.name || String(c.gradeLevel || "") },
        })),
        subjectTeachers: subjectTeachers.map(st => ({
          subject: {
            name: st.subject.name,
            code: st.subject.code,
          },
          class: {
            name: st.class.name,
            grade: { name: st.class.schoolLevel?.name || String(st.class.gradeLevel || "") },
          },
        })),
      },
    }
  } catch (error) {
    console.error("Error fetching profile:", error)
    return { success: false, error: "Failed to fetch profile" }
  }
}

// Update teacher profile
export async function updateTeacherProfile(data: {
  phone?: string
  qualification?: string
  specialization?: string
}) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    await prisma.$transaction(async (tx) => {
      if (data.phone !== undefined) {
        await tx.user.update({
          where: { id: auth.session!.user.id },
          data: { phone: data.phone || null },
        })
      }
      
      if (data.qualification !== undefined || data.specialization !== undefined) {
        await tx.teacherProfile.upsert({
          where: { userId: auth.session!.user.id },
          create: {
            userId: auth.session!.user.id,
            qualification: data.qualification || null,
            specialization: data.specialization || null,
          },
          update: {
            ...(data.qualification !== undefined && { qualification: data.qualification || null }),
            ...(data.specialization !== undefined && { specialization: data.specialization || null }),
          },
        })
      }
    })
    
    revalidatePath("/teacher/profile")
    return { success: true }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: "Failed to update profile" }
  }
}

// Change teacher password
export async function changeTeacherPassword(
  currentPassword: string,
  newPassword: string
) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
    })
    
    if (!user || !user.passwordHash) {
      return { success: false, error: "User not found" }
    }
    
    const isValid = await verifyPassword(currentPassword, user.passwordHash)
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" }
    }
    
    if (newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters" }
    }
    
    const hashedPassword = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    })
    
    return { success: true }
  } catch (error) {
    console.error("Error changing password:", error)
    return { success: false, error: "Failed to change password" }
  }
}

// Get teacher messages
export async function getTeacherMessages(type: "inbox" | "sent" = "inbox") {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const userId = auth.session.user.id
    
    const rawMessages = await prisma.message.findMany({
      where: type === "inbox" 
        ? { receiverId: userId }
        : { senderId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    
    const senderIds = [...new Set(rawMessages.map(m => m.senderId))]
    
    const senders = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
      },
    })
    const senderMap = new Map(senders.map(s => [s.id, s]))
    
    return {
      success: true,
      messages: rawMessages.map(m => {
        const sender = senderMap.get(m.senderId)
        
        return {
          id: m.id,
          subject: m.subject,
          content: m.content,
          isRead: m.isRead,
          createdAt: m.createdAt,
          sender: sender ? {
            firstName: sender.firstName,
            lastName: sender.lastName,
            email: sender.email,
            avatarUrl: sender.avatar,
          } : { firstName: "Unknown", lastName: "User", email: "", avatarUrl: null },
        }
      }),
    }
  } catch (error) {
    console.error("Error fetching messages:", error)
    return { success: false, error: "Failed to fetch messages" }
  }
}

// Write class teacher remarks
export async function writeClassTeacherRemarks(
  studentId: string,
  academicPeriodId: string,
  remarks: string
) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    // Verify teacher is class teacher of this student's class - use separate query
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
    })
    
    if (!student || !student.classId) {
      return { success: false, error: "Student not found" }
    }
    
    const studentClass = await prisma.class.findUnique({
      where: { id: student.classId },
    })
    
    if (!studentClass || studentClass.classTeacherId !== auth.session.user.id) {
      return { success: false, error: "You are not the class teacher for this student" }
    }
    
    // For now, we'll store remarks in a different way since the schema doesn't have classTeacherRemarks
    // This would require a schema update to add a remarks field to ReportCard
    // For now, return a message
    return { success: false, error: "Remarks feature requires schema update" }
    
  } catch (error) {
    console.error("Error writing remarks:", error)
    return { success: false, error: "Failed to save remarks" }
  }
}
