"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { verifySchoolAccess } from "@/lib/auth"
import { UserRole } from "@/app/generated/prisma/client"

// ============================================
// PERIOD MANAGEMENT
// ============================================

export interface CreatePeriodInput {
  name: string
  startTime: string
  endTime: string
  order: number
  isBreak?: boolean
}

export interface UpdatePeriodInput extends Partial<CreatePeriodInput> {
  id: string
}

// Get all periods for the school
export async function getPeriods() {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, periods: [] }
  }

  try {
    const periods = await prisma.period.findMany({
      where: { schoolId: auth.school.id },
      orderBy: { order: "asc" },
    })

    return { success: true, periods }
  } catch (error) {
    console.error("Error fetching periods:", error)
    return { success: false, error: "Failed to fetch periods", periods: [] }
  }
}

// Create a new period
export async function createPeriod(input: CreatePeriodInput) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    const period = await prisma.period.create({
      data: {
        schoolId: auth.school.id,
        name: input.name,
        startTime: input.startTime,
        endTime: input.endTime,
        order: input.order,
        isBreak: input.isBreak || false,
      },
    })

    revalidatePath("/school/timetable")
    return { success: true, period }
  } catch (error) {
    console.error("Error creating period:", error)
    return { success: false, error: "Failed to create period" }
  }
}

// Update a period
export async function updatePeriod(input: UpdatePeriodInput) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify period belongs to school
    const existing = await prisma.period.findFirst({
      where: { id: input.id, schoolId: auth.school.id },
    })

    if (!existing) {
      return { success: false, error: "Period not found" }
    }

    const period = await prisma.period.update({
      where: { id: input.id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.startTime && { startTime: input.startTime }),
        ...(input.endTime && { endTime: input.endTime }),
        ...(input.order !== undefined && { order: input.order }),
        ...(input.isBreak !== undefined && { isBreak: input.isBreak }),
      },
    })

    revalidatePath("/school/timetable")
    return { success: true, period }
  } catch (error) {
    console.error("Error updating period:", error)
    return { success: false, error: "Failed to update period" }
  }
}

// Delete a period
export async function deletePeriod(id: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify period belongs to school
    const existing = await prisma.period.findFirst({
      where: { id, schoolId: auth.school.id },
    })

    if (!existing) {
      return { success: false, error: "Period not found" }
    }

    await prisma.period.delete({ where: { id } })

    revalidatePath("/school/timetable")
    return { success: true }
  } catch (error) {
    console.error("Error deleting period:", error)
    return { success: false, error: "Failed to delete period" }
  }
}

// Bulk create periods (for initial setup)
export async function bulkCreatePeriods(periods: CreatePeriodInput[]) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Delete existing periods first
    await prisma.period.deleteMany({
      where: { schoolId: auth.school.id },
    })

    // Create new periods
    await prisma.period.createMany({
      data: periods.map((p) => ({
        schoolId: auth.school!.id,
        name: p.name,
        startTime: p.startTime,
        endTime: p.endTime,
        order: p.order,
        isBreak: p.isBreak || false,
      })),
    })

    revalidatePath("/school/timetable")
    return { success: true }
  } catch (error) {
    console.error("Error creating periods:", error)
    return { success: false, error: "Failed to create periods" }
  }
}

// ============================================
// TIMETABLE SLOT MANAGEMENT
// ============================================

export interface CreateTimetableSlotInput {
  classId: string
  periodId: string
  dayOfWeek: number
  classSubjectId?: string
  teacherId?: string
  roomNumber?: string
}

export interface UpdateTimetableSlotInput extends Partial<CreateTimetableSlotInput> {
  id: string
}

