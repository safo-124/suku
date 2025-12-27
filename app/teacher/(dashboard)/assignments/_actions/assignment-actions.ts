"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { UserRole, QuestionType, AssignmentType } from "@/app/generated/prisma/client"
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

// Get all assignments for a teacher
export async function getTeacherAssignments() {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const assignments = await prisma.assignment.findMany({
      where: {
        createdById: auth.session.user.id,
      },
      orderBy: { createdAt: "desc" },
    })
    
    // Get related data
    const classSubjectIds = [...new Set(assignments.map(a => a.classSubjectId))]
    
    const classSubjects = await prisma.classSubject.findMany({
      where: { id: { in: classSubjectIds } },
      include: {
        class: true,
        subject: true,
      },
    })
    
    const submissionCounts = await prisma.assignmentSubmission.groupBy({
      by: ["assignmentId"],
      where: { assignmentId: { in: assignments.map(a => a.id) } },
      _count: { id: true },
    }) as unknown as Array<{ assignmentId: string; _count: { id: number } }>
    
    const classSubjectMap = new Map(classSubjects.map(cs => [cs.id, cs]))
    const submissionCountMap = new Map(submissionCounts.map(sc => [sc.assignmentId, sc._count.id]))
    
    return {
      success: true,
      assignments: assignments.map(a => {
        const cs = classSubjectMap.get(a.classSubjectId)
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          type: a.type,
          totalMarks: Number(a.totalMarks),
          dueDate: a.dueDate,
          isPublished: a.isPublished,
          isOnline: a.isOnline,
          className: cs?.class.name || "",
          subjectName: cs?.subject.name || "",
          submissionCount: submissionCountMap.get(a.id) || 0,
          createdAt: a.createdAt,
        }
      }),
    }
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return { success: false, error: "Failed to fetch assignments" }
  }
}

// Get assignments for a specific class-subject
export async function getSubjectAssignments(classSubjectId: string) {
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
    
    const assignments = await prisma.assignment.findMany({
      where: {
        classSubjectId,
      },
      orderBy: { createdAt: "desc" },
    })
    
    // Get submission counts and question counts
    const assignmentIds = assignments.map(a => a.id)
    
    const submissionCounts = await prisma.assignmentSubmission.groupBy({
      by: ["assignmentId"],
      where: { assignmentId: { in: assignmentIds } },
      _count: { id: true },
    }) as unknown as Array<{ assignmentId: string; _count: { id: number } }>
    
    const questionCounts = await prisma.assignmentQuestion.groupBy({
      by: ["assignmentId"],
      where: { assignmentId: { in: assignmentIds } },
      _count: { id: true },
    }) as unknown as Array<{ assignmentId: string; _count: { id: number } }>
    
    const gradedCounts = await prisma.assignmentSubmission.groupBy({
      by: ["assignmentId"],
      where: { 
        assignmentId: { in: assignmentIds },
        isGraded: true,
      },
      _count: { id: true },
    }) as unknown as Array<{ assignmentId: string; _count: { id: number } }>
    
    const submissionCountMap = new Map(submissionCounts.map(sc => [sc.assignmentId, sc._count.id]))
    const questionCountMap = new Map(questionCounts.map(qc => [qc.assignmentId, qc._count.id]))
    const gradedCountMap = new Map(gradedCounts.map(gc => [gc.assignmentId, gc._count.id]))
    
    // Get student count for this class
    const studentCount = await prisma.studentProfile.count({
      where: { classId: classSubject.classId },
    })
    
    return {
      success: true,
      classSubject: {
        id: classSubject.id,
        className: classSubject.class.name,
        subjectName: classSubject.subject.name,
        subjectCode: classSubject.subject.code,
      },
      studentCount,
      assignments: assignments.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        type: a.type,
        totalMarks: Number(a.totalMarks),
        dueDate: a.dueDate,
        duration: a.duration,
        isPublished: a.isPublished,
        isOnline: a.isOnline,
        questionCount: questionCountMap.get(a.id) || 0,
        submissionCount: submissionCountMap.get(a.id) || 0,
        gradedCount: gradedCountMap.get(a.id) || 0,
        createdAt: a.createdAt,
      })),
    }
  } catch (error) {
    console.error("Error fetching subject assignments:", error)
    return { success: false, error: "Failed to fetch assignments" }
  }
}

