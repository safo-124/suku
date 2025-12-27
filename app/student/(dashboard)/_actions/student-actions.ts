"use server"

import prisma from "@/lib/prisma"
import { getSession, getCurrentSchoolSlug } from "@/lib/auth"
import { UserRole, AttendanceStatus } from "@/app/generated/prisma/client"

// Verify student access - uses student-specific session cookie
async function verifyStudentAccess() {
  const session = await getSession(UserRole.STUDENT)
  
  if (!session) {
    return { success: false, error: "Not authenticated" }
  }
  
  if (session.user.role !== UserRole.STUDENT) {
    return { success: false, error: "Access denied. Students only." }
  }
  
  const schoolSlug = await getCurrentSchoolSlug()
  if (!schoolSlug) {
    return { success: false, error: "School not found" }
  }
  
  if (session.user.schoolSlug !== schoolSlug) {
    return { success: false, error: "Access denied to this school" }
  }
  
  return { success: true, session }
}

// Get student profile with class info
export async function getStudentProfile() {
  const auth = await verifyStudentAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
      include: {
        studentProfile: {
          include: {
            class: {
              include: {
                schoolLevel: {
                  select: {
                    id: true,
                    name: true,
                    shortName: true,
                  },
                },
                classTeacher: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
                academicYear: {
                  select: {
                    id: true,
                    name: true,
                    isCurrent: true,
                  },
                },
              },
            },
          },
        },
      },
    })
    
    if (!user || !user.studentProfile) {
      return { success: false, error: "Student profile not found" }
    }
    
    return { 
      success: true, 
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        studentId: user.studentProfile.studentId,
        dateOfBirth: user.studentProfile.dateOfBirth,
        gender: user.studentProfile.gender,
        bloodGroup: user.studentProfile.bloodGroup,
        address: user.studentProfile.address,
        admissionDate: user.studentProfile.admissionDate,
        class: user.studentProfile.class,
      },
    }
  } catch (error) {
    console.error("Error fetching student profile:", error)
    return { success: false, error: "Failed to fetch profile" }
  }
}

