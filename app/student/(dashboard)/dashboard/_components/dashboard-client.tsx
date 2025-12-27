"use client"

import { 
  BookOpen, 
  Calendar, 
  ClipboardCheck, 
  MessageSquare, 
  Bell, 
  Clock,
  TrendingUp,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface DashboardData {
  student: {
    id: string
    firstName: string
    lastName: string
    email: string
    studentId: string | null
    avatar: string | null
  }
  class: {
    id: string
    name: string
    level: string | null
    academicYear: string | null
    classTeacher: string | null
  } | null
  subjects: Array<{
    id: string
    name: string
    code: string | null
    teacher: string | null
  }>
  attendanceStats: {
    total: number
    present: number
    absent: number
    late: number
    excused: number
  }
  upcomingAssignments: Array<{
    id: string
    title: string
    subject: string
    dueDate: Date | null
    type: string
  }>
  unreadNotifications: number
  unreadMessages: number
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const attendancePercentage = data.attendanceStats.total > 0
    ? Math.round(((data.attendanceStats.present + data.attendanceStats.late) / data.attendanceStats.total) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {data.student.firstName}! 👋
          </h1>
          {data.student.studentId && (
            <Badge variant="outline" className="text-sm font-mono">
              {data.student.studentId}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your studies today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="neu-sm hover:neu transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class</CardTitle>
            <div className="h-9 w-9 rounded-xl neu flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.class?.name || "Not assigned"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.class?.level || ""}
              {data.class?.level && data.class?.academicYear && " • "}
              {data.class?.academicYear || ""}
            </p>
          </CardContent>
        </Card>

        <Card className="neu-sm hover:neu transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <div className="h-9 w-9 rounded-xl neu flex items-center justify-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.subjects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Enrolled subjects this term
            </p>
          </CardContent>
        </Card>

        <Card className="neu-sm hover:neu transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <div className="h-9 w-9 rounded-xl neu flex items-center justify-center">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancePercentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              This month&apos;s attendance rate
            </p>
          </CardContent>
        </Card>

        <Card className="neu-sm hover:neu transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <div className="h-9 w-9 rounded-xl neu flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.unreadMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unread messages
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Class Info */}
        <Card className="neu-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Class Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.class ? (
              <>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Class Name</span>
                  <span className="font-medium">{data.class.name}</span>
                </div>
                {data.class.level && (
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-medium">{data.class.level}</span>
                  </div>
                )}
                {data.class.academicYear && (
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-muted-foreground">Academic Year</span>
                    <span className="font-medium">{data.class.academicYear}</span>
                  </div>
                )}
                {data.class.classTeacher && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-muted-foreground">Class Teacher</span>
                    <span className="font-medium">{data.class.classTeacher}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>You haven&apos;t been assigned to a class yet.</p>
                <p className="text-sm">Please contact your administrator.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Overview */}
        <Card className="neu-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Attendance This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Attendance Rate</span>
                <span className="font-medium">{attendancePercentage}%</span>
              </div>
              <Progress value={attendancePercentage} className="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl neu-inset-sm">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Present</p>
                  <p className="font-semibold">{data.attendanceStats.present} days</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl neu-inset-sm">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Absent</p>
                  <p className="font-semibold">{data.attendanceStats.absent} days</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl neu-inset-sm">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Late</p>
                  <p className="font-semibold">{data.attendanceStats.late} days</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl neu-inset-sm">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Excused</p>
                  <p className="font-semibold">{data.attendanceStats.excused} days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subjects */}
        <Card className="neu-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.subjects.length > 0 ? (
              <div className="space-y-3">
                {data.subjects.slice(0, 6).map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between p-3 rounded-xl neu-inset-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg neu flex items-center justify-center">
                        <span className="text-sm font-bold">
                          {subject.code || subject.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{subject.name}</p>
                        {subject.teacher && (
                          <p className="text-xs text-muted-foreground">{subject.teacher}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {data.subjects.length > 6 && (
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    +{data.subjects.length - 6} more subjects
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No subjects enrolled yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card className="neu-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingAssignments.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 rounded-xl neu-inset-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{assignment.title}</p>
                      <p className="text-xs text-muted-foreground">{assignment.subject}</p>
                    </div>
                    <div className="text-right ml-3">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          assignment.type === "TEST" && "border-red-200 text-red-600",
                          assignment.type === "QUIZ" && "border-yellow-200 text-yellow-600",
                          assignment.type === "HOMEWORK" && "border-blue-200 text-blue-600"
                        )}
                      >
                        {assignment.type}
                      </Badge>
                      {assignment.dueDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(assignment.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No upcoming assignments.</p>
                <p className="text-sm">You&apos;re all caught up! 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notifications Banner */}
      {data.unreadNotifications > 0 && (
        <Card className="neu-sm border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Bell className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">You have {data.unreadNotifications} unread notification{data.unreadNotifications > 1 ? 's' : ''}</p>
              <p className="text-sm text-muted-foreground">Check your notifications for updates</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
