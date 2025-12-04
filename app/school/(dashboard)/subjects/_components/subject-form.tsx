"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, AlertCircle } from "lucide-react"
import { createSubject, updateSubject } from "../_actions/subject-actions"

interface SubjectData {
  id: string
  name: string
  code: string | null
  description: string | null
  isRequiredForPromotion: boolean
}

interface SubjectFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectData?: SubjectData | null
}

export function SubjectForm({ 
  open, 
  onOpenChange, 
  subjectData,
}: SubjectFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!subjectData

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    isRequiredForPromotion: false,
  })

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      if (subjectData) {
        setFormData({
          name: subjectData.name || "",
          code: subjectData.code || "",
          description: subjectData.description || "",
          isRequiredForPromotion: subjectData.isRequiredForPromotion || false,
        })
      } else {
        setFormData({
          name: "",
          code: "",
          description: "",
          isRequiredForPromotion: false,
        })
      }
      setError(null)
    }
  }, [open, subjectData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError("Subject name is required")
      return
    }

    startTransition(async () => {
      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        description: formData.description.trim() || undefined,
        isRequiredForPromotion: formData.isRequiredForPromotion,
      }

      let result
      if (isEditing && subjectData) {
        result = await updateSubject({ ...submitData, id: subjectData.id })
      } else {
        result = await createSubject(submitData)
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
            {isEditing ? "Edit Subject" : "Add New Subject"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the subject information below."
              : "Fill in the details to create a new subject."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                placeholder="Mathematics"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Subject Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className={inputClass}
                placeholder="MATH"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl min-h-[80px]"
              placeholder="Brief description of the subject..."
              disabled={isPending}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="isRequired" className="text-sm font-medium">
                Required for Promotion
              </Label>
              <p className="text-xs text-muted-foreground">
                Students must pass this subject to be promoted
              </p>
            </div>
            <Switch
              id="isRequired"
              checked={formData.isRequiredForPromotion}
              onCheckedChange={(checked) => setFormData({ ...formData, isRequiredForPromotion: checked })}
              disabled={isPending}
            />
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
                "Create Subject"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