// Get student dashboard data
export async function getStudentDashboard() {
  const auth = await verifyStudentAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
      include: {
        studentProfile: {
          include: {
            class: {
              include: {
                schoolLevel: true,
                academicYear: true,
                classTeacher: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                classSubjects: {
                  include: {
                    subject: true,
                    teacher: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
    
    if (!user || !user.studentProfile) {
      return { success: false, error: "Student profile not found" }
    }
    
    const studentProfileId = user.studentProfile.id
    const classId = user.studentProfile.classId
    
    // Get attendance stats for current month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const endOfMonth = new Date()
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)
    endOfMonth.setDate(0)
    endOfMonth.setHours(23, 59, 59, 999)
    
    const attendance = classId ? await prisma.attendance.findMany({
      where: {
        studentId: studentProfileId,
        classId: classId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    }) : []
    
    const attendanceStats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === AttendanceStatus.PRESENT).length,
      absent: attendance.filter(a => a.status === AttendanceStatus.ABSENT).length,
      late: attendance.filter(a => a.status === AttendanceStatus.LATE).length,
      excused: attendance.filter(a => a.status === AttendanceStatus.EXCUSED).length,
    }
    
    // Get recent assignments
    const classSubjectIds = user.studentProfile.class?.classSubjects?.map(cs => cs.id) || []
    
    const upcomingAssignmentsRaw = classSubjectIds.length > 0 ? await prisma.assignment.findMany({
      where: {
        classSubjectId: { in: classSubjectIds },
        isPublished: true,
        dueDate: {
          gte: new Date(),
        },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }) : []
    
    // Get subjects for assignments
    const assignmentClassSubjectIds = upcomingAssignmentsRaw.map(a => a.classSubjectId)
    const classSubjectsForAssignments = await prisma.classSubject.findMany({
      where: { id: { in: assignmentClassSubjectIds } },
      include: { subject: { select: { name: true, code: true } } },
    })
    const classSubjectMap = new Map(classSubjectsForAssignments.map(cs => [cs.id, cs]))
    
    // Get notifications count
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: auth.session.user.id,
        isRead: false,
      },
    })
    
    // Get unread messages count
    const unreadMessages = await prisma.message.count({
      where: {
        receiverId: auth.session.user.id,
        isRead: false,
      },
    })
    
    return {
      success: true,
      data: {
        student: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          studentId: user.studentProfile.studentId,
          avatar: user.avatar,
        },
        class: user.studentProfile.class ? {
          id: user.studentProfile.class.id,
          name: user.studentProfile.class.name,
          level: user.studentProfile.class.schoolLevel?.name ?? null,
          academicYear: user.studentProfile.class.academicYear?.name ?? null,
          classTeacher: user.studentProfile.class.classTeacher 
            ? `${user.studentProfile.class.classTeacher.firstName} ${user.studentProfile.class.classTeacher.lastName}`
            : null,
        } : null,
        subjects: user.studentProfile.class?.classSubjects?.map(cs => ({
          id: cs.id,
          name: cs.subject.name,
          code: cs.subject.code,
          teacher: cs.teacher 
            ? `${cs.teacher.firstName} ${cs.teacher.lastName}`
            : null,
        })) || [],
        attendanceStats,
        upcomingAssignments: upcomingAssignmentsRaw.map(a => {
          const cs = classSubjectMap.get(a.classSubjectId)
          return {
            id: a.id,
            title: a.title,
            subject: cs?.subject?.name || "Unknown",
            dueDate: a.dueDate,
            type: a.type,
          }
        }),
        unreadNotifications,
        unreadMessages,
      },
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return { success: false, error: "Failed to fetch dashboard data" }
  }
}

// Get student subjects
export async function getStudentSubjects() {
  const auth = await verifyStudentAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
      include: {
        studentProfile: {
          include: {
            class: {
              include: {
                classSubjects: {
                  include: {
                    subject: true,
                    teacher: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                      },
                    },
                  },
                },
              },
            },
            subjectSelections: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    })
    
    if (!user || !user.studentProfile) {
      return { success: false, error: "Student profile not found" }
    }
    
    const classSubjects = user.studentProfile.class?.classSubjects || []
    const electiveSelections = user.studentProfile.subjectSelections || []
    
    return {
      success: true,
      subjects: classSubjects.map(cs => ({
        id: cs.id,
        subjectId: cs.subject.id,
        name: cs.subject.name,
        code: cs.subject.code,
        description: cs.subject.description,
        teacher: cs.teacher ? {
          id: cs.teacher.id,
          name: `${cs.teacher.firstName} ${cs.teacher.lastName}`,
          email: cs.teacher.email,
          avatar: cs.teacher.avatar,
        } : null,
      })),
      electives: electiveSelections.map(es => ({
        id: es.id,
        subjectId: es.subject.id,
        name: es.subject.name,
        code: es.subject.code,
        approvedAt: es.approvedAt,
      })),
    }
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return { success: false, error: "Failed to fetch subjects" }
  }
}

// Get student attendance
export async function getStudentAttendance(month?: number, year?: number) {
  const auth = await verifyStudentAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
      include: {
        studentProfile: true,
      },
    })
    
    if (!user || !user.studentProfile) {
      return { success: false, error: "Student profile not found" }
    }
    
    // Default to current month
    const targetMonth = month ?? new Date().getMonth()
    const targetYear = year ?? new Date().getFullYear()
    
    const startDate = new Date(targetYear, targetMonth, 1)
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999)
    
    const attendance = await prisma.attendance.findMany({
      where: {
        studentId: user.studentProfile.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "desc" },
    })
    
    // Get class names and markers
    const classIds = [...new Set(attendance.map(a => a.classId))]
    const markedByIds = [...new Set(attendance.map(a => a.markedById).filter(Boolean) as string[])]
    
    const [classes, markers] = await Promise.all([
      prisma.class.findMany({
        where: { id: { in: classIds } },
        select: { id: true, name: true },
      }),
      markedByIds.length > 0 ? prisma.user.findMany({
        where: { id: { in: markedByIds } },
        select: { id: true, firstName: true, lastName: true },
      }) : [],
    ])
    
    const classMap = new Map(classes.map(c => [c.id, c.name]))
    const markerMap = new Map(markers.map(m => [m.id, `${m.firstName} ${m.lastName}`]))
    
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === AttendanceStatus.PRESENT).length,
      absent: attendance.filter(a => a.status === AttendanceStatus.ABSENT).length,
      late: attendance.filter(a => a.status === AttendanceStatus.LATE).length,
      excused: attendance.filter(a => a.status === AttendanceStatus.EXCUSED).length,
      percentage: 0,
    }
    
    if (stats.total > 0) {
      stats.percentage = Math.round(((stats.present + stats.late) / stats.total) * 100)
    }
    
    return {
      success: true,
      attendance: attendance.map(a => ({
        id: a.id,
        date: a.date,
        status: a.status,
        notes: a.notes,
        className: classMap.get(a.classId) || "Unknown",
        markedBy: a.markedById ? markerMap.get(a.markedById) || null : null,
      })),
      stats,
      month: targetMonth,
      year: targetYear,
    }
  } catch (error) {
    console.error("Error fetching attendance:", error)
    return { success: false, error: "Failed to fetch attendance" }
  }
}

