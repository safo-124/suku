"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  GraduationCap,
  MapPin,
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
import { cn } from "@/lib/utils"
import { deleteClass } from "../_actions/class-actions"

export type ClassWithDetails = {
  id: string
  name: string
  gradeLevel: number
  section: string | null
  capacity: number | null
  roomNumber: string | null
  createdAt: Date
  academicYearId: string
  classTeacherId: string | null
  classTeacher: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  academicYear: {
    name: string
  } | null
  _count: {
    students: number
    classSubjects: number
  }
}

interface ClassesTableProps {
  classes: ClassWithDetails[]
  onEdit: (classData: ClassWithDetails) => void
}

export function ClassesTable({ classes, onEdit }: ClassesTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteId) return
    
    startTransition(async () => {
      const result = await deleteClass(deleteId)
      if (result.success) {
        router.refresh()
        setDeleteId(null)
      } else {
        setDeleteError(result.error || "Failed to delete")
      }
    })
  }

  if (classes.length === 0) {
    return (
      <div className="neu rounded-3xl p-16">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="p-8 rounded-3xl neu-inset mb-8">
            <BookOpen className="h-16 w-16 text-muted-foreground/40" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">No classes yet</h3>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Get started by creating your first class. You can then assign
            students, teachers, and subjects to each class.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Grid of class cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="group neu rounded-2xl p-6 hover:neu-sm transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex group-hover:neu-inset transition-all duration-300">
                  <span className="text-lg font-bold">{cls.gradeLevel}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{cls.name}</h3>
                  {cls.section && (
                    <p className="text-sm text-muted-foreground">Section {cls.section}</p>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="neu-sm hover:neu rounded-xl h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card w-44 p-2">
                  <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider px-2">
                    Actions
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem
                    className="rounded-xl py-2.5 cursor-pointer"
                    onClick={() => onEdit(cls)}
                  >
                    <Pencil className="mr-3 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-xl py-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => {
                      setDeleteError(null)
                      setDeleteId(cls.id)
                    }}
                  >
                    <Trash2 className="mr-3 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold">{cls._count.students}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold">{cls._count.classSubjects}</p>
                  <p className="text-xs text-muted-foreground">Subjects</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              {cls.classTeacher && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Teacher:</span>
                  <span className="font-medium">
                    {cls.classTeacher.firstName} {cls.classTeacher.lastName}
                  </span>
                </div>
              )}
              {cls.roomNumber && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Room:</span>
                  <span>{cls.roomNumber}</span>
                </div>
              )}
              {cls.capacity && (
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-full h-2 rounded-full bg-muted/50 overflow-hidden"
                    )}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        cls._count.students / cls.capacity > 0.9
                          ? "bg-red-500"
                          : cls._count.students / cls.capacity > 0.7
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      )}
                      style={{
                        width: `${Math.min((cls._count.students / cls.capacity) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {cls._count.students}/{cls.capacity}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="neu rounded-3xl border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError ? (
                <span className="text-red-500">{deleteError}</span>
              ) : (
                "Are you sure you want to delete this class? This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="rounded-xl" 
              disabled={isPending}
              onClick={() => setDeleteError(null)}
            >
              Cancel
            </AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
