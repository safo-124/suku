"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ClipboardList, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Save,
  BarChart3,
  Users,
  Percent,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { markClassAttendance } from "../../../_actions/teacher-actions"

// Define locally to avoid client-side Prisma import issues
const AttendanceStatus = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
  EXCUSED: "EXCUSED",
} as const

type AttendanceStatusType = typeof AttendanceStatus[keyof typeof AttendanceStatus]

interface Student {
  id: string
  firstName: string
  lastName: string
  studentId: string | null
  avatar: string | null
  attendanceId: string | null
  status: AttendanceStatusType | null
  remarks: string | null
}

interface StudentSummary {
  id: string
  userId: string
  studentId: string | null
  firstName: string
  lastName: string
  avatar: string | null
  stats: {
    present: number
    absent: number
    late: number
    excused: number
  }
  totalMarked: number
  totalSchoolDays: number
  attendancePercent: number
}

interface AttendanceSummary {
  periods: { id: string; name: string }[]
  period: {
    id: string
    name: string
    totalSchoolDays: number
    startDate: Date
    endDate: Date
  }
  students: StudentSummary[]
  classStats: {
    present: number
    absent: number
    late: number
    excused: number
  }
  classAttendanceRate: number
}

export function AttendanceClient({ 
  className, 
  classId,
  date,
  students,
  summary
}: { 
  className: string
  classId: string
  date: string
  students: Student[]
  summary: AttendanceSummary | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const [activeTab, setActiveTab] = useState("daily")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Local attendance state
  const [attendance, setAttendance] = useState<Record<string, { status: AttendanceStatusType; remarks: string }>>(
    students.reduce((acc, student) => {
      acc[student.id] = {
        status: student.status || AttendanceStatus.PRESENT,
        remarks: student.remarks || "",
      }
      return acc
    }, {} as Record<string, { status: AttendanceStatusType; remarks: string }>)
  )

  const currentDate = new Date(date)
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const handlePreviousDay = () => {
    const prevDate = new Date(currentDate)
    prevDate.setDate(prevDate.getDate() - 1)
    const dateStr = prevDate.toISOString().split("T")[0]
    const newUrl = subdomain 
      ? `/teacher/my-class/attendance?date=${dateStr}&subdomain=${subdomain}`
      : `/teacher/my-class/attendance?date=${dateStr}`
    router.push(newUrl)
  }

  const handleNextDay = () => {
    const nextDate = new Date(currentDate)
    nextDate.setDate(nextDate.getDate() + 1)
    const dateStr = nextDate.toISOString().split("T")[0]
    const newUrl = subdomain 
      ? `/teacher/my-class/attendance?date=${dateStr}&subdomain=${subdomain}`
      : `/teacher/my-class/attendance?date=${dateStr}`
    router.push(newUrl)
  }

  const handleToday = () => {
    const today = new Date().toISOString().split("T")[0]
    const newUrl = subdomain 
      ? `/teacher/my-class/attendance?date=${today}&subdomain=${subdomain}`
      : `/teacher/my-class/attendance?date=${today}`
    router.push(newUrl)
  }

  const setStatus = (studentId: string, status: AttendanceStatusType) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }))
  }

  const handleSave = () => {
    setError(null)
    setSuccess(false)
    
    startTransition(async () => {
      const attendanceData = Object.entries(attendance).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        remarks: data.remarks || undefined,
      }))

      const result = await markClassAttendance(date, attendanceData)
      
      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        router.refresh()
      } else {
        setError(result.error || "Failed to save attendance")
      }
    })
  }

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter(a => a.status === AttendanceStatus.PRESENT).length,
    absent: Object.values(attendance).filter(a => a.status === AttendanceStatus.ABSENT).length,
    late: Object.values(attendance).filter(a => a.status === AttendanceStatus.LATE).length,
    excused: Object.values(attendance).filter(a => a.status === AttendanceStatus.EXCUSED).length,
  }

  const isToday = date === new Date().toISOString().split("T")[0]

  const handlePeriodChange = (periodId: string) => {
    const baseUrl = `/teacher/my-class/attendance?periodId=${periodId}`
    const newUrl = subdomain ? `${baseUrl}&subdomain=${subdomain}` : baseUrl
    router.push(newUrl)
  }

  const getAttendanceColor = (percent: number) => {
    if (percent >= 90) return "text-green-600"
    if (percent >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Class Attendance</h1>
          <p className="text-muted-foreground mt-1">
            {className}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="neu-flat p-1 rounded-xl">
          <TabsTrigger value="daily" className="rounded-lg gap-2">
            <Calendar className="h-4 w-4" />
            Daily Marking
          </TabsTrigger>
          <TabsTrigger value="summary" className="rounded-lg gap-2">
            <BarChart3 className="h-4 w-4" />
            Term Summary
          </TabsTrigger>
        </TabsList>

        {/* Daily Marking Tab */}
        <TabsContent value="daily" className="mt-6 space-y-6">
          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="rounded-xl bg-green-600 hover:bg-green-700 text-white"
            >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Attendance
            </>
          )}
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-3">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Attendance saved successfully!
        </div>
      )}

      {/* Date Navigation */}
      <Card className="neu rounded-2xl border-0">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousDay}
              className="rounded-xl neu-sm hover:neu"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">{formattedDate}</span>
                {isToday && (
                  <Badge className="rounded-lg bg-emerald-500/20 text-emerald-500 border-0">
                    Today
                  </Badge>
                )}
              </div>
              {!isToday && (
                <Button
                  variant="link"
                  onClick={handleToday}
                  className="text-xs text-muted-foreground p-0 h-auto"
                >
                  Go to today
                </Button>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextDay}
              className="rounded-xl neu-sm hover:neu"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card className="neu rounded-2xl border-0">
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-500">
              <CheckCircle className="h-5 w-5" />
              <span className="text-2xl font-bold">{stats.present}</span>
            </div>
            <p className="text-xs text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-red-500">
              <XCircle className="h-5 w-5" />
              <span className="text-2xl font-bold">{stats.absent}</span>
            </div>
            <p className="text-xs text-muted-foreground">Absent</p>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-amber-500">
              <Clock className="h-5 w-5" />
              <span className="text-2xl font-bold">{stats.late}</span>
            </div>
            <p className="text-xs text-muted-foreground">Late</p>
          </CardContent>
        </Card>
        
        <Card className="neu rounded-2xl border-0">
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-500">
              <AlertCircle className="h-5 w-5" />
              <span className="text-2xl font-bold">{stats.excused}</span>
            </div>
            <p className="text-xs text-muted-foreground">Excused</p>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <div className="space-y-3">
        {students.length === 0 ? (
          <Card className="neu rounded-2xl border-0">
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No Students Found</h3>
              <p className="text-muted-foreground">
                There are no students assigned to this class yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          students.map((student) => {
            const currentStatus = attendance[student.id]?.status || AttendanceStatus.PRESENT
            
            return (
              <Card key={student.id} className="neu rounded-2xl border-0">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                      <AvatarImage src={student.avatar || ""} />
                      <AvatarFallback className="bg-foreground text-background font-semibold text-sm">
                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-[150px]">
                      <p className="font-semibold">
                      {student.firstName} {student.lastName}
                    </p>
                    {student.studentId && (
                      <p className="text-sm text-muted-foreground">{student.studentId}</p>
                    )}
                  </div>

                  {/* Status Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setStatus(student.id, AttendanceStatus.PRESENT)}
                      className={cn(
                        "rounded-xl h-9 px-3 transition-all",
                        currentStatus === AttendanceStatus.PRESENT
                          ? "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
                          : "neu-sm hover:neu"
                      )}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Present
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setStatus(student.id, AttendanceStatus.ABSENT)}
                      className={cn(
                        "rounded-xl h-9 px-3 transition-all",
                        currentStatus === AttendanceStatus.ABSENT
                          ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                          : "neu-sm hover:neu"
                      )}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Absent
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setStatus(student.id, AttendanceStatus.LATE)}
                      className={cn(
                        "rounded-xl h-9 px-3 transition-all",
                        currentStatus === AttendanceStatus.LATE
                          ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30"
                          : "neu-sm hover:neu"
                      )}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Late
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setStatus(student.id, AttendanceStatus.EXCUSED)}
                      className={cn(
                        "rounded-xl h-9 px-3 transition-all",
                        currentStatus === AttendanceStatus.EXCUSED
                          ? "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
                          : "neu-sm hover:neu"
                      )}
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Excused
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        }))}
      </div>
        </TabsContent>

        {/* Term Summary Tab */}
        <TabsContent value="summary" className="mt-6 space-y-6">
          {summary ? (
            <>
              {/* Period Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Select 
                    value={summary.period.id} 
                    onValueChange={handlePeriodChange}
                  >
                    <SelectTrigger className="w-[200px] neu-inset rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {summary.periods.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground">
                    {new Date(summary.period.startDate).toLocaleDateString()} - {new Date(summary.period.endDate).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant="outline">
                  {summary.period.totalSchoolDays} school days
                </Badge>
              </div>

              {/* Class Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="neu-flat rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Percent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className={cn("text-2xl font-bold", getAttendanceColor(summary.classAttendanceRate))}>
                        {summary.classAttendanceRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">Class Rate</p>
                    </div>
                  </div>
                </div>
                <div className="neu-flat rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{summary.classStats.present}</p>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                  </div>
                </div>
                <div className="neu-flat rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{summary.classStats.absent}</p>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                  </div>
                </div>
                <div className="neu-flat rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{summary.classStats.late}</p>
                      <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                  </div>
                </div>
                <div className="neu-flat rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{summary.classStats.excused}</p>
                      <p className="text-xs text-muted-foreground">Excused</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student List with Stats */}
              <div className="neu-flat rounded-2xl overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Student Attendance Summary
                  </h3>
                  <Badge variant="secondary">{summary.students.length} students</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-accent/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Student</th>
                        <th className="text-center p-4 font-medium text-green-600">Present</th>
                        <th className="text-center p-4 font-medium text-red-600">Absent</th>
                        <th className="text-center p-4 font-medium text-yellow-600">Late</th>
                        <th className="text-center p-4 font-medium text-blue-600">Excused</th>
                        <th className="text-center p-4 font-medium">Marked</th>
                        <th className="text-right p-4 font-medium">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {summary.students.map((student) => (
                        <tr key={student.id} className="hover:bg-accent/30">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={student.avatar || ""} />
                                <AvatarFallback className="bg-foreground text-background text-xs">
                                  {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{student.firstName} {student.lastName}</p>
                                {student.studentId && (
                                  <p className="text-xs text-muted-foreground">{student.studentId}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center font-medium text-green-600">{student.stats.present}</td>
                          <td className="p-4 text-center font-medium text-red-600">{student.stats.absent}</td>
                          <td className="p-4 text-center font-medium text-yellow-600">{student.stats.late}</td>
                          <td className="p-4 text-center font-medium text-blue-600">{student.stats.excused}</td>
                          <td className="p-4 text-center text-muted-foreground">
                            {student.totalMarked}/{student.totalSchoolDays}
                          </td>
                          <td className="p-4 text-right">
                            <Badge className={cn(
                              student.attendancePercent >= 90
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : student.attendancePercent >= 75
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            )}>
                              {student.attendancePercent}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="neu-flat rounded-2xl p-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Summary Available</h3>
              <p className="text-muted-foreground">
                The attendance summary will be available once the school admin configures the academic periods.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
