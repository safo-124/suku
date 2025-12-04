"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  BookOpen,
  Users,
  Pencil,
  Key,
  UserX,
  UserCheck,
  Award,
  Briefcase,
  Loader2,
  Plus,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SubjectAssignmentDialog } from "./subject-assignment-dialog"
import { ClassTeacherDialog } from "./class-teacher-dialog"
import {
  unassignSubjectFromTeacher,
  removeClassTeacher,
  toggleTeacherStatus,
  resetTeacherPassword,
} from "../../_actions/teacher-actions"
import { TeacherForm } from "../../_components/teacher-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Copy, Check } from "lucide-react"

interface Teacher {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatar: string | null
  isActive: boolean
  createdAt: Date
  teacherProfile: {
    id: string
    employeeId: string | null
    qualification: string | null
    specialization: string | null
    joinDate: Date | null
  } | null
  classTeacherOf: {
    id: string
    name: string
    section: string | null
    _count?: { students: number }
  }[]
  classSubjects: {
    id: string
    class: { id: string; name: string; section: string | null }
    subject: { id: string; name: string; code: string | null }
  }[]
}

interface ClassSubject {
  id: string
  class: { id: string; name: string; section: string | null }
  subject: { id: string; name: string; code: string | null }
  teacher: { id: string; firstName: string; lastName: string } | null
}

interface AvailableClass {
  id: string
  name: string
  section: string | null
  classTeacher: { id: string; firstName: string; lastName: string } | null
  gradeDefinition: { name: string } | null
  _count: { students: number }
}

interface TeacherDetailClientProps {
  teacher: Teacher
  availableClassSubjects: ClassSubject[]
  availableClasses: AvailableClass[]
}

