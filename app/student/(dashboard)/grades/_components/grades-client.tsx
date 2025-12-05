"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Award, TrendingUp, BookOpen, Trophy, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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

interface Period {
  id: string
  name: string
  startDate: Date
  endDate: Date
}

interface SubjectResult {
  subject: {
    id: string
    name: string
    code: string | null
  }
  results: Array<{
    id: string
    examType: string
    score: number
    maxScore: number
    grade: string | null
    remarks: string | null
  }>
}

interface ReportCard {
  id: string
  totalScore: number | null
  averageScore: number | null
  position: number | null
  attendancePercentage: number | null
  passStatus: string | null
  promotionEligible: boolean
  publishedAt: Date | null
}

interface GradesClientProps {
  periods: Period[]
  selectedPeriodId: string | undefined
  resultsBySubject: SubjectResult[]
  reportCard: ReportCard | null
}

export function GradesClient({
  periods,
  selectedPeriodId,
  resultsBySubject,
  reportCard,
}: GradesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")

  const handlePeriodChange = (periodId: string) => {
    const params = new URLSearchParams()
    if (subdomain) params.set("subdomain", subdomain)
    params.set("period", periodId)
    router.push(`/student/grades?${params.toString()}`)
  }

  // Calculate overall stats
  const totalResults = resultsBySubject.reduce((sum, s) => sum + s.results.length, 0)
  const allScores = resultsBySubject.flatMap(s => 
    s.results.map(r => (r.score / r.maxScore) * 100)
  )
  const averageScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grades & Results</h1>
          <p className="text-muted-foreground mt-1">
            View your academic performance and exam results.
          </p>
        </div>
        {periods.length > 0 && (
          <Select
            value={selectedPeriodId}
            onValueChange={handlePeriodChange}
          >
            <SelectTrigger className="w-[200px] neu-sm">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Report Card Summary */}
      {reportCard && (
        <Card className="neu-sm border-green-200 bg-green-50/50 dark:bg-green-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Card Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {reportCard.averageScore !== null && (
                <div className="p-4 rounded-xl neu-inset-sm">
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">{reportCard.averageScore.toFixed(1)}%</p>
                </div>
              )}
              {reportCard.position !== null && (
                <div className="p-4 rounded-xl neu-inset-sm">
                  <p className="text-sm text-muted-foreground">Class Position</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    {reportCard.position}
                  </p>
                </div>
              )}
              {reportCard.attendancePercentage !== null && (
                <div className="p-4 rounded-xl neu-inset-sm">
                  <p className="text-sm text-muted-foreground">Attendance</p>
                  <p className="text-2xl font-bold">{reportCard.attendancePercentage.toFixed(1)}%</p>
                </div>
              )}
              <div className="p-4 rounded-xl neu-inset-sm">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge 
                  variant={reportCard.passStatus === "PASS" ? "default" : "destructive"}
                  className="mt-1"
                >
                  {reportCard.passStatus || "Pending"}
                </Badge>
              </div>
            </div>
            {reportCard.publishedAt && (
              <p className="text-xs text-muted-foreground mt-4">
                Published on {new Date(reportCard.publishedAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="neu-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl neu flex items-center justify-center">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resultsBySubject.length}</p>
                <p className="text-sm text-muted-foreground">Subjects Graded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="neu-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl neu flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalResults}</p>
                <p className="text-sm text-muted-foreground">Total Assessments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="neu-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl neu flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageScore}%</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results by Subject */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Results by Subject</h2>
        {resultsBySubject.length > 0 ? (
          <div className="space-y-4">
            {resultsBySubject.map((subjectResult) => {
              const subjectAvg = subjectResult.results.length > 0
                ? Math.round(
                    subjectResult.results.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) /
                    subjectResult.results.length
                  )
                : 0

              return (
                <Card key={subjectResult.subject.id} className="neu-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl neu flex items-center justify-center">
                          <span className="font-bold">
                            {subjectResult.subject.code || subjectResult.subject.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{subjectResult.subject.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {subjectResult.results.length} assessment(s)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{subjectAvg}%</p>
                        <p className="text-xs text-muted-foreground">Average</p>
                      </div>
                    </div>
                    <Progress value={subjectAvg} className="mt-3 h-2" />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Assessment</TableHead>
                          <TableHead className="text-center">Score</TableHead>
                          <TableHead className="text-center">Max</TableHead>
                          <TableHead className="text-center">%</TableHead>
                          <TableHead className="text-center">Grade</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjectResult.results.map((result) => {
                          const percentage = Math.round((result.score / result.maxScore) * 100)
                          return (
                            <TableRow key={result.id}>
                              <TableCell className="font-medium">{result.examType}</TableCell>
                              <TableCell className="text-center">{result.score}</TableCell>
                              <TableCell className="text-center">{result.maxScore}</TableCell>
                              <TableCell className="text-center">
                                <span className={cn(
                                  "font-semibold",
                                  percentage >= 70 && "text-green-600",
                                  percentage >= 50 && percentage < 70 && "text-yellow-600",
                                  percentage < 50 && "text-red-600"
                                )}>
                                  {percentage}%
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                {result.grade && (
                                  <Badge variant="outline">{result.grade}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {result.remarks || "-"}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="neu-sm">
            <CardContent className="py-12 text-center">
              <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-1">No results yet</h3>
              <p className="text-sm text-muted-foreground">
                {periods.length > 0
                  ? "No exam results have been published for this period."
                  : "No academic periods found."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
