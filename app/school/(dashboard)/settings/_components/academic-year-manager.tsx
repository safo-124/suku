"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  Loader2, Plus, Pencil, Trash2, Calendar, 
  Archive, CheckCircle2, Copy, ChevronDown, 
  GripVertical, AlertCircle
} from "lucide-react"
import { 
  createAcademicYear, 
  updateAcademicYear, 
  setCurrentAcademicYear,
  archiveAcademicYear,
  deleteAcademicYear,
  createAcademicPeriod,
  updateAcademicPeriod,
  deleteAcademicPeriod,
} from "../_actions/settings-actions"
import { toast } from "sonner"
import { format } from "date-fns"

interface AcademicPeriod {
  id: string
  name: string
  order: number
  startDate: Date
  endDate: Date
}

interface AcademicYear {
  id: string
  name: string
  startDate: Date
  endDate: Date
  isCurrent: boolean
  isArchived: boolean
  promotionThreshold: unknown
  periods: AcademicPeriod[]
  _count: {
    classes: number
    enrollments: number
  }
}

interface AcademicYearManagerProps {
  years: AcademicYear[]
}

export function AcademicYearManager({ years }: AcademicYearManagerProps) {
  const [isYearDialogOpen, setIsYearDialogOpen] = useState(false)
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState(false)
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null)
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [yearFormData, setYearFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    promotionThreshold: "",
    copyFromYearId: "",
  })

  const [periodFormData, setPeriodFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  })

  const resetYearForm = () => {
    setYearFormData({
      name: "",
      startDate: "",
      endDate: "",
      promotionThreshold: "",
      copyFromYearId: "",
    })
    setEditingYear(null)
  }

  const resetPeriodForm = () => {
    setPeriodFormData({
      name: "",
      startDate: "",
      endDate: "",
    })
    setEditingPeriod(null)
  }

  const handleOpenYearDialog = (year?: AcademicYear) => {
    if (year) {
      setEditingYear(year)
      setYearFormData({
        name: year.name,
        startDate: format(new Date(year.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(year.endDate), "yyyy-MM-dd"),
        promotionThreshold: year.promotionThreshold ? String(year.promotionThreshold) : "",
        copyFromYearId: "",
      })
    } else {
      resetYearForm()
    }
    setIsYearDialogOpen(true)
  }

  const handleOpenPeriodDialog = (yearId: string, period?: AcademicPeriod) => {
    setSelectedYearId(yearId)
    if (period) {
      setEditingPeriod(period)
      setPeriodFormData({
        name: period.name,
        startDate: format(new Date(period.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(period.endDate), "yyyy-MM-dd"),
      })
    } else {
      resetPeriodForm()
    }
    setIsPeriodDialogOpen(true)
  }

  const handleSubmitYear = (e: React.FormEvent) => {
    e.preventDefault()

    if (!yearFormData.startDate || !yearFormData.endDate) {
      toast.error("Please enter start and end dates")
      return
    }

    const threshold = yearFormData.promotionThreshold 
      ? parseFloat(yearFormData.promotionThreshold) 
      : null

    startTransition(async () => {
      const data = {
        name: yearFormData.name,
        startDate: new Date(yearFormData.startDate),
        endDate: new Date(yearFormData.endDate),
        promotionThreshold: threshold,
        copyFromYearId: yearFormData.copyFromYearId || null,
      }

      const result = editingYear
        ? await updateAcademicYear(editingYear.id, data)
        : await createAcademicYear(data)

      if (result.success) {
        toast.success(editingYear ? "Academic year updated" : "Academic year created")
        setIsYearDialogOpen(false)
        resetYearForm()
      } else {
        toast.error(result.error || "Operation failed")
      }
    })
  }

  const handleSubmitPeriod = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedYearId || !periodFormData.startDate || !periodFormData.endDate) {
      toast.error("Please fill in all fields")
      return
    }

    startTransition(async () => {
      const data = {
        academicYearId: selectedYearId,
        name: periodFormData.name,
        startDate: new Date(periodFormData.startDate),
        endDate: new Date(periodFormData.endDate),
      }

      const result = editingPeriod
        ? await updateAcademicPeriod(editingPeriod.id, data)
        : await createAcademicPeriod(data)

      if (result.success) {
        toast.success(editingPeriod ? "Period updated" : "Period created")
        setIsPeriodDialogOpen(false)
        resetPeriodForm()
      } else {
        toast.error(result.error || "Operation failed")
      }
    })
  }

  const handleSetCurrent = (id: string) => {
    startTransition(async () => {
      const result = await setCurrentAcademicYear(id)
      if (result.success) {
        toast.success("Current academic year updated")
      } else {
        toast.error(result.error || "Failed to update")
      }
    })
  }

  const handleArchive = (id: string) => {
    startTransition(async () => {
      const result = await archiveAcademicYear(id)
      if (result.success) {
        toast.success("Academic year archived")
      } else {
        toast.error(result.error || "Failed to archive")
      }
    })
  }

  const handleDeleteYear = (id: string) => {
    startTransition(async () => {
      const result = await deleteAcademicYear(id)
      if (result.success) {
        toast.success("Academic year deleted")
      } else {
        toast.error(result.error || "Failed to delete")
      }
    })
  }

  const handleDeletePeriod = (id: string) => {
    startTransition(async () => {
      const result = await deleteAcademicPeriod(id)
      if (result.success) {
        toast.success("Period deleted")
      } else {
        toast.error(result.error || "Failed to delete")
      }
    })
  }

  const inputClass = "neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-foreground/20 rounded-xl h-11"

  const activeYears = years.filter(y => !y.isArchived)
  const archivedYears = years.filter(y => y.isArchived)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Academic Years
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage academic years and their terms/semesters
          </p>
        </div>
        <Dialog open={isYearDialogOpen} onOpenChange={(open) => {
          setIsYearDialogOpen(open)
          if (!open) resetYearForm()
        }}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenYearDialog()}
              className="neu-sm hover:neu rounded-xl"
              variant="ghost"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Year
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-0 neu rounded-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingYear ? "Edit Academic Year" : "Create Academic Year"}
              </DialogTitle>
              <DialogDescription>
                {editingYear 
                  ? "Update academic year details"
                  : "Create a new academic year. You can copy settings from a previous year."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitYear} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="yearName">Year Name</Label>
                <Input
                  id="yearName"
                  value={yearFormData.name}
                  onChange={(e) => setYearFormData({ ...yearFormData, name: e.target.value })}
                  className={inputClass}
                  placeholder="2024-2025"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearStartDate">Start Date</Label>
                  <Input
                    id="yearStartDate"
                    type="date"
                    value={yearFormData.startDate}
                    onChange={(e) => setYearFormData({ ...yearFormData, startDate: e.target.value })}
                    className={inputClass}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearEndDate">End Date</Label>
                  <Input
                    id="yearEndDate"
                    type="date"
                    value={yearFormData.endDate}
                    onChange={(e) => setYearFormData({ ...yearFormData, endDate: e.target.value })}
                    className={inputClass}
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Promotion Threshold (% - optional)</Label>
                <Input
                  id="threshold"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={yearFormData.promotionThreshold}
                  onChange={(e) => setYearFormData({ ...yearFormData, promotionThreshold: e.target.value })}
                  className={inputClass}
                  placeholder="50"
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Override the default promotion threshold for this year
                </p>
              </div>

              {!editingYear && activeYears.length > 0 && (
                <div className="space-y-2">
                  <Label>Copy From Previous Year (optional)</Label>
                  <Select
                    value={yearFormData.copyFromYearId || "none"}
                    onValueChange={(value) => setYearFormData({ ...yearFormData, copyFromYearId: value === "none" ? "" : value })}
                    disabled={isPending}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Start fresh" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-0 neu rounded-xl">
                      <SelectItem value="none">Start fresh</SelectItem>
                      {activeYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          <div className="flex items-center gap-2">
                            <Copy className="h-4 w-4" />
                            Copy from {year.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Copies classes, subjects, and periods from the selected year
                  </p>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsYearDialogOpen(false)}
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
                    editingYear ? "Update Year" : "Create Year"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Period Dialog */}
      <Dialog open={isPeriodDialogOpen} onOpenChange={(open) => {
        setIsPeriodDialogOpen(open)
        if (!open) resetPeriodForm()
      }}>
        <DialogContent className="glass-card border-0 neu rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingPeriod ? "Edit Period" : "Add Period"}
            </DialogTitle>
            <DialogDescription>
              Add a term, semester, or quarter to this academic year
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPeriod} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="periodName">Period Name</Label>
              <Input
                id="periodName"
                value={periodFormData.name}
                onChange={(e) => setPeriodFormData({ ...periodFormData, name: e.target.value })}
                className={inputClass}
                placeholder="Term 1, Semester A, Quarter 1, etc."
                required
                disabled={isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodStartDate">Start Date</Label>
                <Input
                  id="periodStartDate"
                  type="date"
                  value={periodFormData.startDate}
                  onChange={(e) => setPeriodFormData({ ...periodFormData, startDate: e.target.value })}
                  className={inputClass}
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEndDate">End Date</Label>
                <Input
                  id="periodEndDate"
                  type="date"
                  value={periodFormData.endDate}
                  onChange={(e) => setPeriodFormData({ ...periodFormData, endDate: e.target.value })}
                  className={inputClass}
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsPeriodDialogOpen(false)}
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
                  editingPeriod ? "Update Period" : "Add Period"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Active Years */}
      {years.length === 0 ? (
        <div className="text-center py-12 neu-sm rounded-2xl">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="font-medium mb-2">No academic years</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first academic year to get started
          </p>
          <Button
            onClick={() => handleOpenYearDialog()}
            variant="ghost"
            className="neu-sm hover:neu rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Academic Year
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Years */}
          {activeYears.length > 0 && (
            <Accordion type="multiple" className="space-y-3">
              {activeYears.map((year) => (
                <AccordionItem
                  key={year.id}
                  value={year.id}
                  className="neu-sm rounded-2xl border-0 overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3 w-full">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{year.name}</span>
                          {year.isCurrent && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-500">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(year.startDate), "MMM d, yyyy")} - {format(new Date(year.endDate), "MMM d, yyyy")}
                          {" • "}{year._count.classes} classes • {year._count.enrollments} enrollments
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 pt-2">
                      {/* Year Actions */}
                      <div className="flex flex-wrap gap-2">
                        {!year.isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetCurrent(year.id)}
                            disabled={isPending}
                            className="neu-sm hover:neu rounded-lg"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Set as Current
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenYearDialog(year)}
                          disabled={isPending}
                          className="neu-sm hover:neu rounded-lg"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        {!year.isCurrent && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isPending}
                                className="neu-sm hover:neu rounded-lg"
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="glass-card border-0 neu rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Archive {year.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Archived years become read-only. This helps keep historical data intact.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleArchive(year.id)}
                                  className="rounded-xl"
                                >
                                  Archive
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {!year.isCurrent && year._count.enrollments === 0 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isPending}
                                className="neu-sm hover:neu rounded-lg text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="glass-card border-0 neu rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {year.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this academic year and all its periods. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteYear(year.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>

                      {/* Periods Section */}
                      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Periods / Terms</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPeriodDialog(year.id)}
                            disabled={isPending}
                            className="h-8 neu-sm hover:neu rounded-lg"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Period
                          </Button>
                        </div>

                        {year.periods.length === 0 ? (
                          <div className="text-center py-6 neu rounded-xl">
                            <p className="text-sm text-muted-foreground">
                              No periods defined. Add terms, semesters, or quarters.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {year.periods.map((period, idx) => (
                              <div
                                key={period.id}
                                className="flex items-center gap-3 p-3 neu rounded-xl group"
                              >
                                <div className="text-muted-foreground">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <div className="h-8 w-8 flex items-center justify-center rounded-lg neu text-sm font-medium">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{period.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(period.startDate), "MMM d")} - {format(new Date(period.endDate), "MMM d, yyyy")}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenPeriodDialog(year.id, period)}
                                    disabled={isPending}
                                    className="h-7 w-7 rounded-md"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isPending}
                                        className="h-7 w-7 rounded-md text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="glass-card border-0 neu rounded-3xl">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete {period.name}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will delete the period. Periods with existing assignments or results cannot be deleted.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeletePeriod(period.id)}
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {/* Archived Years */}
          {archivedYears.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Archived Years
              </h4>
              {archivedYears.map((year) => (
                <div
                  key={year.id}
                  className="flex items-center gap-3 p-4 neu-sm rounded-xl opacity-60"
                >
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{year.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(year.startDate), "MMM d, yyyy")} - {format(new Date(year.endDate), "MMM d, yyyy")}
                      {" • "}{year.periods.length} periods • {year._count.classes} classes
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                    Archived
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
