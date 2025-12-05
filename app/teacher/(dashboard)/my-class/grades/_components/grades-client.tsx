"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Award, Search, User, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface ExamPeriod {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
  code: string | null
}

interface StudentGrade {
  subjectId: string
  subjectName: string
  score: number
  grade: string | null
}

interface Student {
  id: string
  firstName: string
  lastName: string
  studentId: string | null
  grades: StudentGrade[]
  reportCard: {
    totalScore: number | null
    averageScore: number | null
    position: number | null
    passStatus: string | null
  } | null
}

export function GradesClient({ 
  className, 
  examPeriods,
  selectedPeriodId,
  subjects,
  students,
}: { 
  className: string
  examPeriods: ExamPeriod[]
  selectedPeriodId: string | undefined
  subjects: Subject[]
  students: Student[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const [search, setSearch] = useState("")

  const handlePeriodChange = (periodId: string) => {
    const baseUrl = "/teacher/my-class/grades"
    const params = new URLSearchParams()
    params.set("period", periodId)
    if (subdomain) params.set("subdomain", subdomain)
    router.push(`${baseUrl}?${params.toString()}`)
  }

  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
    return fullName.includes(search.toLowerCase()) ||
           student.studentId?.toLowerCase().includes(search.toLowerCase())
  })

  // Sort by position or average
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (a.reportCard?.position && b.reportCard?.position) {
      return a.reportCard.position - b.reportCard.position
    }
    return (b.reportCard?.averageScore || 0) - (a.reportCard?.averageScore || 0)
  })

  const getGradeColor = (grade: string | null) => {
    if (!grade) return "text-muted-foreground"
    if (grade.startsWith("A")) return "text-emerald-500"
    if (grade.startsWith("B")) return "text-blue-500"
    if (grade.startsWith("C")) return "text-amber-500"
    if (grade.startsWith("D")) return "text-orange-500"
    return "text-red-500"
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500"
    if (score >= 60) return "text-blue-500"
    if (score >= 50) return "text-amber-500"
    if (score >= 40) return "text-orange-500"
    return "text-red-500"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Class Grades</h1>
          <p className="text-muted-foreground mt-1">
            {className} • All subjects performance
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-11 rounded-xl neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20"
          />
        </div>

        <Select
          value={selectedPeriodId || ""}
          onValueChange={handlePeriodChange}
        >
          <SelectTrigger className="w-[200px] h-11 rounded-xl neu-inset border-0">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="neu rounded-xl border-0">
            {examPeriods.map((period) => (
              <SelectItem key={period.id} value={period.id}>
                {period.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* No Period Selected */}
      {!selectedPeriodId && examPeriods.length === 0 && (
        <Card className="neu-inset rounded-2xl border-0">
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No exam periods found</p>
          </CardContent>
        </Card>
      )}

      {/* Grades Table */}
      {(selectedPeriodId || examPeriods.length > 0) && (
        <Card className="neu rounded-2xl border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead className="min-w-[150px]">Student</TableHead>
                  {subjects.map((subject) => (
                    <TableHead key={subject.id} className="text-center min-w-[80px]">
                      {subject.code || subject.name.substring(0, 4)}
                    </TableHead>
                  ))}
                  <TableHead className="text-center min-w-[80px]">Avg</TableHead>
                  <TableHead className="text-center min-w-[60px]">Pos</TableHead>
                  <TableHead className="text-center min-w-[80px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={subjects.length + 5} className="text-center py-8">
                      <p className="text-muted-foreground">No students found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStudents.map((student, index) => {
                    // Create a map for quick grade lookup
                    const gradeMap = new Map(
                      student.grades.map(g => [g.subjectId, g])
                    )
                    
                    return (
                      <TableRow key={student.id} className="border-border/50">
                        <TableCell className="font-medium text-muted-foreground">
                          {student.reportCard?.position || index + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {student.firstName} {student.lastName}
                            </p>
                            {student.studentId && (
                              <p className="text-xs text-muted-foreground">
                                {student.studentId}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        {subjects.map((subject) => {
                          const grade = gradeMap.get(subject.id)
                          return (
                            <TableCell key={subject.id} className="text-center">
                              {grade ? (
                                <div>
                                  <span className={cn("font-semibold", getScoreColor(grade.score))}>
                                    {grade.score}
                                  </span>
                                  {grade.grade && (
                                    <span className={cn("text-xs ml-1", getGradeColor(grade.grade))}>
                                      ({grade.grade})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-center">
                          {student.reportCard?.averageScore != null ? (
                            <span className={cn(
                              "font-bold",
                              getScoreColor(student.reportCard.averageScore)
                            )}>
                              {student.reportCard.averageScore.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {student.reportCard?.position ? (
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "rounded-lg",
                                student.reportCard.position <= 3 && "bg-amber-500/20 text-amber-500"
                              )}
                            >
                              {student.reportCard.position}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {student.reportCard?.passStatus ? (
                            <Badge 
                              variant="secondary"
                              className={cn(
                                "rounded-lg",
                                student.reportCard.passStatus === "PASSED" 
                                  ? "bg-emerald-500/20 text-emerald-500"
                                  : "bg-red-500/20 text-red-500"
                              )}
                            >
                              {student.reportCard.passStatus}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Legend */}
      <Card className="neu rounded-2xl border-0">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">Subject Codes:</span>
            {subjects.map((subject) => (
              <span key={subject.id}>
                <span className="font-medium">{subject.code || subject.name.substring(0, 4)}</span>
                <span className="text-muted-foreground"> = {subject.name}</span>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
