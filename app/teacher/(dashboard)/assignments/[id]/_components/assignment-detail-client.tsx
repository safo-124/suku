"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  Clock, 
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Send,
  CheckCircle,
  ClipboardList,
  GraduationCap,
  BookOpen,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"
import { 
  addQuestionToAssignment, 
  removeQuestionFromAssignment, 
  publishAssignment,
  deleteAssignment 
} from "../../_actions/assignment-actions"

interface Question {
  id: string
  questionId: string
  order: number
  type: string
  questionText: string
  options: string[] | null
  correctAnswer: string
  marks: number
}

interface Assignment {
  id: string
  title: string
  description: string | null
  type: string
  totalMarks: number
  dueDate: Date | null
  duration: number | null
  isOnline: boolean
  isPublished: boolean
  classSubjectId: string
  className: string
  subjectName: string
  academicPeriod: string
  createdAt: Date
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
  questions 
}: { 
  assignment: Assignment
  questions: Question[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const linkPrefix = subdomain ? `?subdomain=${subdomain}` : ""
  
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Question form state
  const [questionType, setQuestionType] = useState<string>("MCQ")
  const [questionText, setQuestionText] = useState("")
  const [marks, setMarks] = useState<number>(1)
  const [options, setOptions] = useState<string[]>(["", "", "", ""])
  const [correctAnswer, setCorrectAnswer] = useState("")
  
  const config = typeConfig[assignment.type] || typeConfig.HOMEWORK
  const TypeIcon = config.icon

  const resetQuestionForm = () => {
    setQuestionType("MCQ")
    setQuestionText("")
    setMarks(1)
    setOptions(["", "", "", ""])
    setCorrectAnswer("")
  }
  
  const handleAddQuestion = async () => {
    if (!questionText.trim()) {
      toast.error("Please enter a question")
      return
    }
    
    if (questionType === "MCQ" && options.filter(o => o.trim()).length < 2) {
      toast.error("Please add at least 2 options")
      return
    }
    
    if ((questionType === "MCQ" || questionType === "TRUE_FALSE") && !correctAnswer.trim()) {
      toast.error("Please select the correct answer")
      return
    }
    
    setIsAddingQuestion(true)
    
    const data = {
      assignmentId: assignment.id,
      type: questionType as "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY",
      questionText,
      marks,
      options: questionType === "MCQ" ? options.filter(o => o.trim()) : undefined,
      correctAnswer: questionType === "MCQ" || questionType === "TRUE_FALSE" ? correctAnswer : undefined,
    }
    
    const result = await addQuestionToAssignment(data)
    
    if (result.success) {
      toast.success("Question added")
      resetQuestionForm()
      router.refresh()
    } else {
      toast.error(result.error || "Failed to add question")
    }
    
    setIsAddingQuestion(false)
  }
  
  const handleRemoveQuestion = async (questionId: string) => {
    const result = await removeQuestionFromAssignment(questionId)
    
    if (result.success) {
      toast.success("Question removed")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to remove question")
    }
  }
  
  const handlePublish = async () => {
    setIsPublishing(true)
    
    const result = await publishAssignment(assignment.id)
    
    if (result.success) {
      toast.success("Assignment published!")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to publish")
    }
    
    setIsPublishing(false)
  }
  
  const handleDelete = async () => {
    setIsDeleting(true)
    
    const result = await deleteAssignment(assignment.id)
    
    if (result.success) {
      toast.success("Assignment deleted")
      router.push(`/teacher/my-subjects/${assignment.classSubjectId}/assignments${linkPrefix}`)
    } else {
      toast.error(result.error || "Failed to delete")
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href={`/teacher/assignments${linkPrefix}`}>
          <Button variant="ghost" size="icon" className="rounded-xl neu-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{assignment.title}</h1>
                <Badge className={cn("rounded-lg", config.color)}>
                  {config.label}
                </Badge>
                {assignment.isPublished ? (
                  <Badge className="rounded-lg bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Published
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-lg">
                    Draft
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                {assignment.className} • {assignment.subjectName}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {!assignment.isPublished && (
                <>
                  <Button 
                    onClick={handlePublish}
                    disabled={isPublishing || questions.length === 0}
                    className="rounded-xl neu-convex hover:scale-[0.98]"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isPublishing ? "Publishing..." : "Publish"}
                  </Button>
                  
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="rounded-xl">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Assignment</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this assignment? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                          {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              
              {assignment.isPublished && (
                <Link href={`/teacher/assignments/${assignment.id}/submissions${linkPrefix}`}>
                  <Button className="rounded-xl neu-convex hover:scale-[0.98]">
                    <Users className="h-4 w-4 mr-2" />
                    View Submissions
                  </Button>
                </Link>
              )}
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
          <Card className="neu rounded-2xl border-0">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold">{format(new Date(assignment.dueDate), "MMM d")}</p>
                <p className="text-xs text-muted-foreground">Due Date</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {assignment.duration && (
          <Card className="neu rounded-2xl border-0">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold">{assignment.duration} min</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Questions List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Questions</h2>
            {!assignment.isPublished && (
              <Badge variant="outline" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Add questions then publish
              </Badge>
            )}
          </div>
          
          {questions.length === 0 ? (
            <Card className="neu-inset rounded-2xl border-0">
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No questions added yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add questions using the form on the right
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {questions.map((q, index) => {
                const typeInfo = questionTypeLabels[q.type] || questionTypeLabels.MCQ
                
                return (
                  <Card key={q.id} className="neu rounded-2xl border-0">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm shrink-0">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge className={cn("rounded text-xs", typeInfo.color)}>
                                {typeInfo.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {q.marks} marks
                              </span>
                            </div>
                            
                            {!assignment.isPublished && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveQuestion(q.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          
                          <p className="mt-2 text-sm">{q.questionText}</p>
                          
                          {q.options && q.options.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              {q.options.map((opt, i) => (
                                <div 
                                  key={i}
                                  className={cn(
                                    "flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg",
                                    opt === q.correctAnswer 
                                      ? "bg-emerald-500/10 text-emerald-600 font-medium" 
                                      : "bg-muted/50"
                                  )}
                                >
                                  <span className="font-medium">{String.fromCharCode(65 + i)}.</span>
                                  <span>{opt}</span>
                                  {opt === q.correctAnswer && (
                                    <CheckCircle className="h-3.5 w-3.5 ml-auto" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {q.type === "TRUE_FALSE" && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Correct: </span>
                              <span className="font-medium text-emerald-600">{q.correctAnswer}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Add Question Form */}
        {!assignment.isPublished && (
          <Card className="neu rounded-2xl border-0 h-fit sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Question
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select value={questionType} onValueChange={setQuestionType}>
                  <SelectTrigger className="rounded-xl neu-sm border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MCQ">Multiple Choice (Auto-graded)</SelectItem>
                    <SelectItem value="TRUE_FALSE">True/False (Auto-graded)</SelectItem>
                    <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                    <SelectItem value="ESSAY">Essay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Question</Label>
                <Textarea 
                  placeholder="Enter your question..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="rounded-xl neu-inset border-0 min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Marks</Label>
                <Input 
                  type="number"
                  min={1}
                  value={marks}
                  onChange={(e) => setMarks(parseInt(e.target.value) || 1)}
                  className="rounded-xl neu-inset border-0"
                />
              </div>
              
              {questionType === "MCQ" && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    {options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sm font-medium w-6">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        <Input 
                          placeholder={`Option ${i + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...options]
                            newOptions[i] = e.target.value
                            setOptions(newOptions)
                          }}
                          className="rounded-lg neu-sm border-0 h-9"
                        />
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={correctAnswer === opt && opt !== ""}
                          onChange={() => setCorrectAnswer(opt)}
                          className="h-4 w-4"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select the radio button for the correct answer
                  </p>
                </div>
              )}
              
              {questionType === "TRUE_FALSE" && (
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Select value={correctAnswer} onValueChange={setCorrectAnswer}>
                    <SelectTrigger className="rounded-xl neu-sm border-0">
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="True">True</SelectItem>
                      <SelectItem value="False">False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Separator />
              
              <Button 
                onClick={handleAddQuestion}
                disabled={isAddingQuestion}
                className="w-full rounded-xl neu-convex hover:scale-[0.98]"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAddingQuestion ? "Adding..." : "Add Question"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
