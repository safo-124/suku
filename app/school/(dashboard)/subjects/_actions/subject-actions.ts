"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { verifySchoolAccess } from "@/lib/auth"
import { UserRole, SubjectType } from "@/app/generated/prisma/client"

// Types
export interface CreateSubjectInput {
  name: string
  code?: string
  description?: string
  isRequiredForPromotion?: boolean
}

export interface UpdateSubjectInput extends Partial<CreateSubjectInput> {
  id: string
}

export interface SubjectFilters {
  search?: string
  levelId?: string
  page?: number
  limit?: number
}

export interface AssignSubjectToLevelInput {
  subjectId: string
  levelId: string
  subjectType: SubjectType
  isCompulsory: boolean
}

// Get all subjects for the current school
export async function getSubjects(filters: SubjectFilters = {}) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, subjects: [], total: 0 }
  }

  const { search, levelId, page = 1, limit = 50 } = filters
  const skip = (page - 1) * limit

  try {
    const where = {
      schoolId: auth.school.id,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { code: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(levelId && {
        levelSubjects: {
          some: { levelId },
        },
      }),
    }

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        include: {
          levelSubjects: {
            include: {
              level: {
                select: {
                  id: true,
                  name: true,
                  shortName: true,
                },
              },
            },
          },
          _count: {
            select: {
              classSubjects: true,
              questions: true,
            },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.subject.count({ where }),
    ])

    return { 
      success: true, 
      subjects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return { success: false, error: "Failed to fetch subjects", subjects: [], total: 0 }
  }
}

// Get a single subject by ID
export async function getSubject(subjectId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId: auth.school.id,
      },
      include: {
        levelSubjects: {
          include: {
            level: {
              select: {
                id: true,
                name: true,
                shortName: true,
                allowElectives: true,
              },
            },
          },
        },
        classSubjects: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
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
        },
        _count: {
          select: {
            classSubjects: true,
            questions: true,
          },
        },
      },
    })

    if (!subject) {
      return { success: false, error: "Subject not found" }
    }

    return { success: true, subject }
  } catch (error) {
    console.error("Error fetching subject:", error)
    return { success: false, error: "Failed to fetch subject" }
  }
}

// Create a new subject
export async function createSubject(data: CreateSubjectInput) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Check if subject name already exists
    const existingName = await prisma.subject.findFirst({
      where: {
        schoolId: auth.school.id,
        name: { equals: data.name, mode: "insensitive" },
      },
    })

    if (existingName) {
      return { success: false, error: "A subject with this name already exists" }
    }

    // Check if subject code already exists (if provided)
    if (data.code) {
      const existingCode = await prisma.subject.findFirst({
        where: {
          schoolId: auth.school.id,
          code: { equals: data.code, mode: "insensitive" },
        },
      })

      if (existingCode) {
        return { success: false, error: "A subject with this code already exists" }
      }
    }

    const subject = await prisma.subject.create({
      data: {
        schoolId: auth.school.id,
        name: data.name,
        code: data.code || null,
        description: data.description || null,
        isRequiredForPromotion: data.isRequiredForPromotion || false,
      },
    })

    revalidatePath("/school/subjects")
    revalidatePath("/school/settings")
    return { success: true, subject }
  } catch (error) {
    console.error("Error creating subject:", error)
    return { success: false, error: "Failed to create subject" }
  }
}

// Update a subject
export async function updateSubject(data: UpdateSubjectInput) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify subject belongs to this school
    const existingSubject = await prisma.subject.findFirst({
      where: {
        id: data.id,
        schoolId: auth.school.id,
      },
    })

    if (!existingSubject) {
      return { success: false, error: "Subject not found" }
    }

    // Check name uniqueness if changed
    if (data.name && data.name.toLowerCase() !== existingSubject.name.toLowerCase()) {
      const duplicateName = await prisma.subject.findFirst({
        where: {
          schoolId: auth.school.id,
          name: { equals: data.name, mode: "insensitive" },
          NOT: { id: data.id },
        },
      })
      if (duplicateName) {
        return { success: false, error: "A subject with this name already exists" }
      }
    }

    // Check code uniqueness if changed
    if (data.code && data.code.toLowerCase() !== (existingSubject.code?.toLowerCase() || "")) {
      const duplicateCode = await prisma.subject.findFirst({
        where: {
          schoolId: auth.school.id,
          code: { equals: data.code, mode: "insensitive" },
          NOT: { id: data.id },
        },
      })
      if (duplicateCode) {
        return { success: false, error: "A subject with this code already exists" }
      }
    }

    const updatedSubject = await prisma.subject.update({
      where: { id: data.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.code !== undefined && { code: data.code || null }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.isRequiredForPromotion !== undefined && { isRequiredForPromotion: data.isRequiredForPromotion }),
      },
    })

    revalidatePath("/school/subjects")
    revalidatePath("/school/settings")
    return { success: true, subject: updatedSubject }
  } catch (error) {
    console.error("Error updating subject:", error)
    return { success: false, error: "Failed to update subject" }
  }
}

