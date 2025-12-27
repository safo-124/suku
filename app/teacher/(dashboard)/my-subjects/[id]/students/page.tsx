"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Users, 
  Search, 
  BookOpen,
  Mail,
  Hash,
  UserCircle,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getSubjectStudents } from "../../../_actions/teacher-actions"

interface Student {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  avatar: string | null
  studentId: string | null
  isActive: boolean
}

interface ClassSubjectInfo {
  id: string
  className: string
  subjectName: string
  subjectCode: string | null
}

export default function SubjectStudentsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const linkPrefix = subdomain ? `?subdomain=${subdomain}` : ""
  
  const classSubjectId = params.id as string
  
  const [students, setStudents] = useState<Student[]>([])
  const [classSubject, setClassSubject] = useState<ClassSubjectInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  useEffect(() => {
    async function loadStudents() {
      try {
        const result = await getSubjectStudents(classSubjectId)
        
        if (result.success) {
          setStudents(result.students || [])
          setClassSubject(result.classSubject || null)
        } else {
          setError(result.error || "Failed to load students")
        }
      } catch (err) {
        setError("An error occurred while loading students")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadStudents()
  }, [classSubjectId])
  
  // Filter students by search query
  const filteredStudents = students.filter(student => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      student.firstName.toLowerCase().includes(query) ||
      student.lastName.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      (student.studentId?.toLowerCase().includes(query) ?? false)
    )
  })
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">{error}</h2>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => router.push(`/teacher/my-subjects${linkPrefix}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subjects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/teacher/my-subjects${linkPrefix}`}>
            <Button variant="ghost" size="icon" className="rounded-xl neu-sm hover:neu">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{classSubject?.subjectName}</h1>
              {classSubject?.subjectCode && (
                <Badge variant="secondary" className="rounded-lg">
                  {classSubject.subjectCode}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Students in {classSubject?.className}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className="rounded-lg px-3 py-1.5 neu-sm">
            <Users className="h-4 w-4 mr-2" />
            {students.length} {students.length === 1 ? "Student" : "Students"}
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or student ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12 rounded-xl neu-inset border-0"
        />
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <Card className="neu-inset rounded-2xl border-0">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery 
                ? "No students match your search" 
                : "No students enrolled in this class yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <Card 
              key={student.id} 
              className={cn(
                "neu rounded-2xl border-0 hover:shadow-lg transition-all",
                !student.isActive && "opacity-60"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 ring-2 ring-background shadow-sm">
                    <AvatarImage src={student.avatar || undefined} />
                    <AvatarFallback className="bg-foreground text-background font-semibold">
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {student.firstName} {student.lastName}
                      </h3>
                      {!student.isActive && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      {student.studentId && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Hash className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{student.studentId}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <Card className="neu rounded-2xl border-0">
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {filteredStudents.length} of {students.length} students
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">
                  Active: {students.filter(s => s.isActive).length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted" />
                <span className="text-muted-foreground">
                  Inactive: {students.filter(s => !s.isActive).length}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
