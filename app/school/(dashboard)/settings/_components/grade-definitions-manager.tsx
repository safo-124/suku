"use client"

import { useState, useTransition } from "react"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  GripVertical,
  BookOpen,
  Loader2,
  Sparkles,
  ArrowUpDown
} from "lucide-react"
import { toast } from "sonner"
import {
  createGradeDefinition,
  updateGradeDefinition,
  deleteGradeDefinition,
  bulkCreateGradeDefinitions,
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
import { Badge } from "@/components/ui/badge"

interface SchoolLevel {
  id: string
  name: string
  shortName: string
}

interface GradeDefinition {
  id: string
  name: string
  shortName: string
  description: string | null
  order: number
  schoolLevelId: string | null
  schoolLevel: SchoolLevel | null
  _count: {
    classes: number
  }
}

interface GradeDefinitionsManagerProps {
  grades: GradeDefinition[]
  schoolLevels: SchoolLevel[]
}

// Preset grade templates
const GRADE_PRESETS = {
  ghana: [
    { name: "Kindergarten 1", shortName: "KG1" },
    { name: "Kindergarten 2", shortName: "KG2" },
    { name: "Class 1", shortName: "C1" },
    { name: "Class 2", shortName: "C2" },
    { name: "Class 3", shortName: "C3" },
    { name: "Class 4", shortName: "C4" },
    { name: "Class 5", shortName: "C5" },
    { name: "Class 6", shortName: "C6" },
    { name: "JHS 1", shortName: "JHS1" },
    { name: "JHS 2", shortName: "JHS2" },
    { name: "JHS 3", shortName: "JHS3" },
    { name: "SHS 1", shortName: "SHS1" },
    { name: "SHS 2", shortName: "SHS2" },
    { name: "SHS 3", shortName: "SHS3" },
  ],
  us: [
    { name: "Pre-Kindergarten", shortName: "Pre-K" },
    { name: "Kindergarten", shortName: "K" },
    { name: "Grade 1", shortName: "G1" },
    { name: "Grade 2", shortName: "G2" },
    { name: "Grade 3", shortName: "G3" },
    { name: "Grade 4", shortName: "G4" },
    { name: "Grade 5", shortName: "G5" },
    { name: "Grade 6", shortName: "G6" },
    { name: "Grade 7", shortName: "G7" },
    { name: "Grade 8", shortName: "G8" },
    { name: "Grade 9", shortName: "G9" },
    { name: "Grade 10", shortName: "G10" },
    { name: "Grade 11", shortName: "G11" },
    { name: "Grade 12", shortName: "G12" },
  ],
  uk: [
    { name: "Reception", shortName: "R" },
    { name: "Year 1", shortName: "Y1" },
    { name: "Year 2", shortName: "Y2" },
    { name: "Year 3", shortName: "Y3" },
    { name: "Year 4", shortName: "Y4" },
    { name: "Year 5", shortName: "Y5" },
    { name: "Year 6", shortName: "Y6" },
    { name: "Year 7", shortName: "Y7" },
    { name: "Year 8", shortName: "Y8" },
    { name: "Year 9", shortName: "Y9" },
    { name: "Year 10", shortName: "Y10" },
    { name: "Year 11", shortName: "Y11" },
    { name: "Year 12", shortName: "Y12" },
    { name: "Year 13", shortName: "Y13" },
  ],
  form: [
    { name: "Form 1", shortName: "F1" },
    { name: "Form 2", shortName: "F2" },
    { name: "Form 3", shortName: "F3" },
    { name: "Form 4", shortName: "F4" },
    { name: "Form 5", shortName: "F5" },
    { name: "Form 6", shortName: "F6" },
  ],
}

export function GradeDefinitionsManager({ grades, schoolLevels }: GradeDefinitionsManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editingGrade, setEditingGrade] = useState<GradeDefinition | null>(null)
  const [deletingGrade, setDeletingGrade] = useState<GradeDefinition | null>(null)
  const [showPresetDialog, setShowPresetDialog] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>("")

  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    description: "",
    order: 1,
    schoolLevelId: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      shortName: "",
      description: "",
      order: grades.length + 1,
      schoolLevelId: "",
    })
    setEditingGrade(null)
    setShowForm(false)
  }

  const handleEdit = (grade: GradeDefinition) => {
    setFormData({
      name: grade.name,
      shortName: grade.shortName,
      description: grade.description || "",
      order: grade.order,
      schoolLevelId: grade.schoolLevelId || "",
    })
    setEditingGrade(grade)
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.shortName.trim()) {
      toast.error("Please fill in name and short name")
      return
    }

    startTransition(async () => {
      const result = editingGrade
        ? await updateGradeDefinition(editingGrade.id, {
            name: formData.name.trim(),
            shortName: formData.shortName.trim(),
            description: formData.description.trim() || null,
            order: formData.order,
            schoolLevelId: formData.schoolLevelId || null,
          })
        : await createGradeDefinition({
            name: formData.name.trim(),
            shortName: formData.shortName.trim(),
            description: formData.description.trim() || null,
            order: formData.order,
            schoolLevelId: formData.schoolLevelId || null,
          })

      if (result.success) {
        toast.success(editingGrade ? "Grade updated" : "Grade created")
        resetForm()
      } else {
        toast.error(result.error || "Something went wrong")
      }
    })
  }

  const handleDelete = () => {
    if (!deletingGrade) return

    startTransition(async () => {
      const result = await deleteGradeDefinition(deletingGrade.id)
      if (result.success) {
        toast.success("Grade deleted")
        setDeletingGrade(null)
      } else {
        toast.error(result.error || "Something went wrong")
      }
    })
  }

  const handleApplyPreset = () => {
    if (!selectedPreset) {
      toast.error("Please select a preset")
      return
    }

    const presetGrades = GRADE_PRESETS[selectedPreset as keyof typeof GRADE_PRESETS]
    if (!presetGrades) return

    startTransition(async () => {
      const result = await bulkCreateGradeDefinitions(presetGrades)
      if (result.success) {
        toast.success(`Created ${result.count} grades from preset`)
        setShowPresetDialog(false)
        setSelectedPreset("")
      } else {
        toast.error(result.error || "Something went wrong")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Grade Definitions</h3>
          <p className="text-sm text-muted-foreground">
            Define the classes/grades available in your school (e.g., Class 1, Form 2, Grade 5)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPresetDialog(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl neu-sm hover:neu-inset transition-all text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" />
            Use Preset
          </button>
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, order: grades.length + 1 }))
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl neu-sm hover:neu-inset transition-all text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Grade
          </button>
        </div>
      </div>

      {/* Grades List */}
      {grades.length === 0 ? (
        <div className="text-center py-12 neu-inset rounded-2xl">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="font-medium mb-2">No grades defined</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Define the class/grade levels for your school. You can use a preset or create custom grades.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowPresetDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl neu-sm hover:neu-inset transition-all text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" />
              Use Preset
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl neu-sm hover:neu-inset transition-all text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Create Custom
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {grades.map((grade, index) => (
            <div
              key={grade.id}
              className="flex items-center gap-3 p-4 neu-sm rounded-xl hover:bg-muted/20 transition-colors"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
              
              <div className="flex items-center justify-center w-8 h-8 rounded-lg neu-inset text-sm font-medium">
                {grade.order}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{grade.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {grade.shortName}
                  </Badge>
                  {grade.schoolLevel && (
                    <Badge variant="outline" className="text-xs">
                      {grade.schoolLevel.shortName}
                    </Badge>
                  )}
                </div>
                {grade.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {grade.description}
                  </p>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                {grade._count.classes} class{grade._count.classes !== 1 ? "es" : ""}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(grade)}
                  className="p-2 rounded-lg hover:neu-inset transition-all"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeletingGrade(grade)}
                  className="p-2 rounded-lg hover:neu-inset transition-all text-destructive"
                  disabled={grade._count.classes > 0}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grade Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingGrade ? "Edit Grade" : "Add Grade"}
            </DialogTitle>
            <DialogDescription>
              Define a class/grade level for your school
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Grade Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Class 1, Form 2"
                  className="w-full px-3 py-2 rounded-xl neu-inset bg-transparent focus:outline-none"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Short Name *</label>
                <input
                  type="text"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                  placeholder="e.g., C1, F2"
                  className="w-full px-3 py-2 rounded-xl neu-inset bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                className="w-full px-3 py-2 rounded-xl neu-inset bg-transparent focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                  min={1}
                  className="w-full px-3 py-2 rounded-xl neu-inset bg-transparent focus:outline-none"
                />
                <p className="text-xs text-muted-foreground">
                  Used for sorting and promotion sequence
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">School Level</label>
                <Select
                  value={formData.schoolLevelId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, schoolLevelId: value === "none" ? "" : value })}
                >
                  <SelectTrigger className="neu-inset">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {schoolLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-xl hover:neu-inset transition-all text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-4 py-2 rounded-xl neu-sm hover:neu-inset transition-all text-sm font-medium disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingGrade ? (
                "Save Changes"
              ) : (
                "Create Grade"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preset Dialog */}
      <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Use Grade Preset</DialogTitle>
            <DialogDescription>
              Quickly set up grades using a standard template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Preset</label>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger className="neu-inset">
                  <SelectValue placeholder="Choose a preset..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ghana">Ghana (KG1-SHS3)</SelectItem>
                  <SelectItem value="us">US (Pre-K to Grade 12)</SelectItem>
                  <SelectItem value="uk">UK (Reception to Year 13)</SelectItem>
                  <SelectItem value="form">Form System (Form 1-6)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPreset && (
              <div className="p-3 rounded-xl bg-muted/30">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <div className="flex flex-wrap gap-1">
                  {GRADE_PRESETS[selectedPreset as keyof typeof GRADE_PRESETS]?.map((g) => (
                    <Badge key={g.shortName} variant="secondary" className="text-xs">
                      {g.shortName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Note: Existing grades with the same name will be skipped.
            </p>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setShowPresetDialog(false)
                setSelectedPreset("")
              }}
              className="px-4 py-2 rounded-xl hover:neu-inset transition-all text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyPreset}
              disabled={isPending || !selectedPreset}
              className="px-4 py-2 rounded-xl neu-sm hover:neu-inset transition-all text-sm font-medium disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply Preset"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingGrade} onOpenChange={() => setDeletingGrade(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingGrade?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
