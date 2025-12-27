"use client"

import { BookOpen, Users, FileText, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface Subject {
  id: string
  classId: string
  className: string
  classLevel: string | null
  subjectId: string
  subjectName: string
  subjectCode: string | null
  studentCount: number
  assignmentCount: number
}

export function SubjectsClient({ subjects }: { subjects: Subject[] }) {
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const linkPrefix = subdomain ? `?subdomain=${subdomain}` : ""

  // Group subjects by class
  const subjectsByClass = subjects.reduce((acc, subject) => {
    if (!acc[subject.classId]) {
      acc[subject.classId] = {
        className: subject.className,
        classLevel: subject.classLevel,
        subjects: [],
      }
    }
    acc[subject.classId].subjects.push(subject)
    return acc
  }, {} as Record<string, { className: string; classLevel: string | null; subjects: Subject[] }>)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Subjects</h1>
        <p className="text-muted-foreground mt-1">
          Subjects you teach across different classes
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{subjects.length}</p>
              <p className="text-sm text-muted-foreground">Total Subjects</p>
            </div>
          </CardContent>
        </Card>

        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {subjects.reduce((sum, s) => sum + s.studentCount, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>

        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {subjects.reduce((sum, s) => sum + s.assignmentCount, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Assignments Created</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects by Class */}
      {Object.entries(subjectsByClass).length === 0 ? (
        <Card className="neu-inset rounded-2xl border-0">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You haven't been assigned any subjects yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(subjectsByClass).map(([classId, classData]) => (
            <div key={classId}>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="rounded-lg px-3 py-1.5">
                  {classData.className}
                </Badge>
                {classData.classLevel && (
                  <span className="text-sm text-muted-foreground">
                    {classData.classLevel}
                  </span>
                )}
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {classData.subjects.map((subject) => (
                  <Card key={subject.id} className="neu rounded-2xl border-0 hover:shadow-lg transition-all group">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{subject.subjectName}</CardTitle>
                          {subject.subjectCode && (
                            <p className="text-sm text-muted-foreground">{subject.subjectCode}</p>
                          )}
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-sm">
                          <BookOpen className="h-5 w-5" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{subject.studentCount} students</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{subject.assignmentCount} assignments</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link href={`/teacher/my-subjects/${subject.id}/students${linkPrefix}`} className="flex-1">
                          <Button variant="secondary" className="w-full rounded-xl neu-sm hover:neu">
                            Students
                          </Button>
                        </Link>
                        <Link href={`/teacher/my-subjects/${subject.id}/assignments${linkPrefix}`} className="flex-1">
                          <Button variant="secondary" className="w-full rounded-xl neu-sm hover:neu">
                            Assignments
                          </Button>
                        </Link>
                        <Link href={`/teacher/my-subjects/${subject.id}/grades${linkPrefix}`} className="flex-1">
                          <Button variant="secondary" className="w-full rounded-xl neu-sm hover:neu">
                            Grades
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
