"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Users,
  ClipboardList,
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Briefcase,
  Heart,
  Hash,
  School,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Weight,
  Percent,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface Parent {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  relationship: string | null
  occupation: string | null
}

interface Enrollment {
  id: string
  className: string
  academicYear: string
  status: string
  enrolledAt: Date
}

interface StudentData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  avatar: string | null
  isActive: boolean
  createdAt: Date
  profile: {
    id: string
    studentId: string | null
    dateOfBirth: Date | null
    gender: string | null
    bloodGroup: string | null
    address: string | null
    admissionDate: Date | null
    repeatCount: number
  }
  class: {
    id: string
    name: string
    section: string | null
    gradeDefinition: { name: string; shortName: string } | null
    schoolLevel: { name: string; shortName: string } | null
    classTeacher: string | null
  } | null
  parents: Parent[]
  enrollments: Enrollment[]
}

interface AttendanceStats {
  total: number
  present: number
  absent: number
  late: number
  excused: number
}

interface RecentAttendance {
  date: Date
  status: string
  notes: string | null
}

interface AttendanceData {
  academicYear: string
  stats: AttendanceStats
  attendanceRate: number
  recentAttendance: RecentAttendance[]
}

interface Grade {
  id: string
  classSubjectId: string
  subjectName: string
  subjectCode: string | null
  teacherName: string | null
  examType: string
  examTypeLabel: string
  score: number
  maxScore: number
  percentage: number
  grade: string | null
  remarks: string | null
  weight: number
}

interface ActiveWeight {
  examType: string
  examTypeLabel: string
  weight: number
}

interface SubjectSummary {
  classSubjectId: string
  subjectName: string
  subjectCode: string | null
  teacherName: string | null
  examResults: Grade[]
  activeWeights: ActiveWeight[]
  weightedScore: number | null
  grade: string | null
  completedWeight: number
}

interface ReportCard {
  totalScore: number | null
  averageScore: number | null
  position: number | null
  passStatus: string | null
  attendancePercentage: number | null
}

interface GradesData {
  periods: { id: string; name: string }[]
  selectedPeriodId: string
  grades: Grade[]
  subjectSummaries: SubjectSummary[]
  reportCard: ReportCard | null
}

interface ProfileClientProps {
  student: StudentData
  attendance: AttendanceData | null
  grades: GradesData | null
}

