"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  Award, 
  Search, 
  User, 
  ChevronDown, 
  ChevronRight,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Users,
  GraduationCap,
  FileText
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ExamPeriod {
  id: string
  name: string
}

interface ExamResult {
  examType: string
  examTypeLabel: string
  score: number
  maxScore: number
  percentage: number
  grade: string | null
  remarks: string | null
  weight: number
}

interface SubjectGrade {
  subjectId: string
  subjectName: string
  subjectCode: string | null
  teacherName: string | null
  examResults: ExamResult[]
  weightedScore: number | null
  grade: string | null
  hasGrades: boolean
}

interface Student {
  id: string
  firstName: string
  lastName: string
  studentId: string | null
  subjectGrades: SubjectGrade[]
  overallAverage: number | null
  overallGrade: string | null
  reportCard: {
    totalScore: number | null
    averageScore: number | null
    position: number | null
    passStatus: string | null
  } | null
}

interface Subject {
  id: string
  name: string
  code: string | null
  teacherName: string | null
  weights: Record<string, number> | null
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
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<"summary" | "detailed">("summary")

  const handlePeriodChange = (periodId: string) => {
    const baseUrl = "/teacher/my-class/grades"
    const params = new URLSearchParams()
    params.set("period", periodId)
    if (subdomain) params.set("subdomain", subdomain)
    router.push(`${baseUrl}?${params.toString()}`)
  }