// Get timetable for a specific class
export async function getClassTimetable(classId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, slots: [], periods: [] }
  }

  try {
    const [slots, periods] = await Promise.all([
      prisma.timetableSlot.findMany({
        where: { classId },
        include: {
          period: true,
          classSubject: {
            include: {
              subject: true,
            },
          },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [{ dayOfWeek: "asc" }, { period: { order: "asc" } }],
      }),
      prisma.period.findMany({
        where: { schoolId: auth.school.id },
        orderBy: { order: "asc" },
      }),
    ])

    return { success: true, slots, periods }
  } catch (error) {
    console.error("Error fetching class timetable:", error)
    return { success: false, error: "Failed to fetch timetable", slots: [], periods: [] }
  }
}

// Get timetable for a specific teacher
export async function getTeacherTimetable(teacherId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, slots: [], periods: [] }
  }

  try {
    const [slots, periods] = await Promise.all([
      prisma.timetableSlot.findMany({
        where: { teacherId },
        include: {
          period: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          classSubject: {
            include: {
              subject: true,
            },
          },
        },
        orderBy: [{ dayOfWeek: "asc" }, { period: { order: "asc" } }],
      }),
      prisma.period.findMany({
        where: { schoolId: auth.school.id },
        orderBy: { order: "asc" },
      }),
    ])

    return { success: true, slots, periods }
  } catch (error) {
    console.error("Error fetching teacher timetable:", error)
    return { success: false, error: "Failed to fetch timetable", slots: [], periods: [] }
  }
}

// Create or update a timetable slot
export async function upsertTimetableSlot(input: CreateTimetableSlotInput) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Check for teacher conflicts (same teacher, same period, same day)
    if (input.teacherId) {
      const teacherConflict = await prisma.timetableSlot.findFirst({
        where: {
          teacherId: input.teacherId,
          periodId: input.periodId,
          dayOfWeek: input.dayOfWeek,
          NOT: { classId: input.classId },
        },
        include: {
          class: true,
        },
      })

      if (teacherConflict) {
        return {
          success: false,
          error: `Teacher is already assigned to ${teacherConflict.class.name} at this time`,
        }
      }
    }

    // Upsert the slot
    const slot = await prisma.timetableSlot.upsert({
      where: {
        classId_periodId_dayOfWeek: {
          classId: input.classId,
          periodId: input.periodId,
          dayOfWeek: input.dayOfWeek,
        },
      },
      create: {
        classId: input.classId,
        periodId: input.periodId,
        dayOfWeek: input.dayOfWeek,
        classSubjectId: input.classSubjectId,
        teacherId: input.teacherId,
        roomNumber: input.roomNumber,
      },
      update: {
        classSubjectId: input.classSubjectId,
        teacherId: input.teacherId,
        roomNumber: input.roomNumber,
      },
      include: {
        period: true,
        classSubject: {
          include: { subject: true },
        },
        teacher: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    revalidatePath("/school/timetable")
    return { success: true, slot }
  } catch (error) {
    console.error("Error upserting timetable slot:", error)
    return { success: false, error: "Failed to save timetable slot" }
  }
}

// Delete a timetable slot (clear the slot)
export async function deleteTimetableSlot(classId: string, periodId: string, dayOfWeek: number) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    await prisma.timetableSlot.delete({
      where: {
        classId_periodId_dayOfWeek: {
          classId,
          periodId,
          dayOfWeek,
        },
      },
    })

    revalidatePath("/school/timetable")
    return { success: true }
  } catch (error) {
    console.error("Error deleting timetable slot:", error)
    return { success: false, error: "Failed to delete timetable slot" }
  }
}

