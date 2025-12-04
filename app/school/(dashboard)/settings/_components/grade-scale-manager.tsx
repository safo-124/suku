"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, Plus, Pencil, Trash2, GraduationCap, AlertCircle } from "lucide-react"
import { createGradeScale, updateGradeScale, deleteGradeScale } from "../_actions/settings-actions"
import { toast } from "sonner"

interface GradeScale {
  id: string
  label: string
  minScore: unknown
  maxScore: unknown
  gpa: unknown
  isPassingGrade: boolean
}

interface GradeScaleManagerProps {
  grades: GradeScale[]
}

export function GradeScaleManager({ grades }: GradeScaleManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<GradeScale | null>(null)
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    label: "",
    minScore: "",
    maxScore: "",
    gpa: "",
    isPassingGrade: true,
  })

  const resetForm = () => {
    setFormData({
      label: "",
      minScore: "",
      maxScore: "",
      gpa: "",
      isPassingGrade: true,
    })
    setEditingGrade(null)
  }

  const handleOpenDialog = (grade?: GradeScale) => {
    if (grade) {
      setEditingGrade(grade)
      setFormData({
        label: grade.label,
        minScore: String(grade.minScore),
        maxScore: String(grade.maxScore),
        gpa: grade.gpa ? String(grade.gpa) : "",
        isPassingGrade: grade.isPassingGrade,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const minScore = parseFloat(formData.minScore)
    const maxScore = parseFloat(formData.maxScore)
    const gpa = formData.gpa ? parseFloat(formData.gpa) : null

    if (isNaN(minScore) || isNaN(maxScore)) {
      toast.error("Please enter valid score values")
      return
    }

    if (minScore > maxScore) {
      toast.error("Minimum score cannot be greater than maximum score")
      return
    }

    startTransition(async () => {
      const data = {
        label: formData.label,
        minScore,
        maxScore,
        gpa,
        isPassingGrade: formData.isPassingGrade,
      }

      const result = editingGrade
        ? await updateGradeScale(editingGrade.id, data)
        : await createGradeScale(data)

      if (result.success) {
        toast.success(editingGrade ? "Grade updated successfully" : "Grade created successfully")
        setIsDialogOpen(false)
        resetForm()
      } else {
        toast.error(result.error || "Operation failed")
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteGradeScale(id)
      if (result.success) {
        toast.success("Grade deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete grade")
      }
    })
  }

  const inputClass = "neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-foreground/20 rounded-xl h-11"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Grade Scale
          </h3>
          <p className="text-sm text-muted-foreground">
            Define your grading system with score ranges and GPA values
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="neu-sm hover:neu rounded-xl"
              variant="ghost"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Grade
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-0 neu rounded-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingGrade ? "Edit Grade" : "Add Grade"}
              </DialogTitle>
              <DialogDescription>
                Define a grade with its score range and GPA value
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">Grade Label</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className={inputClass}
                  placeholder="A, B+, C, etc."
                  required
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minScore">Minimum Score (%)</Label>
                  <Input
                    id="minScore"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.minScore}
                    onChange={(e) => setFormData({ ...formData, minScore: e.target.value })}
                    className={inputClass}
                    placeholder="80"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxScore">Maximum Score (%)</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                    className={inputClass}
                    placeholder="100"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gpa">GPA Value (optional)</Label>
                <Input
                  id="gpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={formData.gpa}
                  onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                  className={inputClass}
                  placeholder="4.0"
                  disabled={isPending}
                />
              </div>

              <div className="flex items-center justify-between p-4 neu-sm rounded-xl">
                <div className="space-y-0.5">
                  <Label htmlFor="isPassingGrade">Passing Grade</Label>
                  <p className="text-xs text-muted-foreground">
                    Mark this grade as a passing grade
                  </p>
                </div>
                <Switch
                  id="isPassingGrade"
                  checked={formData.isPassingGrade}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isPassingGrade: checked })
                  }
                  disabled={isPending}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isPending}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="neu-convex hover:scale-[0.98] active:neu-inset rounded-xl"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingGrade ? "Update Grade" : "Add Grade"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grade List */}
      {grades.length === 0 ? (
        <div className="text-center py-12 neu-sm rounded-2xl">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="font-medium mb-2">No grades defined</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first grade to define your grading scale
          </p>
          <Button
            onClick={() => handleOpenDialog()}
            variant="ghost"
            className="neu-sm hover:neu rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Grade
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {grades.map((grade) => (
            <div
              key={grade.id}
              className="flex items-center gap-4 p-4 neu-sm rounded-xl group"
            >
              {/* Grade Badge */}
              <div className={`h-12 w-12 flex items-center justify-center rounded-xl neu ${
                grade.isPassingGrade 
                  ? "text-green-600"
                  : "text-red-500"
              }`}>
                <span className="font-bold text-lg">{grade.label}</span>
              </div>

              {/* Score Range */}
              <div className="flex-1">
                <p className="font-medium">
                  {String(grade.minScore)}% - {String(grade.maxScore)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {grade.gpa ? `GPA: ${String(grade.gpa)}` : "No GPA"}
                  {" • "}
                  {grade.isPassingGrade ? "Passing" : "Failing"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDialog(grade)}
                  className="h-9 w-9 rounded-lg neu-sm hover:neu"
                  disabled={isPending}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg neu-sm hover:neu text-destructive hover:text-destructive"
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-card border-0 neu rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Grade {grade.label}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove this grade from your grading scale. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(grade.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