// Get student grades/results
export async function getStudentGrades(periodId?: string) {
  const auth = await verifyStudentAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: auth.session.user.id },
    })
    
    if (!studentProfile) {
      return { success: false, error: "Student profile not found" }
    }
    
    // Get class and academic year
    let periods: { id: string; name: string; startDate: Date; endDate: Date; order: number }[] = []
    
    if (studentProfile.classId) {
      const classData = await prisma.class.findUnique({
        where: { id: studentProfile.classId },
        select: { academicYearId: true },
      })
      
      if (classData?.academicYearId) {
        periods = await prisma.academicPeriod.findMany({
          where: { academicYearId: classData.academicYearId },
          select: { id: true, name: true, startDate: true, endDate: true, order: true },
          orderBy: { order: "asc" },
        })
      }
    }
    
    // Get selected period or latest
    const selectedPeriodId = periodId || periods[periods.length - 1]?.id
    
    // Get exam results
    const examResults = selectedPeriodId ? await prisma.examResult.findMany({
      where: {
        studentId: studentProfile.id,
        academicPeriodId: selectedPeriodId,
      },
    }) : []
    
    // Get class subjects and subjects for exam results
    const classSubjectIds = [...new Set(examResults.map(r => r.classSubjectId))]
    const classSubjects = classSubjectIds.length > 0 ? await prisma.classSubject.findMany({
      where: { id: { in: classSubjectIds } },
      select: { id: true, subjectId: true },
    }) : []
    
    const subjectIds = [...new Set(classSubjects.map(cs => cs.subjectId))]
    const subjects = subjectIds.length > 0 ? await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true, code: true },
    }) : []
    
    const classSubjectMap = new Map(classSubjects.map(cs => [cs.id, cs.subjectId]))
    const subjectMap = new Map(subjects.map(s => [s.id, s]))
    
    // Get report card if exists
    const reportCard = selectedPeriodId ? await prisma.reportCard.findFirst({
      where: {
        studentId: studentProfile.id,
        academicPeriodId: selectedPeriodId,
      },
    }) : null
    
    // Group results by subject
    const resultsBySubject: Record<string, {
      subject: { id: string; name: string; code: string | null };
      results: Array<{
        id: string;
        examType: string;
        score: number;
        maxScore: number;
        grade: string | null;
        remarks: string | null;
      }>;
    }> = {}
    
    for (const result of examResults) {
      const subjectId = classSubjectMap.get(result.classSubjectId)
      if (!subjectId) continue
      
      const subject = subjectMap.get(subjectId)
      if (!subject) continue
      
      if (!resultsBySubject[subjectId]) {
        resultsBySubject[subjectId] = {
          subject: {
            id: subjectId,
            name: subject.name,
            code: subject.code,
          },
          results: [],
        }
      }
      resultsBySubject[subjectId].results.push({
        id: result.id,
        examType: result.examType,
        score: Number(result.score),
        maxScore: Number(result.maxScore),
        grade: result.grade,
        remarks: result.remarks,
      })
    }
    
    return {
      success: true,
      periods: periods.map(p => ({
        id: p.id,
        name: p.name,
        startDate: p.startDate,
        endDate: p.endDate,
      })),
      selectedPeriodId,
      resultsBySubject: Object.values(resultsBySubject),
      reportCard: reportCard ? {
        id: reportCard.id,
        totalScore: reportCard.totalScore ? Number(reportCard.totalScore) : null,
        averageScore: reportCard.averageScore ? Number(reportCard.averageScore) : null,
        position: reportCard.position,
        attendancePercentage: reportCard.attendancePercentage 
          ? Number(reportCard.attendancePercentage) 
          : null,
        passStatus: reportCard.passStatus,
        promotionEligible: reportCard.promotionEligible,
        publishedAt: reportCard.publishedAt,
      } : null,
    }
  } catch (error) {
    console.error("Error fetching grades:", error)
    return { success: false, error: "Failed to fetch grades" }
  }
}

