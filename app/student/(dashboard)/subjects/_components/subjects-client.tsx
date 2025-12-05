"use client"

import { BookOpen, User, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Subject {
  id: string
  subjectId: string
  name: string
  code: string | null
  description: string | null
  teacher: {
    id: string
    name: string
    email: string
    avatar: string | null
  } | null
}

interface Elective {
  id: string
  subjectId: string
  name: string
  code: string | null
  approvedAt: Date | null
}

export function SubjectsClient({ 
  subjects, 
  electives 
}: { 
  subjects: Subject[]
  electives: Elective[]
}) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Subjects</h1>
        <p className="text-muted-foreground mt-1">
          View all the subjects you&apos;re enrolled in this academic year.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="neu-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl neu flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{subjects.length}</p>
                <p className="text-sm text-muted-foreground">Total Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="neu-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl neu flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {subjects.filter(s => s.teacher).length}
                </p>
                <p className="text-sm text-muted-foreground">With Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="neu-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl neu flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{electives.length}</p>
                <p className="text-sm text-muted-foreground">Electives Selected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Core Subjects */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Core Subjects</h2>
        {subjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Card key={subject.id} className="neu-sm hover:neu transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl neu-convex flex items-center justify-center">
                        <span className="text-lg font-bold">
                          {subject.code || subject.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{subject.name}</CardTitle>
                        {subject.code && (
                          <p className="text-sm text-muted-foreground">{subject.code}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {subject.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {subject.description}
                    </p>
                  )}
                  {subject.teacher ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl neu-inset-sm">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={subject.teacher.avatar || undefined} />
                        <AvatarFallback>
                          {subject.teacher.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{subject.teacher.name}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {subject.teacher.email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl neu-inset-sm">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>?</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">
                          No teacher assigned
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="neu-sm">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-1">No subjects found</h3>
              <p className="text-sm text-muted-foreground">
                You haven&apos;t been assigned to any subjects yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Elective Subjects */}
      {electives.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Elective Subjects</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {electives.map((elective) => (
              <Card key={elective.id} className="neu-sm hover:neu transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl neu-convex flex items-center justify-center">
                        <span className="text-lg font-bold">
                          {elective.code || elective.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{elective.name}</p>
                        {elective.code && (
                          <p className="text-sm text-muted-foreground">{elective.code}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={elective.approvedAt ? "default" : "secondary"}>
                      {elective.approvedAt ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                  {elective.approvedAt && (
                    <p className="text-xs text-muted-foreground mt-4">
                      Approved on {new Date(elective.approvedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
