"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle,
  XCircle,
  Calendar,
  BookOpen,
  ClipboardList,
  GraduationCap,
  User,
  Send,
  AlertCircle,
  Save
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
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
import { format, formatDistanceToNow, isPast } from "date-fns"
import { submitAssignment } from "../../_actions/assignment-actions"

interface Question {
  id: string
  questionId: string
  order: number
  type: string
  questionText: string
  options: string[] | null
  marks: number
  studentAnswer: string | null
  teacherScore: number | null
  feedback: string | null
  isCorrect: boolean | null
}

interface Assignment {
  id: string
  title: string
  description: string | null
  type: string
  totalMarks: number
  dueDate: Date | null
  duration: number | null
  subjectName: string
  className: string
  teacherName: string
  createdAt: Date
}

interface Submission {
  id: string
  submittedAt: Date
  isLate: boolean
  isGraded: boolean
  totalScore: number | null
}

const typeConfig: Record<string, { label: string; color: string; icon: typeof FileText }> = {
  HOMEWORK: { label: "Homework", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: FileText },
  CLASSWORK: { label: "Classwork", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: ClipboardList },
  TEST: { label: "Test", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: BookOpen },
  QUIZ: { label: "Quiz", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: GraduationCap },
  EXAM: { label: "Exam", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: Calendar },
}

const questionTypeLabels: Record<string, { label: string; color: string }> = {
  MCQ: { label: "Multiple Choice", color: "bg-blue-500/10 text-blue-500" },
  TRUE_FALSE: { label: "True/False", color: "bg-green-500/10 text-green-500" },
  SHORT_ANSWER: { label: "Short Answer", color: "bg-orange-500/10 text-orange-500" },
  ESSAY: { label: "Essay", color: "bg-purple-500/10 text-purple-500" },
}

