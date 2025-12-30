"use client"

import { useState, useEffect } from "react"
import { 
  Calendar, 
  Clock, 
  Plus, 
  Pencil, 
  Trash2, 
  Users, 
  BookOpen,
  Coffee,
  Save,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Wand2,
  Settings2,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  getPeriods,
  createPeriod,
  updatePeriod,
  deletePeriod,
  bulkCreatePeriods,
  getClassTimetable,
  upsertTimetableSlot,
  deleteTimetableSlot,
  getTimetableData,
  getTeacherTimetable,
  getClassSubjectAllocations,
  bulkUpdateSubjectAllocations,
  validateAllocations,
  generateClassTimetable,
  generateAllClassesTimetable,
  checkAllTeacherConflicts,
  type CreatePeriodInput,
} from "../_actions/timetable-actions"

// Days of the week
const DAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 0, label: "Sunday", short: "Sun" },
]

// Default periods template
const DEFAULT_PERIODS: CreatePeriodInput[] = [
  { name: "Period 1", startTime: "08:00", endTime: "08:45", order: 1, isBreak: false },
  { name: "Period 2", startTime: "08:45", endTime: "09:30", order: 2, isBreak: false },
  { name: "Break", startTime: "09:30", endTime: "09:45", order: 3, isBreak: true },
  { name: "Period 3", startTime: "09:45", endTime: "10:30", order: 4, isBreak: false },
  { name: "Period 4", startTime: "10:30", endTime: "11:15", order: 5, isBreak: false },
  { name: "Period 5", startTime: "11:15", endTime: "12:00", order: 6, isBreak: false },
  { name: "Lunch", startTime: "12:00", endTime: "12:45", order: 7, isBreak: true },
  { name: "Period 6", startTime: "12:45", endTime: "13:30", order: 8, isBreak: false },
  { name: "Period 7", startTime: "13:30", endTime: "14:15", order: 9, isBreak: false },
  { name: "Period 8", startTime: "14:15", endTime: "15:00", order: 10, isBreak: false },
]

interface Period {
  id: string
  name: string
  startTime: string
  endTime: string
  order: number
  isBreak: boolean
}

interface ClassSubject {
  id: string
  subject: { id: string; name: string; code: string | null }
  teacher: { id: string; firstName: string; lastName: string } | null
  hoursPerWeek?: number | string // Decimal comes as string from Prisma
}

interface ClassData {
  id: string
  name: string
  gradeLevel: number | null
  classSubjects: ClassSubject[]
}

interface Teacher {
  id: string
  firstName: string
  lastName: string
}

interface SubjectAllocation {
  id: string
  subject: { id: string; name: string; code: string | null }
  teacher: { id: string; firstName: string; lastName: string } | null
  hoursPerWeek: number | string // Decimal comes as string from Prisma
}

interface TeacherConflict {
  teacher: string
  teacherId: string
  dayOfWeek: number
  period: string
  periodTime: string
  classes: { className: string; subject: string }[]
}

interface TimetableSlot {
  id: string
  periodId: string
  dayOfWeek: number
  classSubjectId: string | null
  teacherId: string | null
  roomNumber: string | null
  period: Period
  classSubject?: {
    id: string
    subject: { id: string; name: string; code: string | null }
  } | null
  teacher?: { id: string; firstName: string; lastName: string } | null
  class?: { id: string; name: string }
}