// Create a new assignment
export async function createAssignment(data: {
  classSubjectId: string
  title: string
  description?: string
  type: AssignmentType
  totalMarks: number
  dueDate?: Date
  duration?: number
  isOnline?: boolean
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
    
    // Get current academic period
    const currentPeriod = await prisma.academicPeriod.findFirst({
      where: {
        academicYear: {
          schoolId: auth.session.user.schoolId!,
          isCurrent: true,
        },
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    })
    
    if (!currentPeriod) {
      // Fallback to any current academic year period
      const fallbackPeriod = await prisma.academicPeriod.findFirst({
        where: {
          academicYear: {
            schoolId: auth.session.user.schoolId!,
            isCurrent: true,
          },
        },
        orderBy: { startDate: "desc" },
      })
      
      if (!fallbackPeriod) {
        return { success: false, error: "No active academic period found" }
      }
    }
    
    const periodId = currentPeriod?.id || (await prisma.academicPeriod.findFirst({
      where: { academicYear: { schoolId: auth.session.user.schoolId!, isCurrent: true } },
      orderBy: { startDate: "desc" },
    }))?.id
    
    if (!periodId) {
      return { success: false, error: "No academic period found" }
    }
    
    const assignment = await prisma.assignment.create({
      data: {
        classSubjectId: data.classSubjectId,
        academicPeriodId: periodId,
        title: data.title,
        description: data.description,
        type: data.type,
        totalMarks: data.totalMarks,
        dueDate: data.dueDate,
        duration: data.duration,
        isOnline: data.isOnline ?? true,
        createdById: auth.session.user.id,
      },
    })
    
    revalidatePath(`/teacher/my-subjects/${data.classSubjectId}/assignments`)
    
    return { success: true, assignmentId: assignment.id }
  } catch (error) {
    console.error("Error creating assignment:", error)
    return { success: false, error: "Failed to create assignment" }
  }
}

// Get assignment details with questions
export async function getAssignmentDetails(assignmentId: string) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        createdById: auth.session.user.id,
      },
    })
    
    if (!assignment) {
      return { success: false, error: "Assignment not found" }
    }
    
    // Get related data
    const [classSubject, assignmentQuestions, academicPeriod] = await Promise.all([
      prisma.classSubject.findUnique({
        where: { id: assignment.classSubjectId },
        include: { class: true, subject: true },
      }),
      prisma.assignmentQuestion.findMany({
        where: { assignmentId },
        orderBy: { order: "asc" },
      }),
      prisma.academicPeriod.findUnique({
        where: { id: assignment.academicPeriodId },
      }),
    ])
    
    // Get questions
    const questionIds = assignmentQuestions.map(aq => aq.questionId)
    const questions = questionIds.length > 0 
      ? await prisma.question.findMany({ where: { id: { in: questionIds } } })
      : []
    
    const questionMap = new Map(questions.map(q => [q.id, q]))
    
    return {
      success: true,
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        type: assignment.type,
        totalMarks: Number(assignment.totalMarks),
        dueDate: assignment.dueDate,
        duration: assignment.duration,
        isOnline: assignment.isOnline,
        isPublished: assignment.isPublished,
        classSubjectId: assignment.classSubjectId,
        className: classSubject?.class.name || "",
        subjectName: classSubject?.subject.name || "",
        academicPeriod: academicPeriod?.name || "",
        createdAt: assignment.createdAt,
      },
      questions: assignmentQuestions.map(aq => {
        const q = questionMap.get(aq.questionId)
        return {
          id: aq.id,
          questionId: aq.questionId,
          order: aq.order,
          type: q?.type || "MCQ",
          questionText: q?.questionText || "",
          options: q?.options as string[] | null,
          correctAnswer: q?.correctAnswer || "",
          marks: q?.marks ? Number(q.marks) : 0,
        }
      }),
    }
  } catch (error) {
    console.error("Error fetching assignment details:", error)
    return { success: false, error: "Failed to fetch assignment details" }
  }
}

