"use client"

import { useState, useTransition } from "react"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  GripVertical,
  Layers,
  BookOpen,
  Loader2,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  createSchoolLevel,
  updateSchoolLevel,
  deleteSchoolLevel,
  addSubjectToLevel,
  updateLevelSubject,
  removeSubjectFromLevel,
  getAvailableSubjectsForLevel,
} from "../_actions/settings-actions"
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
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

interface LevelSubject {
  id: string
  subjectType: string
  isCompulsory: boolean
  subject: {
    id: string
    name: string
    code: string | null
  }
}

interface GradeDefinition {
  id: string
  name: string
  shortName: string
}

interface SchoolLevel {
  id: string
  name: string
  shortName: string
  description: string | null
  allowElectives: boolean
  order: number
  subjects: LevelSubject[]
  grades: GradeDefinition[]
  _count: {
    classes: number
  }
}

interface Subject {
  id: string
  name: string
  code: string | null
}

interface SchoolLevelsManagerProps {
  levels: SchoolLevel[]
  subjects: Subject[]
}

export function SchoolLevelsManager({ levels, subjects }: SchoolLevelsManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [showLevelForm, setShowLevelForm] = useState(false)
  const [editingLevel, setEditingLevel] = useState<SchoolLevel | null>(null)
  const [deletingLevel, setDeletingLevel] = useState<SchoolLevel | null>(null)
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set())
  
  // Subject assignment state
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [targetLevel, setTargetLevel] = useState<SchoolLevel | null>(null)
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [editingLevelSubject, setEditingLevelSubject] = useState<LevelSubject | null>(null)
  const [deletingLevelSubject, setDeletingLevelSubject] = useState<{
    id: string
    name: string
  } | null>(null)

  // Level form state
  const [levelForm, setLevelForm] = useState({
    name: "",
    shortName: "",
    description: "",
    allowElectives: false,
  })

  // Subject assignment form state
  const [subjectForm, setSubjectForm] = useState({
    subjectId: "",
    subjectType: "CORE",
    isCompulsory: true,
  })

  const toggleLevel = (levelId: string) => {
    setExpandedLevels(prev => {
      const newSet = new Set(prev)
      if (newSet.has(levelId)) {
        newSet.delete(levelId)
      } else {
        newSet.add(levelId)
      }
      return newSet
    })
  }

  const resetLevelForm = () => {
    setLevelForm({
      name: "",
      shortName: "",
      description: "",
      allowElectives: false,
    })
    setEditingLevel(null)
    setShowLevelForm(false)
  }

  const handleEditLevel = (level: SchoolLevel) => {
    setLevelForm({
      name: level.name,
      shortName: level.shortName,
      description: level.description || "",
      allowElectives: level.allowElectives,
    })
    setEditingLevel(level)
    setShowLevelForm(true)
  }

  const handleSubmitLevel = () => {
    if (!levelForm.name.trim() || !levelForm.shortName.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    startTransition(async () => {
      const result = editingLevel
        ? await updateSchoolLevel(editingLevel.id, {
            name: levelForm.name.trim(),
            shortName: levelForm.shortName.trim(),
            description: levelForm.description.trim() || null,
            allowElectives: levelForm.allowElectives,
          })
        : await createSchoolLevel({
            name: levelForm.name.trim(),
            shortName: levelForm.shortName.trim(),
            description: levelForm.description.trim() || null,
            allowElectives: levelForm.allowElectives,
          })

      if (result.success) {
        toast.success(editingLevel ? "School level updated" : "School level created")
        resetLevelForm()
      } else {
        toast.error(result.error || "Something went wrong")
      }
    })
  }

  const handleDeleteLevel = () => {
    if (!deletingLevel) return

    startTransition(async () => {
      const result = await deleteSchoolLevel(deletingLevel.id)
      if (result.success) {
        toast.success("School level deleted")
        setDeletingLevel(null)
      } else {
        toast.error(result.error || "Something went wrong")
      }
    })
  }

  const handleOpenSubjectForm = async (level: SchoolLevel) => {
    setTargetLevel(level)
    setLoadingSubjects(true)
    setShowSubjectForm(true)
    
    try {
      const available = await getAvailableSubjectsForLevel(level.id)
      setAvailableSubjects(available)
    } catch {
      toast.error("Failed to load available subjects")
      setAvailableSubjects([])
    } finally {
      setLoadingSubjects(false)
    }
  }

  const resetSubjectForm = () => {
    setSubjectForm({
      subjectId: "",
      subjectType: "CORE",
      isCompulsory: true,
    })
    setTargetLevel(null)
    setShowSubjectForm(false)
    setAvailableSubjects([])
  }

  const handleAddSubject = () => {
    if (!targetLevel || !subjectForm.subjectId) {
      toast.error("Please select a subject")
      return
    }

    startTransition(async () => {
      const result = await addSubjectToLevel({
        levelId: targetLevel.id,
        subjectId: subjectForm.subjectId,
        subjectType: subjectForm.subjectType,
        isCompulsory: subjectForm.isCompulsory,
      })

      if (result.success) {
        toast.success("Subject added to level")
        resetSubjectForm()
      } else {
        toast.error(result.error || "Something went wrong")
      }
    })
  }

  const handleUpdateLevelSubject = (id: string, data: { subjectType: string; isCompulsory: boolean }) => {
    startTransition(async () => {
      const result = await updateLevelSubject(id, data)
      if (result.success) {
        toast.success("Subject updated")
        setEditingLevelSubject(null)
      } else {
        toast.error(result.error || "Something went wrong")
      }
    })
  }

  const handleRemoveSubject = () => {
    if (!deletingLevelSubject) return

    startTransition(async () => {
      const result = await removeSubjectFromLevel(deletingLevelSubject.id)
      if (result.success) {
        toast.success("Subject removed from level")
        setDeletingLevelSubject(null)
      } else {
        toast.error(result.error || "Something went wrong")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">School Levels</h3>
          <p className="text-sm text-muted-foreground">
            Define grade levels and assign subjects with core/elective configuration
          </p>
        </div>
        <button
          onClick={() => setShowLevelForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl neu-sm hover:neu-inset transition-all text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Level
        </button>
      </div>

      {/* Levels List */}
      {levels.length === 0 ? (
        <div className="text-center py-12 neu-inset rounded-2xl">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="font-medium mb-2">No school levels defined</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Create school levels like Primary, Junior High, Senior High to organize your classes
          </p>
          <button
            onClick={() => setShowLevelForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl neu-sm hover:neu-inset transition-all text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Create First Level
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {levels.map((level) => (
            <div key={level.id} className="neu-sm rounded-xl overflow-hidden">
              {/* Level Header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleLevel(level.id)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                
                {expandedLevels.has(level.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{level.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {level.shortName}
                    </Badge>
                    {level.allowElectives && (
                      <Badge variant="outline" className="text-xs">
                        Electives Allowed
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {level.grades.length > 0 
                      ? `${level.grades.map(g => g.shortName).join(", ")} • ` 
                      : ""}{level._count.classes} class{level._count.classes !== 1 ? "es" : ""} • {level.subjects.length} subject{level.subjects.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleEditLevel(level)}
                    className="p-2 rounded-lg hover:neu-inset transition-all"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingLevel(level)}
                    className="p-2 rounded-lg hover:neu-inset transition-all text-destructive"
                    disabled={level._count.classes > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Content - Subjects */}
              {expandedLevels.has(level.id) && (
                <div className="border-t border-border/50 p-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Subjects for {level.shortName}
                    </h4>
                    <button
                      onClick={() => handleOpenSubjectForm(level)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg neu-sm hover:neu-inset transition-all text-xs font-medium"
                    >
                      <Plus className="h-3 w-3" />
                      Add Subject
                    </button>
                  </div>

                  {level.subjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No subjects assigned to this level yet
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {level.subjects.map((ls) => (
                        <div
                          key={ls.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <span className="font-medium text-sm">{ls.subject.name}</span>
                              {ls.subject.code && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({ls.subject.code})
                                </span>
                              )}
                            </div>
                            <Badge
                              variant={ls.subjectType === "CORE" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {ls.subjectType}
                            </Badge>
                            {ls.isCompulsory && (
                              <Badge variant="outline" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingLevelSubject(ls)}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingLevelSubject({ id: ls.id, name: ls.subject.name })}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {level.description && (
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                      {level.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Level Form Dialog */}
      <Dialog open={showLevelForm} onOpenChange={(open) => !open && resetLevelForm()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingLevel ? "Edit School Level" : "Create School Level"}
            </DialogTitle>
            <DialogDescription>
              Define a school level to organize classes and subjects by grade range
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Level Name *</label>
                <input
                  type="text"
                  value={levelForm.name}
                  onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
                  placeholder="e.g., Primary School"
                  className="w-full px-3 py-2 rounded-xl neu-inset bg-transparent focus:outline-none"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Short Name *</label>
                <input
                  type="text"
                  value={levelForm.shortName}
                  onChange={(e) => setLevelForm({ ...levelForm, shortName: e.target.value })}
                  placeholder="e.g., Primary"
                  className="w-full px-3 py-2 rounded-xl neu-inset bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={levelForm.description}
                onChange={(e) => setLevelForm({ ...levelForm, description: e.target.value })}
                placeholder="Optional description for this level..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl neu-inset bg-transparent focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="text-sm font-medium">Allow Electives</p>
                <p className="text-xs text-muted-foreground">
                  Students can choose elective subjects at this level
                </p>
              </div>
              <Switch
                checked={levelForm.allowElectives}
                onCheckedChange={(checked) => setLevelForm({ ...levelForm, allowElectives: checked })}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Tip: After creating levels, assign grades to them from the &quot;Grade Definitions&quot; tab.
            </p>
          </div>

          <DialogFooter>
            <button
              onClick={resetLevelForm}
              className="px-4 py-2 rounded-xl hover:neu-inset transition-all text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitLevel}
              disabled={isPending}
              className="px-4 py-2 rounded-xl neu-sm hover:neu-inset transition-all text-sm font-medium disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingLevel ? (
                "Save Changes"
              ) : (
                "Create Level"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subject Dialog */}
      <Dialog open={showSubjectForm} onOpenChange={(open) => !open && resetSubjectForm()}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Subject to {targetLevel?.shortName}</DialogTitle>
            <DialogDescription>
              Configure the subject type and requirements for this level
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {loadingSubjects ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableSubjects.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  All subjects have been assigned to this level
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject *</label>
                  <Select
                    value={subjectForm.subjectId}
                    onValueChange={(value) => setSubjectForm({ ...subjectForm, subjectId: value })}
                  >
                    <SelectTrigger className="neu-inset">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} {subject.code && `(${subject.code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject Type</label>
                  <Select
                    value={subjectForm.subjectType}
                    onValueChange={(value) => setSubjectForm({ ...subjectForm, subjectType: value })}
                  >
                    <SelectTrigger className="neu-inset">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CORE">Core Subject</SelectItem>
                      <SelectItem value="ELECTIVE">Elective Subject</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Core subjects are assigned to all classes. Electives are chosen by students.
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Required Subject</p>
                    <p className="text-xs text-muted-foreground">
                      Students must take this subject
                    </p>
                  </div>
                  <Switch
                    checked={subjectForm.isCompulsory}
                    onCheckedChange={(checked) => setSubjectForm({ ...subjectForm, isCompulsory: checked })}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <button
              onClick={resetSubjectForm}
              className="px-4 py-2 rounded-xl hover:neu-inset transition-all text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSubject}
              disabled={isPending || !subjectForm.subjectId}
              className="px-4 py-2 rounded-xl neu-sm hover:neu-inset transition-all text-sm font-medium disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Subject"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Level Subject Dialog */}
      <Dialog open={!!editingLevelSubject} onOpenChange={() => setEditingLevelSubject(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Subject Configuration</DialogTitle>
            <DialogDescription>
              Update the subject type and requirements
            </DialogDescription>
          </DialogHeader>

          {editingLevelSubject && (
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-xl bg-muted/30">
                <p className="font-medium">{editingLevelSubject.subject.name}</p>
                {editingLevelSubject.subject.code && (
                  <p className="text-sm text-muted-foreground">{editingLevelSubject.subject.code}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subject Type</label>
                <Select
                  value={editingLevelSubject.subjectType}
                  onValueChange={(value) => 
                    setEditingLevelSubject({ ...editingLevelSubject, subjectType: value })
                  }
                >
                  <SelectTrigger className="neu-inset">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORE">Core Subject</SelectItem>
                    <SelectItem value="ELECTIVE">Elective Subject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Required Subject</p>
                  <p className="text-xs text-muted-foreground">
                    Students must take this subject
                  </p>
                </div>
                <Switch
                  checked={editingLevelSubject.isCompulsory}
                  onCheckedChange={(checked) => 
                    setEditingLevelSubject({ ...editingLevelSubject, isCompulsory: checked })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <button
              onClick={() => setEditingLevelSubject(null)}
              className="px-4 py-2 rounded-xl hover:neu-inset transition-all text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => editingLevelSubject && handleUpdateLevelSubject(
                editingLevelSubject.id,
                {
                  subjectType: editingLevelSubject.subjectType,
                  isCompulsory: editingLevelSubject.isCompulsory,
                }
              )}
              disabled={isPending}
              className="px-4 py-2 rounded-xl neu-sm hover:neu-inset transition-all text-sm font-medium disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Level Confirmation */}
      <AlertDialog open={!!deletingLevel} onOpenChange={() => setDeletingLevel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete School Level</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingLevel?.name}&quot;? 
              This will also remove all subject assignments for this level.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLevel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Subject Confirmation */}
      <AlertDialog open={!!deletingLevelSubject} onOpenChange={() => setDeletingLevelSubject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{deletingLevelSubject?.name}&quot; from this level?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveSubject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
