"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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
}: AttendanceClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")

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

  const isCurrentMonth = () => {
    const now = new Date()
    return month === now.getMonth() && year === now.getFullYear()
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
        <div className="flex items-center gap-2">
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
    </div>
  )
}
