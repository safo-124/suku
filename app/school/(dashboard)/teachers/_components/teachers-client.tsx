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
  Users,
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { TeachersTable } from "./teachers-table"
import { TeacherForm } from "./teacher-form"

type Teacher = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatar: string | null
  isActive: boolean
  createdAt: Date
  teacherProfile: {
    id: string
    employeeId: string | null
    qualification: string | null
    specialization: string | null
    joinDate: Date | null
  } | null
  classTeacherOf: { id: string; name: string }[]
  classSubjects: { id: string; class: { name: string }; subject: { name: string } }[]
}

interface TeachersClientProps {
  teachers: Teacher[]
  total: number
  page: number
  totalPages: number
}

export function TeachersClient({
  teachers,
  total,
  page,
  totalPages,
}: TeachersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | undefined>(undefined)
  const [search, setSearch] = useState(searchParams.get("search") || "")

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

  const handleFilterStatus = (status: string) => {
    updateSearchParams("isActive", status === "all" ? null : status)
  }

  const handlePageChange = (newPage: number) => {
    updateSearchParams("page", newPage.toString())
  }

  const handleAddNew = () => {
    setEditingTeacher(undefined)
    setFormOpen(true)
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    if (!open) {
      setEditingTeacher(undefined)
    }
    setFormOpen(open)
  }

  const activeCount = teachers.filter(t => t.isActive).length
  const withClassesCount = teachers.filter(t => t.classSubjects.length > 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your school's teaching staff ({total} total)
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
            Add Teacher
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
              placeholder="Search by name, email, or employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 h-11 neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl"
            />
          </div>
        </form>

        {/* Filters */}
        <div className="flex items-center gap-3">
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
          label="Total Teachers"
          value={total}
          icon={Users}
        />
        <StatCard
          label="Active"
          value={activeCount}
          icon={Users}
          className="text-emerald-600"
        />
        <StatCard
          label="With Classes"
          value={withClassesCount}
          icon={Users}
        />
        <StatCard
          label="Unassigned"
          value={total - withClassesCount}
          icon={Users}
          className="text-amber-600"
        />
      </div>

      {/* Table */}
      <TeachersTable teachers={teachers} onEdit={handleEdit} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} teachers
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
      <TeacherForm
        open={formOpen}
        onOpenChange={handleFormClose}
        teacher={editingTeacher}
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
