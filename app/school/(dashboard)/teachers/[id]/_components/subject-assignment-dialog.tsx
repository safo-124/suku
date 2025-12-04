"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { bulkAssignSubjectsToTeacher } from "../../_actions/teacher-actions"

interface ClassSubject {
  id: string
  class: { id: string; name: string; section: string | null }
  subject: { id: string; name: string; code: string | null }
  teacher: { id: string; firstName: string; lastName: string } | null
}

interface SubjectAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacherId: string
  teacherName: string
  availableClassSubjects: ClassSubject[]
}

export function SubjectAssignmentDialog({
  open,
  onOpenChange,
  teacherId,
  teacherName,
  availableClassSubjects,
}: SubjectAssignmentDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredSubjects = availableClassSubjects.filter((cs) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      cs.subject.name.toLowerCase().includes(searchLower) ||
      cs.class.name.toLowerCase().includes(searchLower) ||
      cs.subject.code?.toLowerCase().includes(searchLower)
    )
  })

  // Group by class
  const groupedByClass = filteredSubjects.reduce((acc, cs) => {
    const classKey = cs.class.id
    if (!acc[classKey]) {
      acc[classKey] = {
        class: cs.class,
        subjects: [],
      }
    }
    acc[classKey].subjects.push(cs)
    return acc
  }, {} as Record<string, { class: ClassSubject["class"]; subjects: ClassSubject[] }>)

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredSubjects.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredSubjects.map((cs) => cs.id)))
    }
  }

  const handleSubmit = () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one subject")
      return
    }

    startTransition(async () => {
      const result = await bulkAssignSubjectsToTeacher(
        Array.from(selectedIds),
        teacherId
      )
      if (result.success) {
        toast.success(`Assigned ${result.assignedCount} subject(s) to ${teacherName}`)
        setSelectedIds(new Set())
        setSearchQuery("")
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to assign subjects")
      }
    })
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedIds(new Set())
      setSearchQuery("")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="neu rounded-3xl border-0 sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Subjects to {teacherName}</DialogTitle>
          <DialogDescription>
            Select the subjects (class-subject pairs) you want to assign to this teacher.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0">
          {/* Search and Select All */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects or classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 neu-inset border-0 bg-transparent rounded-xl h-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="rounded-xl neu border-0"
            >
              {selectedIds.size === filteredSubjects.length && filteredSubjects.length > 0
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>

          {/* Subjects List */}
          <ScrollArea className="h-[400px] pr-4">
            {filteredSubjects.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-2xl neu-inset inline-block mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No subjects match your search"
                    : "No available subjects to assign"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {!searchQuery && "All subjects may already be assigned to this teacher"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.values(groupedByClass).map(({ class: cls, subjects }) => (
                  <div key={cls.id} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-1">
                      {cls.name}
                      {cls.section && ` - Section ${cls.section}`}
                    </h4>
                    <div className="space-y-1">
                      {subjects.map((cs) => (
                        <label
                          key={cs.id}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={selectedIds.has(cs.id)}
                            onCheckedChange={() => handleToggle(cs.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{cs.subject.name}</p>
                            {cs.subject.code && (
                              <p className="text-xs text-muted-foreground">
                                Code: {cs.subject.code}
                              </p>
                            )}
                          </div>
                          {cs.teacher && (
                            <span className="text-xs text-amber-600 bg-amber-500/10 px-2 py-1 rounded-lg">
                              Currently: {cs.teacher.firstName} {cs.teacher.lastName}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Selection Count */}
          {selectedIds.size > 0 && (
            <div className="p-3 rounded-xl bg-primary/10 text-sm">
              <strong>{selectedIds.size}</strong> subject{selectedIds.size !== 1 ? "s" : ""} selected
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => handleClose(false)}
            disabled={isPending}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || selectedIds.size === 0}
            className="rounded-xl neu-convex"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                Assign {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