// Add question to assignment
export async function addQuestionToAssignment(data: {
  assignmentId: string
  type: QuestionType
  questionText: string
  options?: string[]
  correctAnswer?: string
  marks: number
}) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    // Verify assignment belongs to teacher
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: data.assignmentId,
        createdById: auth.session.user.id,
      },
      include: { classSubject: { include: { subject: true } } },
    })
    
    if (!assignment) {
      return { success: false, error: "Assignment not found" }
    }
    
    if (assignment.isPublished) {
      return { success: false, error: "Cannot modify a published assignment" }
    }
    
    // Get current question count for ordering
    const questionCount = await prisma.assignmentQuestion.count({
      where: { assignmentId: data.assignmentId },
    })
    
    // Create question
    const question = await prisma.question.create({
      data: {
        schoolId: auth.session.user.schoolId!,
        subjectId: assignment.classSubject.subjectId,
        type: data.type,
        questionText: data.questionText,
        options: data.options ?? undefined,
        correctAnswer: data.correctAnswer,
        marks: data.marks,
        createdById: auth.session.user.id,
      },
    })
    
    // Link question to assignment
    await prisma.assignmentQuestion.create({
      data: {
        assignmentId: data.assignmentId,
        questionId: question.id,
        order: questionCount + 1,
      },
    })
    
    // Update assignment total marks
    const allQuestions = await prisma.assignmentQuestion.findMany({
      where: { assignmentId: data.assignmentId },
    })
    const allQuestionIds = allQuestions.map(aq => aq.questionId)
    const questionMarks = await prisma.question.findMany({
      where: { id: { in: [...allQuestionIds, question.id] } },
      select: { marks: true },
    })
    const totalMarks = questionMarks.reduce((sum, q) => sum + Number(q.marks), 0)
    
    await prisma.assignment.update({
      where: { id: data.assignmentId },
      data: { totalMarks },
    })
    
    revalidatePath(`/teacher/assignments/${data.assignmentId}`)
    
    return { success: true, questionId: question.id }
  } catch (error) {
    console.error("Error adding question:", error)
    return { success: false, error: "Failed to add question" }
  }
}

// Delete question from assignment
export async function removeQuestionFromAssignment(assignmentQuestionId: string) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const assignmentQuestion = await prisma.assignmentQuestion.findUnique({
      where: { id: assignmentQuestionId },
      include: {
        assignment: true,
        question: true,
      },
    })
    
    if (!assignmentQuestion) {
      return { success: false, error: "Question not found" }
    }
    
    if (assignmentQuestion.assignment.createdById !== auth.session.user.id) {
      return { success: false, error: "Access denied" }
    }
    
    if (assignmentQuestion.assignment.isPublished) {
      return { success: false, error: "Cannot modify a published assignment" }
    }
    
    // Delete the assignment-question link
    await prisma.assignmentQuestion.delete({
      where: { id: assignmentQuestionId },
    })
    
    // Update total marks
    const remainingQuestions = await prisma.assignmentQuestion.findMany({
      where: { assignmentId: assignmentQuestion.assignmentId },
    })
    const questionIds = remainingQuestions.map(aq => aq.questionId)
    const questionMarks = questionIds.length > 0
      ? await prisma.question.findMany({
          where: { id: { in: questionIds } },
          select: { marks: true },
        })
      : []
    const totalMarks = questionMarks.reduce((sum, q) => sum + Number(q.marks), 0)
    
    await prisma.assignment.update({
      where: { id: assignmentQuestion.assignmentId },
      data: { totalMarks },
    })
    
    revalidatePath(`/teacher/assignments/${assignmentQuestion.assignmentId}`)
    
    return { success: true }
  } catch (error) {
    console.error("Error removing question:", error)
    return { success: false, error: "Failed to remove question" }
  }
}

// Publish assignment
export async function publishAssignment(assignmentId: string) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        createdById: auth.session.user.id,
      },
    })
    
    if (!assignment) {
      return { success: false, error: "Assignment not found" }
    }
    
    // Check if has questions
    const questionCount = await prisma.assignmentQuestion.count({
      where: { assignmentId },
    })
    
    if (questionCount === 0) {
      return { success: false, error: "Add at least one question before publishing" }
    }
    
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { isPublished: true },
    })
    
    revalidatePath(`/teacher/assignments/${assignmentId}`)
    
    return { success: true }
  } catch (error) {
    console.error("Error publishing assignment:", error)
    return { success: false, error: "Failed to publish assignment" }
  }
}

