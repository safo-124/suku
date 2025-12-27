"use server"

import prisma from "@/lib/prisma"
import { getSession, getCurrentSchoolSlug } from "@/lib/auth"
import { UserRole } from "@/app/generated/prisma/client"
import { revalidatePath } from "next/cache"

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

// Get student's class ID
async function getStudentClassId(userId: string) {
  const studentProfile = await prisma.studentProfile.findFirst({
    where: { userId },
    select: { id: true, classId: true },
  })
  return studentProfile
}

// Get all assignments for the student
export async function getStudentAssignments() {
  const auth = await verifyStudentAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const student = await getStudentClassId(auth.session.user.id)
    
    if (!student || !student.classId) {
      return { success: false, error: "Student class not found" }
    }
    
    // Get class subjects for this student's class
    const classSubjects = await prisma.classSubject.findMany({
      where: { classId: student.classId },
      select: { id: true },
    })
    
    const classSubjectIds = classSubjects.map(cs => cs.id)
    
    // Get published assignments for these class subjects
    const assignments = await prisma.assignment.findMany({
      where: {
        classSubjectId: { in: classSubjectIds },
        isPublished: true,
      },
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    })
    
    // Get class subject details and submission status
    const classSubjectDetails = await prisma.classSubject.findMany({
      where: { id: { in: classSubjectIds } },
      include: {
        subject: true,
        class: true,
      },
    })
    const classSubjectMap = new Map(classSubjectDetails.map(cs => [cs.id, cs]))
    
    // Get submissions for this student
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        studentId: student.id,
        assignmentId: { in: assignments.map(a => a.id) },
      },
    })
    const submissionMap = new Map(submissions.map(s => [s.assignmentId, s]))
    
    // Get question counts
    const questionCounts = await prisma.assignmentQuestion.groupBy({
      by: ["assignmentId"],
      where: { assignmentId: { in: assignments.map(a => a.id) } },
      _count: { id: true },
    })
    const questionCountMap = new Map(questionCounts.map(qc => [qc.assignmentId, qc._count.id]))
    
    return {
      success: true,
      assignments: assignments.map(a => {
        const cs = classSubjectMap.get(a.classSubjectId)
        const submission = submissionMap.get(a.id)
        
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          type: a.type,
          totalMarks: Number(a.totalMarks),
          dueDate: a.dueDate,
          duration: a.duration,
          subjectName: cs?.subject.name || "",
          className: cs?.class.name || "",
          questionCount: questionCountMap.get(a.id) || 0,
          hasSubmitted: !!submission,
          isGraded: submission?.isGraded || false,
          totalScore: submission?.totalScore ? Number(submission.totalScore) : null,
          submittedAt: submission?.submittedAt,
          isLate: submission?.isLate || false,
          createdAt: a.createdAt,
        }
      }),
    }
  } catch (error) {
    console.error("Error fetching student assignments:", error)
    return { success: false, error: "Failed to fetch assignments" }
  }
}

// Get assignment details for taking/viewing
export async function getAssignmentForStudent(assignmentId: string) {
  const auth = await verifyStudentAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const student = await getStudentClassId(auth.session.user.id)
    
    if (!student || !student.classId) {
      return { success: false, error: "Student class not found" }
    }
    
    // Get assignment
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        isPublished: true,
      },
    })
    
    if (!assignment) {
      return { success: false, error: "Assignment not found" }
    }
    
    // Verify this assignment is for the student's class
    const classSubject = await prisma.classSubject.findFirst({
      where: {
        id: assignment.classSubjectId,
        classId: student.classId,
      },
      include: {
        subject: true,
        class: true,
        teacher: {
          select: { firstName: true, lastName: true },
        },
      },
    })
    
    if (!classSubject) {
      return { success: false, error: "Assignment not available for your class" }
    }
    
    // Check for existing submission
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: student.id,
      },
      include: {
        responses: true,
      },
    })
    
    // Get questions
    const assignmentQuestions = await prisma.assignmentQuestion.findMany({
      where: { assignmentId },
      orderBy: { order: "asc" },
    })
    
    const questionIds = assignmentQuestions.map(aq => aq.questionId)
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
    })
    const questionMap = new Map(questions.map(q => [q.id, q]))
    
    // Map responses if submission exists
    const responseMap = existingSubmission 
      ? new Map(existingSubmission.responses.map(r => [r.questionId, r]))
      : new Map()
    
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
        subjectName: classSubject.subject.name,
        className: classSubject.class.name,
        teacherName: `${classSubject.teacher?.firstName || ""} ${classSubject.teacher?.lastName || ""}`.trim(),
        createdAt: assignment.createdAt,
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
          marks: q?.marks ? Number(q.marks) : 0,
          // Include student's response if exists
          studentAnswer: response?.studentAnswer || null,
          teacherScore: response?.teacherScore ? Number(response.teacherScore) : null,
          feedback: response?.feedback || null,
          isCorrect: response?.isCorrect,
        }
      }),
      submission: existingSubmission ? {
        id: existingSubmission.id,
        submittedAt: existingSubmission.submittedAt,
        isLate: existingSubmission.isLate,
        isGraded: existingSubmission.isGraded,
        totalScore: existingSubmission.totalScore ? Number(existingSubmission.totalScore) : null,
      } : null,
    }
  } catch (error) {
    console.error("Error fetching assignment for student:", error)
    return { success: false, error: "Failed to fetch assignment" }
  }
}

