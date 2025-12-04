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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle2, Clock, Users } from "lucide-react"
import { toast } from "sonner"
import {
  getStudentElectiveSelections,
  approveElectiveSelection,
  bulkApproveElectiveSelections,
} from "../_actions/student-subject-actions"

interface StudentSelection {
  id: string
  createdAt: Date
  approvedAt: Date | null
  student: {
    id: string
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      avatar: string | null
    }
    class: {
      id: string
      name: string
    } | null
  }
  subject: {
    id: string
    name: string
    code: string | null
  }
  approvedBy: {
    id: string
    firstName: string
    lastName: string
  } | null
}

interface ClassOption {
  id: string
  name: string
}

interface ElectiveApprovalManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classes?: ClassOption[]
}

export function ElectiveApprovalManager({
  open,
  onOpenChange,
  classes = [],
}: ElectiveApprovalManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selections, setSelections] = useState<StudentSelection[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("pending")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Fetch selections
  const loadSelections = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getStudentElectiveSelections(
        selectedClass !== "all" ? selectedClass : undefined,
        statusFilter
      )
      if (result.success) {
        setSelections(result.selections as unknown as StudentSelection[])
      } else {
        setError(result.error || "Failed to load selections")
      }
    } catch {
      setError("An error occurred")
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) {
      loadSelections()
      setSelectedIds(new Set())
    }
  }, [open, selectedClass, statusFilter])

  const handleApprove = async (selectionId: string) => {
    startTransition(async () => {
      const result = await approveElectiveSelection(selectionId)
      if (result.success) {
        toast.success("Selection approved")
        loadSelections()
      } else {
        toast.error(result.error || "Failed to approve")
      }
    })
  }

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return
    
    startTransition(async () => {
      const result = await bulkApproveElectiveSelections(Array.from(selectedIds))
      if (result.success) {
        toast.success(`${result.count} selections approved`)
        setSelectedIds(new Set())
        loadSelections()
      } else {
        toast.error(result.error || "Failed to approve selections")
      }
    })
  }

  const toggleSelectAll = () => {
    const pendingSelections = selections.filter(s => !s.approvedAt)
    if (selectedIds.size === pendingSelections.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingSelections.map(s => s.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const pendingCount = selections.filter(s => !s.approvedAt).length
  const approvedCount = selections.filter(s => s.approvedAt).length

  // Group by student
  const groupedByStudent = selections.reduce((acc, sel) => {
    const studentId = sel.student.id
    if (!acc[studentId]) {
      acc[studentId] = {
        student: sel.student,
        selections: [],
      }
    }
    acc[studentId].selections.push(sel)
    return acc
  }, {} as Record<string, { student: StudentSelection["student"]; selections: StudentSelection[] }>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neu rounded-3xl border-0 sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Manage Elective Selections
          </DialogTitle>
          <DialogDescription>
            Review and approve student elective subject selections.
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 py-2 border-b border-border/50">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px] neu-inset border-0 rounded-xl">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent className="neu rounded-xl border-0">
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[150px] neu-inset border-0 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="neu rounded-xl border-0">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
            </SelectContent>
          </Select>

          {/* Stats */}
          <div className="flex items-center gap-4 ml-auto text-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>{pendingCount} pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{approvedCount} approved</span>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 py-2 px-3 bg-primary/5 rounded-xl">
            <span className="text-sm font-medium">
              {selectedIds.size} selected
            </span>
            <Button
              size="sm"
              onClick={handleBulkApprove}
              disabled={isPending}
              className="rounded-lg"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              )}
              Approve Selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg"
            >
              Clear
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : Object.keys(groupedByStudent).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No elective selections found.
            </div>
          ) : (
            <>
              {/* Select All for pending */}
              {pendingCount > 0 && statusFilter !== "approved" && (
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Checkbox
                    checked={selectedIds.size === pendingCount && pendingCount > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    Select all pending
                  </span>
                </div>
              )}

              {Object.values(groupedByStudent).map(({ student, selections: studentSelections }) => (
                <div key={student.id} className="p-4 rounded-xl bg-muted/20 space-y-3">
                  {/* Student Header */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.user.avatar || undefined} />
                      <AvatarFallback>
                        {student.user.firstName[0]}{student.user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {student.user.firstName} {student.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.class?.name || "No class"}
                      </p>
                    </div>
                  </div>

                  {/* Subject Selections */}
                  <div className="space-y-2 pl-13">
                    {studentSelections.map((sel) => (
                      <div
                        key={sel.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          sel.approvedAt ? "bg-green-500/5" : "bg-orange-500/5"
                        }`}
                      >
                        {!sel.approvedAt && (
                          <Checkbox
                            checked={selectedIds.has(sel.id)}
                            onCheckedChange={() => toggleSelect(sel.id)}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{sel.subject.name}</span>
                            {sel.subject.code && (
                              <span className="text-xs text-muted-foreground">
                                ({sel.subject.code})
                              </span>
                            )}
                          </div>
                        </div>
                        {sel.approvedAt ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(sel.id)}
                            disabled={isPending}
                            className="rounded-lg"
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