// Get all data needed for timetable management
export async function getTimetableData() {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { 
      success: false, 
      error: auth.error, 
      periods: [], 
      classes: [], 
      teachers: [],
      subjects: [],
    }
  }

  try {
    const periods = await prisma.period.findMany({
      where: { schoolId: auth.school.id },
      orderBy: { order: "asc" },
    })

    const classesWithSubjects = await prisma.class.findMany({
      where: { 
        schoolId: auth.school.id,
      },
      include: {
        classSubjects: {
          include: {
            subject: true,
            teacher: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    })

    const teachers = await prisma.user.findMany({
      where: {
        schoolId: auth.school.id,
        role: UserRole.TEACHER,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    })

    const subjects = await prisma.subject.findMany({
      where: { schoolId: auth.school.id },
      orderBy: { name: "asc" },
    })

    // Serialize Decimal fields in classSubjects for client components
    const classes = classesWithSubjects.map(cls => ({
      ...cls,
      classSubjects: cls.classSubjects.map(cs => ({
        ...cs,
        hoursPerWeek: Number(cs.hoursPerWeek),
      })),
    }))

    return { 
      success: true, 
      periods, 
      classes, 
      teachers,
      subjects,
    }
  } catch (error) {
    console.error("Error fetching timetable data:", error)
    return { 
      success: false, 
      error: "Failed to fetch timetable data", 
      periods: [], 
      classes: [], 
      teachers: [],
      subjects: [],
    }
  }
}

// Check for conflicts in a teacher's schedule
export async function checkTeacherConflicts(teacherId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, conflicts: [] }
  }

  try {
    // Get all slots for the teacher
    const slots = await prisma.timetableSlot.findMany({
      where: { teacherId },
      include: {
        period: true,
        class: true,
      },
    })

    // Group by day and period to find conflicts
    const slotMap = new Map<string, typeof slots>()
    for (const slot of slots) {
      const key = `${slot.dayOfWeek}-${slot.periodId}`
      if (!slotMap.has(key)) {
        slotMap.set(key, [])
      }
      slotMap.get(key)!.push(slot)
    }

    // Find duplicates (conflicts)
    const conflicts = []
    for (const [key, slotGroup] of slotMap) {
      if (slotGroup.length > 1) {
        conflicts.push({
          dayOfWeek: slotGroup[0].dayOfWeek,
          period: slotGroup[0].period,
          classes: slotGroup.map((s) => s.class.name),
        })
      }
    }

    return { success: true, conflicts }
  } catch (error) {
    console.error("Error checking teacher conflicts:", error)
    return { success: false, error: "Failed to check conflicts", conflicts: [] }
  }
}

// ============================================
// SUBJECT TIME ALLOCATION (HOURS)
// ============================================

export interface UpdateSubjectAllocationInput {
  classSubjectId: string
  hoursPerWeek: number // Hours per week (e.g., 4.5 hours)
}

// Helper to calculate period duration in minutes from start and end time
function getPeriodDurationMinutes(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number)
  const [endHour, endMin] = endTime.split(":").map(Number)
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  return endMinutes - startMinutes
}

// Helper to convert hours to number of periods needed
function hoursToPeriodsNeeded(hours: number, periodDurationMinutes: number): number {
  const totalMinutes = hours * 60
  return Math.round(totalMinutes / periodDurationMinutes)
}

// Get all class subjects with their time allocations for a class
export async function getClassSubjectAllocations(classId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, allocations: [], periodDurationMinutes: 45 }
  }

  try {
    // Get first non-break period to determine period duration
    const firstPeriod = await prisma.period.findFirst({
      where: { schoolId: auth.school.id, isBreak: false },
      orderBy: { order: "asc" },
    })
    
    const periodDurationMinutes = firstPeriod 
      ? getPeriodDurationMinutes(firstPeriod.startTime, firstPeriod.endTime)
      : 45 // Default 45 minutes

    const allocations = await prisma.classSubject.findMany({
      where: { classId },
      include: {
        subject: true,
        teacher: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { subject: { name: "asc" } },
    })

    // Convert Decimal to number for client component serialization
    const serializedAllocations = allocations.map(a => ({
      ...a,
      hoursPerWeek: Number(a.hoursPerWeek),
    }))

    return { success: true, allocations: serializedAllocations, periodDurationMinutes }
  } catch (error) {
    console.error("Error fetching subject allocations:", error)
    return { success: false, error: "Failed to fetch allocations", allocations: [], periodDurationMinutes: 45 }
  }
}