// Submit assignment answers
export async function submitAssignment(data: {
  assignmentId: string
  answers: { questionId: string; answer: string }[]
}) {
  const auth = await verifyStudentAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const student = await getStudentClassId(auth.session.user.id)
    
    if (!student) {
      return { success: false, error: "Student profile not found" }
    }
    
    // Get assignment
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: data.assignmentId,
        isPublished: true,
      },
    })
    
    if (!assignment) {
      return { success: false, error: "Assignment not found" }
    }
    
    // Check if already submitted
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId: data.assignmentId,
        studentId: student.id,
      },
    })
    
    if (existingSubmission) {
      return { success: false, error: "You have already submitted this assignment" }
    }
    
    // Check if late
    const isLate = assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false
    
    // Create submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: data.assignmentId,
        studentId: student.id,
        submittedAt: new Date(),
        isLate,
      },
    })
    
    // Get questions for auto-grading
    const assignmentQuestions = await prisma.assignmentQuestion.findMany({
      where: { assignmentId: data.assignmentId },
    })
    const questionIds = assignmentQuestions.map(aq => aq.questionId)
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
    })
    const questionMap = new Map(questions.map(q => [q.id, q]))
    
    // Create responses and auto-grade MCQ/TRUE_FALSE
    let autoGradedScore = 0
    const responses = []
    
    for (const answer of data.answers) {
      const question = questionMap.get(answer.questionId)
      if (!question) continue
      
      let isCorrect: boolean | null = null
      let teacherScore: number | null = null
      
      // Auto-grade MCQ and TRUE_FALSE
      if (question.type === "MCQ" || question.type === "TRUE_FALSE") {
        isCorrect = answer.answer.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase()
        teacherScore = isCorrect ? Number(question.marks) : 0
        autoGradedScore += teacherScore
      }
      
      responses.push({
        submissionId: submission.id,
        questionId: answer.questionId,
        studentAnswer: answer.answer,
        isCorrect,
        teacherScore,
      })
    }
    
    // Create all responses
    await prisma.questionResponse.createMany({
      data: responses,
    })
    
    // Update submission with auto-graded score
    await prisma.assignmentSubmission.update({
      where: { id: submission.id },
      data: { totalScore: autoGradedScore },
    })
    
    revalidatePath("/student/assignments")
    
    return { success: true, submissionId: submission.id }
  } catch (error) {
    console.error("Error submitting assignment:", error)
    return { success: false, error: "Failed to submit assignment" }
  }
}

// Get submission result
export async function getSubmissionResult(assignmentId: string) {
  const auth = await verifyStudentAccess()
  
  if (!auth.success || !auth.session) {
    return { success: false, error: auth.error }
  }
  
  try {
    const student = await getStudentClassId(auth.session.user.id)
    
    if (!student) {
      return { success: false, error: "Student profile not found" }
    }
    
    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: student.id,
      },
      include: {
        responses: true,
        assignment: {
          include: {
            classSubject: {
              include: {
                subject: true,
                class: true,
              },
            },
          },
        },
      },
    })
    
    if (!submission) {
      return { success: false, error: "Submission not found" }
    }
    
    // Get questions
    const assignmentQuestions = await prisma.assignmentQuestion.findMany({
      where: { assignmentId },
      orderBy: { order: "asc" },
    })
    
    const questionIds = assignmentQuestions.map(aq => aq.questionId)
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
    })
    const questionMap = new Map(questions.map(q => [q.id, q]))
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
        id: submission.assignment.id,
        title: submission.assignment.title,
        type: submission.assignment.type,
        totalMarks: Number(submission.assignment.totalMarks),
        subjectName: submission.assignment.classSubject.subject.name,
        className: submission.assignment.classSubject.class.name,
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
          correctAnswer: q?.correctAnswer,
          marks: q?.marks ? Number(q.marks) : 0,
          studentAnswer: response?.studentAnswer || null,
          isCorrect: response?.isCorrect,
          teacherScore: response?.teacherScore ? Number(response.teacherScore) : null,
          feedback: response?.feedback || null,
        }
      }),
    }
  } catch (error) {
    console.error("Error fetching submission result:", error)
    return { success: false, error: "Failed to fetch result" }
  }
}
