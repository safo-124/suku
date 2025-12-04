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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, GraduationCap, Users, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { assignClassTeacher } from "../../_actions/teacher-actions"

interface AvailableClass {
  id: string
  name: string
  section: string | null
  classTeacher: { id: string; firstName: string; lastName: string } | null
  gradeDefinition: { name: string } | null
  _count: { students: number }
}

interface ClassTeacherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacherId: string
  teacherName: string
  availableClasses: AvailableClass[]
}

export function ClassTeacherDialog({
  open,
  onOpenChange,
  teacherId,
  teacherName,
  availableClasses,
}: ClassTeacherDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)

  const filteredClasses = availableClasses.filter((cls) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      cls.name.toLowerCase().includes(searchLower) ||
      cls.section?.toLowerCase().includes(searchLower) ||
      cls.gradeDefinition?.name.toLowerCase().includes(searchLower)
    )
  })

  const handleSubmit = () => {
    if (!selectedClassId) {
      toast.error("Please select a class")
      return
    }

    const selectedClass = availableClasses.find((c) => c.id === selectedClassId)

    startTransition(async () => {
      const result = await assignClassTeacher(selectedClassId, teacherId)
      if (result.success) {
        toast.success(
          `${teacherName} is now the class teacher of ${selectedClass?.name}`
        )
        setSelectedClassId(null)
        setSearchQuery("")
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to assign class teacher")
      }
    })
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedClassId(null)
      setSearchQuery("")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="neu rounded-3xl border-0 sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign {teacherName} as Class Teacher</DialogTitle>
          <DialogDescription>
            Select the class you want this teacher to be responsible for as class teacher.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 neu-inset border-0 bg-transparent rounded-xl h-10"
            />
          </div>

          {/* Classes List */}
          <ScrollArea className="h-[350px] pr-4">
            {filteredClasses.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-2xl neu-inset inline-block mb-4">
                  <GraduationCap className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No classes match your search"
                    : "No available classes"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {!searchQuery && "This teacher may already be assigned to all classes"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredClasses.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setSelectedClassId(cls.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left",
                      selectedClassId === cls.id
                        ? "neu-inset bg-primary/10 ring-2 ring-primary/30"
                        : "hover:bg-muted/30"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        selectedClassId === cls.id ? "bg-primary/20" : "neu-inset"
                      )}
                    >
                      <GraduationCap
                        className={cn(
                          "h-5 w-5",
                          selectedClassId === cls.id
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {cls.name}
                        {cls.section && ` - Section ${cls.section}`}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {cls.gradeDefinition && (
                          <span>{cls.gradeDefinition.name}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {cls._count.students} students
                        </span>
                      </div>
                      {cls.classTeacher && (
                        <p className="text-xs text-amber-600 mt-1">
                          Current: {cls.classTeacher.firstName} {cls.classTeacher.lastName}
                        </p>
                      )}
                    </div>
                    {selectedClassId === cls.id && (
                      <div className="p-1.5 rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
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
            disabled={isPending || !selectedClassId}
            className="rounded-xl neu-convex"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign as Class Teacher"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
