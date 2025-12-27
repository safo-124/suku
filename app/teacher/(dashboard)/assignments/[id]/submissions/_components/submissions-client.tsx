"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Eye
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"
import { gradeSubmission } from "../../../_actions/assignment-actions"

interface Student {
  id: string
  firstName: string
  lastName: string
  studentId: string
  hasSubmitted: boolean
  submittedAt: Date | null
  isLate: boolean
  isGraded: boolean
  totalScore: number | null
  submissionId: string | null
}

interface Assignment {
  id: string
  title: string
  type: string
  totalMarks: number
  dueDate: Date | null
  className: string
  subjectName: string
}

const typeColors: Record<string, string> = {
  HOMEWORK: "bg-blue-500/10 text-blue-500",
  CLASSWORK: "bg-emerald-500/10 text-emerald-500",
  TEST: "bg-orange-500/10 text-orange-500",
  QUIZ: "bg-purple-500/10 text-purple-500",
  EXAM: "bg-red-500/10 text-red-500",
}

export function SubmissionsClient({ 
  assignment, 
  students 
}: { 
  assignment: Assignment
  students: Student[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const linkPrefix = subdomain ? `?subdomain=${subdomain}` : ""
  
  const [searchQuery, setSearchQuery] = useState("")
  const [gradingId, setGradingId] = useState<string | null>(null)
  
  const filteredStudents = students.filter(s => {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase()
    return !searchQuery || 
      name.includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  })
  
  // Stats
  const submittedCount = students.filter(s => s.hasSubmitted).length
  const gradedCount = students.filter(s => s.isGraded).length
  const lateCount = students.filter(s => s.isLate).length
  const avgScore = students.filter(s => s.isGraded && s.totalScore !== null)
    .reduce((sum, s, _, arr) => {
      if (arr.length === 0) return 0
      return sum + (s.totalScore || 0) / arr.length
    }, 0)
  
  const handleAutoGrade = async (submissionId: string) => {
    setGradingId(submissionId)
    
    const result = await gradeSubmission(submissionId)
    
    if (result.success) {
      toast.success(`Graded! Score: ${result.totalScore}/${assignment.totalMarks}`)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to grade")
    }
    
    setGradingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href={`/teacher/assignments/${assignment.id}${linkPrefix}`}>
          <Button variant="ghost" size="icon" className="rounded-xl neu-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        <div>
          <h1 className="text-2xl font-bold">Submissions</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={cn("rounded-lg", typeColors[assignment.type])}>
              {assignment.type}
            </Badge>
            <span className="text-muted-foreground">{assignment.title}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{assignment.className}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold">{submittedCount}/{students.length}</p>
              <p className="text-xs text-muted-foreground">Submitted</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{gradedCount}</p>
              <p className="text-xs text-muted-foreground">Graded</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{lateCount}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{avgScore.toFixed(1)}/{assignment.totalMarks}</p>
              <p className="text-xs text-muted-foreground">Average</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-11 rounded-xl neu-inset border-0"
        />
      </div>

      {/* Students Table */}
      <Card className="neu rounded-2xl border-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-muted">
              <TableHead className="font-semibold">Student</TableHead>
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
              <TableHead className="font-semibold text-center">Submitted</TableHead>
              <TableHead className="font-semibold text-center">Score</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id} className="border-b border-muted/50">
                <TableCell className="font-medium">
                  {student.firstName} {student.lastName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {student.studentId}
                </TableCell>
                <TableCell className="text-center">
                  {student.hasSubmitted ? (
                    student.isLate ? (
                      <Badge className="bg-amber-500/10 text-amber-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Late
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Submitted
                      </Badge>
                    )
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not submitted
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {student.submittedAt 
                    ? format(new Date(student.submittedAt), "MMM d, h:mm a")
                    : "-"
                  }
                </TableCell>
                <TableCell className="text-center">
                  {student.isGraded ? (
                    <span className="font-semibold">
                      {student.totalScore}/{assignment.totalMarks}
                    </span>
                  ) : student.hasSubmitted ? (
                    <Badge variant="outline">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {student.hasSubmitted && student.submissionId && (
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/teacher/assignments/${assignment.id}/submissions/${student.submissionId}${linkPrefix}`}>
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      </Link>
                      {!student.isGraded && (
                        <Button 
                          size="sm" 
                          className="h-8 rounded-lg"
                          onClick={() => handleAutoGrade(student.submissionId!)}
                          disabled={gradingId === student.submissionId}
                        >
                          {gradingId === student.submissionId ? "Grading..." : "Grade"}
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            
            {filteredStudents.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  {searchQuery ? "No students match your search" : "No students in this class"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
