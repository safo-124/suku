"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { 
  FileText, 
  Clock, 
  CheckCircle,
  XCircle,
  Search,
  Calendar,
  BookOpen,
  ClipboardList,
  GraduationCap,
  AlertCircle
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, format, isPast } from "date-fns"

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
  questionCount: number
  hasSubmitted: boolean
  isGraded: boolean
  totalScore: number | null
  submittedAt?: Date | null
  isLate: boolean
  createdAt: Date
}

const typeConfig: Record<string, { label: string; color: string; icon: typeof FileText }> = {
  HOMEWORK: { label: "Homework", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: FileText },
  CLASSWORK: { label: "Classwork", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: ClipboardList },
  TEST: { label: "Test", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: BookOpen },
  QUIZ: { label: "Quiz", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: GraduationCap },
  EXAM: { label: "Exam", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: Calendar },
}

export function AssignmentsClient({ assignments }: { assignments: Assignment[] }) {
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const linkPrefix = subdomain ? `?subdomain=${subdomain}` : ""
  
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = !searchQuery || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = typeFilter === "all" || a.type === typeFilter
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "pending" && !a.hasSubmitted) ||
      (statusFilter === "submitted" && a.hasSubmitted && !a.isGraded) ||
      (statusFilter === "graded" && a.isGraded)
    
    return matchesSearch && matchesType && matchesStatus
  })
  
  // Stats
  const pendingCount = assignments.filter(a => !a.hasSubmitted).length
  const submittedCount = assignments.filter(a => a.hasSubmitted).length
  const gradedCount = assignments.filter(a => a.isGraded).length
  const overdueCount = assignments.filter(a => 
    !a.hasSubmitted && a.dueDate && isPast(new Date(a.dueDate))
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <p className="text-muted-foreground mt-1">
          View and complete your assignments
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex">
              <CheckCircle className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{submittedCount}</p>
              <p className="text-sm text-muted-foreground">Submitted</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex">
              <GraduationCap className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{gradedCount}</p>
              <p className="text-sm text-muted-foreground">Graded</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overdueCount}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 rounded-xl neu-inset border-0"
          />
        </div>
        
        <div className="flex gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] h-11 rounded-xl neu-sm border-0">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="HOMEWORK">Homework</SelectItem>
              <SelectItem value="CLASSWORK">Classwork</SelectItem>
              <SelectItem value="TEST">Test</SelectItem>
              <SelectItem value="QUIZ">Quiz</SelectItem>
              <SelectItem value="EXAM">Exam</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-11 rounded-xl neu-sm border-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <Card className="neu-inset rounded-2xl border-0">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "No assignments match your filters" 
                : "No assignments available"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const config = typeConfig[assignment.type] || typeConfig.HOMEWORK
            const TypeIcon = config.icon
            const isOverdue = !assignment.hasSubmitted && assignment.dueDate && isPast(new Date(assignment.dueDate))
            const dueSoon = !assignment.hasSubmitted && assignment.dueDate && 
              !isOverdue && 
              new Date(assignment.dueDate).getTime() - Date.now() < 24 * 60 * 60 * 1000
            
            return (
              <Link 
                key={assignment.id} 
                href={`/student/assignments/${assignment.id}${linkPrefix}`}
              >
                <Card className={cn(
                  "neu rounded-2xl border-0 hover:shadow-lg transition-all cursor-pointer",
                  isOverdue && "border-l-4 border-l-red-500",
                  dueSoon && !isOverdue && "border-l-4 border-l-amber-500"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl border shrink-0",
                        config.color
                      )}>
                        <TypeIcon className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg">{assignment.title}</h3>
                              <Badge className={cn("rounded-lg", config.color)}>
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {assignment.subjectName}
                            </p>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="shrink-0">
                            {assignment.isGraded ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 rounded-lg">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {assignment.totalScore}/{assignment.totalMarks}
                              </Badge>
                            ) : assignment.hasSubmitted ? (
                              <Badge className="bg-blue-500/10 text-blue-500 rounded-lg">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Submitted
                              </Badge>
                            ) : isOverdue ? (
                              <Badge className="bg-red-500/10 text-red-500 rounded-lg">
                                <XCircle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="rounded-lg">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <ClipboardList className="h-4 w-4" />
                            <span>{assignment.questionCount} questions</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{assignment.totalMarks} marks</span>
                          </div>
                          
                          {assignment.dueDate && (
                            <div className={cn(
                              "flex items-center gap-1",
                              isOverdue && "text-red-500",
                              dueSoon && !isOverdue && "text-amber-500"
                            )}>
                              <Clock className="h-4 w-4" />
                              <span>
                                {isOverdue 
                                  ? `Overdue by ${formatDistanceToNow(new Date(assignment.dueDate))}`
                                  : `Due ${formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}`
                                }
                              </span>
                            </div>
                          )}
                          
                          {assignment.hasSubmitted && assignment.submittedAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Submitted {format(new Date(assignment.submittedAt), "MMM d, yyyy")}
                                {assignment.isLate && " (Late)"}
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
