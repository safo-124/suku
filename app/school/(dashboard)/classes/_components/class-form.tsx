"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, AlertCircle } from "lucide-react"
import { createClass, updateClass } from "../_actions/class-actions"

interface Teacher {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface AcademicYear {
  id: string
  name: string
  isCurrent: boolean
}

interface ClassData {
  id: string
  name: string
  gradeLevel: number
  section: string | null
  capacity: number | null
  roomNumber: string | null
  classTeacherId?: string | null
  academicYearId: string
}

interface ClassFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classData?: ClassData | null
  teachers: Teacher[]
  academicYears: AcademicYear[]
  currentAcademicYear: AcademicYear | null
}

export function ClassForm({ 
  open, 
  onOpenChange, 
  classData, 
  teachers,
  academicYears,
  currentAcademicYear
}: ClassFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!classData

  const [formData, setFormData] = useState({
    name: "",
    gradeLevel: "1",
    section: "",
    capacity: "",
    roomNumber: "",
    classTeacherId: "",
    academicYearId: currentAcademicYear?.id || "",
  })

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      if (classData) {
        setFormData({
          name: classData.name || "",
          gradeLevel: classData.gradeLevel?.toString() || "1",
          section: classData.section || "",
          capacity: classData.capacity?.toString() || "",
          roomNumber: classData.roomNumber || "",
          classTeacherId: classData.classTeacherId || "",
          academicYearId: classData.academicYearId || currentAcademicYear?.id || "",
        })
      } else {
        setFormData({
          name: "",
          gradeLevel: "1",
          section: "",
          capacity: "",
          roomNumber: "",
          classTeacherId: "",
          academicYearId: currentAcademicYear?.id || "",
        })
      }
      setError(null)
    }
  }, [open, classData, currentAcademicYear])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name) {
      setError("Class name is required")
      return
    }

    if (!formData.academicYearId) {
      setError("Academic year is required")
      return
    }

    startTransition(async () => {
      const submitData = {
        name: formData.name,
        gradeLevel: formData.gradeLevel,
        section: formData.section || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        roomNumber: formData.roomNumber || undefined,
        classTeacherId: formData.classTeacherId || undefined,
        academicYearId: formData.academicYearId,
      }

      let result
      if (isEditing && classData) {
        result = await updateClass({ ...submitData, id: classData.id })
      } else {
        result = await createClass(submitData)
      }

      if (result.success) {
        onOpenChange(false)
        router.refresh()
      } else {
        setError(result.error || "Operation failed")
      }
    })
  }

  const inputClass = "neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl h-11"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neu rounded-3xl border-0 sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? "Edit Class" : "Add New Class"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the class information below."
              : "Fill in the details to create a new class."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="academicYear">Academic Year *</Label>
            <Select
              value={formData.academicYearId}
              onValueChange={(value) => setFormData({ ...formData, academicYearId: value })}
              disabled={isPending}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent className="neu rounded-xl border-0">
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name} {year.isCurrent && "(Current)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                placeholder="Grade 5A"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Grade Level *</Label>
              <Select
                value={formData.gradeLevel}
                onValueChange={(value) => setFormData({ ...formData, gradeLevel: value })}
                disabled={isPending}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent className="neu rounded-xl border-0">
                  {[...Array(12)].map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      Grade {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className={inputClass}
                placeholder="A, B, C..."
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className={inputClass}
                placeholder="30"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number</Label>
              <Input
                id="roomNumber"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className={inputClass}
                placeholder="Room 101"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classTeacher">Class Teacher</Label>
              <Select
                value={formData.classTeacherId}
                onValueChange={(value) => setFormData({ ...formData, classTeacherId: value })}
                disabled={isPending}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent className="neu rounded-xl border-0">
                  <SelectItem value="">None</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl neu-convex"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Class"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