export function TeacherDetailClient({
  teacher,
  availableClassSubjects,
  availableClasses,
}: TeacherDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showEditForm, setShowEditForm] = useState(false)
  const [showSubjectDialog, setShowSubjectDialog] = useState(false)
  const [showClassTeacherDialog, setShowClassTeacherDialog] = useState(false)
  const [resetPasswordResult, setResetPasswordResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleUnassignSubject = (classSubjectId: string, subjectName: string) => {
    startTransition(async () => {
      const result = await unassignSubjectFromTeacher(classSubjectId)
      if (result.success) {
        toast.success(`Removed ${subjectName} from teacher`)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to remove subject")
      }
    })
  }

  const handleRemoveClassTeacher = (classId: string, className: string) => {
    startTransition(async () => {
      const result = await removeClassTeacher(classId)
      if (result.success) {
        toast.success(`Removed as class teacher of ${className}`)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to remove class teacher")
      }
    })
  }

  const handleToggleStatus = () => {
    startTransition(async () => {
      const result = await toggleTeacherStatus(teacher.id, !teacher.isActive)
      if (result.success) {
        toast.success(teacher.isActive ? "Teacher deactivated" : "Teacher activated")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update status")
      }
    })
  }

  const handleResetPassword = () => {
    startTransition(async () => {
      const result = await resetTeacherPassword(teacher.id)
      if (result.success && result.tempPassword) {
        setResetPasswordResult(result.tempPassword)
      } else {
        toast.error(result.error || "Failed to reset password")
      }
    })
  }

  const handleCopyPassword = async () => {
    if (resetPasswordResult) {
      await navigator.clipboard.writeText(resetPasswordResult)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Filter out already assigned subjects
  const unassignedClassSubjects = availableClassSubjects.filter(
    (cs) => !cs.teacher || cs.teacher.id !== teacher.id
  )

  // Filter out classes where teacher is already class teacher
  const availableForClassTeacher = availableClasses.filter(
    (c) => !c.classTeacher || c.classTeacher.id !== teacher.id
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/school/teachers">
            <Button
              variant="ghost"
              size="icon"
              className="neu-sm hover:neu rounded-xl h-10 w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {teacher.firstName} {teacher.lastName}
            </h1>
            <p className="text-muted-foreground">
              {teacher.teacherProfile?.specialization || "Teacher"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetPassword}
            disabled={isPending}
            className="rounded-xl neu border-0"
          >
            <Key className="h-4 w-4 mr-2" />
            Reset Password
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={isPending}
            className="rounded-xl neu border-0"
          >
            {teacher.isActive ? (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowEditForm(true)}
            className="rounded-xl neu-convex border-0"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="neu rounded-3xl p-6 space-y-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg mb-4">
                <AvatarImage src={teacher.avatar || ""} />
                <AvatarFallback className="bg-foreground text-background text-2xl font-bold">
                  {teacher.firstName[0]}{teacher.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">
                {teacher.firstName} {teacher.lastName}
              </h2>
              <Badge
                variant={teacher.isActive ? "default" : "destructive"}
                className="mt-2"
              >
                {teacher.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 rounded-lg neu-inset">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="truncate">{teacher.email}</p>
                </div>
              </div>

              {teacher.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg neu-inset">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Phone</p>
                    <p>{teacher.phone}</p>
                  </div>
                </div>
              )}

              {teacher.teacherProfile?.employeeId && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg neu-inset">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Employee ID</p>
                    <code className="text-sm">{teacher.teacherProfile.employeeId}</code>
                  </div>
                </div>
              )}

              {teacher.teacherProfile?.qualification && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg neu-inset">
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Qualification</p>
                    <p>{teacher.teacherProfile.qualification}</p>
                  </div>
                </div>
              )}

              {teacher.teacherProfile?.joinDate && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg neu-inset">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Join Date</p>
                    <p>{new Date(teacher.teacherProfile.joinDate).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/30">
              <div className="neu-inset rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{teacher.classSubjects.length}</p>
                <p className="text-xs text-muted-foreground">Subjects</p>
              </div>
              <div className="neu-inset rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{teacher.classTeacherOf.length}</p>
                <p className="text-xs text-muted-foreground">Classes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="subjects" className="space-y-4">
            <TabsList className="neu-inset p-1 rounded-xl">
              <TabsTrigger value="subjects" className="rounded-lg data-[state=active]:neu">
                <BookOpen className="h-4 w-4 mr-2" />
                Subjects ({teacher.classSubjects.length})
              </TabsTrigger>
              <TabsTrigger value="classes" className="rounded-lg data-[state=active]:neu">
                <GraduationCap className="h-4 w-4 mr-2" />
                Class Teacher ({teacher.classTeacherOf.length})
              </TabsTrigger>
            </TabsList>

            {/* Subjects Tab */}
            <TabsContent value="subjects" className="neu rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Assigned Subjects</h3>
                <Button
                  size="sm"
                  onClick={() => setShowSubjectDialog(true)}
                  className="rounded-xl neu-convex border-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Subject
                </Button>
              </div>

              {teacher.classSubjects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-4 rounded-2xl neu-inset inline-block mb-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    No subjects assigned yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Assign Subject" to add subjects to this teacher
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teacher.classSubjects.map((cs) => (
                    <div
                      key={cs.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg neu-inset">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{cs.subject.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {cs.class.name}
                            {cs.class.section && ` - Section ${cs.class.section}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnassignSubject(cs.id, cs.subject.name)}
                        disabled={isPending}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Class Teacher Tab */}
            <TabsContent value="classes" className="neu rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Class Teacher Of</h3>
                <Button
                  size="sm"
                  onClick={() => setShowClassTeacherDialog(true)}
                  className="rounded-xl neu-convex border-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Assign as Class Teacher
                </Button>
              </div>

              {teacher.classTeacherOf.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-4 rounded-2xl neu-inset inline-block mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Not assigned as class teacher
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Assign as Class Teacher" to make this teacher a class teacher
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teacher.classTeacherOf.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg neu-inset">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {cls.name}
                            {cls.section && ` - Section ${cls.section}`}
                          </p>
                          {cls._count?.students !== undefined && (
                            <p className="text-sm text-muted-foreground">
                              {cls._count.students} students
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveClassTeacher(cls.id, cls.name)}
                        disabled={isPending}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Form Dialog */}
      <TeacherForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        teacher={teacher}
      />

      {/* Subject Assignment Dialog */}
      <SubjectAssignmentDialog
        open={showSubjectDialog}
        onOpenChange={setShowSubjectDialog}
        teacherId={teacher.id}
        teacherName={`${teacher.firstName} ${teacher.lastName}`}
        availableClassSubjects={unassignedClassSubjects}
      />

      {/* Class Teacher Dialog */}
      <ClassTeacherDialog
        open={showClassTeacherDialog}
        onOpenChange={setShowClassTeacherDialog}
        teacherId={teacher.id}
        teacherName={`${teacher.firstName} ${teacher.lastName}`}
        availableClasses={availableForClassTeacher}
      />

      {/* Password Reset Result Dialog */}
      <Dialog
        open={!!resetPasswordResult}
        onOpenChange={() => setResetPasswordResult(null)}
      >
        <DialogContent className="neu rounded-3xl border-0 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Password Reset</DialogTitle>
            <DialogDescription>
              The password has been reset. Share these new credentials:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-medium">{teacher.email}</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-muted-foreground mb-1">New Password</p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-lg">{resetPasswordResult}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={handleCopyPassword}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              ⚠️ This password will only be shown once. Make sure to save it.
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setResetPasswordResult(null)}
              className="rounded-xl"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
