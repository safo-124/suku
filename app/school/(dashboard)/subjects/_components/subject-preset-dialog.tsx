"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
import { Loader2, Sparkles, BookOpen, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { bulkCreateSubjects } from "../_actions/subject-actions"

// Subject presets for different curricula
const SUBJECT_PRESETS = {
  ghana: [
    { name: "English Language", code: "ENG" },
    { name: "Mathematics", code: "MATH" },
    { name: "Integrated Science", code: "SCI" },
    { name: "Social Studies", code: "SOC" },
    { name: "Religious and Moral Education", code: "RME" },
    { name: "French", code: "FRE" },
    { name: "Ghanaian Language", code: "GHL" },
    { name: "Information and Communication Technology", code: "ICT" },
    { name: "Creative Arts", code: "ART" },
    { name: "Physical Education", code: "PE" },
    { name: "Career Technology", code: "CT" },
    { name: "Basic Design and Technology", code: "BDT" },
    { name: "Core Science", code: "CSCI" },
    { name: "Elective Mathematics", code: "EMATH" },
    { name: "Physics", code: "PHY" },
    { name: "Chemistry", code: "CHEM" },
    { name: "Biology", code: "BIO" },
    { name: "Geography", code: "GEO" },
    { name: "History", code: "HIST" },
    { name: "Government", code: "GOV" },
    { name: "Economics", code: "ECON" },
    { name: "Accounting", code: "ACC" },
    { name: "Business Management", code: "BM" },
    { name: "Literature in English", code: "LIT" },
  ],
  general: [
    { name: "English", code: "ENG" },
    { name: "Mathematics", code: "MATH" },
    { name: "Science", code: "SCI" },
    { name: "Social Studies", code: "SOC" },
    { name: "Physical Education", code: "PE" },
    { name: "Art", code: "ART" },
    { name: "Music", code: "MUS" },
    { name: "Computer Science", code: "CS" },
    { name: "Foreign Language", code: "FL" },
    { name: "Health Education", code: "HE" },
  ],
  science: [
    { name: "Physics", code: "PHY" },
    { name: "Chemistry", code: "CHEM" },
    { name: "Biology", code: "BIO" },
    { name: "Mathematics", code: "MATH" },
    { name: "Further Mathematics", code: "FMATH" },
    { name: "Computer Science", code: "CS" },
    { name: "English Language", code: "ENG" },
    { name: "Agricultural Science", code: "AGR" },
    { name: "Technical Drawing", code: "TD" },
  ],
  arts: [
    { name: "English Language", code: "ENG" },
    { name: "Literature in English", code: "LIT" },
    { name: "History", code: "HIST" },
    { name: "Government", code: "GOV" },
    { name: "Economics", code: "ECON" },
    { name: "Geography", code: "GEO" },
    { name: "Religious Studies", code: "REL" },
    { name: "French", code: "FRE" },
    { name: "Fine Arts", code: "FART" },
    { name: "Music", code: "MUS" },
  ],
  business: [
    { name: "Accounting", code: "ACC" },
    { name: "Business Management", code: "BM" },
    { name: "Economics", code: "ECON" },
    { name: "Commerce", code: "COM" },
    { name: "Mathematics", code: "MATH" },
    { name: "English Language", code: "ENG" },
    { name: "Office Practice", code: "OP" },
    { name: "Marketing", code: "MKT" },
    { name: "Computer Studies", code: "CS" },
  ],
}

interface SubjectPresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubjectPresetDialog({ open, onOpenChange }: SubjectPresetDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set())

  const presetSubjects = selectedPreset 
    ? SUBJECT_PRESETS[selectedPreset as keyof typeof SUBJECT_PRESETS] 
    : []

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)
    // Select all subjects by default
    const subjects = SUBJECT_PRESETS[preset as keyof typeof SUBJECT_PRESETS] || []
    setSelectedSubjects(new Set(subjects.map((s) => s.code)))
  }

  const toggleSubject = (code: string) => {
    const newSet = new Set(selectedSubjects)
    if (newSet.has(code)) {
      newSet.delete(code)
    } else {
      newSet.add(code)
    }
    setSelectedSubjects(newSet)
  }

  const handleCreate = () => {
    if (selectedSubjects.size === 0) return

    const subjectsToCreate = presetSubjects.filter((s) => selectedSubjects.has(s.code))

    startTransition(async () => {
      const result = await bulkCreateSubjects(subjectsToCreate)

      if (result.success) {
        toast.success(`Created ${result.count} subject(s)`)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to create subjects")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neu rounded-3xl border-0 sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Quick Add Subjects
          </DialogTitle>
          <DialogDescription>
            Choose a curriculum preset to quickly add common subjects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Curriculum Preset</Label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="neu-inset border-0 rounded-xl h-11">
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent className="neu rounded-xl border-0">
                <SelectItem value="ghana">Ghana Education Service (GES)</SelectItem>
                <SelectItem value="general">General Education</SelectItem>
                <SelectItem value="science">Science Track</SelectItem>
                <SelectItem value="arts">Arts & Humanities Track</SelectItem>
                <SelectItem value="business">Business Track</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {presetSubjects.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Subjects ({selectedSubjects.size} selected)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    if (selectedSubjects.size === presetSubjects.length) {
                      setSelectedSubjects(new Set())
                    } else {
                      setSelectedSubjects(new Set(presetSubjects.map((s) => s.code)))
                    }
                  }}
                >
                  {selectedSubjects.size === presetSubjects.length ? "Deselect All" : "Select All"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1">
                {presetSubjects.map((subject) => (
                  <button
                    key={subject.code}
                    type="button"
                    onClick={() => toggleSubject(subject.code)}
                    className={`p-3 rounded-xl text-left transition-all duration-200 ${
                      selectedSubjects.has(subject.code)
                        ? "neu-inset"
                        : "neu-sm hover:neu"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center ${
                        selectedSubjects.has(subject.code)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}>
                        {selectedSubjects.has(subject.code) && (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">{subject.code}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!selectedPreset && (
            <div className="p-8 rounded-xl neu-inset text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-sm text-muted-foreground">
                Select a curriculum preset above to see available subjects.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={selectedSubjects.size === 0 || isPending}
            className="rounded-xl neu-convex"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Create {selectedSubjects.size} Subject(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
