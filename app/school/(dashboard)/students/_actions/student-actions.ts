"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { verifySchoolAccess, hashPassword } from "@/lib/auth"
import { UserRole, Gender, EnrollmentStatus } from "@/app/generated/prisma/client"

// Generate unique student ID (format: STU-YYMM-XXXXX where YY=year, MM=month)
async function generateStudentId(schoolId: string): Promise<string> {
  const now = new Date()
  const year = String(now.getFullYear()).slice(-2) // Last 2 digits of year
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const prefix = `STU-${year}${month}`
  
  // Get the count of students in this school
  const studentCount = await prisma.studentProfile.count({
    where: {
      user: { schoolId },
    },
  })
  
  // Generate sequential ID with padding
  const nextNumber = studentCount + 1
  const paddedNumber = String(nextNumber).padStart(5, "0")
  let studentId = `${prefix}-${paddedNumber}`
  
  // Check for collision and increment if needed
  let attempts = 0
  while (attempts < 100) {
    const existing = await prisma.studentProfile.findFirst({
      where: {
        studentId,
        user: { schoolId },
      },
    })
    
    if (!existing) break
    
    attempts++
    const newNumber = studentCount + attempts + 1
    studentId = `${prefix}-${String(newNumber).padStart(5, "0")}`
  }
  
  return studentId
}

// Types
export interface ParentInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  relationship?: string
  occupation?: string
}

export interface CreateStudentInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  studentId?: string // Admission number
  dateOfBirth?: string
  gender?: Gender
  bloodGroup?: string
  address?: string
  classId?: string
  password?: string
  // Parent/Guardian details
  parent1?: ParentInput
  parent2?: ParentInput
}

export interface UpdateStudentInput extends Partial<CreateStudentInput> {
  id: string
  isActive?: boolean
}

export interface StudentFilters {
  search?: string
  classId?: string
  gender?: Gender
  isActive?: boolean
  page?: number
  limit?: number
}

