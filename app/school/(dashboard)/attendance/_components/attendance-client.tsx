"use client"

import { useState, useTransition } from "react"
import { 
  ChevronDown, 
  ChevronRight, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  ChevronLeft,
  Calendar,
  Building2,
  GraduationCap,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getClassAttendance } from "../_actions/attendance-actions"

interface AttendanceStats {
  present: number
  absent: number
  late: number
  excused: number
}

interface ClassData {
  id: string
  name: string
  section: string | null
  schoolLevelId: string | null
  gradeDefinition: { name: string; shortName: string } | null
  classTeacher: string | null
  totalStudents: number
  markedCount: number
  isComplete: boolean
  stats: AttendanceStats
}

interface LevelData {
  id: string
  name: string
  shortName: string
  order: number
  classes: ClassData[]
}

interface OverallStats {
  totalClasses: number
  totalStudents: number
  classesCompleted: number
  present: number
  absent: number
  late: number
  excused: number
}

interface StudentAttendance {
  id: string
  userId: string
  firstName: string
  lastName: string
  studentId: string | null
  avatar: string | null
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | null
  remarks: string | null
  markedBy: string | null
  markedAt: Date | null
}

interface ClassDetails {
  id: string
  name: string
  section: string | null
  gradeDefinition: { name: string; shortName: string } | null
  schoolLevel: { name: string; shortName: string } | null
  classTeacher: string | null
}

interface AttendanceClientProps {
  initialDate: string
  levels: LevelData[]
  overallStats: OverallStats
}