// Update time allocation for a class subject
export async function updateSubjectAllocation(input: UpdateSubjectAllocationInput) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    await prisma.classSubject.update({
      where: { id: input.classSubjectId },
      data: { hoursPerWeek: input.hoursPerWeek },
    })

    revalidatePath("/school/timetable")
    return { success: true }
  } catch (error) {
    console.error("Error updating subject allocation:", error)
    return { success: false, error: "Failed to update allocation" }
  }
}

// Bulk update time allocations for a class
export async function bulkUpdateSubjectAllocations(allocations: UpdateSubjectAllocationInput[]) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    await prisma.$transaction(
      allocations.map((a) =>
        prisma.classSubject.update({
          where: { id: a.classSubjectId },
          data: { hoursPerWeek: a.hoursPerWeek },
        })
      )
    )

    revalidatePath("/school/timetable")
    return { success: true }
  } catch (error) {
    console.error("Error bulk updating subject allocations:", error)
    return { success: false, error: "Failed to update allocations" }
  }
}

// ============================================
// AUTO-GENERATE TIMETABLE
// ============================================

interface GenerationSlot {
  periodId: string
  dayOfWeek: number
  periodOrder: number
  isBreak: boolean
}

interface TeacherBusyMap {
  [key: string]: Set<string> // teacherId -> Set of "dayOfWeek-periodId"
}

interface ClassDaySubjectCount {
  [key: string]: { [subjectId: string]: number } // "classId-dayOfWeek" -> { subjectId: count }
}

// Validate that allocations don't exceed available slots
export async function validateAllocations(classId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, isValid: false, message: "" }
  }

  try {
    // Get periods (excluding breaks)
    const periods = await prisma.period.findMany({
      where: { schoolId: auth.school.id, isBreak: false },
    })

    if (periods.length === 0) {
      return { success: false, error: "No periods configured", isValid: false, message: "No periods configured" }
    }

    // Calculate period duration
    const firstPeriod = periods[0]
    const periodDurationMinutes = getPeriodDurationMinutes(firstPeriod.startTime, firstPeriod.endTime)

    // Get class subjects with allocations
    const classSubjects = await prisma.classSubject.findMany({
      where: { classId },
      include: { subject: true },
    })

    const workingDays = 5 // Monday to Friday
    const totalAvailableSlots = periods.length * workingDays
    const totalAvailableHours = (totalAvailableSlots * periodDurationMinutes) / 60
    
    // Calculate total hours allocated
    const totalAllocatedHours = classSubjects.reduce(
      (sum, cs) => sum + Number(cs.hoursPerWeek || 0), 
      0
    )
    
    // Convert hours to periods needed
    const totalPeriodsNeeded = hoursToPeriodsNeeded(totalAllocatedHours, periodDurationMinutes)

    if (totalPeriodsNeeded > totalAvailableSlots) {
      return {
        success: true,
        isValid: false,
        message: `Total allocated hours (${totalAllocatedHours.toFixed(1)}h = ${totalPeriodsNeeded} periods) exceeds available slots (${totalAvailableSlots}). Please reduce allocations.`,
        totalAvailableSlots,
        totalAvailableHours,
        totalAllocatedHours,
        totalPeriodsNeeded,
      }
    }

    return {
      success: true,
      isValid: true,
      message: `Allocations are valid. ${totalAllocatedHours.toFixed(1)}h (${totalPeriodsNeeded} periods) / ${totalAvailableSlots} slots allocated.`,
      totalAvailableSlots,
      totalAvailableHours,
      totalAllocatedHours,
      totalPeriodsNeeded,
    }
  } catch (error) {
    console.error("Error validating allocations:", error)
    return { success: false, error: "Failed to validate allocations", isValid: false, message: "" }
  }
}