// Get student timetable
export async function getStudentTimetable() {
  const auth = await verifyStudentAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
      include: {
        studentProfile: {
          include: {
            class: true,
          },
        },
      },
    })
    
    if (!user || !user.studentProfile || !user.studentProfile.classId) {
      return { success: false, error: "Class not assigned" }
    }
    
    const classId = user.studentProfile.classId
    
    // Get periods (time slots)
    const periods = await prisma.period.findMany({
      where: {
        schoolId: user.schoolId!,
      },
      orderBy: { order: "asc" },
    })
    
    // Get timetable slots - use separate queries for Prisma Accelerate compatibility
    const rawTimetableSlots = await prisma.timetableSlot.findMany({
      where: {
        classId: classId,
      },
      orderBy: [
        { dayOfWeek: "asc" },
      ],
    })
    
    // Build period map
    const periodMap = new Map(periods.map(p => [p.id, p]))
    
    // Get class subjects for these slots
    const classSubjectIds = rawTimetableSlots
      .map(s => s.classSubjectId)
      .filter((id): id is string => id !== null)
    
    const classSubjects = classSubjectIds.length > 0 
      ? await prisma.classSubject.findMany({
          where: { id: { in: classSubjectIds } },
        })
      : []
    
    // Get subjects for class subjects
    const subjectIds = classSubjects.map(cs => cs.subjectId)
    const subjects = subjectIds.length > 0
      ? await prisma.subject.findMany({
          where: { id: { in: subjectIds } },
        })
      : []
    const subjectMap = new Map(subjects.map(s => [s.id, s]))
    const classSubjectMap = new Map(classSubjects.map(cs => [cs.id, { ...cs, subject: subjectMap.get(cs.subjectId) }]))
    
    // Get teachers for these slots
    const teacherIds = rawTimetableSlots
      .map(s => s.teacherId)
      .filter((id): id is string => id !== null)
    
    const teachers = teacherIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: teacherIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : []
    const teacherMap = new Map(teachers.map(t => [t.id, t]))
    
    // Organize by day
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const timetableByDay: Record<number, typeof rawTimetableSlots> = {}
    
    for (let i = 0; i <= 6; i++) {
      timetableByDay[i] = rawTimetableSlots
        .filter(slot => slot.dayOfWeek === i)
        .sort((a, b) => {
          const periodA = periodMap.get(a.periodId)
          const periodB = periodMap.get(b.periodId)
          return (periodA?.order ?? 0) - (periodB?.order ?? 0)
        })
    }
    
    return {
      success: true,
      periods: periods.map(p => ({
        id: p.id,
        name: p.name,
        startTime: p.startTime,
        endTime: p.endTime,
        isBreak: p.isBreak,
      })),
      timetable: Object.entries(timetableByDay).map(([day, slots]) => ({
        day: Number(day),
        dayName: days[Number(day)],
        slots: slots.map(slot => {
          const period = periodMap.get(slot.periodId)
          const classSubject = slot.classSubjectId ? classSubjectMap.get(slot.classSubjectId) : null
          const teacher = slot.teacherId ? teacherMap.get(slot.teacherId) : null
          
          return {
            id: slot.id,
            periodId: slot.periodId,
            periodName: period?.name ?? "",
            startTime: period?.startTime ?? "",
            endTime: period?.endTime ?? "",
            isBreak: period?.isBreak ?? false,
            subject: classSubject?.subject ? {
              id: classSubject.subject.id,
              name: classSubject.subject.name,
              code: classSubject.subject.code,
            } : null,
            teacher: teacher 
              ? `${teacher.firstName} ${teacher.lastName}`
              : null,
            room: slot.roomNumber,
          }
        }),
      })),
      className: user.studentProfile.class?.name,
    }
  } catch (error) {
    console.error("Error fetching timetable:", error)
    return { success: false, error: "Failed to fetch timetable" }
  }
}