export function AttendanceClient({ initialDate, levels, overallStats }: AttendanceClientProps) {
  const [date, setDate] = useState(initialDate)
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set(levels.map(l => l.id)))
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [classData, setClassData] = useState<{
    class: ClassDetails
    students: StudentAttendance[]
    stats: { total: number; present: number; absent: number; late: number; excused: number; notMarked: number }
  } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const toggleLevel = (levelId: string) => {
    const newExpanded = new Set(expandedLevels)
    if (newExpanded.has(levelId)) {
      newExpanded.delete(levelId)
    } else {
      newExpanded.add(levelId)
    }
    setExpandedLevels(newExpanded)
  }

  const handleDateChange = (direction: "prev" | "next") => {
    const currentDate = new Date(date)
    if (direction === "prev") {
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      currentDate.setDate(currentDate.getDate() + 1)
    }
    setDate(currentDate.toISOString().split("T")[0])
    // Refresh data for new date
    window.location.href = `/school/attendance?date=${currentDate.toISOString().split("T")[0]}`
  }

  const handleClassClick = (classId: string) => {
    setError(null)
    startTransition(async () => {
      const result = await getClassAttendance(classId, date)
      if (result.success && result.class && result.students && result.stats) {
        setSelectedClass(classId)
        setClassData({
          class: result.class,
          students: result.students as StudentAttendance[],
          stats: result.stats,
        })
      } else {
        setError(result.error || "Failed to load class attendance")
      }
    })
  }

  const handleBack = () => {
    setSelectedClass(null)
    setClassData(null)
  }

  const getStatusColor = (status: string | null) => {
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
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "ABSENT":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "LATE":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "EXCUSED":
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-dashed border-gray-400" />
    }
  }

  // Class Detail View
  if (selectedClass && classData) {
    const attendanceRate = classData.stats.total > 0
      ? Math.round(((classData.stats.present + classData.stats.late) / classData.stats.total) * 100)
      : 0

    return (
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Overview
        </Button>

        {/* Class Header */}
        <div className="neu-flat rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 neu-inset rounded-xl">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{classData.class.name}</h2>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  {classData.class.schoolLevel && (
                    <span>{classData.class.schoolLevel.name}</span>
                  )}
                  {classData.class.classTeacher && (
                    <>
                      <span>•</span>
                      <span>Teacher: {classData.class.classTeacher}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn(
                "text-lg px-3 py-1",
                attendanceRate >= 90 ? "bg-green-100 text-green-800" :
                attendanceRate >= 75 ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              )}>
                {attendanceRate}% Attendance
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="neu-flat rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{classData.stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
          <div className="neu-flat rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{classData.stats.present}</p>
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
                <p className="text-2xl font-bold text-red-600">{classData.stats.absent}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{classData.stats.late}</p>
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
                <p className="text-2xl font-bold text-blue-600">{classData.stats.excused}</p>
                <p className="text-xs text-muted-foreground">Excused</p>
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="neu-flat rounded-2xl overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Students ({classData.students.length})</h3>
          </div>
          <div className="divide-y">
            {classData.students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    {student.avatar ? (
                      <img src={student.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-medium">
                        {student.firstName[0]}{student.lastName[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{student.firstName} {student.lastName}</p>
                    {student.studentId && (
                      <p className="text-xs text-muted-foreground">{student.studentId}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {student.markedBy && (
                    <span className="text-xs text-muted-foreground hidden md:block">
                      Marked by {student.markedBy}
                    </span>
                  )}
                  <Badge className={getStatusColor(student.status)}>
                    <span className="flex items-center gap-1.5">
                      {getStatusIcon(student.status)}
                      {student.status || "Not Marked"}
                    </span>
                  </Badge>
                </div>
              </div>
            ))}
            {classData.students.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No students found in this class
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Overview View
  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleDateChange("prev")}
          className="neu-flat hover:neu-inset rounded-xl"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 px-4 py-2 neu-flat rounded-xl">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {new Date(date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleDateChange("next")}
          className="neu-flat hover:neu-inset rounded-xl"
          disabled={date >= new Date().toISOString().split("T")[0]}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="neu-flat rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overallStats.classesCompleted}/{overallStats.totalClasses}</p>
              <p className="text-xs text-muted-foreground">Classes Marked</p>
            </div>
          </div>
        </div>
        <div className="neu-flat rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{overallStats.present}</p>
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
              <p className="text-2xl font-bold text-red-600">{overallStats.absent}</p>
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
              <p className="text-2xl font-bold text-yellow-600">{overallStats.late + overallStats.excused}</p>
              <p className="text-xs text-muted-foreground">Late/Excused</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Levels and Classes */}
      <div className="space-y-4">
        {levels.map((level) => (
          <div key={level.id} className="neu-flat rounded-2xl overflow-hidden">
            {/* Level Header */}
            <button
              onClick={() => toggleLevel(level.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedLevels.has(level.id) ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">{level.name}</span>
                <Badge variant="secondary">{level.classes.length} classes</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {level.classes.reduce((sum, c) => sum + c.totalStudents, 0)} students
                </span>
              </div>
            </button>

            {/* Classes List */}
            {expandedLevels.has(level.id) && (
              <div className="border-t divide-y">
                {level.classes.map((classItem) => {
                  const attendanceRate = classItem.totalStudents > 0
                    ? Math.round(((classItem.stats.present + classItem.stats.late) / classItem.totalStudents) * 100)
                    : 0

                  return (
                    <button
                      key={classItem.id}
                      onClick={() => handleClassClick(classItem.id)}
                      disabled={isPending}
                      className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{classItem.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{classItem.totalStudents} students</span>
                            {classItem.classTeacher && (
                              <>
                                <span>•</span>
                                <span>{classItem.classTeacher}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Mini Stats */}
                        <div className="hidden md:flex items-center gap-2 text-sm">
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {classItem.stats.present}
                          </span>
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-3.5 w-3.5" />
                            {classItem.stats.absent}
                          </span>
                          <span className="flex items-center gap-1 text-yellow-600">
                            <Clock className="h-3.5 w-3.5" />
                            {classItem.stats.late}
                          </span>
                        </div>

                        {/* Status Badge */}
                        {classItem.isComplete ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {attendanceRate}%
                          </Badge>
                        ) : classItem.markedCount > 0 ? (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            {classItem.markedCount}/{classItem.totalStudents} marked
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Not marked
                          </Badge>
                        )}

                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  )
                })}
                {level.classes.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    No classes in this level
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {levels.length === 0 && (
          <div className="neu-flat rounded-2xl p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Classes Found</h3>
            <p className="text-muted-foreground">
              No classes have been set up for the current academic year.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