  const toggleStudentExpanded = (studentId: string) => {
    setExpandedStudents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
  }

  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
    return fullName.includes(search.toLowerCase()) ||
           student.studentId?.toLowerCase().includes(search.toLowerCase())
  })

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (a.reportCard?.position && b.reportCard?.position) {
      return a.reportCard.position - b.reportCard.position
    }
    return (b.overallAverage || 0) - (a.overallAverage || 0)
  })

  const getGradeColor = (grade: string | null) => {
    if (!grade) return "text-muted-foreground"
    if (grade === "A") return "text-emerald-600 dark:text-emerald-400"
    if (grade === "B") return "text-blue-600 dark:text-blue-400"
    if (grade === "C") return "text-amber-600 dark:text-amber-400"
    if (grade === "D") return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  const getGradeBadgeClass = (grade: string | null) => {
    if (!grade) return "bg-muted text-muted-foreground"
    if (grade === "A") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
    if (grade === "B") return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
    if (grade === "C") return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
    if (grade === "D") return "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
    return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground"
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
    if (score >= 60) return "text-blue-600 dark:text-blue-400"
    if (score >= 50) return "text-amber-600 dark:text-amber-400"
    if (score >= 40) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  const totalStudents = students.length
  const studentsWithGrades = students.filter(s => s.overallAverage !== null).length
  const averageClassScore = students.reduce((sum, s) => sum + (s.overallAverage || 0), 0) / (studentsWithGrades || 1)
  const passingStudents = students.filter(s => (s.overallAverage || 0) >= 50).length

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Class Grades</h1>
            <p className="text-muted-foreground mt-1">
              {className} • Comprehensive student performance overview
            </p>
          </div>
          <Badge variant="outline" className="text-sm py-1.5 px-3">
            <FileText className="h-4 w-4 mr-2" />
            Read Only
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="neu rounded-2xl border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
            </CardContent>
          </Card>
          <Card className="neu rounded-2xl border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <Award className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{studentsWithGrades}</p>
                <p className="text-xs text-muted-foreground">With Grades</p>
              </div>
            </CardContent>
          </Card>
          <Card className="neu rounded-2xl border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageClassScore.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Class Average</p>
              </div>
            </CardContent>
          </Card>
          <Card className="neu rounded-2xl border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <GraduationCap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{passingStudents}</p>
                <p className="text-xs text-muted-foreground">Passing (≥50%)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-11 rounded-xl neu-inset border-0 bg-transparent"
            />
          </div>

          <Select value={selectedPeriodId || ""} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[200px] h-11 rounded-xl neu border-0">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="neu rounded-xl border-0">
              {examPeriods.map((period) => (
                <SelectItem key={period.id} value={period.id}>{period.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-xl neu overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className={cn("rounded-none h-11 px-4", viewMode === "summary" && "bg-primary/10 text-primary")}
              onClick={() => setViewMode("summary")}
            >
              Summary
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("rounded-none h-11 px-4", viewMode === "detailed" && "bg-primary/10 text-primary")}
              onClick={() => setViewMode("detailed")}
            >
              Detailed
            </Button>
          </div>
        </div>

        {!selectedPeriodId && examPeriods.length === 0 && (
          <Card className="neu-inset rounded-2xl border-0">
            <CardContent className="py-12 text-center">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No exam periods found</p>
            </CardContent>
          </Card>
        )}

        {viewMode === "summary" && (selectedPeriodId || examPeriods.length > 0) && (
          <Card className="neu rounded-2xl border-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead className="min-w-[180px]">Student</TableHead>
                    {subjects.map((subject) => (
                      <TableHead key={subject.id} className="text-center min-w-20">
                        <Tooltip>
                          <TooltipTrigger>{subject.code || subject.name.substring(0, 3)}</TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{subject.name}</p>
                            {subject.teacherName && <p className="text-xs text-muted-foreground">Teacher: {subject.teacherName}</p>}
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                    ))}
                    <TableHead className="text-center min-w-20">Avg</TableHead>
                    <TableHead className="text-center min-w-16">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={subjects.length + 4} className="text-center py-12">
                        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No students found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedStudents.map((student, index) => {
                      const gradeMap = new Map(student.subjectGrades.map(g => [g.subjectId, g]))
                      return (
                        <TableRow key={student.id} className="border-border/50">
                          <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{student.firstName} {student.lastName}</p>
                              {student.studentId && <p className="text-xs text-muted-foreground">{student.studentId}</p>}
                            </div>
                          </TableCell>
                          {subjects.map((subject) => {
                            const grade = gradeMap.get(subject.id)
                            return (
                              <TableCell key={subject.id} className="text-center">
                                {grade?.hasGrades ? (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className={cn("font-semibold", getScoreColor(grade.weightedScore))}>
                                        {grade.weightedScore}
                                        <span className={cn("text-xs ml-0.5", getGradeColor(grade.grade))}>({grade.grade})</span>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-medium">{subject.name}</p>
                                      <p className="text-xs">Weighted Score: {grade.weightedScore}%</p>
                                      <p className="text-xs">{grade.examResults.length} assessment(s)</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : <span className="text-muted-foreground">-</span>}
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-center">
                            <span className={cn("font-bold", getScoreColor(student.overallAverage))}>
                              {student.overallAverage !== null ? `${student.overallAverage}%` : "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {student.overallGrade ? (
                              <Badge className={cn("rounded-lg", getGradeBadgeClass(student.overallGrade))}>{student.overallGrade}</Badge>
                            ) : <span className="text-muted-foreground">-</span>}
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

        {viewMode === "detailed" && (selectedPeriodId || examPeriods.length > 0) && (
          <div className="space-y-4">
            {sortedStudents.length === 0 ? (
              <Card className="neu rounded-2xl border-0">
                <CardContent className="py-12 text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No students found</p>
                </CardContent>
              </Card>
            ) : (
              sortedStudents.map((student, index) => {
                const isExpanded = expandedStudents.has(student.id)
                return (
                  <Collapsible key={student.id} open={isExpanded}>
                    <Card className="neu rounded-2xl border-0 overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4" onClick={() => toggleStudentExpanded(student.id)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-inset">
                                <span className="font-bold text-muted-foreground">{index + 1}</span>
                              </div>
                              <div>
                                <CardTitle className="text-lg">{student.firstName} {student.lastName}</CardTitle>
                                {student.studentId && <p className="text-sm text-muted-foreground">ID: {student.studentId}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className={cn("text-xl font-bold", getScoreColor(student.overallAverage))}>
                                  {student.overallAverage !== null ? `${student.overallAverage}%` : "-"}
                                </p>
                                <p className="text-xs text-muted-foreground">Overall Average</p>
                              </div>
                              {student.overallGrade && (
                                <Badge className={cn("text-lg px-3 py-1 rounded-xl", getGradeBadgeClass(student.overallGrade))}>{student.overallGrade}</Badge>
                              )}
                              {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-6">
                          <div className="space-y-4">
                            {student.subjectGrades.map((subjectGrade) => (
                              <div key={subjectGrade.subjectId} className="rounded-xl bg-muted/30 p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{subjectGrade.subjectName}</span>
                                    {subjectGrade.subjectCode && <Badge variant="outline" className="text-xs">{subjectGrade.subjectCode}</Badge>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {subjectGrade.weightedScore !== null && (
                                      <>
                                        <span className={cn("font-bold", getScoreColor(subjectGrade.weightedScore))}>{subjectGrade.weightedScore}%</span>
                                        <Badge className={cn("rounded-lg", getGradeBadgeClass(subjectGrade.grade))}>{subjectGrade.grade}</Badge>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {subjectGrade.teacherName && <p className="text-xs text-muted-foreground mb-3">Subject Teacher: {subjectGrade.teacherName}</p>}
                                {subjectGrade.examResults.length > 0 ? (
                                  <div className="space-y-2">
                                    {subjectGrade.examResults.map((result, idx) => (
                                      <div key={idx} className="flex items-start justify-between py-2 px-3 rounded-lg bg-background/50">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{result.examTypeLabel}</span>
                                            {result.weight > 0 && <Badge variant="outline" className="text-xs">{result.weight}%</Badge>}
                                          </div>
                                          {result.remarks && (
                                            <div className="flex items-start gap-1.5 mt-1.5">
                                              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                              <p className="text-xs text-muted-foreground italic">"{result.remarks}"</p>
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <p className={cn("font-semibold", getScoreColor(result.percentage))}>{result.score}/{result.maxScore}</p>
                                          <p className="text-xs text-muted-foreground">{result.percentage}%</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : <p className="text-sm text-muted-foreground text-center py-4">No grades recorded yet</p>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )
              })
            )}
          </div>
        )}

        <Card className="neu rounded-2xl border-0">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="text-muted-foreground font-medium">Subjects:</span>
              {subjects.map((subject) => (
                <span key={subject.id} className="flex items-center gap-1">
                  <span className="font-medium">{subject.code || subject.name.substring(0, 3)}</span>
                  <span className="text-muted-foreground">= {subject.name}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