// Get all students for the current school
export async function getStudents(filters: StudentFilters = {}) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, students: [], total: 0 }
  }

  const { search, classId, gender, isActive, page = 1, limit = 20 } = filters
  const skip = (page - 1) * limit

  try {
    const where = {
      schoolId: auth.school.id,
      role: UserRole.STUDENT,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { studentProfile: { studentId: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
      ...(classId && { studentProfile: { classId } }),
      ...(gender && { studentProfile: { gender } }),
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          studentProfile: {
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                  gradeLevel: true,
                },
              },
            },
          },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return { 
      success: true, 
      students: students as unknown as StudentWithProfile[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error("Error fetching students:", error)
    return { success: false, error: "Failed to fetch students", students: [], total: 0 }
  }
}

// Get a single student by ID
export async function getStudent(studentId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: auth.school.id,
        role: UserRole.STUDENT,
      },
      include: {
        studentProfile: {
          include: {
            class: true,
            enrollments: {
              include: {
                class: true,
                academicYear: true,
              },
              orderBy: { createdAt: "desc" },
            },
            parentLinks: {
              include: {
                parent: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    return { success: true, student: student as unknown as StudentWithProfile }
  } catch (error) {
    console.error("Error fetching student:", error)
    return { success: false, error: "Failed to fetch student" }
  }
}

// Create a new student
export async function createStudent(data: CreateStudentInput) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Check student limit
    const studentCount = await prisma.user.count({
      where: { schoolId: auth.school.id, role: UserRole.STUDENT },
    })

    if (studentCount >= auth.school.maxStudents) {
      return { 
        success: false, 
        error: `Student limit reached (${auth.school.maxStudents}). Please upgrade your plan.` 
      }
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })

    if (existingUser) {
      return { success: false, error: "Email is already registered" }
    }

    // Check if student ID is already taken within the school
    if (data.studentId) {
      const existingStudentId = await prisma.studentProfile.findFirst({
        where: {
          studentId: data.studentId,
          user: { schoolId: auth.school.id },
        },
      })

      if (existingStudentId) {
        return { success: false, error: "Student ID (admission number) is already taken" }
      }
    }

    // Generate temporary password if not provided
    const password = data.password || generateTempPassword()
    const passwordHash = await hashPassword(password)

    // Helper function to create parent account
    const createParentAccount = async (
      tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
      parentData: ParentInput,
      studentProfileId: string,
      schoolId: string
    ) => {
      // Check if parent email already exists
      const existingParent = await tx.user.findUnique({
        where: { email: parentData.email.toLowerCase() },
        include: { parentProfile: true },
      })

      if (existingParent) {
        // If parent exists, just link them to this student
        if (existingParent.parentProfile) {
          // Check if link already exists
          const existingLink = await tx.parentStudent.findFirst({
            where: {
              parentId: existingParent.parentProfile.id,
              studentId: studentProfileId,
            },
          })
          
          if (!existingLink) {
            await tx.parentStudent.create({
              data: {
                parentId: existingParent.parentProfile.id,
                studentId: studentProfileId,
              },
            })
          }
        }
        return { isNew: false, email: parentData.email }
      }

      // Create new parent account
      const parentPassword = generateTempPassword()
      const parentPasswordHash = await hashPassword(parentPassword)

      const parentUser = await tx.user.create({
        data: {
          email: parentData.email.toLowerCase(),
          firstName: parentData.firstName,
          lastName: parentData.lastName,
          phone: parentData.phone || null,
          passwordHash: parentPasswordHash,
          role: UserRole.PARENT,
          schoolId: schoolId,
          isActive: true,
          emailVerified: false,
        },
      })

      const parentProfile = await tx.parentProfile.create({
        data: {
          userId: parentUser.id,
          relationship: parentData.relationship || null,
          occupation: parentData.occupation || null,
        },
      })

      // Link parent to student
      await tx.parentStudent.create({
        data: {
          parentId: parentProfile.id,
          studentId: studentProfileId,
        },
      })

      return { isNew: true, email: parentData.email, tempPassword: parentPassword }
    }

    // Track parent credentials for new parents
    const parentCredentials: Array<{ email: string; tempPassword: string }> = []

    // Generate student ID if not provided
    const studentId = data.studentId || await generateStudentId(auth.school!.id)

    // Create user and profile in transaction
    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          passwordHash,
          role: UserRole.STUDENT,
          schoolId: auth.school!.id,
          isActive: true,
          emailVerified: false,
        },
      })

      const profile = await tx.studentProfile.create({
        data: {
          userId: user.id,
          studentId,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender || null,
          bloodGroup: data.bloodGroup || null,
          address: data.address || null,
          classId: data.classId || null,
          admissionDate: new Date(),
        },
      })

      // If class is assigned, create enrollment for current academic year
      if (data.classId) {
        const currentYear = await tx.academicYear.findFirst({
          where: { schoolId: auth.school!.id, isCurrent: true },
        })

        if (currentYear) {
          await tx.studentEnrollment.create({
            data: {
              studentId: profile.id,
              classId: data.classId,
              academicYearId: currentYear.id,
              status: EnrollmentStatus.ACTIVE,
            },
          })
        }
      }

      // Create parent accounts if provided
      if (data.parent1?.email) {
        const result = await createParentAccount(tx, data.parent1, profile.id, auth.school!.id)
        if (result.isNew && result.tempPassword) {
          parentCredentials.push({ email: result.email, tempPassword: result.tempPassword })
        }
      }

      if (data.parent2?.email) {
        const result = await createParentAccount(tx, data.parent2, profile.id, auth.school!.id)
        if (result.isNew && result.tempPassword) {
          parentCredentials.push({ email: result.email, tempPassword: result.tempPassword })
        }
      }

      return { ...user, studentProfile: profile }
    })

    revalidatePath("/school/students")
    return { 
      success: true, 
      student,
      tempPassword: data.password ? undefined : password,
      parentCredentials: parentCredentials.length > 0 ? parentCredentials : undefined,
    }
  } catch (error) {
    console.error("Error creating student:", error)
    return { success: false, error: "Failed to create student" }
  }
}

