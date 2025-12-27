"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle,
  XCircle,
  Clock,
  User,
  Save,
  MessageSquare,
  Edit3,
  Send
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"
import { gradeEssayQuestion, gradeSubmission, correctObjectiveQuestion, publishSubmissionResults } from "../../../../_actions/assignment-actions"

interface Response {
  id: string
  studentAnswer: string | null
  isCorrect: boolean | null
  teacherScore: number | null
  feedback: string | null
}

interface Question {
  id: string
  questionId: string
  order: number
  type: string
  questionText: string
  options: string[] | null
  correctAnswer: string
  marks: number
  response: Response | null
}

interface Submission {
  id: string
  submittedAt: Date | null
  isLate: boolean
  isGraded: boolean
  totalScore: number
}

interface Assignment {
  id: string
  title: string
  type: string
  totalMarks: number
  className: string
  subjectName: string
}

interface Student {
  id: string
  studentId: string
  firstName: string
  lastName: string
}

const questionTypeLabels: Record<string, { label: string; color: string }> = {
  MCQ: { label: "Multiple Choice", color: "bg-blue-500/10 text-blue-500" },
  TRUE_FALSE: { label: "True/False", color: "bg-green-500/10 text-green-500" },
  SHORT_ANSWER: { label: "Short Answer", color: "bg-orange-500/10 text-orange-500" },
  ESSAY: { label: "Essay", color: "bg-purple-500/10 text-purple-500" },
}

const typeColors: Record<string, string> = {
  HOMEWORK: "bg-blue-500/10 text-blue-500",
  CLASSWORK: "bg-emerald-500/10 text-emerald-500",
  TEST: "bg-orange-500/10 text-orange-500",
  QUIZ: "bg-purple-500/10 text-purple-500",
  EXAM: "bg-red-500/10 text-red-500",
}