// Get assignment submissions
export async function getAssignmentSubmissions(assignmentId: string) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        createdById: auth.session.user.id,
      },
      include: {
        classSubject: {
          include: { class: true, subject: true },
        },
      },
    })
    
    if (!assignment) {
      return { success: false, error: "Assignment not found" }
    }
    
    // Get all students in class
    const students = await prisma.studentProfile.findMany({
      where: { classId: assignment.classSubject.classId },
    })
    
    const studentUserIds = students.map(s => s.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: studentUserIds } },
      select: { id: true, firstName: true, lastName: true },
    })
    const userMap = new Map(users.map(u => [u.id, u]))
    
    // Get submissions
    const studentIds = students.map(s => s.id)
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
    })
    const submissionMap = new Map(submissions.map(s => [s.studentId, s]))
    
    return {
      success: true,
      assignment: {
        id: assignment.id,
        title: assignment.title,
        type: assignment.type,
        totalMarks: Number(assignment.totalMarks),
        dueDate: assignment.dueDate,
        className: assignment.classSubject.class.name,
        subjectName: assignment.classSubject.subject.name,
      },
      students: students.map(s => {
        const user = userMap.get(s.userId)
        const submission = submissionMap.get(s.id)
        return {
          id: s.id,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          studentId: s.studentId,
          hasSubmitted: !!submission,
          submittedAt: submission?.submittedAt,
          isLate: submission?.isLate || false,
          isGraded: submission?.isGraded || false,
          totalScore: submission?.totalScore ? Number(submission.totalScore) : null,
          submissionId: submission?.id,
        }
      }),
    }
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return { success: false, error: "Failed to fetch submissions" }
  }
}

// Grade a submission (auto-grade MCQ/True-False, manual for essays)
export async function gradeSubmission(submissionId: string) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            questions: {
              include: { question: true },
            },
          },
        },
        responses: true,
      },
    })
    
    if (!submission) {
      return { success: false, error: "Submission not found" }
    }
    
    if (submission.assignment.createdById !== auth.session.user.id) {
      return { success: false, error: "Access denied" }
    }
    
    let totalScore = 0
    const responseUpdates = []
    
    for (const aq of submission.assignment.questions) {
      const response = submission.responses.find(r => r.questionId === aq.questionId)
      const question = aq.question
      
      if (!response) continue
      
      // Auto-grade MCQ and TRUE_FALSE
      if (question.type === "MCQ" || question.type === "TRUE_FALSE") {
        const isCorrect = response.studentAnswer?.trim().toLowerCase() === 
                         question.correctAnswer?.trim().toLowerCase()
        const score = isCorrect ? Number(question.marks) : 0
        
        responseUpdates.push(
          prisma.questionResponse.update({
            where: { id: response.id },
            data: {
              isCorrect,
              teacherScore: score,
            },
          })
        )
        
        totalScore += score
      } else {
        // For SHORT_ANSWER and ESSAY, use existing teacher score if set
        if (response.teacherScore) {
          totalScore += Number(response.teacherScore)
        }
      }
    }
    
    // Apply all response updates
    await Promise.all(responseUpdates)
    
    // Update submission
    await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        totalScore,
        isGraded: true,
      },
    })
    
    // Record in ExamResult for grade tracking
    const examType = mapAssignmentTypeToExamType(submission.assignment.type)
    
    // Check if exam result already exists
    const existingResult = await prisma.examResult.findFirst({
      where: {
        studentId: submission.studentId,
        classSubjectId: submission.assignment.classSubjectId,
        academicPeriodId: submission.assignment.academicPeriodId,
        examType: examType,
      },
    })
    
    if (existingResult) {
      await prisma.examResult.update({
        where: { id: existingResult.id },
        data: {
          score: totalScore,
          maxScore: Number(submission.assignment.totalMarks),
          grade: calculateGrade(totalScore, Number(submission.assignment.totalMarks)),
        },
      })
    } else {
      await prisma.examResult.create({
        data: {
          studentId: submission.studentId,
          classSubjectId: submission.assignment.classSubjectId,
          academicPeriodId: submission.assignment.academicPeriodId,
          examType: examType,
          score: totalScore,
          maxScore: Number(submission.assignment.totalMarks),
          grade: calculateGrade(totalScore, Number(submission.assignment.totalMarks)),
        },
      })
    }
    
    revalidatePath(`/teacher/assignments/${submission.assignmentId}/submissions`)
    
    return { success: true, totalScore }
  } catch (error) {
    console.error("Error grading submission:", error)
    return { success: false, error: "Failed to grade submission" }
  }
}

