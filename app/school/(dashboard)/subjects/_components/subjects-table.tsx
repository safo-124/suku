"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
  Layers,
  GraduationCap,
  CheckCircle2,
  XCircle,
  FileQuestion,
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
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { deleteSubject } from "../_actions/subject-actions"

export interface LevelSubjectInfo {
  id: string
  subjectType: string
  isCompulsory: boolean
  level: {
    id: string
    name: string
    shortName: string
  }
}

export type SubjectWithDetails = {
  id: string
  name: string
  code: string | null
  description: string | null
  isRequiredForPromotion: boolean
  createdAt: Date
  levelSubjects: LevelSubjectInfo[]
  _count: {
    classSubjects: number
    questions: number
  }
}

interface SubjectsTableProps {
  subjects: SubjectWithDetails[]
  onEdit: (subject: SubjectWithDetails) => void
  onManageLevels: (subject: SubjectWithDetails) => void
}

export function SubjectsTable({ subjects, onEdit, onManageLevels }: SubjectsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteId) return
    
    startTransition(async () => {
      const result = await deleteSubject(deleteId)
      if (result.success) {
        router.refresh()
        setDeleteId(null)
      } else {
        setDeleteError(result.error || "Failed to delete")
      }
    })
  }

  if (subjects.length === 0) {
    return (
      <div className="neu rounded-3xl p-16">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="p-8 rounded-3xl neu-inset mb-8">
            <BookOpen className="h-16 w-16 text-muted-foreground/40" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">No subjects yet</h3>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Get started by creating your first subject. You can then assign
            subjects to school levels and classes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      {/* Grid of subject cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="group neu rounded-2xl p-6 hover:neu-sm transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex group-hover:neu-inset transition-all duration-300">
                  <span className="text-sm font-bold">{subject.code || subject.name.substring(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{subject.name}</h3>
                  {subject.code && (
                    <p className="text-sm text-muted-foreground">{subject.code}</p>
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
                <DropdownMenuContent align="end" className="glass-card w-48 p-2">
                  <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider px-2">
                    Actions
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem
                    className="rounded-xl py-2.5 cursor-pointer"
                    onClick={() => onEdit(subject)}
                  >
                    <Pencil className="mr-3 h-4 w-4" />
                    Edit Subject
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-xl py-2.5 cursor-pointer"
                    onClick={() => onManageLevels(subject)}
                  >
                    <Layers className="mr-3 h-4 w-4" />
                    Manage Levels
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem
                    className="rounded-xl py-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => {
                      setDeleteError(null)
                      setDeleteId(subject.id)
                    }}
                  >
                    <Trash2 className="mr-3 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Description */}
            {subject.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {subject.description}
              </p>
            )}

            {/* Level badges */}
            {subject.levelSubjects.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {subject.levelSubjects.map((ls) => (
                  <Tooltip key={ls.id}>
                    <TooltipTrigger>
                      <Badge 
                        variant={ls.subjectType === "CORE" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {ls.level.shortName}
                        {ls.isCompulsory && <CheckCircle2 className="h-3 w-3 ml-1" />}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{ls.level.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ls.subjectType === "CORE" ? "Core" : "Elective"} • 
                        {ls.isCompulsory ? " Compulsory" : " Optional"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <div className="text-xs">
                  <span className="font-semibold">{subject._count.classSubjects}</span>
                  <span className="text-muted-foreground ml-1">Classes</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30">
                <FileQuestion className="h-4 w-4 text-muted-foreground" />
                <div className="text-xs">
                  <span className="font-semibold">{subject._count.questions}</span>
                  <span className="text-muted-foreground ml-1">Q&A</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30">
                {subject.isRequiredForPromotion ? (
                  <Tooltip>
                    <TooltipTrigger>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </TooltipTrigger>
                    <TooltipContent>Required for promotion</TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Not required for promotion</TooltipContent>
                  </Tooltip>
                )}
                <span className="text-xs text-muted-foreground">
                  {subject.isRequiredForPromotion ? "Required" : "Optional"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="neu rounded-3xl border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError ? (
                <span className="text-red-500">{deleteError}</span>
              ) : (
                "Are you sure you want to delete this subject? This action cannot be undone."
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
    </TooltipProvider>
  )
}
