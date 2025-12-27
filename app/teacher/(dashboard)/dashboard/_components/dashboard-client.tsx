"use client"

import { 
  BookOpen, 
  Calendar, 
  ClipboardList, 
  MessageSquare, 
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  School,
  FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface DashboardData {
  teacher: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar: string | null
    employeeId: string | null
  }
  stats: {
    subjectsTeaching: number
    classesTeaching: number
    studentsTeaching: number
    pendingSubmissions: number
    unreadMessages: number
  }
  todaySchedule: Array<{
    id: string
    periodName: string
    startTime: string
    endTime: string
    isBreak: boolean
    className: string
    subjectName: string | null
    room: string | null
  }>
  isClassTeacher: boolean
  classTeacherData: {
    className: string
    totalStudents: number
    attendanceMarked: boolean
    presentToday: number
    absentToday: number
  } | null
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const linkPrefix = subdomain ? `?subdomain=${subdomain}` : ""

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold">
            Welcome back, {data.teacher.firstName}!
          </h1>
          {data.teacher.employeeId && (
            <Badge variant="outline" className="text-sm font-mono">
              {data.teacher.employeeId}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your classes today.
        </p>
      </div>

      {/* Class Teacher Alert */}
      {data.isClassTeacher && data.classTeacherData && (
        <div className={cn(
          "p-4 rounded-2xl border",
          data.classTeacherData.attendanceMarked 
            ? "bg-emerald-500/10 border-emerald-500/20" 
            : "bg-amber-500/10 border-amber-500/20"
        )}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                data.classTeacherData.attendanceMarked ? "bg-emerald-500/20" : "bg-amber-500/20"
              )}>
                {data.classTeacherData.attendanceMarked ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div>
                <p className="font-semibold">
                  {data.classTeacherData.className} - Class Teacher
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.classTeacherData.attendanceMarked 
                    ? `Attendance marked: ${data.classTeacherData.presentToday} present, ${data.classTeacherData.absentToday} absent`
                    : "Today's attendance not yet marked"
                  }
                </p>
              </div>
            </div>
            <Link href={`/teacher/my-class/attendance${linkPrefix}`}>
              <Badge 
                variant="secondary" 
                className={cn(
                  "cursor-pointer rounded-lg px-4 py-2",
                  data.classTeacherData.attendanceMarked 
                    ? "bg-emerald-500/20 hover:bg-emerald-500/30" 
                    : "bg-amber-500/20 hover:bg-amber-500/30"
                )}
              >
                {data.classTeacherData.attendanceMarked ? "View Attendance" : "Mark Attendance"}
              </Badge>
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="neu rounded-2xl border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subjects Teaching
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.stats.subjectsTeaching}</div>
            <p className="text-xs text-muted-foreground">
              across {data.stats.classesTeaching} classes
            </p>
          </CardContent>
        </Card>

        <Card className="neu rounded-2xl border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.stats.studentsTeaching}</div>
            <p className="text-xs text-muted-foreground">
              total students you teach
            </p>
          </CardContent>
        </Card>

        <Card className="neu rounded-2xl border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Submissions
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              assignments to grade
            </p>
          </CardContent>
        </Card>

        <Card className="neu rounded-2xl border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unread Messages
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.stats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">
              new messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Today's Schedule</h2>
        </div>
        
        {data.todaySchedule.length === 0 ? (
          <Card className="neu-inset rounded-2xl border-0">
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No classes scheduled for today</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {data.todaySchedule.map((slot, index) => (
              <Card key={slot.id} className={cn(
                "rounded-2xl border-0 transition-all",
                slot.isBreak ? "neu-inset opacity-60" : "neu hover:shadow-lg"
              )}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex flex-col items-center justify-center min-w-[80px] text-center">
                    <span className="text-lg font-bold">{slot.startTime}</span>
                    <span className="text-xs text-muted-foreground">{slot.endTime}</span>
                  </div>
                  
                  <div className="h-12 w-px bg-border" />
                  
                  <div className="flex-1">
                    {slot.isBreak ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">{slot.periodName}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{slot.subjectName || "Free Period"}</span>
                          <Badge variant="secondary" className="rounded-lg">
                            {slot.className}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{slot.periodName}</span>
                          {slot.room && (
                            <>
                              <span>•</span>
                              <span>Room {slot.room}</span>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href={`/teacher/my-subjects${linkPrefix}`}>
            <Card className="neu rounded-2xl border-0 hover:shadow-lg transition-all cursor-pointer group">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex group-hover:scale-105 transition-transform">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">My Subjects</p>
                  <p className="text-sm text-muted-foreground">View all subjects</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/teacher/assignments${linkPrefix}`}>
            <Card className="neu rounded-2xl border-0 hover:shadow-lg transition-all cursor-pointer group">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex group-hover:scale-105 transition-transform">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Assignments</p>
                  <p className="text-sm text-muted-foreground">Manage assignments</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {data.isClassTeacher && (
            <>
              <Link href={`/teacher/my-class/students${linkPrefix}`}>
                <Card className="neu rounded-2xl border-0 hover:shadow-lg transition-all cursor-pointer group">
                  <CardContent className="flex items-center gap-4 py-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex group-hover:scale-105 transition-transform">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">Class Students</p>
                      <p className="text-sm text-muted-foreground">View your class</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href={`/teacher/my-class/grades${linkPrefix}`}>
                <Card className="neu rounded-2xl border-0 hover:shadow-lg transition-all cursor-pointer group">
                  <CardContent className="flex items-center gap-4 py-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex group-hover:scale-105 transition-transform">
                      <ClipboardList className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">Class Grades</p>
                      <p className="text-sm text-muted-foreground">View all grades</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