// Grade essay question manually
export async function gradeEssayQuestion(data: {
  responseId: string
  score: number
  feedback?: string
}) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const response = await prisma.questionResponse.findUnique({
      where: { id: data.responseId },
      include: {
        submission: {
          include: {
            assignment: true,
          },
        },
      },
    })
    
    if (!response) {
      return { success: false, error: "Response not found" }
    }
    
    if (response.submission.assignment.createdById !== auth.session.user.id) {
      return { success: false, error: "Access denied" }
    }
    
    await prisma.questionResponse.update({
      where: { id: data.responseId },
      data: {
        teacherScore: data.score,
        feedback: data.feedback,
      },
    })
    
    // Recalculate total score
    const allResponses = await prisma.questionResponse.findMany({
      where: { submissionId: response.submissionId },
    })
    
    const totalScore = allResponses.reduce((sum, r) => 
      sum + (r.teacherScore ? Number(r.teacherScore) : 0), 0
    )
    
    await prisma.assignmentSubmission.update({
      where: { id: response.submissionId },
      data: { totalScore },
    })
    
    revalidatePath(`/teacher/assignments/${response.submission.assignmentId}/submissions`)
    
    return { success: true }
  } catch (error) {
    console.error("Error grading essay:", error)
    return { success: false, error: "Failed to grade essay" }
  }
}

// Correct/override objective question score
export async function correctObjectiveQuestion(data: {
  responseId: string
  isCorrect: boolean
  score: number
  feedback?: string
}) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const response = await prisma.questionResponse.findUnique({
      where: { id: data.responseId },
      include: {
        submission: {
          include: {
            assignment: true,
          },
        },
      },
    })
    
    if (!response) {
      return { success: false, error: "Response not found" }
    }
    
    if (response.submission.assignment.createdById !== auth.session.user.id) {
      return { success: false, error: "Access denied" }
    }
    
    // Update the response with corrected score
    await prisma.questionResponse.update({
      where: { id: data.responseId },
      data: {
        isCorrect: data.isCorrect,
        teacherScore: data.score,
        feedback: data.feedback,
      },
    })
    
    // Recalculate total score
    const allResponses = await prisma.questionResponse.findMany({
      where: { submissionId: response.submissionId },
    })
    
    const totalScore = allResponses.reduce((sum, r) => 
      sum + (r.teacherScore ? Number(r.teacherScore) : 0), 0
    )
    
    await prisma.assignmentSubmission.update({
      where: { id: response.submissionId },
      data: { totalScore },
    })
    
    revalidatePath(`/teacher/assignments/${response.submission.assignmentId}/submissions`)
    
    return { success: true }
  } catch (error) {
    console.error("Error correcting question:", error)
    return { success: false, error: "Failed to correct question" }
  }
}

// Publish graded results - mark submission as graded and update exam result
export async function publishSubmissionResults(submissionId: string) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
        responses: true,
      },
    })
    
    if (!submission) {
      return { success: false, error: "Submission not found" }
    }
    
    if (submission.assignment.createdById !== auth.session.user.id) {
      return { success: false, error: "Access denied" }
    }
    
    // Calculate total score from all responses
    const totalScore = submission.responses.reduce((sum, r) => 
      sum + (r.teacherScore ? Number(r.teacherScore) : 0), 0
    )
    
    // Mark as graded
    await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        totalScore,
        isGraded: true,
      },
    })
    
    // Update or create ExamResult for grade tracking
    const examType = mapAssignmentTypeToExamType(submission.assignment.type)
    
    const existingResult = await prisma.examResult.findFirst({
      where: {
        studentId: submission.studentId,
        classSubjectId: submission.assignment.classSubjectId,
        academicPeriodId: submission.assignment.academicPeriodId,
        examType: examType,
      },
    })
    
    if (existingResult) {
      await prisma.examResult.update({
        where: { id: existingResult.id },
        data: {
          score: totalScore,
          maxScore: Number(submission.assignment.totalMarks),
          grade: calculateGrade(totalScore, Number(submission.assignment.totalMarks)),
        },
      })
    } else {
      await prisma.examResult.create({
        data: {
          studentId: submission.studentId,
          classSubjectId: submission.assignment.classSubjectId,
          academicPeriodId: submission.assignment.academicPeriodId,
          examType: examType,
          score: totalScore,
          maxScore: Number(submission.assignment.totalMarks),
          grade: calculateGrade(totalScore, Number(submission.assignment.totalMarks)),
        },
      })
    }
    
    revalidatePath(`/teacher/assignments/${submission.assignmentId}/submissions`)
    
    return { success: true, totalScore }
  } catch (error) {
    console.error("Error publishing results:", error)
    return { success: false, error: "Failed to publish results" }
  }
}