// Delete a subject
export async function deleteSubject(subjectId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify subject belongs to this school
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId: auth.school.id,
      },
      include: {
        _count: { 
          select: { 
            classSubjects: true,
            questions: true,
          } 
        },
      },
    })

    if (!subject) {
      return { success: false, error: "Subject not found" }
    }

    if (subject._count.classSubjects > 0) {
      return { 
        success: false, 
        error: `Cannot delete subject assigned to ${subject._count.classSubjects} class(es). Remove from all classes first.` 
      }
    }

    if (subject._count.questions > 0) {
      return { 
        success: false, 
        error: `Cannot delete subject with ${subject._count.questions} question(s). Delete questions first.` 
      }
    }

    // Delete level assignments first
    await prisma.levelSubject.deleteMany({
      where: { subjectId },
    })

    // Delete the subject
    await prisma.subject.delete({
      where: { id: subjectId },
    })

    revalidatePath("/school/subjects")
    revalidatePath("/school/settings")
    return { success: true }
  } catch (error) {
    console.error("Error deleting subject:", error)
    return { success: false, error: "Failed to delete subject" }
  }
}

// Assign subject to a school level
export async function assignSubjectToLevel(data: AssignSubjectToLevelInput) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify subject belongs to this school
    const subject = await prisma.subject.findFirst({
      where: { id: data.subjectId, schoolId: auth.school.id },
    })

    if (!subject) {
      return { success: false, error: "Subject not found" }
    }

    // Verify level belongs to this school
    const level = await prisma.schoolLevel.findFirst({
      where: { id: data.levelId, schoolId: auth.school.id },
    })

    if (!level) {
      return { success: false, error: "School level not found" }
    }

    // Check if already assigned
    const existingAssignment = await prisma.levelSubject.findFirst({
      where: {
        subjectId: data.subjectId,
        levelId: data.levelId,
      },
    })

    // Use transaction to create LevelSubject and ClassSubjects atomically
    await prisma.$transaction(async (tx) => {
      if (existingAssignment) {
        // Update existing assignment
        await tx.levelSubject.update({
          where: { id: existingAssignment.id },
          data: {
            subjectType: data.subjectType,
            isCompulsory: data.isCompulsory,
          },
        })
      } else {
        // Create new assignment
        await tx.levelSubject.create({
          data: {
            subjectId: data.subjectId,
            levelId: data.levelId,
            subjectType: data.subjectType,
            isCompulsory: data.isCompulsory,
          },
        })
      }

      // Get all classes in this level (across all academic years)
      const classesInLevel = await tx.class.findMany({
        where: {
          schoolId: auth.school!.id,
          schoolLevelId: data.levelId,
        },
        select: { id: true },
      })

      // Create ClassSubject for each class if it doesn't exist
      for (const cls of classesInLevel) {
        const existingClassSubject = await tx.classSubject.findUnique({
          where: {
            classId_subjectId: {
              classId: cls.id,
              subjectId: data.subjectId,
            },
          },
        })

        if (!existingClassSubject) {
          await tx.classSubject.create({
            data: {
              classId: cls.id,
              subjectId: data.subjectId,
            },
          })
        }
      }
    })

    revalidatePath("/school/subjects")
    revalidatePath("/school/settings")
    revalidatePath("/school/classes")
    revalidatePath("/school/teachers")
    return { success: true }
  } catch (error) {
    console.error("Error assigning subject to level:", error)
    return { success: false, error: "Failed to assign subject to level" }
  }
}

// Remove subject from a school level
export async function removeSubjectFromLevel(subjectId: string, levelId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify subject belongs to this school
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId: auth.school.id },
    })

    if (!subject) {
      return { success: false, error: "Subject not found" }
    }

    // Delete the level assignment
    await prisma.levelSubject.deleteMany({
      where: {
        subjectId,
        levelId,
      },
    })

    revalidatePath("/school/subjects")
    revalidatePath("/school/settings")
    return { success: true }
  } catch (error) {
    console.error("Error removing subject from level:", error)
    return { success: false, error: "Failed to remove subject from level" }
  }
}

