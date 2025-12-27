"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { 
  FileText, 
  Plus, 
  Search, 
  Clock, 
  Users, 
  CheckCircle,
  Calendar,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Filter
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { formatDistanceToNow, format } from "date-fns"

interface Assignment {
  id: string
  title: string
  description: string | null
  type: string
  totalMarks: number
  dueDate: Date | null
  isPublished: boolean
  isOnline: boolean
  className: string
  subjectName: string
  submissionCount: number
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
      a.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = typeFilter === "all" || a.type === typeFilter
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "published" && a.isPublished) ||
      (statusFilter === "draft" && !a.isPublished)
    
    return matchesSearch && matchesType && matchesStatus
  })
  
  // Stats
  const totalAssignments = assignments.length
  const publishedCount = assignments.filter(a => a.isPublished).length
  const draftCount = assignments.filter(a => !a.isPublished).length
  const totalSubmissions = assignments.reduce((sum, a) => sum + a.submissionCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage assignments for your classes
          </p>
        </div>
        
        <Link href={`/teacher/my-subjects${linkPrefix}`}>
          <Button className="rounded-xl neu-convex hover:scale-[0.98]">
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalAssignments}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{publishedCount}</p>
              <p className="text-sm text-muted-foreground">Published</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{draftCount}</p>
              <p className="text-sm text-muted-foreground">Drafts</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSubmissions}</p>
              <p className="text-sm text-muted-foreground">Submissions</p>
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
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
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
                : "No assignments created yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Go to My Subjects to create an assignment for a specific class
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const config = typeConfig[assignment.type] || typeConfig.HOMEWORK
            const TypeIcon = config.icon
            const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date()
            
            return (
              <Link 
                key={assignment.id} 
                href={`/teacher/assignments/${assignment.id}${linkPrefix}`}
              >
                <Card className="neu rounded-2xl border-0 hover:shadow-lg transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl border",
                        config.color
                      )}>
                        <TypeIcon className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{assignment.title}</h3>
                              {!assignment.isPublished && (
                                <Badge variant="secondary" className="text-xs">Draft</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {assignment.className} • {assignment.subjectName}
                            </p>
                          </div>
                          
                          <Badge className={cn("rounded-lg shrink-0", config.color)}>
                            {config.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{assignment.totalMarks} marks</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{assignment.submissionCount} submissions</span>
                          </div>
                          
                          {assignment.dueDate && (
                            <div className={cn(
                              "flex items-center gap-1",
                              isOverdue && "text-red-500"
                            )}>
                              <Clock className="h-4 w-4" />
                              <span>
                                {isOverdue ? "Overdue" : `Due ${formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}`}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Created {format(new Date(assignment.createdAt), "MMM d, yyyy")}</span>
                          </div>
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
