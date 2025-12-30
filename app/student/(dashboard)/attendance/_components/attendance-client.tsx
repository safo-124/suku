"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3,
  Percent,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface AttendanceRecord {
  id: string
  date: Date
  status: string
  notes: string | null
  className: string
  markedBy: string | null
}

interface AttendanceStats {
  total: number
  present: number
  absent: number
  late: number
  excused: number
  percentage: number
}

interface AttendanceClientProps {
  attendance: AttendanceRecord[]
  stats: AttendanceStats
  month: number
  year: number
  summary: {
    className: string
    periods: { id: string; name: string }[]
    period: {
      id: string
      name: string
      totalSchoolDays: number
      startDate: Date
      endDate: Date
    }
    stats: {
      present: number
      absent: number
      late: number
      excused: number
    }
    totalMarked: number
    attendancePercent: number
    recentRecords: {
      id: string
      date: Date
      status: string
      notes: string | null
    }[]
  } | null
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const getStatusConfig = (status: string) => {
  switch (status) {
    case "PRESENT":
      return { icon: CheckCircle, color: "text-green-500", bg: "bg-green-100", label: "Present" }
    case "ABSENT":
      return { icon: XCircle, color: "text-red-500", bg: "bg-red-100", label: "Absent" }
    case "LATE":
      return { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-100", label: "Late" }
    case "EXCUSED":
      return { icon: AlertCircle, color: "text-blue-500", bg: "bg-blue-100", label: "Excused" }
    default:
      return { icon: AlertCircle, color: "text-gray-500", bg: "bg-gray-100", label: status }
  }
}

export function AttendanceClient({
  attendance,
  stats,
  month,
  year,
  summary,
}: AttendanceClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const [activeTab, setActiveTab] = useState("term")

  const navigateMonth = (direction: "prev" | "next") => {
    let newMonth = month
    let newYear = year
    
    if (direction === "prev") {
      newMonth = month === 0 ? 11 : month - 1
      newYear = month === 0 ? year - 1 : year
    } else {
      newMonth = month === 11 ? 0 : month + 1
      newYear = month === 11 ? year + 1 : year
    }
    
    const params = new URLSearchParams()
    if (subdomain) params.set("subdomain", subdomain)
    params.set("month", newMonth.toString())
    params.set("year", newYear.toString())
    router.push(`/student/attendance?${params.toString()}`)
  }

  const handlePeriodChange = (periodId: string) => {
    const params = new URLSearchParams()
    if (subdomain) params.set("subdomain", subdomain)
    params.set("periodId", periodId)
    router.push(`/student/attendance?${params.toString()}`)
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return month === now.getMonth() && year === now.getFullYear()
  }

  const getAttendanceColor = (percent: number) => {
    if (percent >= 90) return "text-green-600"
    if (percent >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground mt-1">
            View your attendance records and statistics.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="neu-flat p-1 rounded-xl">
          <TabsTrigger value="term" className="rounded-lg gap-2">
            <BarChart3 className="h-4 w-4" />
            Term Summary
          </TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-lg gap-2">
            <Calendar className="h-4 w-4" />
            Monthly View
          </TabsTrigger>
        </TabsList>

        {/* Term Summary Tab */}
        <TabsContent value="term" className="mt-6 space-y-6">
          {summary ? (
            <>
              {/* Period Selector & Info */}
              <Card className="neu rounded-2xl border-0">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-xl font-semibold">{summary.className}</h2>
                      <p className="text-sm text-muted-foreground">
                        {new Date(summary.period.startDate).toLocaleDateString()} - {new Date(summary.period.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select value={summary.period.id} onValueChange={handlePeriodChange}>
                        <SelectTrigger className="w-[180px] neu-inset rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {summary.periods.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Attendance Rate Display */}
                  <div className="text-center mb-6">
                    <div className={cn(
                      "text-6xl font-bold mb-2",
                      getAttendanceColor(summary.attendancePercent)
                    )}>
                      {summary.attendancePercent}%
                    </div>
                    <p className="text-muted-foreground">Your Attendance Rate</p>
                    <div className="mt-4 max-w-md mx-auto">
                      <Progress 
                        value={summary.attendancePercent} 
                        className="h-3"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {summary.totalMarked} days marked of {summary.period.totalSchoolDays} school days
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="neu rounded-2xl border-0">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{summary.stats.present}</p>
                        <p className="text-xs text-muted-foreground">Present</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="neu rounded-2xl border-0">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <XCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{summary.stats.absent}</p>
                        <p className="text-xs text-muted-foreground">Absent</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="neu rounded-2xl border-0">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-yellow-600">{summary.stats.late}</p>
                        <p className="text-xs text-muted-foreground">Late</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="neu rounded-2xl border-0">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{summary.stats.excused}</p>
                        <p className="text-xs text-muted-foreground">Excused</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Records */}
              {summary.recentRecords.length > 0 && (
                <Card className="neu rounded-2xl border-0">
                  <CardHeader>
                    <CardTitle>Recent Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {summary.recentRecords.map((record) => {
                        const config = getStatusConfig(record.status)
                        return (
                          <div 
                            key={record.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-accent/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("p-1.5 rounded-lg", config.bg)}>
                                <config.icon className={cn("h-4 w-4", config.color)} />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {new Date(record.date).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                                {record.notes && (
                                  <p className="text-xs text-muted-foreground">{record.notes}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className={cn(
                              "gap-1",
                              record.status === "PRESENT" && "border-green-200 text-green-600",
                              record.status === "ABSENT" && "border-red-200 text-red-600",
                              record.status === "LATE" && "border-yellow-200 text-yellow-600",
                              record.status === "EXCUSED" && "border-blue-200 text-blue-600"
                            )}>
                              {config.label}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="neu rounded-2xl border-0">
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-1">No term summary available</h3>
                <p className="text-sm text-muted-foreground">
                  The term attendance summary is not available yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Monthly View Tab */}
        <TabsContent value="monthly" className="mt-6 space-y-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="neu-sm hover:neu rounded-xl"
              onClick={() => navigateMonth("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 py-2 rounded-xl neu-sm min-w-[160px] text-center">
              <span className="font-medium">{MONTHS[month]} {year}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="neu-sm hover:neu rounded-xl"
              onClick={() => navigateMonth("next")}
              disabled={isCurrentMonth()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="neu-sm lg:col-span-1">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full neu flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold">{stats.percentage}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                </div>
              </CardContent>
            </Card>

            <Card className="neu-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.present}</p>
                    <p className="text-sm text-muted-foreground">Present</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="neu-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.absent}</p>
                    <p className="text-sm text-muted-foreground">Absent</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="neu-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.late}</p>
                    <p className="text-sm text-muted-foreground">Late</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="neu-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.excused}</p>
                    <p className="text-sm text-muted-foreground">Excused</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card className="neu-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Attendance Progress</span>
                  <span className="text-sm text-muted-foreground">{stats.total} days recorded</span>
                </div>
                <Progress value={stats.percentage} className="h-4" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className={cn(
                    "font-medium",
                    stats.percentage >= 90 && "text-green-600",
                    stats.percentage >= 75 && stats.percentage < 90 && "text-yellow-600",
                    stats.percentage < 75 && "text-red-600"
                  )}>
                    {stats.percentage >= 90 ? "Excellent!" : stats.percentage >= 75 ? "Good" : "Needs Improvement"}
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Records Table */}
          <Card className="neu-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Attendance Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Marked By</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => {
                      const config = getStatusConfig(record.status)
                      const date = new Date(record.date)
                      
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell>
                            {date.toLocaleDateString("en-US", { weekday: "long" })}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "gap-1",
                                record.status === "PRESENT" && "border-green-200 text-green-600",
                                record.status === "ABSENT" && "border-red-200 text-red-600",
                                record.status === "LATE" && "border-yellow-200 text-yellow-600",
                                record.status === "EXCUSED" && "border-blue-200 text-blue-600"
                              )}
                            >
                              <config.icon className="h-3 w-3" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.className}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {record.markedBy || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {record.notes || "-"}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-1">No attendance records</h3>
                  <p className="text-sm text-muted-foreground">
                    No attendance has been marked for {MONTHS[month]} {year}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