export function SubmissionDetailClient({ 
  submission,
  assignment, 
  student,
  questions 
}: { 
  submission: Submission
  assignment: Assignment
  student: Student
  questions: Question[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const linkPrefix = subdomain ? `?subdomain=${subdomain}` : ""
  
  // Track scores and feedback for manual grading
  const [essayScores, setEssayScores] = useState<Record<string, { score: number; feedback: string }>>({})
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [isAutoGrading, setIsAutoGrading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  
  // For correcting objective questions
  const [correctingQuestion, setCorrectingQuestion] = useState<Question | null>(null)
  const [correctionScore, setCorrectionScore] = useState(0)
  const [correctionFeedback, setCorrectionFeedback] = useState("")
  const [isCorrectingOpen, setIsCorrectingOpen] = useState(false)
  
  // Calculate current total
  const currentTotal = questions.reduce((sum, q) => {
    if (q.response && q.response.teacherScore !== null) {
      return sum + (q.response.teacherScore || 0)
    }
    if (essayScores[q.questionId]?.score !== undefined) {
      return sum + essayScores[q.questionId].score
    }
    return sum
  }, 0)
  
  const handleSaveEssayScore = async (questionId: string, responseId: string) => {
    const essayData = essayScores[questionId]
    if (!essayData) return
    
    setIsSaving(questionId)
    
    const result = await gradeEssayQuestion({
      responseId,
      score: essayData.score,
      feedback: essayData.feedback,
    })
    
    if (result.success) {
      toast.success("Score saved")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to save score")
    }
    
    setIsSaving(null)
  }
  
  const handleAutoGrade = async () => {
    setIsAutoGrading(true)
    
    const result = await gradeSubmission(submission.id)
    
    if (result.success) {
      toast.success(`Graded! Score: ${result.totalScore}/${assignment.totalMarks}`)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to grade")
    }
    
    setIsAutoGrading(false)
  }
  
  const handleCorrectQuestion = async () => {
    if (!correctingQuestion?.response) return
    
    setIsSaving(correctingQuestion.questionId)
    
    const result = await correctObjectiveQuestion({
      responseId: correctingQuestion.response.id,
      isCorrect: correctionScore > 0,
      score: correctionScore,
      feedback: correctionFeedback || undefined,
    })
    
    if (result.success) {
      toast.success("Question corrected")
      setIsCorrectingOpen(false)
      setCorrectingQuestion(null)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to correct question")
    }
    
    setIsSaving(null)
  }
  
  const handlePublishResults = async () => {
    setIsPublishing(true)
    
    const result = await publishSubmissionResults(submission.id)
    
    if (result.success) {
      toast.success(`Results published! Final score: ${result.totalScore}/${assignment.totalMarks}`)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to publish results")
    }
    
    setIsPublishing(false)
  }
  
  const openCorrectionDialog = (question: Question) => {
    setCorrectingQuestion(question)
    setCorrectionScore(question.response?.teacherScore ?? 0)
    setCorrectionFeedback(question.response?.feedback ?? "")
    setIsCorrectingOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href={`/teacher/assignments/${assignment.id}/submissions${linkPrefix}`}>
          <Button variant="ghost" size="icon" className="rounded-xl neu-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {student.firstName} {student.lastName}'s Submission
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={cn("rounded-lg", typeColors[assignment.type])}>
                  {assignment.type}
                </Badge>
                <span className="text-muted-foreground">{assignment.title}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{assignment.className}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!submission.isGraded && (
                <Button 
                  onClick={handleAutoGrade}
                  disabled={isAutoGrading}
                  variant="outline"
                  className="rounded-xl"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isAutoGrading ? "Grading..." : "Auto-Grade"}
                </Button>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    disabled={isPublishing}
                    className={cn(
                      "rounded-xl hover:scale-[0.98]",
                      submission.isGraded 
                        ? "bg-emerald-500 hover:bg-emerald-600" 
                        : "bg-primary"
                    )}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isPublishing ? "Publishing..." : submission.isGraded ? "Published" : "Publish Results"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Publish Results?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will finalize the grade for {student.firstName} {student.lastName}.
                      <br /><br />
                      <strong>Current Score: {currentTotal}/{assignment.totalMarks}</strong>
                      <br /><br />
                      The student will be able to see their graded results and feedback.
                      {!submission.isGraded && " You can still make corrections after publishing."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePublishResults}>
                      Publish
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Info */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{student.studentId}</p>
              <p className="text-xs text-muted-foreground">Student ID</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {format(new Date(submission.submittedAt), "MMM d, h:mm a")}
              </p>
              <p className="text-xs text-muted-foreground">
                Submitted {submission.isLate && "(Late)"}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold">{currentTotal}/{assignment.totalMarks}</p>
              <p className="text-xs text-muted-foreground">Current Score</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-5">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl neu-convex",
              submission.isGraded ? "text-emerald-500" : "text-amber-500"
            )}>
              {submission.isGraded ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {submission.isGraded ? "Graded" : "Pending"}
              </p>
              <p className="text-xs text-muted-foreground">Status</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions & Responses */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Responses</h2>
        
        {questions.map((q, index) => {
          const typeInfo = questionTypeLabels[q.type] || questionTypeLabels.MCQ
          const isObjective = q.type === "MCQ" || q.type === "TRUE_FALSE"
          const response = q.response
          const essayData = essayScores[q.questionId] || { 
            score: response?.teacherScore ?? 0, 
            feedback: response?.feedback ?? "" 
          }
          
          return (
            <Card key={q.id} className="neu rounded-2xl border-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg font-semibold text-sm shrink-0",
                    response?.isCorrect === true 
                      ? "bg-emerald-500/10 text-emerald-500"
                      : response?.isCorrect === false
                        ? "bg-red-500/10 text-red-500"
                        : "bg-primary/10 text-primary"
                  )}>
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={cn("rounded text-xs", typeInfo.color)}>
                          {typeInfo.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {q.marks} marks
                        </span>
                        {isObjective && response && (
                          response.isCorrect ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Correct
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-500 text-xs">
                              <XCircle className="h-3 w-3 mr-1" />
                              Incorrect
                            </Badge>
                          )
                        )}
                      </div>
                      
                      {/* Correct/Edit button for objective questions */}
                      {isObjective && response && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={() => openCorrectionDialog(q)}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Correct
                        </Button>
                      )}
                    </div>
                    
                    <p className="font-medium mb-4">{q.questionText}</p>
                    
                    {/* Student's Answer */}
                    <div className="bg-muted/50 rounded-xl p-4 mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Student's Answer:</p>
                      {response?.studentAnswer ? (
                        <div>
                          {q.type === "MCQ" && q.options && (
                            <div className="space-y-1.5">
                              {q.options.map((opt, i) => (
                                <div 
                                  key={i}
                                  className={cn(
                                    "flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg",
                                    opt === response.studentAnswer && opt === q.correctAnswer
                                      ? "bg-emerald-500/10 text-emerald-600 font-medium"
                                      : opt === response.studentAnswer
                                        ? "bg-red-500/10 text-red-600"
                                        : opt === q.correctAnswer
                                          ? "bg-emerald-500/20 text-emerald-600"
                                          : "bg-background"
                                  )}
                                >
                                  <span className="font-medium">{String.fromCharCode(65 + i)}.</span>
                                  <span>{opt}</span>
                                  {opt === response.studentAnswer && opt === q.correctAnswer && (
                                    <CheckCircle className="h-3.5 w-3.5 ml-auto" />
                                  )}
                                  {opt === response.studentAnswer && opt !== q.correctAnswer && (
                                    <XCircle className="h-3.5 w-3.5 ml-auto" />
                                  )}
                                  {opt !== response.studentAnswer && opt === q.correctAnswer && (
                                    <span className="ml-auto text-xs">(Correct)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {q.type === "TRUE_FALSE" && (
                            <div className="flex items-center gap-4">
                              <span className={cn(
                                "font-medium",
                                response.studentAnswer === q.correctAnswer 
                                  ? "text-emerald-600" 
                                  : "text-red-600"
                              )}>
                                {response.studentAnswer}
                              </span>
                              {response.studentAnswer !== q.correctAnswer && (
                                <span className="text-xs text-muted-foreground">
                                  (Correct: {q.correctAnswer})
                                </span>
                              )}
                            </div>
                          )}
                          
                          {(q.type === "SHORT_ANSWER" || q.type === "ESSAY") && (
                            <p className="whitespace-pre-wrap">{response.studentAnswer}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">No answer provided</p>
                      )}
                    </div>
                    
                    {/* Manual Grading for Essays/Short Answer */}
                    {!isObjective && response && (
                      <div className="space-y-4 border-t pt-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Score (out of {q.marks})</Label>
                            <Input 
                              type="number"
                              min={0}
                              max={q.marks}
                              value={essayData.score}
                              onChange={(e) => setEssayScores({
                                ...essayScores,
                                [q.questionId]: {
                                  ...essayData,
                                  score: Math.min(parseInt(e.target.value) || 0, q.marks),
                                }
                              })}
                              className="rounded-xl neu-inset border-0 w-32"
                            />
                          </div>
                          
                          <div className="space-y-2 sm:col-span-2">
                            <Label>Feedback (optional)</Label>
                            <Textarea 
                              placeholder="Add feedback for the student..."
                              value={essayData.feedback}
                              onChange={(e) => setEssayScores({
                                ...essayScores,
                                [q.questionId]: {
                                  ...essayData,
                                  feedback: e.target.value,
                                }
                              })}
                              className="rounded-xl neu-inset border-0 min-h-20"
                            />
                          </div>
                        </div>
                        
                        <Button 
                          size="sm"
                          onClick={() => handleSaveEssayScore(q.questionId, response.id)}
                          disabled={isSaving === q.questionId}
                          className="rounded-xl"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {isSaving === q.questionId ? "Saving..." : "Save Score"}
                        </Button>
                      </div>
                    )}
                    
                    {/* Show existing feedback if graded */}
                    {response?.feedback && isObjective && (
                      <div className="flex items-start gap-2 mt-4 p-3 bg-blue-500/10 rounded-lg">
                        <MessageSquare className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-blue-500 font-medium mb-1">Feedback</p>
                          <p className="text-sm">{response.feedback}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Score display for graded items */}
                    {response && response.teacherScore !== null && (
                      <div className="flex items-center gap-2 mt-4 text-sm">
                        <span className="text-muted-foreground">Score:</span>
                        <span className="font-semibold">{response.teacherScore}/{q.marks}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Correction Dialog for Objective Questions */}
      <Dialog open={isCorrectingOpen} onOpenChange={setIsCorrectingOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Correct Question</DialogTitle>
            <DialogDescription>
              Override the auto-grading for this question. This is useful if the correct answer was ambiguous or if you want to award partial credit.
            </DialogDescription>
          </DialogHeader>
          
          {correctingQuestion && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium mb-2">Question:</p>
                <p className="text-sm text-muted-foreground">{correctingQuestion.questionText}</p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">Student's Answer:</p>
                <p className="text-sm">{correctingQuestion.response?.studentAnswer || "No answer"}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Correct Answer: {correctingQuestion.correctAnswer}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Score (out of {correctingQuestion.marks})</Label>
                <Input 
                  type="number"
                  min={0}
                  max={correctingQuestion.marks}
                  value={correctionScore}
                  onChange={(e) => setCorrectionScore(Math.min(parseInt(e.target.value) || 0, correctingQuestion.marks))}
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Set to {correctingQuestion.marks} for full credit, 0 for no credit, or any value in between for partial credit.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Feedback (optional)</Label>
                <Textarea 
                  placeholder="Add a note explaining the correction..."
                  value={correctionFeedback}
                  onChange={(e) => setCorrectionFeedback(e.target.value)}
                  className="rounded-xl min-h-20"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCorrectingOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCorrectQuestion}
              disabled={isSaving === correctingQuestion?.questionId}
            >
              {isSaving === correctingQuestion?.questionId ? "Saving..." : "Save Correction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