// Bulk assign subjects to a level
export async function bulkAssignSubjectsToLevel(
  levelId: string,
  assignments: { subjectId: string; subjectType: SubjectType; isCompulsory: boolean }[]
) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify level belongs to this school
    const level = await prisma.schoolLevel.findFirst({
      where: { id: levelId, schoolId: auth.school.id },
    })

    if (!level) {
      return { success: false, error: "School level not found" }
    }

    // Clear existing assignments for this level
    await prisma.levelSubject.deleteMany({
      where: { levelId },
    })

    // Create new assignments
    if (assignments.length > 0) {
      await prisma.levelSubject.createMany({
        data: assignments.map((a) => ({
          levelId,
          subjectId: a.subjectId,
          subjectType: a.subjectType,
          isCompulsory: a.isCompulsory,
        })),
      })
    }

    revalidatePath("/school/subjects")
    revalidatePath("/school/settings")
    return { success: true }
  } catch (error) {
    console.error("Error bulk assigning subjects:", error)
    return { success: false, error: "Failed to assign subjects" }
  }
}

// Get school levels for dropdown
export async function getSchoolLevelsForSubjects() {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, levels: [] }
  }

  try {
    const levels = await prisma.schoolLevel.findMany({
      where: { schoolId: auth.school.id },
      select: {
        id: true,
        name: true,
        shortName: true,
        allowElectives: true,
        order: true,
      },
      orderBy: { order: "asc" },
    })

    return { success: true, levels }
  } catch (error) {
    console.error("Error fetching school levels:", error)
    return { success: false, error: "Failed to fetch school levels", levels: [] }
  }
}

// Bulk create subjects from preset
export async function bulkCreateSubjects(
  subjects: { name: string; code: string }[]
) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Get existing subjects
    const existingSubjects = await prisma.subject.findMany({
      where: { schoolId: auth.school.id },
      select: { name: true, code: true },
    })

    const existingNames = new Set(existingSubjects.map((s) => s.name.toLowerCase()))
    const existingCodes = new Set(existingSubjects.map((s) => s.code?.toLowerCase()).filter(Boolean))

    // Filter out duplicates
    const newSubjects = subjects.filter(
      (s) => !existingNames.has(s.name.toLowerCase()) && !existingCodes.has(s.code.toLowerCase())
    )

    if (newSubjects.length === 0) {
      return { success: false, error: "All subjects already exist" }
    }

    await prisma.subject.createMany({
      data: newSubjects.map((s) => ({
        schoolId: auth.school!.id,
        name: s.name,
        code: s.code,
      })),
    })

    revalidatePath("/school/subjects")
    revalidatePath("/school/settings")
    return { success: true, count: newSubjects.length }
  } catch (error) {
    console.error("Error bulk creating subjects:", error)
    return { success: false, error: "Failed to create subjects" }
  }
}

// Sync class subjects with level subjects
// This ensures all classes in a level have the level's subjects as ClassSubjects
export async function syncClassSubjectsWithLevelSubjects(levelId?: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Get all levels or specific level
    const levels = await prisma.schoolLevel.findMany({
      where: {
        schoolId: auth.school.id,
        ...(levelId && { id: levelId }),
      },
      select: { id: true },
    })

    let totalCreated = 0

    await prisma.$transaction(async (tx) => {
      for (const level of levels) {
        // Get level subjects
        const levelSubjects = await tx.levelSubject.findMany({
          where: { levelId: level.id },
          select: { subjectId: true },
        })
        const levelSubjectIds = levelSubjects.map(ls => ls.subjectId)
        
        if (levelSubjectIds.length === 0) continue
        
        // Get classes in this level
        const classes = await tx.class.findMany({
          where: { schoolLevelId: level.id },
          select: { 
            id: true,
          },
        })
        
        for (const cls of classes) {
          // Get existing class subjects
          const existingClassSubjects = await tx.classSubject.findMany({
            where: { classId: cls.id },
            select: { subjectId: true },
          })
          const existingSubjectIds = new Set(existingClassSubjects.map(cs => cs.subjectId))
          
          // Find subjects that need to be added
          const subjectsToAdd = levelSubjectIds.filter(
            subjectId => !existingSubjectIds.has(subjectId)
          )
          
          if (subjectsToAdd.length > 0) {
            await tx.classSubject.createMany({
              data: subjectsToAdd.map(subjectId => ({
                classId: cls.id,
                subjectId,
              })),
            })
            totalCreated += subjectsToAdd.length
          }
        }
      }
    })

    revalidatePath("/school/classes")
    revalidatePath("/school/teachers")
    revalidatePath("/school/subjects")
    
    return { 
      success: true, 
      message: `Synced ${totalCreated} subject-class assignments`,
      createdCount: totalCreated,
    }
  } catch (error) {
    console.error("Error syncing class subjects:", error)
    return { success: false, error: "Failed to sync class subjects" }
  }
}