// Get single submission details with responses
export async function getSubmissionDetails(submissionId: string) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        responses: true,
      },
    })
    
    if (!submission) {
      return { success: false, error: "Submission not found" }
    }
    
    // Get assignment with questions
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: submission.assignmentId,
        createdById: auth.session.user.id,
      },
      include: {
        classSubject: {
          include: { class: true, subject: true },
        },
      },
    })
    
    if (!assignment) {
      return { success: false, error: "Assignment not found or access denied" }
    }
    
    // Get student info
    const student = await prisma.studentProfile.findUnique({
      where: { id: submission.studentId },
    })
    
    const user = student 
      ? await prisma.user.findUnique({
          where: { id: student.userId },
          select: { firstName: true, lastName: true },
        })
      : null
    
    // Get assignment questions
    const assignmentQuestions = await prisma.assignmentQuestion.findMany({
      where: { assignmentId: submission.assignmentId },
      orderBy: { order: "asc" },
    })
    
    const questionIds = assignmentQuestions.map(aq => aq.questionId)
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
    })
    const questionMap = new Map(questions.map(q => [q.id, q]))
    
    // Map responses to questions
    const responseMap = new Map(submission.responses.map(r => [r.questionId, r]))
    
    return {
      success: true,
      submission: {
        id: submission.id,
        submittedAt: submission.submittedAt,
        isLate: submission.isLate,
        isGraded: submission.isGraded,
        totalScore: submission.totalScore ? Number(submission.totalScore) : 0,
      },
      assignment: {
        id: assignment.id,
        title: assignment.title,
        type: assignment.type,
        totalMarks: Number(assignment.totalMarks),
        className: assignment.classSubject.class.name,
        subjectName: assignment.classSubject.subject.name,
      },
      student: {
        id: student?.id || "",
        studentId: student?.studentId || "",
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
      },
      questions: assignmentQuestions.map(aq => {
        const q = questionMap.get(aq.questionId)
        const response = responseMap.get(aq.questionId)
        
        return {
          id: aq.id,
          questionId: aq.questionId,
          order: aq.order,
          type: q?.type || "MCQ",
          questionText: q?.questionText || "",
          options: q?.options as string[] | null,
          correctAnswer: q?.correctAnswer || "",
          marks: q?.marks ? Number(q.marks) : 0,
          response: response ? {
            id: response.id,
            studentAnswer: response.studentAnswer,
            isCorrect: response.isCorrect,
            teacherScore: response.teacherScore ? Number(response.teacherScore) : null,
            feedback: response.feedback,
          } : null,
        }
      }),
    }
  } catch (error) {
    console.error("Error fetching submission details:", error)
    return { success: false, error: "Failed to fetch submission details" }
  }
}

// Delete assignment
export async function deleteAssignment(assignmentId: string) {
  const auth = await verifyTeacherAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        createdById: auth.session.user.id,
      },
    })
    
    if (!assignment) {
      return { success: false, error: "Assignment not found" }
    }
    
    // Check if has submissions
    const submissionCount = await prisma.assignmentSubmission.count({
      where: { assignmentId },
    })
    
    if (submissionCount > 0) {
      return { success: false, error: "Cannot delete assignment with submissions" }
    }
    
    await prisma.assignment.delete({
      where: { id: assignmentId },
    })
    
    revalidatePath(`/teacher/my-subjects/${assignment.classSubjectId}/assignments`)
    
    return { success: true }
  } catch (error) {
    console.error("Error deleting assignment:", error)
    return { success: false, error: "Failed to delete assignment" }
  }
}

// Helper functions
function mapAssignmentTypeToExamType(type: AssignmentType): string {
  switch (type) {
    case "HOMEWORK":
      return "HOMEWORK"
    case "CLASSWORK":
      return "CLASSWORK"
    case "TEST":
      return "TEST"
    case "QUIZ":
      return "QUIZ"
    case "EXAM":
      return "EXAM"
    default:
      return "OTHER"
  }
}

function calculateGrade(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100
  if (percentage >= 80) return "A"
  if (percentage >= 70) return "B"
  if (percentage >= 60) return "C"
  if (percentage >= 50) return "D"
  if (percentage >= 40) return "E"
  return "F"
}