export function ProfileClient({ student, attendance, grades }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase()
  
  const toggleSubjectExpand = (classSubjectId: string) => {
    setExpandedSubjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(classSubjectId)) {
        newSet.delete(classSubjectId)
      } else {
        newSet.add(classSubjectId)
      }
      return newSet
    })
  }
  
  const getGradeColor = (grade: string | null) => {
    switch (grade) {
      case "A": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "B": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "C": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "D": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
      case "E": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "F": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default: return "bg-gray-100 text-gray-800"
    }
  }
  
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "ABSENT":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "LATE":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "EXCUSED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getEnrollmentStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "PROMOTED":
        return "bg-blue-100 text-blue-800"
      case "GRADUATED":
        return "bg-purple-100 text-purple-800"
      case "WITHDRAWN":
        return "bg-red-100 text-red-800"
      case "REPEATED":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/school/students">
        <Button variant="ghost" className="hover:bg-accent">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Students
        </Button>
      </Link>

      {/* Profile Header */}
      <div className="neu-flat rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
              <AvatarImage src={student.avatar || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">
                {student.firstName} {student.lastName}
              </h1>
              <Badge className={student.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {student.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {student.profile.studentId && (
                <div className="flex items-center gap-1.5">
                  <Hash className="h-4 w-4" />
                  <span>{student.profile.studentId}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                <span>{student.email}</span>
              </div>
              {student.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  <span>{student.phone}</span>
                </div>
              )}
            </div>

            {student.class && (
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="font-medium">{student.class.name}</span>
                  {student.class.schoolLevel && (
                    <span className="text-muted-foreground"> • {student.class.schoolLevel.name}</span>
                  )}
                  {student.class.classTeacher && (
                    <span className="text-muted-foreground text-sm block">
                      Class Teacher: {student.class.classTeacher}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {attendance && (
            <div className="flex-shrink-0 grid grid-cols-2 gap-3">
              <div className="neu-inset rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{attendance.attendanceRate}%</p>
                <p className="text-xs text-muted-foreground">Attendance</p>
              </div>
              {grades?.reportCard?.position && (
                <div className="neu-inset rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">#{grades.reportCard.position}</p>
                  <p className="text-xs text-muted-foreground">Position</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="neu-flat rounded-xl p-1">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:neu-inset">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:neu-inset">
            <ClipboardList className="h-4 w-4 mr-2" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="grades" className="rounded-lg data-[state=active]:neu-inset">
            <Award className="h-4 w-4 mr-2" />
            Grades
          </TabsTrigger>
          <TabsTrigger value="parents" className="rounded-lg data-[state=active]:neu-inset">
            <Users className="h-4 w-4 mr-2" />
            Parents
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="neu-flat rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span className="font-medium">{formatDate(student.profile.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="font-medium">{student.profile.gender || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blood Group</span>
                  <span className="font-medium">{student.profile.bloodGroup || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admission Date</span>
                  <span className="font-medium">{formatDate(student.profile.admissionDate)}</span>
                </div>
                {student.profile.address && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Address</span>
                    <span className="font-medium text-sm">{student.profile.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Academic Information */}
            <div className="neu-flat rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <School className="h-5 w-5" />
                Academic Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Class</span>
                  <span className="font-medium">{student.class?.name || "Not Assigned"}</span>
                </div>
                {student.class?.schoolLevel && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-medium">{student.class.schoolLevel.name}</span>
                  </div>
                )}
                {student.class?.classTeacher && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Class Teacher</span>
                    <span className="font-medium">{student.class.classTeacher}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Repeat Count</span>
                  <span className="font-medium">{student.profile.repeatCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Created</span>
                  <span className="font-medium">{formatDate(student.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enrollment History */}
          {student.enrollments.length > 0 && (
            <div className="neu-flat rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Enrollment History
              </h3>
              <div className="space-y-3">
                {student.enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-accent/50"
                  >
                    <div>
                      <p className="font-medium">{enrollment.className}</p>
                      <p className="text-sm text-muted-foreground">{enrollment.academicYear}</p>
                    </div>
                    <Badge className={getEnrollmentStatusColor(enrollment.status)}>
                      {enrollment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6 mt-6">
          {attendance ? (
            <>
              {/* Attendance Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="neu-flat rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{attendance.stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Days</p>
                </div>
                <div className="neu-flat rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{attendance.stats.present}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div className="neu-flat rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{attendance.stats.absent}</p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
                <div className="neu-flat rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{attendance.stats.late}</p>
                  <p className="text-xs text-muted-foreground">Late</p>
                </div>
                <div className="neu-flat rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{attendance.stats.excused}</p>
                  <p className="text-xs text-muted-foreground">Excused</p>
                </div>
              </div>

              {/* Attendance Rate */}
              <div className="neu-flat rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Attendance Rate - {attendance.academicYear}</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        attendance.attendanceRate >= 90 ? "bg-green-500" :
                        attendance.attendanceRate >= 75 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${attendance.attendanceRate}%` }}
                    />
                  </div>
                  <span className="font-bold text-lg">{attendance.attendanceRate}%</span>
                </div>
              </div>

              {/* Recent Attendance */}
              <div className="neu-flat rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Recent Attendance (Last 30 Days)</h3>
                {attendance.recentAttendance.length > 0 ? (
                  <div className="space-y-2">
                    {attendance.recentAttendance.slice(0, 10).map((record, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-accent/50"
                      >
                        <span className="font-medium">
                          {new Date(record.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          {record.notes && (
                            <span className="text-sm text-muted-foreground">{record.notes}</span>
                          )}
                          <Badge className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No attendance records in the last 30 days
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="neu-flat rounded-2xl p-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold">No Attendance Data</h3>
              <p className="text-muted-foreground">
                No attendance records found for this student.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-6 mt-6">
          {grades && grades.subjectSummaries && grades.subjectSummaries.length > 0 ? (
            <>
              {/* Report Card Summary */}
              {grades.reportCard && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {grades.reportCard.averageScore !== null && (
                    <div className="neu-flat rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {grades.reportCard.averageScore.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Average Score</p>
                    </div>
                  )}
                  {grades.reportCard.position !== null && (
                    <div className="neu-flat rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        #{grades.reportCard.position}
                      </p>
                      <p className="text-xs text-muted-foreground">Class Position</p>
                    </div>
                  )}
                  {grades.reportCard.passStatus && (
                    <div className="neu-flat rounded-xl p-4 text-center">
                      <Badge className={
                        grades.reportCard.passStatus === "PASS" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }>
                        {grades.reportCard.passStatus}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Status</p>
                    </div>
                  )}
                  {grades.reportCard.attendancePercentage !== null && (
                    <div className="neu-flat rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {grades.reportCard.attendancePercentage.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Attendance</p>
                    </div>
                  )}
                </div>
              )}

              {/* Subject Summaries with Expandable Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Subject Breakdown</h3>
                  <Badge variant="outline" className="text-xs">
                    {grades.subjectSummaries.length} Subjects
                  </Badge>
                </div>

                {grades.subjectSummaries.map((subject) => (
                  <div
                    key={subject.classSubjectId}
                    className="neu-flat rounded-2xl overflow-hidden"
                  >
                    {/* Subject Header - Clickable */}
                    <button
                      onClick={() => toggleSubjectExpand(subject.classSubjectId)}
                      className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold">{subject.subjectName}</h4>
                          {subject.teacherName && (
                            <p className="text-sm text-muted-foreground">
                              Teacher: {subject.teacherName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {subject.weightedScore !== null ? (
                            <>
                              <p className="text-xl font-bold">{subject.weightedScore}%</p>
                              <p className="text-xs text-muted-foreground">Weighted Average</p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">No score</p>
                          )}
                        </div>
                        {subject.grade && (
                          <Badge className={cn("text-sm", getGradeColor(subject.grade))}>
                            {subject.grade}
                          </Badge>
                        )}
                        {expandedSubjects.has(subject.classSubjectId) ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {expandedSubjects.has(subject.classSubjectId) && (
                      <div className="border-t p-4 space-y-4 bg-accent/30">
                        {/* Grade Weights */}
                        {subject.activeWeights.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <Weight className="h-4 w-4" />
                              Grade Weight Configuration
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {subject.activeWeights.map((w) => (
                                <Badge
                                  key={w.examType}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {w.examTypeLabel}: {w.weight}%
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Percent className="h-3 w-3" />
                              Weight completed: {subject.completedWeight}% of 100%
                            </div>
                          </div>
                        )}

                        {/* Exam Results */}
                        {subject.examResults.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">
                              Assessment Results
                            </div>
                            <div className="space-y-2">
                              {subject.examResults.map((result) => (
                                <div
                                  key={result.id}
                                  className="bg-background rounded-xl p-3 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        {result.examTypeLabel}
                                      </Badge>
                                      {result.weight > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                          ({result.weight}% weight)
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <p className="font-bold">
                                          {result.score}/{result.maxScore}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {result.percentage}%
                                        </p>
                                      </div>
                                      {result.grade && (
                                        <Badge className={cn("text-xs", getGradeColor(result.grade))}>
                                          {result.grade}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Teacher Comments */}
                                  {result.remarks && (
                                    <div className="flex items-start gap-2 pt-2 border-t mt-2">
                                      <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                      <p className="text-sm text-muted-foreground italic">
                                        &ldquo;{result.remarks}&rdquo;
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="neu-flat rounded-2xl p-12 text-center">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold">No Grades Available</h3>
              <p className="text-muted-foreground">
                No grade records found for this student.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Parents Tab */}
        <TabsContent value="parents" className="space-y-6 mt-6">
          {student.parents.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {student.parents.map((parent) => (
                <div key={parent.id} className="neu-flat rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {parent.firstName[0]}{parent.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="font-semibold">
                          {parent.firstName} {parent.lastName}
                        </h4>
                        {parent.relationship && (
                          <Badge variant="secondary" className="mt-1">
                            {parent.relationship}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{parent.email}</span>
                        </div>
                        {parent.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{parent.phone}</span>
                          </div>
                        )}
                        {parent.occupation && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Briefcase className="h-4 w-4" />
                            <span>{parent.occupation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="neu-flat rounded-2xl p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold">No Parents/Guardians</h3>
              <p className="text-muted-foreground">
                No parent or guardian information has been added for this student.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