// Check for potential teacher conflicts across all classes
export async function checkAllTeacherConflicts() {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, conflicts: [] }
  }

  try {
    // Get all timetable slots with teachers
    const slots = await prisma.timetableSlot.findMany({
      where: {
        class: { schoolId: auth.school.id },
        teacherId: { not: null },
      },
      include: {
        period: true,
        class: true,
        teacher: {
          select: { id: true, firstName: true, lastName: true },
        },
        classSubject: {
          include: { subject: true },
        },
      },
    })

    // Group by teacher, day, and period
    const teacherSlots = new Map<string, typeof slots>()
    for (const slot of slots) {
      if (!slot.teacherId) continue
      const key = `${slot.teacherId}-${slot.dayOfWeek}-${slot.periodId}`
      if (!teacherSlots.has(key)) {
        teacherSlots.set(key, [])
      }
      teacherSlots.get(key)!.push(slot)
    }

    // Find conflicts
    const conflicts = []
    for (const [, slotGroup] of teacherSlots) {
      if (slotGroup.length > 1) {
        const teacher = slotGroup[0].teacher
        conflicts.push({
          teacher: teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown",
          teacherId: slotGroup[0].teacherId,
          dayOfWeek: slotGroup[0].dayOfWeek,
          period: slotGroup[0].period.name,
          periodTime: `${slotGroup[0].period.startTime} - ${slotGroup[0].period.endTime}`,
          classes: slotGroup.map((s) => ({
            className: s.class.name,
            subject: s.classSubject?.subject.name || "Unknown",
          })),
        })
      }
    }

    return { success: true, conflicts }
  } catch (error) {
    console.error("Error checking all teacher conflicts:", error)
    return { success: false, error: "Failed to check conflicts", conflicts: [] }
  }
}

