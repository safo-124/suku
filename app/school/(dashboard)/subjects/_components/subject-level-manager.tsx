"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Loader2, AlertCircle, Plus, X, Layers, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { assignSubjectToLevel, removeSubjectFromLevel } from "../_actions/subject-actions"

interface SchoolLevel {
  id: string
  name: string
  shortName: string
  allowElectives: boolean
  order: number
}

interface LevelAssignment {
  id: string
  subjectType: string
  isCompulsory: boolean
  level: {
    id: string
    name: string
    shortName: string
  }
}

interface SubjectData {
  id: string
  name: string
  code: string | null
  levelSubjects: LevelAssignment[]
}

interface SubjectLevelManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: SubjectData | null
  schoolLevels: SchoolLevel[]
}

export function SubjectLevelManager({
  open,
  onOpenChange,
  subject,
  schoolLevels,
}: SubjectLevelManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  // New assignment form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLevelId, setNewLevelId] = useState("")
  const [newSubjectType, setNewSubjectType] = useState<"CORE" | "ELECTIVE">("CORE")
  const [newIsCompulsory, setNewIsCompulsory] = useState(true)

  // Get levels not yet assigned
  const assignedLevelIds = new Set(subject?.levelSubjects.map((ls) => ls.level.id) || [])
  const availableLevels = schoolLevels.filter((l) => !assignedLevelIds.has(l.id))

  // Get current level for elective check
  const selectedLevel = schoolLevels.find((l) => l.id === newLevelId)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setShowAddForm(false)
      setNewLevelId("")
      setNewSubjectType("CORE")
      setNewIsCompulsory(true)
      setError(null)
    }
  }, [open])

  const handleAddAssignment = async () => {
    if (!subject || !newLevelId) return
    setError(null)

    startTransition(async () => {
      const result = await assignSubjectToLevel({
        subjectId: subject.id,
        levelId: newLevelId,
        subjectType: newSubjectType,
        isCompulsory: newIsCompulsory,
      })

      if (result.success) {
        toast.success("Subject assigned to level")
        setShowAddForm(false)
        setNewLevelId("")
        setNewSubjectType("CORE")
        setNewIsCompulsory(true)
        router.refresh()
      } else {
        setError(result.error || "Failed to assign subject")
      }
    })
  }

  const handleRemoveAssignment = async (levelId: string) => {
    if (!subject) return

    startTransition(async () => {
      const result = await removeSubjectFromLevel(subject.id, levelId)

      if (result.success) {
        toast.success("Subject removed from level")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to remove subject")
      }
    })
  }

  const handleUpdateAssignment = async (levelId: string, subjectType: "CORE" | "ELECTIVE", isCompulsory: boolean) => {
    if (!subject) return

    startTransition(async () => {
      const result = await assignSubjectToLevel({
        subjectId: subject.id,
        levelId,
        subjectType,
        isCompulsory,
      })

      if (result.success) {
        toast.success("Assignment updated")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update assignment")
      }
    })
  }

  if (!subject) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neu rounded-3xl border-0 sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Manage School Levels
          </DialogTitle>
          <DialogDescription>
            Assign <strong>{subject.name}</strong> to school levels and configure how it&apos;s offered.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Current Assignments */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Current Assignments</Label>
            
            {subject.levelSubjects.length === 0 ? (
              <div className="p-6 rounded-xl neu-inset text-center">
                <p className="text-sm text-muted-foreground">
                  This subject is not assigned to any school level yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {subject.levelSubjects.map((ls) => {
                  const level = schoolLevels.find((l) => l.id === ls.level.id)
                  return (
                    <div
                      key={ls.id}
                      className="p-4 rounded-xl neu-sm flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-medium">
                          {ls.level.shortName}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{ls.level.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={ls.subjectType === "CORE" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {ls.subjectType}
                            </Badge>
                            {ls.isCompulsory && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Compulsory
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Quick toggle for type if level allows electives */}
                        {level?.allowElectives && (
                          <Select
                            value={ls.subjectType}
                            onValueChange={(value) => 
                              handleUpdateAssignment(ls.level.id, value as "CORE" | "ELECTIVE", ls.isCompulsory)
                            }
                            disabled={isPending}
                          >
                            <SelectTrigger className="w-24 h-8 text-xs neu-inset border-0 rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CORE">Core</SelectItem>
                              <SelectItem value="ELECTIVE">Elective</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveAssignment(ls.level.id)}
                          disabled={isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Add New Assignment */}
          {availableLevels.length > 0 && (
            <div className="space-y-3">
              {!showAddForm ? (
                <Button
                  variant="outline"
                  className="w-full rounded-xl neu-sm border-0 h-12"
                  onClick={() => setShowAddForm(true)}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Assign to School Level
                </Button>
              ) : (
                <div className="p-4 rounded-xl neu-inset space-y-4">
                  <div className="space-y-2">
                    <Label>School Level</Label>
                    <Select value={newLevelId} onValueChange={setNewLevelId}>
                      <SelectTrigger className="neu-inset border-0 rounded-xl h-11">
                        <SelectValue placeholder="Select a level" />
                      </SelectTrigger>
                      <SelectContent className="neu rounded-xl border-0">
                        {availableLevels.map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.name} ({level.shortName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newLevelId && (
                    <>
                      <div className="space-y-2">
                        <Label>Subject Type</Label>
                        <Select 
                          value={newSubjectType} 
                          onValueChange={(v) => setNewSubjectType(v as "CORE" | "ELECTIVE")}
                          disabled={!selectedLevel?.allowElectives}
                        >
                          <SelectTrigger className="neu-inset border-0 rounded-xl h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="neu rounded-xl border-0">
                            <SelectItem value="CORE">Core Subject</SelectItem>
                            <SelectItem value="ELECTIVE" disabled={!selectedLevel?.allowElectives}>
                              Elective Subject
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {!selectedLevel?.allowElectives && (
                          <p className="text-xs text-muted-foreground">
                            This level doesn&apos;t allow electives. Enable in Settings &gt; School Levels.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <div>
                          <Label htmlFor="compulsory" className="text-sm">
                            Compulsory for all students
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            All students must take this subject
                          </p>
                        </div>
                        <Switch
                          id="compulsory"
                          checked={newIsCompulsory}
                          onCheckedChange={setNewIsCompulsory}
                          disabled={newSubjectType === "ELECTIVE"}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1 rounded-xl"
                      onClick={() => {
                        setShowAddForm(false)
                        setNewLevelId("")
                      }}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 rounded-xl neu-convex"
                      onClick={handleAddAssignment}
                      disabled={!newLevelId || isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        "Assign"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {availableLevels.length === 0 && subject.levelSubjects.length > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              This subject is assigned to all school levels.
            </p>
          )}

          {schoolLevels.length === 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm">
              <p>No school levels defined yet. Create school levels in Settings first.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-xl"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
