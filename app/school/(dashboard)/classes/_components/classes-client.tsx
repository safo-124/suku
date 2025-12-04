"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, BookOpen, Users, GraduationCap, Calendar } from "lucide-react"
import { ClassForm } from "./class-form"
import { ClassesTable, ClassWithDetails } from "./classes-table"
import { AcademicYearForm } from "./academic-year-form"

interface Teacher {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface AcademicYear {
  id: string
  name: string
  isCurrent: boolean
}

interface SchoolLevel {
  id: string
  name: string
  shortName: string
  allowElectives: boolean
}

interface GradeDefinition {
  id: string
  name: string
  shortName: string
  description: string | null
  order: number
}

interface ClassesClientProps {
  classes: ClassWithDetails[]
  teachers: Teacher[]
  academicYears: AcademicYear[]
  currentAcademicYear: AcademicYear | null
  schoolLevels?: SchoolLevel[]
  gradeDefinitions?: GradeDefinition[]
}

export function ClassesClient({ 
  classes, 
  teachers, 
  academicYears,
  currentAcademicYear,
  schoolLevels = [],
  gradeDefinitions = []
}: ClassesClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGrade, setSelectedGrade] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>(currentAcademicYear?.id || "all")
  const [showClassForm, setShowClassForm] = useState(false)
  const [showAcademicYearForm, setShowAcademicYearForm] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassWithDetails | null>(null)

  // Filter classes based on search and grade filter
  const filteredClasses = classes.filter((cls) => {
    const teacherName = cls.classTeacher 
      ? `${cls.classTeacher.firstName} ${cls.classTeacher.lastName}`.toLowerCase()
      : ""
    
    const matchesSearch =
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.section?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      teacherName.includes(searchQuery.toLowerCase())

    const matchesGrade = selectedGrade === "all" || cls.gradeDefinitionId === selectedGrade

    const matchesYear = selectedYear === "all" || cls.academicYearId === selectedYear

    return matchesSearch && matchesGrade && matchesYear
  })

  // Get unique grade definitions from classes
  const usedGradeDefinitions = gradeDefinitions.filter(gd => 
    classes.some(c => c.gradeDefinitionId === gd.id)
  )

  // Calculate stats
  const totalClasses = classes.length
  const totalStudents = classes.reduce((sum, c) => sum + c._count.students, 0)
  const totalSubjects = classes.reduce((sum, c) => sum + c._count.classSubjects, 0)

  const handleEditClass = (cls: ClassWithDetails) => {
    setEditingClass(cls)
    setShowClassForm(true)
  }

  const handleCloseForm = (open: boolean) => {
    setShowClassForm(open)
    if (!open) {
      setEditingClass(null)
    }
  }

  const statsCards = [
    {
      title: "Total Classes",
      value: totalClasses,
      icon: BookOpen,
      color: "text-blue-400",
    },
    {
      title: "Total Students",
      value: totalStudents,
      icon: Users,
      color: "text-green-400",
    },
    {
      title: "Total Subjects",
      value: totalSubjects,
      icon: GraduationCap,
      color: "text-purple-400",
    },
    {
      title: "Academic Years",
      value: academicYears.length,
      icon: Calendar,
      color: "text-orange-400",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <div
            key={stat.title}
            className="neu rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl neu-inset ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl h-11"
            />
          </div>

          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-44 neu-inset border-0 bg-transparent rounded-xl h-11">
              <SelectValue placeholder="Class/Grade" />
            </SelectTrigger>
            <SelectContent className="neu border-0 rounded-xl">
              <SelectItem value="all">All Classes</SelectItem>
              {usedGradeDefinitions.map((grade) => (
                <SelectItem key={grade.id} value={grade.id}>
                  {grade.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-44 neu-inset border-0 bg-transparent rounded-xl h-11">
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent className="neu border-0 rounded-xl">
              <SelectItem value="all">All Years</SelectItem>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name} {year.isCurrent && "(Current)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setShowAcademicYearForm(true)}
            variant="outline"
            className="rounded-xl neu-convex border-0 h-11"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Add Year
          </Button>
          <Button
            onClick={() => setShowClassForm(true)}
            className="rounded-xl neu-convex border-0 h-11"
            disabled={academicYears.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </div>
      </div>

      {/* No Academic Year Warning */}
      {academicYears.length === 0 && (
        <div className="neu rounded-2xl p-6 border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-3 text-yellow-500">
            <Calendar className="h-5 w-5" />
            <p>Please create an academic year first before adding classes.</p>
          </div>
        </div>
      )}

      {/* Classes Table */}
      <div className="neu rounded-2xl p-6">
        <ClassesTable 
          classes={filteredClasses} 
          onEdit={handleEditClass}
        />
      </div>

      {/* Class Form Modal */}
      <ClassForm
        open={showClassForm}
        onOpenChange={handleCloseForm}
        classData={editingClass}
        teachers={teachers}
        academicYears={academicYears}
        currentAcademicYear={currentAcademicYear}
        schoolLevels={schoolLevels}
        gradeDefinitions={gradeDefinitions}
      />

      {/* Academic Year Form Modal */}
      <AcademicYearForm
        open={showAcademicYearForm}
        onOpenChange={setShowAcademicYearForm}
      />
    </div>
  )
}