// Auto-generate timetable for a specific class
export async function generateClassTimetable(classId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Validate allocations first
    const validation = await validateAllocations(classId)
    if (!validation.success || !validation.isValid) {
      return { success: false, error: validation.message || validation.error }
    }

    // Get periods (excluding breaks)
    const periods = await prisma.period.findMany({
      where: { schoolId: auth.school.id, isBreak: false },
      orderBy: { order: "asc" },
    })

    if (periods.length === 0) {
      return { success: false, error: "No periods configured. Please set up periods first." }
    }

    // Calculate period duration
    const firstPeriod = periods[0]
    const periodDurationMinutes = getPeriodDurationMinutes(firstPeriod.startTime, firstPeriod.endTime)

    // Get class subjects with allocations and teachers (filter by hoursPerWeek > 0)
    const classSubjects = await prisma.classSubject.findMany({
      where: { classId },
      include: {
        subject: true,
        teacher: true,
      },
    })

    // Filter subjects that have hours allocated and calculate periods needed
    const subjectsWithPeriods = classSubjects
      .filter(cs => Number(cs.hoursPerWeek || 0) > 0)
      .map(cs => ({
        ...cs,
        periodsNeeded: hoursToPeriodsNeeded(Number(cs.hoursPerWeek || 0), periodDurationMinutes)
      }))

    if (subjectsWithPeriods.length === 0) {
      return { success: false, error: "No subjects with time allocations found. Please set up allocations first." }
    }

    // Get existing slots for other classes (to check teacher availability)
    const existingSlots = await prisma.timetableSlot.findMany({
      where: {
        class: { schoolId: auth.school.id },
        NOT: { classId },
        teacherId: { not: null },
      },
      select: { teacherId: true, dayOfWeek: true, periodId: true },
    })

    // Build teacher busy map
    const teacherBusy: TeacherBusyMap = {}
    for (const slot of existingSlots) {
      if (!slot.teacherId) continue
      if (!teacherBusy[slot.teacherId]) {
        teacherBusy[slot.teacherId] = new Set()
      }
      teacherBusy[slot.teacherId].add(`${slot.dayOfWeek}-${slot.periodId}`)
    }

    // Generate available slots (Monday=1 to Friday=5)
    const workingDays = [1, 2, 3, 4, 5]
    const availableSlots: GenerationSlot[] = []
    for (const day of workingDays) {
      for (const period of periods) {
        availableSlots.push({
          periodId: period.id,
          dayOfWeek: day,
          periodOrder: period.order,
          isBreak: period.isBreak,
        })
      }
    }

    // Clear existing timetable for this class
    await prisma.timetableSlot.deleteMany({ where: { classId } })

    // Track what we've assigned
    const assignedSlots = new Set<string>() // "dayOfWeek-periodId"
    const daySubjectCount: { [day: number]: { [subjectId: string]: number } } = {}
    for (const day of workingDays) {
      daySubjectCount[day] = {}
    }

    // Sort subjects by periods needed (descending) - prioritize subjects with more periods
    const sortedSubjects = [...subjectsWithPeriods].sort((a, b) => b.periodsNeeded - a.periodsNeeded)

    // Generate timetable slots
    const newSlots: {
      classId: string
      periodId: string
      dayOfWeek: number
      classSubjectId: string
      teacherId: string | null
    }[] = []

    for (const cs of sortedSubjects) {
      let periodsToAssign = cs.periodsNeeded
      
      // Try to distribute across days evenly
      const periodsPerDay = Math.ceil(periodsToAssign / workingDays.length)
      
      for (const day of workingDays) {
        if (periodsToAssign <= 0) break
        
        // Limit to max periods per day for this subject (try to avoid more than 2 per day)
        const maxPerDay = Math.min(periodsPerDay, 2)
        const currentDayCount = daySubjectCount[day][cs.subjectId] || 0
        
        if (currentDayCount >= maxPerDay) continue

        // Find available slots for this day
        const daySlots = availableSlots.filter(
          (slot) =>
            slot.dayOfWeek === day &&
            !assignedSlots.has(`${slot.dayOfWeek}-${slot.periodId}`)
        )

        for (const slot of daySlots) {
          if (periodsToAssign <= 0) break
          if ((daySubjectCount[day][cs.subjectId] || 0) >= maxPerDay) break

          // Check if teacher is available
          const slotKey = `${slot.dayOfWeek}-${slot.periodId}`
          if (cs.teacherId && teacherBusy[cs.teacherId]?.has(slotKey)) {
            continue // Teacher is busy, skip this slot
          }

          // Assign the slot
          newSlots.push({
            classId,
            periodId: slot.periodId,
            dayOfWeek: slot.dayOfWeek,
            classSubjectId: cs.id,
            teacherId: cs.teacherId,
          })

          assignedSlots.add(slotKey)
          daySubjectCount[day][cs.subjectId] = (daySubjectCount[day][cs.subjectId] || 0) + 1
          
          // Mark teacher as busy for this slot
          if (cs.teacherId) {
            if (!teacherBusy[cs.teacherId]) {
              teacherBusy[cs.teacherId] = new Set()
            }
            teacherBusy[cs.teacherId].add(slotKey)
          }

          periodsToAssign--
        }
      }

      // If we still have periods to assign, try any available slot
      if (periodsToAssign > 0) {
        for (const slot of availableSlots) {
          if (periodsToAssign <= 0) break
          
          const slotKey = `${slot.dayOfWeek}-${slot.periodId}`
          if (assignedSlots.has(slotKey)) continue
          
          // Check if teacher is available
          if (cs.teacherId && teacherBusy[cs.teacherId]?.has(slotKey)) {
            continue
          }

          newSlots.push({
            classId,
            periodId: slot.periodId,
            dayOfWeek: slot.dayOfWeek,
            classSubjectId: cs.id,
            teacherId: cs.teacherId,
          })

          assignedSlots.add(slotKey)
          daySubjectCount[slot.dayOfWeek][cs.subjectId] = (daySubjectCount[slot.dayOfWeek][cs.subjectId] || 0) + 1
          
          if (cs.teacherId) {
            if (!teacherBusy[cs.teacherId]) {
              teacherBusy[cs.teacherId] = new Set()
            }
            teacherBusy[cs.teacherId].add(slotKey)
          }

          periodsToAssign--
        }
      }

      // Check if we couldn't assign all periods
      if (periodsToAssign > 0) {
        // Rollback and return error
        await prisma.timetableSlot.deleteMany({ where: { classId } })
        return {
          success: false,
          error: `Could not assign all periods for ${cs.subject.name}. ${periodsToAssign} periods remaining. The teacher may have conflicts with other classes.`,
        }
      }
    }

    // Create all slots
    if (newSlots.length > 0) {
      await prisma.timetableSlot.createMany({ data: newSlots })
    }

    revalidatePath("/school/timetable")
    return {
      success: true,
      message: `Successfully generated timetable with ${newSlots.length} slots.`,
      slotsCreated: newSlots.length,
    }
  } catch (error) {
    console.error("Error generating timetable:", error)
    return { success: false, error: "Failed to generate timetable" }
  }
}

