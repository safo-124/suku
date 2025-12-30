"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { StudentsTable } from "./students-table"
import { StudentForm } from "./student-form"
import { Gender } from "@/app/generated/prisma/client"

type Student = {
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

type ClassOption = {
  id: string
  name: string
  gradeLevel: number
  section: string | null
  _count: { students: number }
}

interface StudentsClientProps {
  students: Student[]
  classes: ClassOption[]
  total: number
  page: number
  totalPages: number
}

export function StudentsClient({
  students,
  classes,
  total,
  page,
  totalPages,
}: StudentsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined)
  const [search, setSearch] = useState(searchParams.get("search") || "")

  const subdomain = searchParams.get("subdomain")

  const updateSearchParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateSearchParams("search", search || null)
  }

  const handleFilterClass = (classId: string) => {
    updateSearchParams("classId", classId === "all" ? null : classId)
  }

  const handleFilterStatus = (status: string) => {
    updateSearchParams("isActive", status === "all" ? null : status)
  }

  const handlePageChange = (newPage: number) => {
    updateSearchParams("page", newPage.toString())
  }

  const handleAddNew = () => {
    setEditingStudent(undefined)
    setFormOpen(true)
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    if (!open) {
      setEditingStudent(undefined)
    }
    setFormOpen(open)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">
            Manage your school's students ({total} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="neu-sm hover:neu rounded-xl h-10 w-10"
            onClick={() => router.refresh()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white hover:scale-[0.98] rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, or admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 h-11 neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl"
            />
          </div>
        </form>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select
            value={searchParams.get("classId") || "all"}
            onValueChange={handleFilterClass}
          >
            <SelectTrigger className="w-[160px] h-11 neu-inset border-0 bg-transparent rounded-xl">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent className="neu rounded-xl border-0">
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get("isActive") || "all"}
            onValueChange={handleFilterStatus}
          >
            <SelectTrigger className="w-[130px] h-11 neu-inset border-0 bg-transparent rounded-xl">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="neu rounded-xl border-0">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={total}
          icon={GraduationCap}
        />
        <StatCard
          label="Active"
          value={students.filter(s => s.isActive).length}
          icon={GraduationCap}
          className="text-emerald-600"
        />
        <StatCard
          label="With Class"
          value={students.filter(s => s.studentProfile?.classId).length}
          icon={GraduationCap}
        />
        <StatCard
          label="No Class"
          value={students.filter(s => !s.studentProfile?.classId).length}
          icon={GraduationCap}
          className="text-amber-600"
        />
      </div>

      {/* Table */}
      <StudentsTable students={students} onEdit={handleEdit} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} students
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="neu-sm hover:neu rounded-xl h-10 w-10"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-3">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="neu-sm hover:neu rounded-xl h-10 w-10"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <StudentForm
        open={formOpen}
        onOpenChange={handleFormClose}
        student={editingStudent}
        classes={classes}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string
  value: number
  icon: React.ElementType
  className?: string
}) {
  return (
    <div className="neu-sm rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-inset">
          <Icon className={`h-5 w-5 ${className || "text-muted-foreground"}`} />
        </div>
        <div>
          <p className={`text-2xl font-bold ${className || ""}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  )
}
