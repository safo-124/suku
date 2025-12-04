"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, AlertCircle, BookOpen, Check, Info } from "lucide-react"
import { toast } from "sonner"
import {
  getAvailableElectives,
  selectElectiveSubject,
  removeElectiveSubject,
} from "../_actions/student-subject-actions"

interface ElectiveSubject {
  id: string
  name: string
  code: string | null
  description: string | null
  isCompulsory: boolean
  isSelected: boolean
}

interface StudentElectiveSelectorProps {
  studentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function StudentElectiveSelector({
  studentId,
  open,
  onOpenChange,
  onUpdate,
}: StudentElectiveSelectorProps) {
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [electives, setElectives] = useState<ElectiveSubject[]>([])
  const [allowElectives, setAllowElectives] = useState(false)
  const [schoolLevelName, setSchoolLevelName] = useState<string>("")
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map())

  // Fetch available electives when dialog opens
  useEffect(() => {
    if (open) {
      setLoading(true)
      setError(null)
      getAvailableElectives(studentId).then((result) => {
        if (result.success) {
          setElectives(result.electives)
          setAllowElectives(result.allowElectives || false)
          setSchoolLevelName(result.schoolLevelName || "")
        } else {
          setError(result.error || "Failed to load electives")
        }
        setLoading(false)
      })
    } else {
      setPendingChanges(new Map())
    }
  }, [open, studentId])

  const handleToggleSubject = async (subjectId: string, currentlySelected: boolean) => {
    startTransition(async () => {
      try {
        if (currentlySelected) {
          const result = await removeElectiveSubject(studentId, subjectId)
          if (result.success) {
            setElectives(prev => 
              prev.map(e => e.id === subjectId ? { ...e, isSelected: false } : e)
            )
            toast.success("Subject removed from selections")
          } else {
            toast.error(result.error || "Failed to remove subject")
          }
        } else {
          const result = await selectElectiveSubject(studentId, subjectId)
          if (result.success) {
            setElectives(prev => 
              prev.map(e => e.id === subjectId ? { ...e, isSelected: true } : e)
            )
            toast.success("Subject added to selections")
          } else {
            toast.error(result.error || "Failed to add subject")
          }
        }
        onUpdate?.()
      } catch {
        toast.error("An error occurred")
      }
    })
  }

  const selectedCount = electives.filter(e => e.isSelected).length
  const compulsoryCount = electives.filter(e => e.isCompulsory && e.isSelected).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neu rounded-3xl border-0 sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Select Elective Subjects
          </DialogTitle>
          <DialogDescription>
            Choose your elective subjects for the current academic year.
            {schoolLevelName && <span className="font-medium"> ({schoolLevelName})</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : !allowElectives ? (
            <div className="p-4 rounded-xl bg-muted/30 text-muted-foreground text-sm flex items-center gap-3">
              <Info className="h-4 w-4 shrink-0" />
              Elective selection is not available for your current level.
            </div>
          ) : electives.length === 0 ? (
            <div className="p-4 rounded-xl bg-muted/30 text-muted-foreground text-sm flex items-center gap-3">
              <Info className="h-4 w-4 shrink-0" />
              No elective subjects available for your level.
            </div>
          ) : (
            <>
              {/* Selection Stats */}
              <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm">
                  <span className="font-medium">{selectedCount}</span> subject{selectedCount !== 1 ? "s" : ""} selected
                  {compulsoryCount > 0 && (
                    <span className="text-muted-foreground">
                      {" "}({compulsoryCount} compulsory)
                    </span>
                  )}
                </p>
              </div>

              {/* Subject List */}
              <div className="space-y-3">
                {electives.map((subject) => (
                  <div
                    key={subject.id}
                    className={`p-4 rounded-xl border transition-all ${
                      subject.isSelected
                        ? "bg-primary/5 border-primary/30"
                        : "bg-muted/20 border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={subject.id}
                        checked={subject.isSelected}
                        onCheckedChange={() => handleToggleSubject(subject.id, subject.isSelected)}
                        disabled={isPending || subject.isCompulsory}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={subject.id}
                            className="font-medium cursor-pointer"
                          >
                            {subject.name}
                          </label>
                          {subject.code && (
                            <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                              {subject.code}
                            </span>
                          )}
                          {subject.isCompulsory && (
                            <span className="text-xs text-orange-600 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 rounded">
                              Required
                            </span>
                          )}
                          {subject.isSelected && (
                            <Check className="h-4 w-4 text-primary ml-auto" />
                          )}
                        </div>
                        {subject.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {subject.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Help Text */}
              <div className="mt-4 p-3 rounded-xl bg-muted/30 text-xs text-muted-foreground">
                <Info className="h-3 w-3 inline mr-1" />
                Your selections may require approval from your school administrator.
                Required subjects cannot be removed.
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={() => onOpenChange(false)}
            className="rounded-xl neu-convex"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