// Auto-generate timetable for all classes
export async function generateAllClassesTimetable() {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Get all classes
    const classes = await prisma.class.findMany({
      where: { schoolId: auth.school.id },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    })

    if (classes.length === 0) {
      return { success: false, error: "No classes found." }
    }

    const results: { classId: string; className: string; success: boolean; error?: string }[] = []

    // Clear all existing timetables first
    await prisma.timetableSlot.deleteMany({
      where: { class: { schoolId: auth.school.id } },
    })

    // Generate timetable for each class
    for (const cls of classes) {
      const result = await generateClassTimetableInternal(cls.id, auth.school.id)
      results.push({
        classId: cls.id,
        className: cls.name,
        success: result.success,
        error: result.error,
      })
    }

    const successCount = results.filter((r) => r.success).length
    const failedClasses = results.filter((r) => !r.success)

    revalidatePath("/school/timetable")
    
    if (failedClasses.length > 0) {
      return {
        success: false,
        error: `Generated timetable for ${successCount}/${classes.length} classes. Failed: ${failedClasses.map((c) => c.className).join(", ")}`,
        results,
      }
    }

    return {
      success: true,
      message: `Successfully generated timetable for all ${classes.length} classes.`,
      results,
    }
  } catch (error) {
    console.error("Error generating all timetables:", error)
    return { success: false, error: "Failed to generate timetables" }
  }
}