// Get student fees
export async function getStudentFees() {
  const auth = await verifyStudentAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    // Get student profile separately for Prisma Accelerate compatibility
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: auth.session.user.id },
    })
    
    if (!studentProfile) {
      return { success: false, error: "Student profile not found" }
    }
    
    // Get fee assignments
    const feeAssignments = await prisma.studentFee.findMany({
      where: { studentId: studentProfile.id },
    }) as unknown as Array<{
      id: string
      studentId: string
      feeStructureId: string
      amount: number | { toString(): string }
      paidAmount: number | { toString(): string }
      dueDate: Date | null
      status: string
    }>
    
    // Get fee structures and categories
    const feeStructureIds = feeAssignments.map(f => f.feeStructureId)
    const feeStructures = feeStructureIds.length > 0
      ? await prisma.feeStructure.findMany({
          where: { id: { in: feeStructureIds } },
        })
      : []
    
    const categoryIds = feeStructures.map(fs => fs.categoryId)
    const categories = categoryIds.length > 0
      ? await prisma.feeCategory.findMany({
          where: { id: { in: categoryIds } },
        })
      : []
    const categoryMap = new Map(categories.map(c => [c.id, c]))
    const feeStructureMap = new Map(feeStructures.map(fs => [fs.id, { ...fs, category: categoryMap.get(fs.categoryId) }]))
    
    // Get recent payments
    const payments = await prisma.payment.findMany({
      where: { studentId: studentProfile.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
    
    // Calculate totals
    const totalFees = feeAssignments.reduce((sum, f) => sum + Number(f.amount), 0)
    const totalPaid = feeAssignments.reduce((sum, f) => sum + Number(f.paidAmount), 0)
    const totalDue = totalFees - totalPaid
    
    return {
      success: true,
      fees: feeAssignments.map(f => {
        const feeStructure = feeStructureMap.get(f.feeStructureId)
        return {
          id: f.id,
          category: feeStructure?.category?.name ?? "Unknown",
          description: feeStructure?.category?.description ?? "",
          amount: Number(f.amount),
          paidAmount: Number(f.paidAmount),
          dueDate: f.dueDate,
          status: f.status,
          currency: feeStructure?.currency ?? "USD",
        }
      }),
      payments: payments.map(p => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.paymentMethod,
        receiptNumber: p.receiptNumber,
        notes: p.notes,
        date: p.createdAt,
      })),
      summary: {
        totalFees,
        totalPaid,
        totalDue,
      },
    }
  } catch (error) {
    console.error("Error fetching fees:", error)
    return { success: false, error: "Failed to fetch fees" }
  }
}

// Get student messages
export async function getStudentMessages(type: "inbox" | "sent" = "inbox") {
  const auth = await verifyStudentAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const userId = auth.session.user.id
    
    // Get messages without includes for Prisma Accelerate compatibility
    const rawMessages = await prisma.message.findMany({
      where: type === "inbox" 
        ? { receiverId: userId }
        : { senderId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    
    // Get unique user IDs
    const userIds = [...new Set([
      ...rawMessages.map(m => m.senderId),
      ...rawMessages.map(m => m.receiverId),
    ])]
    
    // Fetch users
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
      },
    })
    const userMap = new Map(users.map(u => [u.id, u]))
    
    return {
      success: true,
      messages: rawMessages.map(m => {
        const sender = userMap.get(m.senderId)
        const receiver = userMap.get(m.receiverId)
        
        return {
          id: m.id,
          subject: m.subject,
          content: m.content,
          isRead: m.isRead,
          readAt: m.readAt,
          createdAt: m.createdAt,
          sender: sender ? {
            id: sender.id,
            name: `${sender.firstName} ${sender.lastName}`,
            role: sender.role,
            avatar: sender.avatar,
          } : { id: "", name: "Unknown", role: "STUDENT" as const, avatar: null },
          receiver: receiver ? {
            id: receiver.id,
            name: `${receiver.firstName} ${receiver.lastName}`,
            role: receiver.role,
            avatar: receiver.avatar,
          } : { id: "", name: "Unknown", role: "STUDENT" as const, avatar: null },
        }
      }),
    }
  } catch (error) {
    console.error("Error fetching messages:", error)
    return { success: false, error: "Failed to fetch messages" }
  }
}
