"use client"

import { useState } from "react"
import { Users, Search, Mail, Phone, User, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// Define locally to avoid client-side Prisma import issues
const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const

type GenderType = typeof Gender[keyof typeof Gender] | null

interface Student {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  avatar: string | null
  studentId: string | null
  dateOfBirth: Date | null
  gender: GenderType
  isActive: boolean
  parents: Array<{
    name: string
    email: string | null
    phone: string | null
    relationship: string | null
  }>
}

export function StudentsClient({ 
  className, 
  students 
}: { 
  className: string
  students: Student[] 
}) {
  const [search, setSearch] = useState("")
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
    const searchLower = search.toLowerCase()
    return fullName.includes(searchLower) || 
           student.email.toLowerCase().includes(searchLower) ||
           student.studentId?.toLowerCase().includes(searchLower)
  })

  const toggleExpand = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Class Students</h1>
          <p className="text-muted-foreground mt-1">
            {className} • {students.length} students
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11 h-12 rounded-xl neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20"
        />
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <Card className="neu-inset rounded-2xl border-0">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No students found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredStudents.map((student) => (
            <Card 
              key={student.id} 
              className={cn(
                "neu rounded-2xl border-0 transition-all",
                expandedStudent === student.id && "ring-1 ring-foreground/10"
              )}
            >
              <CardContent className="py-4">
                {/* Main Row */}
                <div 
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => toggleExpand(student.id)}
                >
                  <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                    <AvatarImage src={student.avatar || ""} />
                    <AvatarFallback className="bg-foreground text-background font-semibold">
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">
                        {student.firstName} {student.lastName}
                      </p>
                      {!student.isActive && (
                        <Badge variant="destructive" className="rounded-lg text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {student.studentId && <span>{student.studentId}</span>}
                      {student.gender && (
                        <>
                          <span>•</span>
                          <span>{student.gender}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span className="hidden md:inline truncate max-w-[200px]">{student.email}</span>
                    </div>
                    {student.phone && (
                      <div className="hidden lg:flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span>{student.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {student.parents.length > 0 && (
                      <Badge variant="secondary" className="rounded-lg">
                        {student.parents.length} parent{student.parents.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {expandedStudent === student.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedStudent === student.id && (
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                    {/* Student Details - Mobile */}
                    <div className="sm:hidden space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Parents/Guardians */}
                    {student.parents.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Parents/Guardians
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {student.parents.map((parent, index) => (
                            <div 
                              key={index}
                              className="p-3 rounded-xl bg-muted/30"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{parent.name}</span>
                                {parent.relationship && (
                                  <Badge variant="secondary" className="rounded text-xs">
                                    {parent.relationship}
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground ml-6">
                                {parent.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    <span>{parent.email}</span>
                                  </div>
                                )}
                                {parent.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{parent.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {student.parents.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        No parent/guardian information available
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
