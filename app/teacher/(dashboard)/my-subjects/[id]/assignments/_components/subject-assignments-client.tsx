"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Clock, 
  Users, 
  CheckCircle,
  Calendar,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Send,
  Trash2,
  MoreVertical
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"
import { createAssignment, publishAssignment, deleteAssignment } from "../../../../assignments/_actions/assignment-actions"

interface ClassSubject {
  id: string
  className: string
  subjectName: string
  subjectCode: string | null
}

interface Assignment {
  id: string
  title: string
  description: string | null
  type: string
  totalMarks: number
  dueDate: Date | null
  duration: number | null
  isPublished: boolean
  isOnline: boolean
  questionCount: number
  submissionCount: number
  gradedCount: number
  createdAt: Date
}

const typeConfig: Record<string, { label: string; color: string; icon: typeof FileText }> = {
  HOMEWORK: { label: "Homework", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: FileText },
  CLASSWORK: { label: "Classwork", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: ClipboardList },
  TEST: { label: "Test", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: BookOpen },
  QUIZ: { label: "Quiz", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: GraduationCap },
  EXAM: { label: "Exam", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: Calendar },
}

export function SubjectAssignmentsClient({ 
  classSubject, 
  studentCount,
  assignments 
}: { 
  classSubject: ClassSubject
  studentCount: number
  assignments: Assignment[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const linkPrefix = subdomain ? `?subdomain=${subdomain}` : ""
  
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Create form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<string>("HOMEWORK")
  const [dueDate, setDueDate] = useState("")
  const [duration, setDuration] = useState<string>("")
  
  // Stats
  const totalAssignments = assignments.length
  const publishedCount = assignments.filter(a => a.isPublished).length
  const pendingGrading = assignments.reduce((sum, a) => 
    sum + (a.submissionCount - a.gradedCount), 0
  )
  
  const resetForm = () => {
    setTitle("")
    setDescription("")
    setType("HOMEWORK")
    setDueDate("")
    setDuration("")
  }
  
  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }
    
    setIsCreating(true)
    
    const result = await createAssignment({
      classSubjectId: classSubject.id,
      title: title.trim(),
      description: description.trim() || undefined,
      type: type as "HOMEWORK" | "CLASSWORK" | "TEST" | "QUIZ" | "EXAM",
      totalMarks: 0, // Will be calculated from questions
      dueDate: dueDate ? new Date(dueDate) : undefined,
      duration: duration ? parseInt(duration) : undefined,
      isOnline: true,
    })
    
    if (result.success) {
      toast.success("Assignment created! Now add questions.")
      setShowCreateDialog(false)
      resetForm()
      router.push(`/teacher/assignments/${result.assignmentId}${linkPrefix}`)
    } else {
      toast.error(result.error || "Failed to create assignment")
    }
    
    setIsCreating(false)
  }
  
  const handlePublish = async (assignmentId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const result = await publishAssignment(assignmentId)
    
    if (result.success) {
      toast.success("Assignment published!")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to publish")
    }
  }
  
  const handleDelete = async (assignmentId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const result = await deleteAssignment(assignmentId)
    
    if (result.success) {
      toast.success("Assignment deleted")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to delete")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href={`/teacher/my-subjects${linkPrefix}`}>
          <Button variant="ghost" size="icon" className="rounded-xl neu-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{classSubject.subjectName}</h1>
              <p className="text-muted-foreground mt-1">
                {classSubject.className} • {studentCount} students
              </p>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="rounded-xl neu-convex hover:scale-[0.98]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create Assignment</DialogTitle>
                  <DialogDescription>
                    Create a new assignment for {classSubject.className} - {classSubject.subjectName}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input 
                      placeholder="e.g., Chapter 5 Quiz"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea 
                      placeholder="Instructions for students..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-xl min-h-[80px]"
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HOMEWORK">Homework</SelectItem>
                          <SelectItem value="CLASSWORK">Classwork</SelectItem>
                          <SelectItem value="TEST">Test</SelectItem>
                          <SelectItem value="QUIZ">Quiz</SelectItem>
                          <SelectItem value="EXAM">Exam</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input 
                        type="number"
                        placeholder="e.g., 30"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Due Date (optional)</Label>
                    <Input 
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create & Add Questions"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex gap-2">
        <Link href={`/teacher/my-subjects/${classSubject.id}/students${linkPrefix}`}>
          <Button variant="outline" size="sm" className="rounded-xl">
            <Users className="h-4 w-4 mr-2" />
            Students
          </Button>
        </Link>
        <Link href={`/teacher/my-subjects/${classSubject.id}/grades${linkPrefix}`}>
          <Button variant="outline" size="sm" className="rounded-xl">
            <FileText className="h-4 w-4 mr-2" />
            Grades
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold">{totalAssignments}</p>
              <p className="text-xs text-muted-foreground">Assignments</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{publishedCount}</p>
              <p className="text-xs text-muted-foreground">Published</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{pendingGrading}</p>
              <p className="text-xs text-muted-foreground">Pending Grade</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{studentCount}</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <Card className="neu-inset rounded-2xl border-0">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No assignments created yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Click "Create Assignment" to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const config = typeConfig[assignment.type] || typeConfig.HOMEWORK
            const TypeIcon = config.icon
            const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date()
            
            return (
              <Link 
                key={assignment.id} 
                href={`/teacher/assignments/${assignment.id}${linkPrefix}`}
              >
                <Card className="neu rounded-2xl border-0 hover:shadow-lg transition-all cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl border shrink-0",
                        config.color
                      )}>
                        <TypeIcon className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{assignment.title}</h3>
                              <Badge className={cn("rounded-lg text-xs", config.color)}>
                                {config.label}
                              </Badge>
                              {!assignment.isPublished && (
                                <Badge variant="secondary" className="text-xs">Draft</Badge>
                              )}
                            </div>
                            {assignment.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {assignment.description}
                              </p>
                            )}
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!assignment.isPublished && assignment.questionCount > 0 && (
                                <DropdownMenuItem onClick={(e) => handlePublish(assignment.id, e as unknown as React.MouseEvent)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              {!assignment.isPublished && (
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={(e) => handleDelete(assignment.id, e as unknown as React.MouseEvent)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                              {assignment.isPublished && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/teacher/assignments/${assignment.id}/submissions${linkPrefix}`}>
                                    <Users className="h-4 w-4 mr-2" />
                                    View Submissions
                                  </Link>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <ClipboardList className="h-4 w-4" />
                            <span>{assignment.questionCount} questions</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{assignment.totalMarks} marks</span>
                          </div>
                          
                          {assignment.isPublished && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{assignment.submissionCount}/{studentCount} submitted</span>
                            </div>
                          )}
                          
                          {assignment.dueDate && (
                            <div className={cn(
                              "flex items-center gap-1",
                              isOverdue && "text-red-500"
                            )}>
                              <Clock className="h-4 w-4" />
                              <span>
                                {isOverdue 
                                  ? "Overdue" 
                                  : `Due ${formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