export function TimetableClient() {
  const [activeTab, setActiveTab] = useState("periods")
  const [periods, setPeriods] = useState<Period[]>([])
  const [classes, setClasses] = useState<ClassData[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Period management state
  const [isEditingPeriods, setIsEditingPeriods] = useState(false)
  const [editablePeriods, setEditablePeriods] = useState<CreatePeriodInput[]>([])
  const [isSavingPeriods, setIsSavingPeriods] = useState(false)

  // Class timetable state
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [classSlots, setClassSlots] = useState<TimetableSlot[]>([])
  const [isLoadingClass, setIsLoadingClass] = useState(false)

  // Teacher timetable state
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
  const [teacherSlots, setTeacherSlots] = useState<TimetableSlot[]>([])
  const [isLoadingTeacher, setIsLoadingTeacher] = useState(false)

  // Slot edit dialog
  const [editSlotDialog, setEditSlotDialog] = useState(false)
  const [editingSlot, setEditingSlot] = useState<{
    periodId: string
    dayOfWeek: number
    classSubjectId: string
    teacherId: string
    roomNumber: string
  } | null>(null)
  const [isSavingSlot, setIsSavingSlot] = useState(false)

  // Allocation state
  const [allocationClassId, setAllocationClassId] = useState<string>("")
  const [allocations, setAllocations] = useState<SubjectAllocation[]>([])
  const [editableAllocations, setEditableAllocations] = useState<{ [id: string]: number }>({}) // hours per week
  const [periodDurationMinutes, setPeriodDurationMinutes] = useState(45) // default 45 min periods
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(false)
  const [isSavingAllocations, setIsSavingAllocations] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    message: string
    totalAvailableSlots?: number
    totalAllocatedHours?: number
    totalPeriodsNeeded?: number
  } | null>(null)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateAllDialog, setGenerateAllDialog] = useState(false)
  const [conflicts, setConflicts] = useState<TeacherConflict[]>([])
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false)

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const result = await getTimetableData()
      if (result.success) {
        setPeriods(result.periods as Period[])
        // Cast classes with type assertion
        if (result.classes && result.classes.length > 0 && 'classSubjects' in result.classes[0]) {
          setClasses(result.classes as unknown as ClassData[])
        }
        setTeachers(result.teachers as Teacher[])
      } else {
        toast.error(result.error || "Failed to load data")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load timetable data")
    } finally {
      setIsLoading(false)
    }
  }

  // Load class timetable
  useEffect(() => {
    if (selectedClassId) {
      loadClassTimetable()
    }
  }, [selectedClassId])

  async function loadClassTimetable() {
    setIsLoadingClass(true)
    try {
      const result = await getClassTimetable(selectedClassId)
      if (result.success) {
        setClassSlots(result.slots as TimetableSlot[])
      } else {
        toast.error(result.error || "Failed to load timetable")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load class timetable")
    } finally {
      setIsLoadingClass(false)
    }
  }

  // Load teacher timetable
  useEffect(() => {
    if (selectedTeacherId) {
      loadTeacherTimetable()
    }
  }, [selectedTeacherId])

  async function loadTeacherTimetable() {
    setIsLoadingTeacher(true)
    try {
      const result = await getTeacherTimetable(selectedTeacherId)
      if (result.success) {
        setTeacherSlots(result.slots as TimetableSlot[])
      } else {
        toast.error(result.error || "Failed to load timetable")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load teacher timetable")
    } finally {
      setIsLoadingTeacher(false)
    }
  }

  // Load allocations when class changes
  useEffect(() => {
    if (allocationClassId) {
      loadAllocations()
    }
  }, [allocationClassId])

  async function loadAllocations() {
    setIsLoadingAllocations(true)
    setValidationResult(null)
    try {
      const result = await getClassSubjectAllocations(allocationClassId)
      if (result.success) {
        const allocs = result.allocations as unknown as SubjectAllocation[]
        setAllocations(allocs)
        setPeriodDurationMinutes(result.periodDurationMinutes)
        // Initialize editable allocations with hours
        const editable: { [id: string]: number } = {}
        for (const a of allocs) {
          editable[a.id] = Number(a.hoursPerWeek || 0)
        }
        setEditableAllocations(editable)
      } else {
        toast.error(result.error || "Failed to load allocations")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load allocations")
    } finally {
      setIsLoadingAllocations(false)
    }
  }

  // Save allocations
  async function saveAllocations() {
    setIsSavingAllocations(true)
    try {
      const updates = Object.entries(editableAllocations).map(([id, hoursPerWeek]) => ({
        classSubjectId: id,
        hoursPerWeek,
      }))

      const result = await bulkUpdateSubjectAllocations(updates)
      if (result.success) {
        toast.success("Allocations saved successfully")
        // Validate after saving
        await validateClassAllocations()
      } else {
        toast.error(result.error || "Failed to save allocations")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to save allocations")
    } finally {
      setIsSavingAllocations(false)
    }
  }

  // Validate allocations
  async function validateClassAllocations() {
    if (!allocationClassId) return
    try {
      const result = await validateAllocations(allocationClassId)
      if (result.success) {
        setValidationResult({
          isValid: result.isValid ?? false,
          message: result.message ?? "",
          totalAvailableSlots: result.totalAvailableSlots,
          totalAllocatedHours: result.totalAllocatedHours,
          totalPeriodsNeeded: result.totalPeriodsNeeded,
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Generate timetable for a class
  async function handleGenerateClassTimetable() {
    if (!selectedClassId) return
    setIsGenerating(true)
    try {
      const result = await generateClassTimetable(selectedClassId)
      if (result.success) {
        toast.success(result.message || "Timetable generated successfully")
        loadClassTimetable()
      } else {
        toast.error(result.error || "Failed to generate timetable")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to generate timetable")
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate timetable for all classes
  async function handleGenerateAllTimetables() {
    setIsGenerating(true)
    setGenerateAllDialog(false)
    try {
      const result = await generateAllClassesTimetable()
      if (result.success) {
        toast.success(result.message || "Timetables generated successfully")
        if (selectedClassId) {
          loadClassTimetable()
        }
      } else {
        toast.error(result.error || "Failed to generate timetables")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to generate timetables")
    } finally {
      setIsGenerating(false)
    }
  }

  // Check for teacher conflicts
  async function handleCheckConflicts() {
    setIsCheckingConflicts(true)
    try {
      const result = await checkAllTeacherConflicts()
      if (result.success) {
        setConflicts(result.conflicts as TeacherConflict[])
        if (result.conflicts.length === 0) {
          toast.success("No teacher conflicts found!")
        } else {
          toast.warning(`Found ${result.conflicts.length} teacher conflict(s)`)
        }
      } else {
        toast.error(result.error || "Failed to check conflicts")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to check conflicts")
    } finally {
      setIsCheckingConflicts(false)
    }
  }

  // Calculate total allocated hours and available hours
  const totalAllocatedHours = Object.values(editableAllocations).reduce((sum, val) => sum + val, 0)
  const availableSlotsPerWeek = periods.filter(p => !p.isBreak).length * 5 // 5 working days
  const availableHoursPerWeek = (availableSlotsPerWeek * periodDurationMinutes) / 60
  
  // Convert hours to periods needed
  const hoursToPeriodsNeeded = (hours: number) => Math.round((hours * 60) / periodDurationMinutes)
  const totalPeriodsNeeded = hoursToPeriodsNeeded(totalAllocatedHours)

  // Start editing periods
  function startEditingPeriods() {
    if (periods.length > 0) {
      setEditablePeriods(
        periods.map((p) => ({
          name: p.name,
          startTime: p.startTime,
          endTime: p.endTime,
          order: p.order,
          isBreak: p.isBreak,
        }))
      )
    } else {
      setEditablePeriods([...DEFAULT_PERIODS])
    }
    setIsEditingPeriods(true)
  }

  // Add a new period to the editable list
  function addPeriod() {
    const maxOrder = Math.max(...editablePeriods.map((p) => p.order), 0)
    const lastPeriod = editablePeriods[editablePeriods.length - 1]
    const newStartTime = lastPeriod?.endTime || "08:00"
    
    // Calculate end time (45 minutes later)
    const [hours, mins] = newStartTime.split(":").map(Number)
    const endMinutes = (hours * 60 + mins + 45) % (24 * 60)
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    const newEndTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`

    setEditablePeriods([
      ...editablePeriods,
      {
        name: `Period ${editablePeriods.filter((p) => !p.isBreak).length + 1}`,
        startTime: newStartTime,
        endTime: newEndTime,
        order: maxOrder + 1,
        isBreak: false,
      },
    ])
  }

  // Remove a period from the editable list
  function removePeriod(index: number) {
    setEditablePeriods(editablePeriods.filter((_, i) => i !== index))
  }

  // Update an editable period
  function updateEditablePeriod(index: number, field: keyof CreatePeriodInput, value: string | number | boolean) {
    setEditablePeriods(
      editablePeriods.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  // Save periods
  async function savePeriods() {
    setIsSavingPeriods(true)
    try {
      // Validate periods
      for (const period of editablePeriods) {
        if (!period.name || !period.startTime || !period.endTime) {
          toast.error("All periods must have a name, start time, and end time")
          return
        }
      }

      // Reorder periods
      const orderedPeriods = editablePeriods.map((p, i) => ({ ...p, order: i + 1 }))

      const result = await bulkCreatePeriods(orderedPeriods)
      if (result.success) {
        toast.success("Periods saved successfully")
        setIsEditingPeriods(false)
        loadData()
      } else {
        toast.error(result.error || "Failed to save periods")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to save periods")
    } finally {
      setIsSavingPeriods(false)
    }
  }

  // Open slot edit dialog
  function openSlotDialog(periodId: string, dayOfWeek: number) {
    const existingSlot = classSlots.find(
      (s) => s.periodId === periodId && s.dayOfWeek === dayOfWeek
    )

    setEditingSlot({
      periodId,
      dayOfWeek,
      classSubjectId: existingSlot?.classSubjectId || "",
      teacherId: existingSlot?.teacherId || "",
      roomNumber: existingSlot?.roomNumber || "",
    })
    setEditSlotDialog(true)
  }

  // Save slot
  async function saveSlot() {
    if (!editingSlot || !selectedClassId) return

    setIsSavingSlot(true)
    try {
      if (!editingSlot.classSubjectId) {
        // Delete the slot if no subject selected
        await deleteTimetableSlot(selectedClassId, editingSlot.periodId, editingSlot.dayOfWeek)
        toast.success("Slot cleared")
      } else {
        const result = await upsertTimetableSlot({
          classId: selectedClassId,
          periodId: editingSlot.periodId,
          dayOfWeek: editingSlot.dayOfWeek,
          classSubjectId: editingSlot.classSubjectId || undefined,
          teacherId: editingSlot.teacherId || undefined,
          roomNumber: editingSlot.roomNumber || undefined,
        })

        if (result.success) {
          toast.success("Slot saved")
        } else {
          toast.error(result.error || "Failed to save slot")
          return
        }
      }

      setEditSlotDialog(false)
      loadClassTimetable()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save slot")
    } finally {
      setIsSavingSlot(false)
    }
  }

  // Get the selected class data
  const selectedClass = classes.find((c) => c.id === selectedClassId)

  // Get slot for a specific period and day
  function getSlot(periodId: string, dayOfWeek: number): TimetableSlot | undefined {
    return classSlots.find((s) => s.periodId === periodId && s.dayOfWeek === dayOfWeek)
  }

  // Get teacher slot for a specific period and day
  function getTeacherSlot(periodId: string, dayOfWeek: number): TimetableSlot | undefined {
    return teacherSlots.find((s) => s.periodId === periodId && s.dayOfWeek === dayOfWeek)
  }

  // Working days (excluding weekends by default)
  const workingDays = DAYS.filter((d) => d.value >= 1 && d.value <= 5)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 neu-flat rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Timetable</h1>
            <p className="text-muted-foreground">
              Manage class schedules and periods
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="neu-flat rounded-xl p-1 flex-wrap">
          <TabsTrigger value="periods" className="rounded-lg data-[state=active]:neu-inset">
            <Clock className="h-4 w-4 mr-2" />
            Periods
          </TabsTrigger>
          <TabsTrigger value="allocations" className="rounded-lg data-[state=active]:neu-inset">
            <Settings2 className="h-4 w-4 mr-2" />
            Allocations
          </TabsTrigger>
          <TabsTrigger value="class" className="rounded-lg data-[state=active]:neu-inset">
            <BookOpen className="h-4 w-4 mr-2" />
            Class Timetable
          </TabsTrigger>
          <TabsTrigger value="teacher" className="rounded-lg data-[state=active]:neu-inset">
            <Users className="h-4 w-4 mr-2" />
            Teacher Schedule
          </TabsTrigger>
        </TabsList>

        {/* Periods Tab */}
        <TabsContent value="periods" className="space-y-4">
          <div className="neu-flat rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">School Periods</h3>
                <p className="text-sm text-muted-foreground">
                  Configure the daily schedule periods and breaks
                </p>
              </div>
              {!isEditingPeriods ? (
                <Button onClick={startEditingPeriods} className="bg-green-600 hover:bg-green-700 text-white rounded-xl">
                  <Pencil className="h-4 w-4 mr-2" />
                  {periods.length > 0 ? "Edit Periods" : "Setup Periods"}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingPeriods(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={savePeriods}
                    disabled={isSavingPeriods}
                    className="neu-convex rounded-xl bg-green-600 hover:bg-green-700"
                  >
                    {isSavingPeriods ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Periods
                  </Button>
                </div>
              )}
            </div>

            {!isEditingPeriods ? (
              // Display periods
              periods.length > 0 ? (
                <div className="space-y-2">
                  {periods.map((period) => (
                    <div
                      key={period.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl",
                        period.isBreak ? "neu-inset bg-amber-50" : "neu-sm"
                      )}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg neu-flat">
                        {period.isBreak ? (
                          <Coffee className="h-5 w-5 text-amber-600" />
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{period.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {period.startTime} - {period.endTime}
                        </div>
                      </div>
                      {period.isBreak && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                          Break
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="font-medium mb-2">No periods configured</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set up your school&apos;s daily periods and breaks
                  </p>
                  <Button onClick={startEditingPeriods} className="neu-convex rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Setup Periods
                  </Button>
                </div>
              )
            ) : (
              // Edit periods
              <div className="space-y-4">
                {editablePeriods.map((period, index) => (
                  <div
                    key={index}
                    className={cn(
                      "grid grid-cols-12 gap-4 p-4 rounded-xl",
                      period.isBreak ? "neu-inset bg-amber-50" : "neu-sm"
                    )}
                  >
                    <div className="col-span-3">
                      <Label>Name</Label>
                      <Input
                        value={period.name}
                        onChange={(e) => updateEditablePeriod(index, "name", e.target.value)}
                        placeholder="Period name"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={period.startTime}
                        onChange={(e) => updateEditablePeriod(index, "startTime", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={period.endTime}
                        onChange={(e) => updateEditablePeriod(index, "endTime", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-3 flex items-end gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={period.isBreak}
                          onCheckedChange={(checked) =>
                            updateEditablePeriod(index, "isBreak", checked)
                          }
                        />
                        <Label>Break</Label>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-end justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePeriod(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addPeriod}
                  className="w-full rounded-xl border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Period
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Allocations Tab */}
        <TabsContent value="allocations" className="space-y-4">
          <div className="neu-flat rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold">Subject Time Allocation</h3>
                <p className="text-sm text-muted-foreground">
                  Set weekly periods for each subject in a class
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Select value={allocationClassId} onValueChange={setAllocationClassId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!allocationClassId ? (
              <div className="text-center py-12">
                <Settings2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="font-medium mb-2">Select a class</h4>
                <p className="text-sm text-muted-foreground">
                  Choose a class to configure subject time allocations
                </p>
              </div>
            ) : isLoadingAllocations ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : allocations.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                <h4 className="font-medium mb-2">No subjects assigned</h4>
                <p className="text-sm text-muted-foreground">
                  This class has no subjects assigned. Please add subjects to the class first.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="flex flex-wrap gap-4">
                  <div className="neu-sm rounded-xl p-4 flex-1 min-w-[200px]">
                    <div className="text-sm text-muted-foreground">Available Hours/Week</div>
                    <div className="text-2xl font-bold">{availableHoursPerWeek.toFixed(1)}h</div>
                    <div className="text-xs text-muted-foreground">{availableSlotsPerWeek} slots</div>
                  </div>
                  <div className={cn(
                    "neu-sm rounded-xl p-4 flex-1 min-w-[200px]",
                    totalPeriodsNeeded > availableSlotsPerWeek && "bg-red-50"
                  )}>
                    <div className="text-sm text-muted-foreground">Allocated Hours</div>
                    <div className={cn(
                      "text-2xl font-bold",
                      totalPeriodsNeeded > availableSlotsPerWeek && "text-red-600"
                    )}>
                      {totalAllocatedHours.toFixed(1)}h
                    </div>
                    <div className="text-xs text-muted-foreground">{totalPeriodsNeeded} periods needed</div>
                  </div>
                  <div className="neu-sm rounded-xl p-4 flex-1 min-w-[200px]">
                    <div className="text-sm text-muted-foreground">Remaining Slots</div>
                    <div className={cn(
                      "text-2xl font-bold",
                      availableSlotsPerWeek - totalPeriodsNeeded < 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {availableSlotsPerWeek - totalPeriodsNeeded}
                    </div>
                  </div>
                </div>

                {/* Validation Result */}
                {validationResult && (
                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-xl",
                    validationResult.isValid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    {validationResult.isValid ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                    <span>{validationResult.message}</span>
                  </div>
                )}

                {/* Subject List */}
                <div className="space-y-3">
                  {allocations.map((allocation) => (
                    <div
                      key={allocation.id}
                      className="neu-sm rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{allocation.subject.name}</div>
                        {allocation.teacher && (
                          <div className="text-sm text-muted-foreground">
                            {allocation.teacher.firstName} {allocation.teacher.lastName}
                          </div>
                        )}
                        {!allocation.teacher && (
                          <div className="text-sm text-amber-600">No teacher assigned</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Label className="text-sm text-muted-foreground whitespace-nowrap">
                          Hours/Week:
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="40"
                          step="0.5"
                          value={editableAllocations[allocation.id] || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0
                            setEditableAllocations((prev) => ({
                              ...prev,
                              [allocation.id]: Math.max(0, Math.min(40, value)),
                            }))
                          }}
                          className="w-20 text-center"
                        />
                        <span className="text-xs text-muted-foreground">
                          ({hoursToPeriodsNeeded(editableAllocations[allocation.id] || 0)} periods)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button
                    onClick={saveAllocations}
                    disabled={isSavingAllocations}
                    className="neu-convex rounded-xl bg-green-600 hover:bg-green-700"
                  >
                    {isSavingAllocations ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Allocations
                  </Button>
                  <Button
                    variant="outline"
                    onClick={validateClassAllocations}
                    className="rounded-xl"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validate
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Class Timetable Tab */}
        <TabsContent value="class" className="space-y-4">
          <div className="neu-flat rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Label>Select Class</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleCheckConflicts}
                  disabled={isCheckingConflicts}
                  className="rounded-xl"
                >
                  {isCheckingConflicts ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  )}
                  Check Conflicts
                </Button>
                {selectedClassId && (
                  <Button
                    onClick={handleGenerateClassTimetable}
                    disabled={isGenerating}
                    className="neu-convex rounded-xl"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2" />
                    )}
                    Auto-Generate
                  </Button>
                )}
                <Button
                  onClick={() => setGenerateAllDialog(true)}
                  disabled={isGenerating}
                  variant="outline"
                  className="rounded-xl"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate All
                </Button>
              </div>
            </div>

            {/* Conflicts Display */}
            {conflicts.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                <h4 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Teacher Conflicts Found ({conflicts.length})
                </h4>
                <div className="space-y-2">
                  {conflicts.map((conflict, idx) => (
                    <div key={idx} className="text-sm text-red-600">
                      <strong>{conflict.teacher}</strong> is double-booked on {DAYS.find(d => d.value === conflict.dayOfWeek)?.label} 
                      at {conflict.periodTime}:
                      <ul className="ml-4 mt-1">
                        {conflict.classes.map((c, i) => (
                          <li key={i}>• {c.className} - {c.subject}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!selectedClassId ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="font-medium mb-2">Select a class</h4>
                <p className="text-sm text-muted-foreground">
                  Choose a class to view and edit its timetable
                </p>
              </div>
            ) : periods.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                <h4 className="font-medium mb-2">No periods configured</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Please configure school periods first
                </p>
                <Button onClick={() => setActiveTab("periods")} className="rounded-xl">
                  Go to Periods
                </Button>
              </div>
            ) : isLoadingClass ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              // Timetable Grid
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground border-b">
                        Period
                      </th>
                      {workingDays.map((day) => (
                        <th
                          key={day.value}
                          className="p-3 text-center text-sm font-medium text-muted-foreground border-b min-w-[140px]"
                        >
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period) => (
                      <tr key={period.id}>
                        <td
                          className={cn(
                            "p-3 border-b",
                            period.isBreak && "bg-amber-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {period.isBreak ? (
                              <Coffee className="h-4 w-4 text-amber-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <div className="font-medium text-sm">{period.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {period.startTime} - {period.endTime}
                              </div>
                            </div>
                          </div>
                        </td>
                        {workingDays.map((day) => {
                          const slot = getSlot(period.id, day.value)
                          return (
                            <td
                              key={day.value}
                              className={cn(
                                "p-2 border-b border-l",
                                period.isBreak && "bg-amber-50"
                              )}
                            >
                              {period.isBreak ? (
                                <div className="h-16 flex items-center justify-center">
                                  <span className="text-sm text-amber-600 font-medium">
                                    {period.name}
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => openSlotDialog(period.id, day.value)}
                                  className={cn(
                                    "w-full h-16 rounded-lg transition-all text-left p-2",
                                    slot?.classSubject
                                      ? "neu-inset bg-blue-50 hover:bg-blue-100"
                                      : "neu-sm hover:neu-inset bg-gray-50"
                                  )}
                                >
                                  {slot?.classSubject ? (
                                    <div>
                                      <div className="font-medium text-sm text-blue-700 truncate">
                                        {slot.classSubject.subject.name}
                                      </div>
                                      {slot.teacher && (
                                        <div className="text-xs text-muted-foreground truncate">
                                          {slot.teacher.firstName} {slot.teacher.lastName}
                                        </div>
                                      )}
                                      {slot.roomNumber && (
                                        <div className="text-xs text-muted-foreground">
                                          Room: {slot.roomNumber}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="h-full flex items-center justify-center">
                                      <Plus className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </button>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Teacher Schedule Tab */}
        <TabsContent value="teacher" className="space-y-4">
          <div className="neu-flat rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <Label>Select Teacher</Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Choose a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!selectedTeacherId ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="font-medium mb-2">Select a teacher</h4>
                <p className="text-sm text-muted-foreground">
                  Choose a teacher to view their schedule
                </p>
              </div>
            ) : periods.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                <h4 className="font-medium mb-2">No periods configured</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Please configure school periods first
                </p>
                <Button onClick={() => setActiveTab("periods")} className="rounded-xl">
                  Go to Periods
                </Button>
              </div>
            ) : isLoadingTeacher ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              // Teacher Schedule Grid
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground border-b">
                        Period
                      </th>
                      {workingDays.map((day) => (
                        <th
                          key={day.value}
                          className="p-3 text-center text-sm font-medium text-muted-foreground border-b min-w-[140px]"
                        >
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period) => (
                      <tr key={period.id}>
                        <td
                          className={cn(
                            "p-3 border-b",
                            period.isBreak && "bg-amber-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {period.isBreak ? (
                              <Coffee className="h-4 w-4 text-amber-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <div className="font-medium text-sm">{period.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {period.startTime} - {period.endTime}
                              </div>
                            </div>
                          </div>
                        </td>
                        {workingDays.map((day) => {
                          const slot = getTeacherSlot(period.id, day.value)
                          return (
                            <td
                              key={day.value}
                              className={cn(
                                "p-2 border-b border-l",
                                period.isBreak && "bg-amber-50"
                              )}
                            >
                              {period.isBreak ? (
                                <div className="h-16 flex items-center justify-center">
                                  <span className="text-sm text-amber-600 font-medium">
                                    {period.name}
                                  </span>
                                </div>
                              ) : slot?.classSubject ? (
                                <div className="w-full h-16 rounded-lg neu-inset bg-green-50 p-2">
                                  <div className="font-medium text-sm text-green-700 truncate">
                                    {slot.classSubject.subject.name}
                                  </div>
                                  {slot.class && (
                                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                      <GraduationCap className="h-3 w-3" />
                                      {slot.class.name}
                                    </div>
                                  )}
                                  {slot.roomNumber && (
                                    <div className="text-xs text-muted-foreground">
                                      Room: {slot.roomNumber}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="w-full h-16 rounded-lg bg-gray-50 flex items-center justify-center">
                                  <span className="text-xs text-muted-foreground">Free</span>
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Slot Dialog */}
      <Dialog open={editSlotDialog} onOpenChange={setEditSlotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Timetable Slot</DialogTitle>
            <DialogDescription>
              Assign a subject and teacher to this slot
            </DialogDescription>
          </DialogHeader>

          {editingSlot && selectedClass && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={editingSlot.classSubjectId}
                  onValueChange={(value) =>
                    setEditingSlot({ ...editingSlot, classSubjectId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- No subject (clear slot) --</SelectItem>
                    {selectedClass.classSubjects.map((cs) => (
                      <SelectItem key={cs.id} value={cs.id}>
                        {cs.subject.name}
                        {cs.teacher && ` (${cs.teacher.firstName} ${cs.teacher.lastName})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Teacher (Optional Override)</Label>
                <Select
                  value={editingSlot.teacherId}
                  onValueChange={(value) =>
                    setEditingSlot({ ...editingSlot, teacherId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Use default teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Use default teacher --</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Room Number (Optional)</Label>
                <Input
                  value={editingSlot.roomNumber}
                  onChange={(e) =>
                    setEditingSlot({ ...editingSlot, roomNumber: e.target.value })
                  }
                  placeholder="e.g., Room 101"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditSlotDialog(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={saveSlot}
              disabled={isSavingSlot}
              className="neu-convex rounded-xl"
            >
              {isSavingSlot && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate All Confirmation Dialog */}
      <AlertDialog open={generateAllDialog} onOpenChange={setGenerateAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Timetables for All Classes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all existing timetables and generate new ones based on the subject allocations for each class. 
              Make sure all classes have proper time allocations set up.
              <br /><br />
              <strong className="text-amber-600">Warning:</strong> This action cannot be undone. All manually edited timetables will be replaced.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGenerateAllTimetables}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Generate All Timetables
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