// Internal helper for generating single class timetable (used by bulk generation)
async function generateClassTimetableInternal(classId: string, schoolId: string) {
  try {
    // Get periods (excluding breaks)
    const periods = await prisma.period.findMany({
      where: { schoolId, isBreak: false },
      orderBy: { order: "asc" },
    })

    if (periods.length === 0) {
      return { success: false, error: "No periods configured" }
    }

    // Calculate period duration
    const firstPeriod = periods[0]
    const periodDurationMinutes = getPeriodDurationMinutes(firstPeriod.startTime, firstPeriod.endTime)

    // Get class subjects with allocations
    const classSubjects = await prisma.classSubject.findMany({
      where: { classId },
      include: { subject: true, teacher: true },
    })

    // Filter subjects with hours allocated and calculate periods needed
    const subjectsWithPeriods = classSubjects
      .filter(cs => Number(cs.hoursPerWeek || 0) > 0)
      .map(cs => ({
        ...cs,
        periodsNeeded: hoursToPeriodsNeeded(Number(cs.hoursPerWeek || 0), periodDurationMinutes)
      }))

    if (subjectsWithPeriods.length === 0) {
      return { success: true, message: "No subjects with allocations" } // Not an error, just skip
    }

    // Validate allocations
    const workingDays = [1, 2, 3, 4, 5]
    const totalAvailableSlots = periods.length * workingDays.length
    const totalPeriodsNeeded = subjectsWithPeriods.reduce((sum, cs) => sum + cs.periodsNeeded, 0)

    if (totalPeriodsNeeded > totalAvailableSlots) {
      return { success: false, error: `Allocations exceed available slots` }
    }

    // Get existing slots (for teacher availability)
    const existingSlots = await prisma.timetableSlot.findMany({
      where: {
        class: { schoolId },
        NOT: { classId },
        teacherId: { not: null },
      },
      select: { teacherId: true, dayOfWeek: true, periodId: true },
    })

    // Build teacher busy map
    const teacherBusy: TeacherBusyMap = {}
    for (const slot of existingSlots) {
      if (!slot.teacherId) continue
      if (!teacherBusy[slot.teacherId]) {
        teacherBusy[slot.teacherId] = new Set()
      }
      teacherBusy[slot.teacherId].add(`${slot.dayOfWeek}-${slot.periodId}`)
    }

    // Generate available slots
    const availableSlots: GenerationSlot[] = []
    for (const day of workingDays) {
      for (const period of periods) {
        availableSlots.push({
          periodId: period.id,
          dayOfWeek: day,
          periodOrder: period.order,
          isBreak: false,
        })
      }
    }

    // Track assignments
    const assignedSlots = new Set<string>()
    const daySubjectCount: { [day: number]: { [subjectId: string]: number } } = {}
    for (const day of workingDays) {
      daySubjectCount[day] = {}
    }

    // Sort by periods needed
    const sortedSubjects = [...subjectsWithPeriods].sort((a, b) => b.periodsNeeded - a.periodsNeeded)

    const newSlots: {
      classId: string
      periodId: string
      dayOfWeek: number
      classSubjectId: string
      teacherId: string | null
    }[] = []

    for (const cs of sortedSubjects) {
      let periodsToAssign = cs.periodsNeeded

      for (const day of workingDays) {
        if (periodsToAssign <= 0) break

        const maxPerDay = 2
        const currentDayCount = daySubjectCount[day][cs.subjectId] || 0
        if (currentDayCount >= maxPerDay) continue

        const daySlots = availableSlots.filter(
          (slot) =>
            slot.dayOfWeek === day &&
            !assignedSlots.has(`${slot.dayOfWeek}-${slot.periodId}`)
        )

        for (const slot of daySlots) {
          if (periodsToAssign <= 0) break
          if ((daySubjectCount[day][cs.subjectId] || 0) >= maxPerDay) break

          const slotKey = `${slot.dayOfWeek}-${slot.periodId}`
          if (cs.teacherId && teacherBusy[cs.teacherId]?.has(slotKey)) {
            continue
          }

          newSlots.push({
            classId,
            periodId: slot.periodId,
            dayOfWeek: slot.dayOfWeek,
            classSubjectId: cs.id,
            teacherId: cs.teacherId,
          })

          assignedSlots.add(slotKey)
          daySubjectCount[day][cs.subjectId] = (daySubjectCount[day][cs.subjectId] || 0) + 1

          if (cs.teacherId) {
            if (!teacherBusy[cs.teacherId]) {
              teacherBusy[cs.teacherId] = new Set()
            }
            teacherBusy[cs.teacherId].add(slotKey)
          }

          periodsToAssign--
        }
      }

      // Try remaining slots
      if (periodsToAssign > 0) {
        for (const slot of availableSlots) {
          if (periodsToAssign <= 0) break

          const slotKey = `${slot.dayOfWeek}-${slot.periodId}`
          if (assignedSlots.has(slotKey)) continue
          if (cs.teacherId && teacherBusy[cs.teacherId]?.has(slotKey)) continue

          newSlots.push({
            classId,
            periodId: slot.periodId,
            dayOfWeek: slot.dayOfWeek,
            classSubjectId: cs.id,
            teacherId: cs.teacherId,
          })

          assignedSlots.add(slotKey)
          daySubjectCount[slot.dayOfWeek][cs.subjectId] = (daySubjectCount[slot.dayOfWeek][cs.subjectId] || 0) + 1

          if (cs.teacherId) {
            if (!teacherBusy[cs.teacherId]) {
              teacherBusy[cs.teacherId] = new Set()
            }
            teacherBusy[cs.teacherId].add(slotKey)
          }

          periodsToAssign--
        }
      }

      if (periodsToAssign > 0) {
        return { success: false, error: `Could not assign all periods for ${cs.subject.name}` }
      }
    }

    if (newSlots.length > 0) {
      await prisma.timetableSlot.createMany({ data: newSlots })
    }

    return { success: true }
  } catch (error) {
    console.error("Error in generateClassTimetableInternal:", error)
    return { success: false, error: "Internal error" }
  }
}