export function AssignmentDetailClient({ 
  assignment, 
  questions,
  submission
}: { 
  assignment: Assignment
  questions: Question[]
  submission: Submission | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const linkPrefix = subdomain ? `?subdomain=${subdomain}` : ""
  
  const storageKey = `assignment-draft-${assignment.id}`
  
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    // Initialize with existing answers if any (from submission)
    const initial: Record<string, string> = {}
    questions.forEach(q => {
      if (q.studentAnswer) {
        initial[q.questionId] = q.studentAnswer
      }
    })
    return initial
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Load saved draft from localStorage on mount
  useEffect(() => {
    if (submission) return // Don't load draft if already submitted
    
    try {
      const savedDraft = localStorage.getItem(storageKey)
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
        if (parsed.answers && Object.keys(parsed.answers).length > 0) {
          setAnswers(parsed.answers)
          setLastSaved(parsed.savedAt ? new Date(parsed.savedAt) : null)
        }
      }
    } catch (e) {
      console.error("Failed to load draft:", e)
    }
    setDraftLoaded(true)
  }, [storageKey, submission])
  
  // Auto-save answers to localStorage whenever they change
  useEffect(() => {
    if (submission || !draftLoaded) return // Don't save if already submitted or not loaded yet
    
    const hasAnswers = Object.values(answers).some(a => a.trim())
    if (hasAnswers) {
      try {
        const now = new Date()
        localStorage.setItem(storageKey, JSON.stringify({
          answers,
          savedAt: now.toISOString()
        }))
        setLastSaved(now)
      } catch (e) {
        console.error("Failed to save draft:", e)
      }
    }
  }, [answers, storageKey, submission, draftLoaded])
  
  const config = typeConfig[assignment.type] || typeConfig.HOMEWORK
  const TypeIcon = config.icon
  const isOverdue = assignment.dueDate && isPast(new Date(assignment.dueDate))
  const hasSubmitted = !!submission
  
  // Count answered questions
  const answeredCount = Object.values(answers).filter(a => a.trim()).length
  
  const handleSubmit = async () => {
    if (answeredCount === 0) {
      toast.error("Please answer at least one question")
      return
    }
    
    setIsSubmitting(true)
    
    const result = await submitAssignment({
      assignmentId: assignment.id,
      answers: Object.entries(answers)
        .filter(([_, answer]) => answer.trim())
        .map(([questionId, answer]) => ({ questionId, answer })),
    })
    
    if (result.success) {
      // Clear the draft from localStorage on successful submission
      try {
        localStorage.removeItem(storageKey)
      } catch (e) {
        console.error("Failed to clear draft:", e)
      }
      toast.success("Assignment submitted successfully!")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to submit assignment")
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href={`/student/assignments${linkPrefix}`}>
          <Button variant="ghost" size="icon" className="rounded-xl neu-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{assignment.title}</h1>
                <Badge className={cn("rounded-lg", config.color)}>
                  {config.label}
                </Badge>
                {hasSubmitted && (
                  submission?.isGraded ? (
                    <Badge className="rounded-lg bg-emerald-500/10 text-emerald-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Graded: {submission.totalScore}/{assignment.totalMarks}
                    </Badge>
                  ) : (
                    <Badge className="rounded-lg bg-blue-500/10 text-blue-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Submitted
                    </Badge>
                  )
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                {assignment.subjectName} • {assignment.className}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold">{assignment.totalMarks}</p>
              <p className="text-xs text-muted-foreground">Total Marks</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold">{questions.length}</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
          </CardContent>
        </Card>
        
        {assignment.dueDate && (
          <Card className={cn(
            "neu rounded-2xl border-0",
            isOverdue && !hasSubmitted && "border-l-4 border-l-red-500"
          )}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl neu-convex",
                isOverdue && !hasSubmitted && "text-red-500"
              )}>
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">{format(new Date(assignment.dueDate), "MMM d, h:mm a")}</p>
                <p className={cn(
                  "text-xs text-muted-foreground",
                  isOverdue && !hasSubmitted && "text-red-500"
                )}>
                  {isOverdue ? "Overdue" : `Due ${formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium truncate">{assignment.teacherName || "Teacher"}</p>
              <p className="text-xs text-muted-foreground">Assigned by</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {assignment.description && (
        <Card className="neu rounded-2xl border-0">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">{assignment.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Submission Status Banner */}
      {hasSubmitted && (
        <Card className={cn(
          "rounded-2xl border-0",
          submission?.isGraded ? "bg-emerald-500/10" : "bg-blue-500/10"
        )}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className={cn(
                "h-5 w-5",
                submission?.isGraded ? "text-emerald-500" : "text-blue-500"
              )} />
              <div>
                <p className="font-medium">
                  {submission?.isGraded 
                    ? `Your score: ${submission.totalScore}/${assignment.totalMarks}`
                    : "Assignment submitted successfully"
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Submitted {format(new Date(submission!.submittedAt), "MMMM d, yyyy 'at' h:mm a")}
                  {submission?.isLate && " (Late submission)"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Questions</h2>
          {!hasSubmitted && (
            <span className="text-sm text-muted-foreground">
              {answeredCount}/{questions.length} answered
            </span>
          )}
        </div>
        
        {questions.map((q, index) => {
          const typeInfo = questionTypeLabels[q.type] || questionTypeLabels.MCQ
          
          return (
            <Card key={q.id} className="neu rounded-2xl border-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg font-semibold text-sm shrink-0",
                    hasSubmitted && q.isCorrect === true && "bg-emerald-500/10 text-emerald-500",
                    hasSubmitted && q.isCorrect === false && "bg-red-500/10 text-red-500",
                    !hasSubmitted && "bg-primary/10 text-primary"
                  )}>
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={cn("rounded text-xs", typeInfo.color)}>
                        {typeInfo.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {q.marks} marks
                      </span>
                      {hasSubmitted && q.teacherScore !== null && (
                        <Badge variant="outline" className="text-xs">
                          Score: {q.teacherScore}/{q.marks}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="font-medium mb-4">{q.questionText}</p>
                    
                    {/* Answer Input */}
                    {!hasSubmitted ? (
                      <>
                        {q.type === "MCQ" && q.options && (
                          <RadioGroup 
                            value={answers[q.questionId] || ""}
                            onValueChange={(value) => setAnswers({ ...answers, [q.questionId]: value })}
                          >
                            <div className="space-y-2">
                              {q.options.map((opt, i) => (
                                <div 
                                  key={i}
                                  className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer",
                                    answers[q.questionId] === opt 
                                      ? "neu-inset bg-primary/5" 
                                      : "hover:bg-muted/50"
                                  )}
                                  onClick={() => setAnswers({ ...answers, [q.questionId]: opt })}
                                >
                                  <RadioGroupItem value={opt} id={`${q.questionId}-${i}`} />
                                  <Label 
                                    htmlFor={`${q.questionId}-${i}`} 
                                    className="flex-1 cursor-pointer"
                                  >
                                    <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                                    {opt}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        )}
                        
                        {q.type === "TRUE_FALSE" && (
                          <RadioGroup 
                            value={answers[q.questionId] || ""}
                            onValueChange={(value) => setAnswers({ ...answers, [q.questionId]: value })}
                          >
                            <div className="flex gap-4">
                              {["True", "False"].map((opt) => (
                                <div 
                                  key={opt}
                                  className={cn(
                                    "flex items-center gap-3 px-6 py-3 rounded-xl transition-all cursor-pointer flex-1",
                                    answers[q.questionId] === opt 
                                      ? "neu-inset bg-primary/5" 
                                      : "hover:bg-muted/50 neu-sm"
                                  )}
                                  onClick={() => setAnswers({ ...answers, [q.questionId]: opt })}
                                >
                                  <RadioGroupItem value={opt} id={`${q.questionId}-${opt}`} />
                                  <Label htmlFor={`${q.questionId}-${opt}`} className="cursor-pointer font-medium">
                                    {opt}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        )}
                        
                        {(q.type === "SHORT_ANSWER" || q.type === "ESSAY") && (
                          <Textarea 
                            placeholder={q.type === "ESSAY" ? "Write your essay here..." : "Type your answer..."}
                            value={answers[q.questionId] || ""}
                            onChange={(e) => setAnswers({ ...answers, [q.questionId]: e.target.value })}
                            className={cn(
                              "rounded-xl neu-inset border-0",
                              q.type === "ESSAY" ? "min-h-[150px]" : "min-h-[80px]"
                            )}
                          />
                        )}
                      </>
                    ) : (
                      /* Show submitted answer */
                      <div className="space-y-3">
                        {q.type === "MCQ" && q.options && (
                          <div className="space-y-2">
                            {q.options.map((opt, i) => (
                              <div 
                                key={i}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-3 rounded-xl",
                                  q.studentAnswer === opt && q.isCorrect && "bg-emerald-500/10 text-emerald-600",
                                  q.studentAnswer === opt && !q.isCorrect && "bg-red-500/10 text-red-600",
                                  q.studentAnswer !== opt && "bg-muted/30"
                                )}
                              >
                                <span className="font-medium">{String.fromCharCode(65 + i)}.</span>
                                <span className="flex-1">{opt}</span>
                                {q.studentAnswer === opt && (
                                  q.isCorrect 
                                    ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    : <XCircle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {q.type === "TRUE_FALSE" && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Your answer:</span>
                            <span className={cn(
                              "font-medium",
                              q.isCorrect ? "text-emerald-600" : "text-red-600"
                            )}>
                              {q.studentAnswer}
                              {q.isCorrect 
                                ? <CheckCircle className="h-4 w-4 inline ml-2" />
                                : <XCircle className="h-4 w-4 inline ml-2" />
                              }
                            </span>
                          </div>
                        )}
                        
                        {(q.type === "SHORT_ANSWER" || q.type === "ESSAY") && (
                          <div className="bg-muted/30 rounded-xl p-4">
                            <p className="text-xs text-muted-foreground mb-1">Your answer:</p>
                            <p className="whitespace-pre-wrap">{q.studentAnswer || "No answer provided"}</p>
                          </div>
                        )}
                        
                        {/* Feedback */}
                        {q.feedback && (
                          <div className="bg-blue-500/10 rounded-xl p-4">
                            <p className="text-xs text-blue-500 font-medium mb-1">Teacher's Feedback:</p>
                            <p className="text-sm">{q.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Submit Button */}
      {!hasSubmitted && (
        <Card className="sticky bottom-6 neu rounded-2xl border-0 shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4 text-emerald-500" />
                  <span>
                    {lastSaved 
                      ? `Draft auto-saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`
                      : answeredCount > 0 ? "Draft saved" : "Your progress will be saved automatically"
                    }
                  </span>
                </div>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">{answeredCount}/{questions.length} answered</span>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    size="lg"
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-[0.98] shadow-lg px-8"
                    disabled={answeredCount === 0}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Assignment
                  </Button>
                </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit Assignment?</AlertDialogTitle>
                <AlertDialogDescription>
                  You have answered {answeredCount} of {questions.length} questions.
                  {isOverdue && (
                    <span className="block mt-2 text-amber-500">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      This submission will be marked as late.
                    </span>
                  )}
                  <br />
                  <strong>This action cannot be undone.</strong> Make sure you've reviewed all your answers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Review Answers</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
