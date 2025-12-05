"use client"

import { School, Users, BookOpen, Calendar, Award, ClipboardList, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface ClassData {
  id: string
  name: string
  gradeLevel: number | null
  section: string | null
  level: string | null
  academicYear: string | null
  studentCount: number
  subjects: Array<{
    id: string
    subjectName: string
    subjectCode: string | null
    teacherName: string
  }>
}

export function MyClassClient({ classData }: { classData: ClassData }) {
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const linkPrefix = subdomain ? `?subdomain=${subdomain}` : ""

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl neu-convex">
              <School className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{classData.name}</h1>
              <p className="text-muted-foreground">
                {classData.level && `${classData.level} • `}
                {classData.academicYear || "Current Year"}
              </p>
            </div>
          </div>
        </div>
        <Badge variant="secondary" className="rounded-xl px-4 py-2 text-sm bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
          Class Teacher
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{classData.studentCount}</p>
              <p className="text-sm text-muted-foreground">Students</p>
            </div>
          </CardContent>
        </Card>

        <Card className="neu rounded-2xl border-0">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{classData.subjects.length}</p>
              <p className="text-sm text-muted-foreground">Subjects</p>
            </div>
          </CardContent>
        </Card>

        <Link href={`/teacher/my-class/attendance${linkPrefix}`} className="block">
          <Card className="neu rounded-2xl border-0 hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Attendance</p>
                <p className="text-sm text-muted-foreground">Mark today's</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href={`/teacher/my-class/grades${linkPrefix}`} className="block">
          <Card className="neu rounded-2xl border-0 hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex">
                <Award className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Grades</p>
                <p className="text-sm text-muted-foreground">View all grades</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Subjects & Teachers */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Subjects & Teachers</h2>
        <div className="grid gap-3">
          {classData.subjects.map((subject) => (
            <Card key={subject.id} className="neu rounded-2xl border-0">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-sm">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{subject.subjectName}</p>
                    {subject.subjectCode && (
                      <p className="text-sm text-muted-foreground">{subject.subjectCode}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{subject.teacherName}</p>
                  <p className="text-xs text-muted-foreground">Subject Teacher</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href={`/teacher/my-class/students${linkPrefix}`}>
            <Card className="neu rounded-2xl border-0 hover:shadow-lg transition-all cursor-pointer group">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex group-hover:scale-105 transition-transform">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">View Students</p>
                  <p className="text-sm text-muted-foreground">See student details & parents</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/teacher/my-class/attendance${linkPrefix}`}>
            <Card className="neu rounded-2xl border-0 hover:shadow-lg transition-all cursor-pointer group">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex group-hover:scale-105 transition-transform">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Mark Attendance</p>
                  <p className="text-sm text-muted-foreground">Take daily attendance</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/teacher/my-class/grades${linkPrefix}`}>
            <Card className="neu rounded-2xl border-0 hover:shadow-lg transition-all cursor-pointer group">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl neu-convex group-hover:scale-105 transition-transform">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">View Grades</p>
                  <p className="text-sm text-muted-foreground">All subjects grades</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
