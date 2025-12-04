"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Layers,
  MapPin,
  Users,
  Pencil,
  UserCircle,
  Star,
} from "lucide-react"

interface ClassSubjectWithType {
  id: string
  subjectId: string
  subjectType?: "CORE" | "ELECTIVE"
  subject: {
    id: string
    name: string
    code: string | null
    isRequiredForPromotion: boolean
  }
  teacher: {
    id: string
    firstName: string
    lastName: string
  } | null
}

interface ClassDetailData {
  id: string
  name: string
  section: string | null
  capacity: number | null
  roomNumber: string | null
  classTeacher: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar: string | null
  } | null
  academicYear: {
    id: string
    name: string
    isCurrent: boolean
  } | null
  gradeDefinition: {
    id: string
    name: string
    shortName: string
    description: string | null
  } | null
  schoolLevel: {
    id: string
    name: string
    shortName: string
    allowElectives: boolean
  } | null
  classSubjects: ClassSubjectWithType[]
  _count: {
    students: number
  }
}

interface ClassDetailClientProps {
  classData: ClassDetailData
}

export function ClassDetailClient({ classData }: ClassDetailClientProps) {
  const coreSubjects = classData.classSubjects.filter(cs => cs.subjectType === "CORE" || !cs.subjectType)
  const electiveSubjects = classData.classSubjects.filter(cs => cs.subjectType === "ELECTIVE")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/school/classes">
            <Button variant="ghost" size="icon" className="neu-sm rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl neu-convex">
              <span className="text-xl font-bold">
                {classData.gradeDefinition?.shortName || "—"}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                {classData.name}
                {classData.section && (
                  <span className="text-muted-foreground">
                    • Section {classData.section}
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {classData.academicYear && (
                  <span>{classData.academicYear.name}</span>
                )}
                {classData.schoolLevel && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary">{classData.schoolLevel.name}</Badge>
                    {classData.schoolLevel.allowElectives && (
                      <Badge variant="outline">Electives Allowed</Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <Link href={`/school/classes?edit=${classData.id}`}>
          <Button className="neu-convex rounded-xl">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Class
          </Button>
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="neu rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl neu-inset">
              <GraduationCap className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Students</p>
              <p className="text-2xl font-bold">{classData._count.students}</p>
            </div>
          </div>
        </div>

        <div className="neu rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl neu-inset">
              <BookOpen className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Subjects</p>
              <p className="text-2xl font-bold">{classData.classSubjects.length}</p>
            </div>
          </div>
        </div>

        <div className="neu rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl neu-inset">
              <Layers className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Core / Elective</p>
              <p className="text-2xl font-bold">
                {coreSubjects.length} / {electiveSubjects.length}
              </p>
            </div>
          </div>
        </div>

        <div className="neu rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl neu-inset">
              <MapPin className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Room</p>
              <p className="text-2xl font-bold">{classData.roomNumber || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Class Teacher */}
      {classData.classTeacher && (
        <div className="neu rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Class Teacher
          </h2>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={classData.classTeacher.avatar || undefined} />
              <AvatarFallback>
                {classData.classTeacher.firstName[0]}
                {classData.classTeacher.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-lg">
                {classData.classTeacher.firstName} {classData.classTeacher.lastName}
              </p>
              <p className="text-muted-foreground">{classData.classTeacher.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Subjects */}
        <div className="neu rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Core Subjects
            <Badge variant="secondary">{coreSubjects.length}</Badge>
          </h2>
          {coreSubjects.length === 0 ? (
            <p className="text-muted-foreground text-sm">No core subjects assigned.</p>
          ) : (
            <div className="space-y-3">
              {coreSubjects.map((cs) => (
                <div
                  key={cs.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg neu-inset flex items-center justify-center">
                      <span className="text-xs font-bold">
                        {cs.subject.code || cs.subject.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {cs.subject.name}
                        {cs.subject.isRequiredForPromotion && (
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        )}
                      </p>
                      {cs.teacher && (
                        <p className="text-sm text-muted-foreground">
                          {cs.teacher.firstName} {cs.teacher.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Elective Subjects */}
        <div className="neu rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-400" />
            Elective Subjects
            <Badge variant="secondary">{electiveSubjects.length}</Badge>
          </h2>
          {!classData.schoolLevel?.allowElectives ? (
            <p className="text-muted-foreground text-sm">
              Elective subjects are not available at this school level.
            </p>
          ) : electiveSubjects.length === 0 ? (
            <p className="text-muted-foreground text-sm">No elective subjects assigned.</p>
          ) : (
            <div className="space-y-3">
              {electiveSubjects.map((cs) => (
                <div
                  key={cs.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg neu-inset flex items-center justify-center">
                      <span className="text-xs font-bold">
                        {cs.subject.code || cs.subject.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {cs.subject.name}
                        {cs.subject.isRequiredForPromotion && (
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        )}
                      </p>
                      {cs.teacher && (
                        <p className="text-sm text-muted-foreground">
                          {cs.teacher.firstName} {cs.teacher.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-purple-500 border-purple-500/30">
                    Elective
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grade Definition Info */}
      {classData.gradeDefinition && (
        <div className="neu rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Grade Information</h2>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl neu-convex flex items-center justify-center">
              <span className="text-2xl font-bold">{classData.gradeDefinition.shortName}</span>
            </div>
            <div>
              <p className="font-medium text-lg">{classData.gradeDefinition.name}</p>
              {classData.gradeDefinition.description && (
                <p className="text-muted-foreground">{classData.gradeDefinition.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
