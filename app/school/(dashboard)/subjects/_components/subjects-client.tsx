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
import { Plus, Search, BookOpen, Layers, GraduationCap, FileQuestion, Sparkles, Users } from "lucide-react"
import { SubjectForm } from "./subject-form"
import { SubjectsTable, SubjectWithDetails } from "./subjects-table"
import { SubjectLevelManager } from "./subject-level-manager"
import { SubjectPresetDialog } from "./subject-preset-dialog"
import { ElectiveApprovalManager } from "./elective-approval-manager"

interface SchoolLevel {
  id: string
  name: string
  shortName: string
  allowElectives: boolean
  order: number
}

interface ClassOption {
  id: string
  name: string
}

interface SubjectsClientProps {
  subjects: SubjectWithDetails[]
  schoolLevels: SchoolLevel[]
  classes?: ClassOption[]
}

export function SubjectsClient({ subjects, schoolLevels, classes = [] }: SubjectsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [showPresetDialog, setShowPresetDialog] = useState(false)
  const [showElectiveManager, setShowElectiveManager] = useState(false)
  const [editingSubject, setEditingSubject] = useState<SubjectWithDetails | null>(null)
  const [managingLevelsFor, setManagingLevelsFor] = useState<SubjectWithDetails | null>(null)

  // Filter subjects based on search and level filter
  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subject.code?.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesLevel = 
      selectedLevel === "all" || 
      subject.levelSubjects.some((ls) => ls.level.id === selectedLevel)

    return matchesSearch && matchesLevel
  })

  // Calculate stats
  const totalSubjects = subjects.length
  const coreSubjects = subjects.filter((s) => 
    s.levelSubjects.some((ls) => ls.subjectType === "CORE")
  ).length
  const electiveSubjects = subjects.filter((s) => 
    s.levelSubjects.some((ls) => ls.subjectType === "ELECTIVE")
  ).length
  const totalQuestions = subjects.reduce((sum, s) => sum + s._count.questions, 0)

  const handleEditSubject = (subject: SubjectWithDetails) => {
    setEditingSubject(subject)
    setShowSubjectForm(true)
  }

  const handleManageLevels = (subject: SubjectWithDetails) => {
    setManagingLevelsFor(subject)
  }

  const handleCloseForm = (open: boolean) => {
    setShowSubjectForm(open)
    if (!open) {
      setEditingSubject(null)
    }
  }

  const statsCards = [
    {
      title: "Total Subjects",
      value: totalSubjects,
      icon: BookOpen,
      color: "text-blue-400",
    },
    {
      title: "Core Subjects",
      value: coreSubjects,
      icon: GraduationCap,
      color: "text-emerald-400",
    },
    {
      title: "Elective Subjects",
      value: electiveSubjects,
      icon: Layers,
      color: "text-purple-400",
    },
    {
      title: "Total Questions",
      value: totalQuestions,
      icon: FileQuestion,
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
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl h-11"
            />
          </div>

          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-44 neu-inset border-0 bg-transparent rounded-xl h-11">
              <SelectValue placeholder="School Level" />
            </SelectTrigger>
            <SelectContent className="neu border-0 rounded-xl">
              <SelectItem value="all">All Levels</SelectItem>
              {schoolLevels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setShowElectiveManager(true)}
            variant="outline"
            className="rounded-xl neu-convex border-0 h-11"
          >
            <Users className="h-4 w-4 mr-2" />
            Elective Approvals
          </Button>
          <Button
            onClick={() => setShowPresetDialog(true)}
            variant="outline"
            className="rounded-xl neu-convex border-0 h-11"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
          <Button
            onClick={() => setShowSubjectForm(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-0 h-11"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* No School Levels Warning */}
      {schoolLevels.length === 0 && (
        <div className="neu rounded-2xl p-6 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-3 text-amber-500">
            <Layers className="h-5 w-5" />
            <p>No school levels defined. Create school levels in Settings to organize subjects by level.</p>
          </div>
        </div>
      )}

      {/* Subjects Table */}
      <div className="neu rounded-2xl p-6">
        <SubjectsTable 
          subjects={filteredSubjects} 
          onEdit={handleEditSubject}
          onManageLevels={handleManageLevels}
        />
      </div>

      {/* Subject Form Modal */}
      <SubjectForm
        open={showSubjectForm}
        onOpenChange={handleCloseForm}
        subjectData={editingSubject}
      />

      {/* Subject Level Manager Modal */}
      <SubjectLevelManager
        open={!!managingLevelsFor}
        onOpenChange={(open) => !open && setManagingLevelsFor(null)}
        subject={managingLevelsFor}
        schoolLevels={schoolLevels}
      />

      {/* Subject Preset Dialog */}
      <SubjectPresetDialog
        open={showPresetDialog}
        onOpenChange={setShowPresetDialog}
      />

      {/* Elective Approval Manager */}
      <ElectiveApprovalManager
        open={showElectiveManager}
        onOpenChange={setShowElectiveManager}
        classes={classes}
      />
    </div>
  )
}