// Update a student
export async function updateStudent(data: UpdateStudentInput) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify student belongs to this school
    const existingStudent = await prisma.user.findFirst({
      where: {
        id: data.id,
        schoolId: auth.school.id,
        role: UserRole.STUDENT,
      },
      include: { studentProfile: true },
    })

    if (!existingStudent) {
      return { success: false, error: "Student not found" }
    }

    // Check email uniqueness if changed
    if (data.email && data.email.toLowerCase() !== existingStudent.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      })
      if (existingEmail) {
        return { success: false, error: "Email is already registered" }
      }
    }

    // Check student ID uniqueness if changed
    if (data.studentId && data.studentId !== existingStudent.studentProfile?.studentId) {
      const existingStudentId = await prisma.studentProfile.findFirst({
        where: {
          studentId: data.studentId,
          user: { schoolId: auth.school.id },
          NOT: { userId: data.id },
        },
      })
      if (existingStudentId) {
        return { success: false, error: "Student ID (admission number) is already taken" }
      }
    }

    // Update user and profile
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: data.id },
        data: {
          ...(data.email && { email: data.email.toLowerCase() }),
          ...(data.firstName && { firstName: data.firstName }),
          ...(data.lastName && { lastName: data.lastName }),
          ...(data.phone !== undefined && { phone: data.phone || null }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      })

      if (existingStudent.studentProfile) {
        await tx.studentProfile.update({
          where: { id: existingStudent.studentProfile.id },
          data: {
            ...(data.studentId !== undefined && { studentId: data.studentId || null }),
            ...(data.dateOfBirth !== undefined && { 
              dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null 
            }),
            ...(data.gender !== undefined && { gender: data.gender || null }),
            ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup || null }),
            ...(data.address !== undefined && { address: data.address || null }),
            ...(data.classId !== undefined && { classId: data.classId || null }),
          },
        })
      }
    })

    revalidatePath("/school/students")
    revalidatePath(`/school/students/${data.id}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating student:", error)
    return { success: false, error: "Failed to update student" }
  }
}

// Delete a student
export async function deleteStudent(studentId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify student belongs to this school
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: auth.school.id,
        role: UserRole.STUDENT,
      },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    await prisma.user.delete({
      where: { id: studentId },
    })

    revalidatePath("/school/students")
    return { success: true }
  } catch (error) {
    console.error("Error deleting student:", error)
    return { success: false, error: "Failed to delete student" }
  }
}

// Toggle student active status
export async function toggleStudentStatus(studentId: string, isActive: boolean) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: auth.school.id,
        role: UserRole.STUDENT,
      },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    await prisma.user.update({
      where: { id: studentId },
      data: { isActive },
    })

    revalidatePath("/school/students")
    return { success: true }
  } catch (error) {
    console.error("Error toggling student status:", error)
    return { success: false, error: "Failed to update student status" }
  }
}

// Reset student password
export async function resetStudentPassword(studentId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: auth.school.id,
        role: UserRole.STUDENT,
      },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    const tempPassword = generateTempPassword()
    const passwordHash = await hashPassword(tempPassword)

    await prisma.user.update({
      where: { id: studentId },
      data: { 
        passwordHash,
        mustResetPassword: true, // Force password change on next login
      },
    })

    return { success: true, tempPassword }
  } catch (error) {
    console.error("Error resetting password:", error)
    return { success: false, error: "Failed to reset password" }
  }
}

// Get classes for dropdown (for assigning students to classes)
export async function getClassesForDropdown() {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, classes: [] }
  }

  try {
    const classes = await prisma.class.findMany({
      where: {
        schoolId: auth.school.id,
        academicYear: { isCurrent: true },
      },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        section: true,
        _count: {
          select: { students: true },
        },
      },
      orderBy: [{ gradeLevel: "asc" }, { section: "asc" }],
    })

    return { success: true, classes }
  } catch (error) {
    console.error("Error fetching classes:", error)
    return { success: false, error: "Failed to fetch classes", classes: [] }
  }
}

// Helper: Generate temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Types for responses
type StudentWithProfile = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatar: string | null
  isActive: boolean
  createdAt: Date
  studentProfile: {
    id: string
    studentId: string | null
    dateOfBirth: Date | null
    gender: Gender | null
    bloodGroup: string | null
    address: string | null
    classId: string | null
    class: {
      id: string
      name: string
      gradeLevel: number
    } | null
  } | null
}

// Function to assign student IDs to existing students who don't have one
export async function assignMissingStudentIds() {
  try {
    const session = await getSession()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId

    // Find all student profiles without a student ID
    const studentsWithoutId = await prisma.studentProfile.findMany({
      where: {
        schoolId: schoolId,
        studentId: null
      },
      select: { id: true }
    })

    if (studentsWithoutId.length === 0) {
      return { success: true, message: "All students already have student IDs", updated: 0 }
    }

    // Update each student with a new student ID
    let updatedCount = 0
    for (const student of studentsWithoutId) {
      const newStudentId = await generateStudentId(schoolId)
      await prisma.studentProfile.update({
        where: { id: student.id },
        data: { studentId: newStudentId }
      })
      updatedCount++
    }

    revalidatePath("/school/students")
    return { 
      success: true, 
      message: `Successfully assigned student IDs to ${updatedCount} students`,
      updated: updatedCount 
    }
  } catch (error) {
    console.error("Error assigning missing student IDs:", error)
    return { success: false, error: "Failed to assign student IDs" }
  }
}
