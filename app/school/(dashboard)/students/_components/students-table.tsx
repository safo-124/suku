"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  GraduationCap,
  MoreHorizontal,
  Pencil,
  Eye,
  Trash2,
  Key,
  UserX,
  UserCheck,
  Mail,
  Phone,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Gender } from "@/app/generated/prisma/client"
import { 
  deleteStudent, 
  toggleStudentStatus, 
  resetStudentPassword 
} from "../_actions/student-actions"

type Student = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatar: string | null
  isActive: boolean
  createdAt: Date
  studentProfile: {
    id: string
    studentId: string | null
    dateOfBirth: Date | null
    gender: Gender | null
    bloodGroup: string | null
    address: string | null
    classId: string | null
    class: {
      id: string
      name: string
      gradeLevel: number
    } | null
  } | null
}

interface StudentsTableProps {
  students: Student[]
  onEdit: (student: Student) => void
}

export function StudentsTable({ students, onEdit }: StudentsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  // Dialog states
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toggleId, setToggleId] = useState<{ id: string; isActive: boolean } | null>(null)
  const [resetPasswordResult, setResetPasswordResult] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const subdomain = searchParams.get("subdomain")
  const getLink = (path: string) => subdomain ? `${path}?subdomain=${subdomain}` : path

  const handleDelete = async () => {
    if (!deleteId) return
    
    startTransition(async () => {
      const result = await deleteStudent(deleteId)
      if (result.success) {
        router.refresh()
      }
      setDeleteId(null)
    })
  }

  const handleToggleStatus = async () => {
    if (!toggleId) return
    
    startTransition(async () => {
      const result = await toggleStudentStatus(toggleId.id, !toggleId.isActive)
      if (result.success) {
        router.refresh()
      }
      setToggleId(null)
    })
  }

  const handleResetPassword = async (studentId: string, email: string) => {
    startTransition(async () => {
      const result = await resetStudentPassword(studentId)
      if (result.success && result.tempPassword) {
        setResetPasswordResult({ email, password: result.tempPassword })
      }
    })
  }

  const handleCopyPassword = async () => {
    if (resetPasswordResult) {
      await navigator.clipboard.writeText(resetPasswordResult.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (students.length === 0) {
    return (
      <div className="neu rounded-3xl p-16">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="p-8 rounded-3xl neu-inset mb-8">
            <GraduationCap className="h-16 w-16 text-muted-foreground/40" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">No students yet</h3>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Get started by adding your first student. Students can log in to their
            portal and access their classes, assignments, and grades.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="neu rounded-3xl overflow-hidden">
        {/* Table Header - Desktop */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-muted/30 text-sm font-medium text-muted-foreground border-b border-border/30">
          <div className="col-span-4">Student</div>
          <div className="col-span-2">Class</div>
          <div className="col-span-2">Admission #</div>
          <div className="col-span-2">Contact</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border/30">
          {students.map((student) => (
            <div
              key={student.id}
              className="group grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 sm:px-8 py-5 items-center hover:bg-muted/20 transition-colors"
            >
              {/* Student Info */}
              <div className="lg:col-span-4 flex items-center gap-4">
                <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                  <AvatarImage src={student.avatar || ""} />
                  <AvatarFallback className="bg-foreground text-background font-semibold">
                    {student.firstName[0]}{student.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {student.email}
                  </p>
                </div>
              </div>

              {/* Class - Mobile Label */}
              <div className="lg:hidden flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">Class:</span>
                <span className="text-sm">
                  {student.studentProfile?.class?.name || "Not assigned"}
                </span>
              </div>

              {/* Class - Desktop */}
              <div className="hidden lg:block lg:col-span-2">
                {student.studentProfile?.class ? (
                  <span className="inline-flex px-3 py-1.5 rounded-xl text-xs font-medium border bg-muted/50">
                    {student.studentProfile.class.name}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Not assigned</span>
                )}
              </div>

              {/* Admission Number */}
              <div className="lg:col-span-2 flex items-center gap-2 lg:block">
                <span className="lg:hidden text-xs text-muted-foreground w-20">Adm #:</span>
                <code className="text-sm px-2 py-1 rounded-lg bg-muted/50">
                  {student.studentProfile?.studentId || "-"}
                </code>
              </div>

              {/* Contact */}
              <div className="lg:col-span-2 flex items-center gap-2 lg:block">
                <span className="lg:hidden text-xs text-muted-foreground w-20">Contact:</span>
                <div className="flex items-center gap-2">
                  {student.phone && (
                    <a
                      href={`tel:${student.phone}`}
                      className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                      title={student.phone}
                    >
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  <a
                    href={`mailto:${student.email}`}
                    className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                    title={student.email}
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </a>
                </div>
              </div>

              {/* Status */}
              <div className="lg:col-span-1 flex items-center gap-2 lg:justify-center">
                <span className="lg:hidden text-xs text-muted-foreground w-20">Status:</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium",
                    student.isActive
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-red-500/10 text-red-700"
                  )}
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      student.isActive ? "bg-emerald-500" : "bg-red-500"
                    )}
                  />
                  {student.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Actions */}
              <div className="lg:col-span-1 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="neu-sm hover:neu rounded-xl h-10 w-10"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-card w-48 p-2">
                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider px-2">
                      Actions
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50" />
                    
                    <DropdownMenuItem
                      className="rounded-xl py-2.5 cursor-pointer"
                      asChild
                    >
                      <Link href={getLink(`/school/students/${student.id}`)}>
                        <Eye className="mr-3 h-4 w-4" />
                        View Profile
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      className="rounded-xl py-2.5 cursor-pointer"
                      onClick={() => onEdit(student)}
                    >
                      <Pencil className="mr-3 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      className="rounded-xl py-2.5 cursor-pointer"
                      onClick={() => handleResetPassword(student.id, student.email)}
                    >
                      <Key className="mr-3 h-4 w-4" />
                      Reset Password
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      className="rounded-xl py-2.5 cursor-pointer"
                      onClick={() => setToggleId({ id: student.id, isActive: student.isActive })}
                    >
                      {student.isActive ? (
                        <>
                          <UserX className="mr-3 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-3 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="bg-border/50" />
                    
                    <DropdownMenuItem
                      className="rounded-xl py-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                      onClick={() => setDeleteId(student.id)}
                    >
                      <Trash2 className="mr-3 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="neu rounded-3xl border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student? This action cannot be undone.
              All associated data (attendance, grades, etc.) will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Status Confirmation Dialog */}
      <AlertDialog open={!!toggleId} onOpenChange={() => setToggleId(null)}>
        <AlertDialogContent className="neu rounded-3xl border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleId?.isActive ? "Deactivate" : "Activate"} Student
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleId?.isActive
                ? "This student will no longer be able to log in or access the portal."
                : "This student will be able to log in and access the portal again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              disabled={isPending}
              className="rounded-xl"
            >
              {isPending ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              <p className="font-medium">{resetPasswordResult?.email}</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-muted-foreground mb-1">New Password</p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-lg">{resetPasswordResult?.password}</code>
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
    </>
  )
}
