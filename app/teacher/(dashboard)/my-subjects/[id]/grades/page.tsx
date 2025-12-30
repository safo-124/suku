"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Users, 
  Search, 
  BookOpen,
  Award,
  Loader2,
  Save,
  Edit2,
  X,
  Check,
  LayoutGrid,
  List,
  FileText,
  TrendingUp,
  Percent,
  Settings2,
  PieChart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getSubjectGrades, saveStudentGrade, updateGradeWeights } from "../../../_actions/teacher-actions"

interface ExamResult {
  id: string
  studentId: string
  examType: string
  score: number
  maxScore: number
  grade: string | null
  remarks: string | null
}

interface Student {
  id: string
  userId: string
  firstName: string
  lastName: string
  studentId: string | null
  isActive: boolean
  examResults: ExamResult[]
}

interface AcademicPeriod {
  id: string
  name: string
}

interface ClassSubjectInfo {
  id: string
  className: string
  subjectName: string
  subjectCode: string | null
  homeworkWeight: number
  classworkWeight: number
  testWeight: number
  quizWeight: number
  examWeight: number
  classTestWeight: number
  midTermWeight: number
  endOfTermWeight: number
  assignmentWeight: number
  projectWeight: number
}

interface GradeWeights {
  homeworkWeight: number
  classworkWeight: number
  testWeight: number
  quizWeight: number
  examWeight: number
  classTestWeight: number
  midTermWeight: number
  endOfTermWeight: number
  assignmentWeight: number
  projectWeight: number
}

// Grade weight categories with colors
const WEIGHT_CATEGORIES = [
  { key: "homeworkWeight", label: "Homework", color: "bg-blue-500" },
  { key: "classworkWeight", label: "Classwork", color: "bg-emerald-500" },
  { key: "testWeight", label: "Test", color: "bg-orange-500" },
  { key: "quizWeight", label: "Quiz", color: "bg-purple-500" },
  { key: "examWeight", label: "Exam", color: "bg-red-500" },
  { key: "classTestWeight", label: "Class Test", color: "bg-cyan-500" },
  { key: "midTermWeight", label: "Mid-Term", color: "bg-indigo-500" },
  { key: "endOfTermWeight", label: "End of Term", color: "bg-pink-500" },
  { key: "assignmentWeight", label: "Assignment", color: "bg-teal-500" },
  { key: "projectWeight", label: "Project", color: "bg-amber-500" },
] as const

const EXAM_TYPES = [
  { value: "HOMEWORK", label: "Homework", maxScore: 100, color: "bg-blue-500" },
  { value: "CLASSWORK", label: "Classwork", maxScore: 100, color: "bg-emerald-500" },
  { value: "TEST", label: "Test", maxScore: 100, color: "bg-orange-500" },
  { value: "QUIZ", label: "Quiz", maxScore: 100, color: "bg-purple-500" },
  { value: "EXAM", label: "Exam", maxScore: 100, color: "bg-red-500" },
  { value: "CLASS_TEST", label: "Class Test", maxScore: 20, color: "bg-cyan-500" },
  { value: "MID_TERM", label: "Mid-Term Exam", maxScore: 30, color: "bg-indigo-500" },
  { value: "END_OF_TERM", label: "End of Term", maxScore: 50, color: "bg-pink-500" },
  { value: "ASSIGNMENT", label: "Assignment", maxScore: 10, color: "bg-teal-500" },
  { value: "PROJECT", label: "Project", maxScore: 20, color: "bg-amber-500" },
]

export default function SubjectGradesPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const linkPrefix = subdomain ? `?subdomain=${subdomain}` : ""
  
  const classSubjectId = params.id as string
  
  const [students, setStudents] = useState<Student[]>([])
  const [classSubject, setClassSubject] = useState<ClassSubjectInfo | null>(null)
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("")
  const [selectedExamType, setSelectedExamType] = useState<string>("CLASS_TEST")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingStudent, setEditingStudent] = useState<string | null>(null)
  const [editScore, setEditScore] = useState<string>("")
  const [editMaxScore, setEditMaxScore] = useState<string>("")
  const [editComment, setEditComment] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [viewMode, setViewMode] = useState<"single" | "comprehensive">("single")
  
  // Grade weights state
  const [isWeightsDialogOpen, setIsWeightsDialogOpen] = useState(false)
  const [gradeWeights, setGradeWeights] = useState<GradeWeights>({
    homeworkWeight: 10,
    classworkWeight: 10,
    testWeight: 10,
    quizWeight: 10,
    examWeight: 10,
    classTestWeight: 10,
    midTermWeight: 15,
    endOfTermWeight: 15,
    assignmentWeight: 5,
    projectWeight: 5,
  })
  const [isSavingWeights, setIsSavingWeights] = useState(false)
  
  const loadGrades = async (periodId?: string) => {
    try {
      setIsLoading(true)
      const result = await getSubjectGrades(classSubjectId, periodId)
      
      if (result.success) {
        setStudents(result.students || [])
        setClassSubject(result.classSubject || null)
        setAcademicPeriods(result.academicPeriods || [])
        if (result.selectedPeriodId && !selectedPeriodId) {
          setSelectedPeriodId(result.selectedPeriodId)
        }
        // Set grade weights from the class subject
        if (result.classSubject) {
          setGradeWeights({
            homeworkWeight: result.classSubject.homeworkWeight ?? 10,
            classworkWeight: result.classSubject.classworkWeight ?? 10,
            testWeight: result.classSubject.testWeight ?? 10,
            quizWeight: result.classSubject.quizWeight ?? 10,
            examWeight: result.classSubject.examWeight ?? 10,
            classTestWeight: result.classSubject.classTestWeight ?? 10,
            midTermWeight: result.classSubject.midTermWeight ?? 15,
            endOfTermWeight: result.classSubject.endOfTermWeight ?? 15,
            assignmentWeight: result.classSubject.assignmentWeight ?? 5,
            projectWeight: result.classSubject.projectWeight ?? 5,
          })
        }
      } else {
        setError(result.error || "Failed to load grades")
      }
    } catch (err) {
      setError("An error occurred while loading grades")
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    loadGrades()
  }, [classSubjectId])
  
  const handlePeriodChange = (periodId: string) => {
    setSelectedPeriodId(periodId)
    loadGrades(periodId)
  }
  
  const getStudentScoreForExamType = (student: Student, examType: string): ExamResult | null => {
    return student.examResults.find(r => r.examType === examType) || null
  }
  
  // Calculate comprehensive stats for a student using weighted averages
  const getStudentComprehensiveGrades = (student: Student) => {
    const gradeCategories = ["HOMEWORK", "CLASSWORK", "TEST", "QUIZ", "EXAM", "CLASS_TEST", "MID_TERM", "END_OF_TERM", "ASSIGNMENT", "PROJECT"]
    const categoryScores: Record<string, { score: number; maxScore: number; percentage: number; weight: number } | null> = {}
    
    // Map categories to their weights
    const categoryWeights: Record<string, number> = {
      HOMEWORK: gradeWeights.homeworkWeight,
      CLASSWORK: gradeWeights.classworkWeight,
      TEST: gradeWeights.testWeight,
      QUIZ: gradeWeights.quizWeight,
      EXAM: gradeWeights.examWeight,
      CLASS_TEST: gradeWeights.classTestWeight,
      MID_TERM: gradeWeights.midTermWeight,
      END_OF_TERM: gradeWeights.endOfTermWeight,
      ASSIGNMENT: gradeWeights.assignmentWeight,
      PROJECT: gradeWeights.projectWeight,
    }
    
    for (const category of gradeCategories) {
      const results = student.examResults.filter(r => r.examType === category)
      if (results.length > 0) {
        const totalScore = results.reduce((sum, r) => sum + r.score, 0)
        const totalMaxScore = results.reduce((sum, r) => sum + r.maxScore, 0)
        categoryScores[category] = {
          score: totalScore,
          maxScore: totalMaxScore,
          percentage: totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0,
          weight: categoryWeights[category] || 0,
        }
      } else {
        categoryScores[category] = null
      }
    }
    
    // Calculate weighted overall percentage
    // Only include categories that have grades
    let totalWeight = 0
    let weightedSum = 0
    
    for (const category of gradeCategories) {
      const categoryData = categoryScores[category]
      if (categoryData) {
        // Normalize the weight based on which categories have grades
        totalWeight += categoryData.weight
        weightedSum += categoryData.percentage * categoryData.weight
      }
    }
    
    // Calculate the weighted average (normalizing for missing categories)
    const overallPercentage = totalWeight > 0 ? weightedSum / totalWeight : 0
    
    return {
      categories: categoryScores,
      overallPercentage,
      overallGrade: calculateGrade(overallPercentage, 100),
      weights: gradeWeights,
    }
  }
  
  // Handle saving grade weights
  const handleSaveWeights = async () => {
    const total = gradeWeights.homeworkWeight + gradeWeights.classworkWeight + 
                  gradeWeights.testWeight + gradeWeights.quizWeight + gradeWeights.examWeight +
                  gradeWeights.classTestWeight + gradeWeights.midTermWeight + 
                  gradeWeights.endOfTermWeight + gradeWeights.assignmentWeight + 
                  gradeWeights.projectWeight
    
    if (Math.abs(total - 100) > 0.01) {
      toast.error(`Weights must total 100%. Current total: ${total.toFixed(1)}%`)
      return
    }
    
    setIsSavingWeights(true)
    
    try {
      const result = await updateGradeWeights({
        classSubjectId,
        ...gradeWeights,
      })
      
      if (result.success) {
        toast.success("Grade weights updated successfully")
        setIsWeightsDialogOpen(false)
        loadGrades(selectedPeriodId)
      } else {
        toast.error(result.error || "Failed to update weights")
      }
    } catch (err) {
      toast.error("An error occurred while saving weights")
    } finally {
      setIsSavingWeights(false)
    }
  }
  
  const totalWeight = gradeWeights.homeworkWeight + gradeWeights.classworkWeight + 
                      gradeWeights.testWeight + gradeWeights.quizWeight + gradeWeights.examWeight +
                      gradeWeights.classTestWeight + gradeWeights.midTermWeight + 
                      gradeWeights.endOfTermWeight + gradeWeights.assignmentWeight + 
                      gradeWeights.projectWeight
  
  const handleStartEdit = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    const existingResult = student ? getStudentScoreForExamType(student, selectedExamType) : null
    const examTypeConfig = EXAM_TYPES.find(t => t.value === selectedExamType)
    setEditingStudent(studentId)
    setEditScore(existingResult ? existingResult.score.toString() : "")
    setEditMaxScore(existingResult ? existingResult.maxScore.toString() : (examTypeConfig?.maxScore?.toString() || "100"))
    setEditComment(existingResult?.remarks || "")
  }
  
  const handleCancelEdit = () => {
    setEditingStudent(null)
    setEditScore("")
    setEditMaxScore("")
    setEditComment("")
  }
  
  const handleSaveGrade = async (studentId: string) => {
    const score = parseFloat(editScore)
    const maxScore = parseFloat(editMaxScore)
    
    if (isNaN(maxScore) || maxScore <= 0) {
      toast.error("Max score must be a positive number")
      return
    }
    
    if (isNaN(score) || score < 0 || score > maxScore) {
      toast.error(`Score must be between 0 and ${maxScore}`)
      return
    }
    
    setIsSaving(true)
    
    try {
      const result = await saveStudentGrade({
        classSubjectId,
        studentId,
        periodId: selectedPeriodId,
        examType: selectedExamType,
        score,
        maxScore,
        grade: calculateGrade(score, maxScore),
        remarks: editComment.trim() || undefined,
      })
      
      if (result.success) {
        toast.success("Grade saved successfully")
        loadGrades(selectedPeriodId)
        handleCancelEdit()
      } else {
        toast.error(result.error || "Failed to save grade")
      }
    } catch (err) {
      toast.error("An error occurred while saving")
    } finally {
      setIsSaving(false)
    }
  }
  
  const calculateGrade = (score: number, maxScore: number): string => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return "A"
    if (percentage >= 70) return "B"
    if (percentage >= 60) return "C"
    if (percentage >= 50) return "D"
    if (percentage >= 40) return "E"
    return "F"
  }
  
  // Filter students by search query
  const filteredStudents = students.filter(student => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      student.firstName.toLowerCase().includes(query) ||
      student.lastName.toLowerCase().includes(query) ||
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

  const examTypeConfig = EXAM_TYPES.find(t => t.value === selectedExamType)

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
              Grades for {classSubject?.className}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isWeightsDialogOpen} onOpenChange={setIsWeightsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl neu-sm hover:neu">
                <Settings2 className="h-4 w-4 mr-2" />
                Grade Weights
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Configure Grade Weights
                </DialogTitle>
                <DialogDescription>
                  Set how much each assessment type contributes to the final grade.
                  Weights must total 100%.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
                {/* Current Distribution Visual */}
                <div className="flex h-4 rounded-full overflow-hidden">
                  {WEIGHT_CATEGORIES.map((category) => {
                    const weight = gradeWeights[category.key as keyof GradeWeights];
                    if (weight === 0) return null;
                    return (
                      <div 
                        key={category.key}
                        className={`${category.color} transition-all`}
                        style={{ width: `${weight}%` }}
                        title={`${category.label}: ${weight}%`}
                      />
                    );
                  })}
                </div>
                
                {/* Total indicator */}
                <div className={cn(
                  "text-center text-sm font-medium rounded-lg py-2 sticky top-0 z-10",
                  Math.abs(totalWeight - 100) < 0.01 
                    ? "bg-green-500/10 text-green-600" 
                    : "bg-red-500/10 text-red-600"
                )}>
                  Total: {totalWeight}%
                  {Math.abs(totalWeight - 100) >= 0.01 && (
                    <span className="ml-2">
                      ({totalWeight > 100 ? "+" : ""}{(totalWeight - 100).toFixed(1)}% {totalWeight > 100 ? "over" : "needed"})
                    </span>
                  )}
                </div>
                
                {/* All Weight Categories */}
                <div className="grid gap-4">
                  {WEIGHT_CATEGORIES.map((category) => (
                    <div key={category.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${category.color}`} />
                          {category.label}
                        </Label>
                        <span className="text-sm font-medium tabular-nums">
                          {gradeWeights[category.key as keyof GradeWeights]}%
                        </span>
                      </div>
                      <Slider
                        value={[gradeWeights[category.key as keyof GradeWeights]]}
                        onValueChange={(values: number[]) => 
                          setGradeWeights(prev => ({ 
                            ...prev, 
                            [category.key]: values[0] 
                          }))
                        }
                        max={100}
                        step={5}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsWeightsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveWeights}
                  disabled={isSavingWeights || Math.abs(totalWeight - 100) >= 0.01}
                >
                  {isSavingWeights ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Weights
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Badge className="rounded-lg px-3 py-1.5 neu-sm">
            <Award className="h-4 w-4 mr-2" />
            {students.length} {students.length === 1 ? "Student" : "Students"}
          </Badge>
        </div>
      </div>
      
      {/* Grade Weights Info Card */}
      <Card className="neu rounded-2xl border-0 bg-muted/30">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <PieChart className="h-4 w-4" />
              <span>Grade Distribution:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {WEIGHT_CATEGORIES.filter(cat => gradeWeights[cat.key as keyof GradeWeights] > 0).map((category) => (
                <div key={category.key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${category.color}`} />
                  <span>{category.label}: <strong>{gradeWeights[category.key as keyof GradeWeights]}%</strong></span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 rounded-xl neu-inset border-0"
          />
        </div>
        
        <div className="flex gap-3">
          <div className="flex items-center rounded-xl neu-sm overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-none h-11 px-4",
                viewMode === "single" && "bg-primary/10 text-primary"
              )}
              onClick={() => setViewMode("single")}
            >
              <List className="h-4 w-4 mr-2" />
              Single
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-none h-11 px-4",
                viewMode === "comprehensive" && "bg-primary/10 text-primary"
              )}
              onClick={() => setViewMode("comprehensive")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Overview
            </Button>
          </div>
          
          {viewMode === "single" && (
            <>
              <Select value={selectedPeriodId} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[180px] h-11 rounded-xl neu-sm border-0">
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  {academicPeriods.map(period => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                <SelectTrigger className="w-[180px] h-11 rounded-xl neu-sm border-0">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          
          {viewMode === "comprehensive" && (
            <Select value={selectedPeriodId} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[180px] h-11 rounded-xl neu-sm border-0">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                {academicPeriods.map(period => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Comprehensive View */}
      {viewMode === "comprehensive" && (
        <>
          {/* Category Stats */}
          <div className="grid gap-4 sm:grid-cols-5">
            {["HOMEWORK", "CLASSWORK", "TEST", "QUIZ", "EXAM"].map(category => {
              const config = EXAM_TYPES.find(t => t.value === category)
              const studentsWithGrades = filteredStudents.filter(s => 
                s.examResults.some(r => r.examType === category)
              )
              const avgPercentage = studentsWithGrades.length > 0
                ? studentsWithGrades.reduce((sum, s) => {
                    const results = s.examResults.filter(r => r.examType === category)
                    const totalScore = results.reduce((s, r) => s + r.score, 0)
                    const totalMax = results.reduce((s, r) => s + r.maxScore, 0)
                    return sum + (totalMax > 0 ? (totalScore / totalMax) * 100 : 0)
                  }, 0) / studentsWithGrades.length
                : 0
              
              return (
                <Card key={category} className="neu rounded-2xl border-0">
                  <CardContent className="py-4 text-center">
                    <div className={cn(
                      "w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center text-white",
                      config?.color || "bg-gray-500"
                    )}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <p className="text-lg font-bold">{avgPercentage.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">{config?.label || category}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {studentsWithGrades.length}/{filteredStudents.length} graded
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Comprehensive Grades Table */}
          <Card className="neu rounded-2xl border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                Grade Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredStudents.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No students found</p>
                </div>
              ) : (
                <div className="rounded-xl overflow-x-auto border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead className="min-w-[150px]">Student</TableHead>
                        <TableHead className="text-center min-w-[80px]">
                          <div className="flex flex-col items-center">
                            <span className="text-blue-500">HW</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center min-w-[80px]">
                          <div className="flex flex-col items-center">
                            <span className="text-emerald-500">CW</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center min-w-[80px]">
                          <div className="flex flex-col items-center">
                            <span className="text-orange-500">Test</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center min-w-[80px]">
                          <div className="flex flex-col items-center">
                            <span className="text-purple-500">Quiz</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center min-w-[80px]">
                          <div className="flex flex-col items-center">
                            <span className="text-red-500">Exam</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center min-w-[80px]">Average</TableHead>
                        <TableHead className="text-center min-w-[60px]">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student, index) => {
                        const comprehensive = getStudentComprehensiveGrades(student)
                        
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              <div>
                                <span className="font-medium">
                                  {student.firstName} {student.lastName}
                                </span>
                                <p className="text-xs text-muted-foreground">{student.studentId}</p>
                              </div>
                            </TableCell>
                            {["HOMEWORK", "CLASSWORK", "TEST", "QUIZ", "EXAM"].map(category => {
                              const catData = comprehensive.categories[category]
                              return (
                                <TableCell key={category} className="text-center">
                                  {catData ? (
                                    <span className={cn(
                                      "font-medium",
                                      catData.percentage >= 70 && "text-emerald-600",
                                      catData.percentage >= 50 && catData.percentage < 70 && "text-amber-600",
                                      catData.percentage < 50 && "text-red-600"
                                    )}>
                                      {catData.percentage.toFixed(0)}%
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              )
                            })}
                            <TableCell className="text-center font-semibold">
                              {comprehensive.overallPercentage.toFixed(0)}%
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "rounded-lg",
                                  comprehensive.overallGrade === "A" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
                                  comprehensive.overallGrade === "B" && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                                  comprehensive.overallGrade === "C" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                                  comprehensive.overallGrade === "D" && "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
                                  (comprehensive.overallGrade === "E" || comprehensive.overallGrade === "F") && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                )}
                              >
                                {comprehensive.overallGrade}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Class Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="neu rounded-2xl border-0">
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {(() => {
                      const avgs = filteredStudents.map(s => 
                        getStudentComprehensiveGrades(s).overallPercentage
                      ).filter(p => p > 0)
                      return avgs.length > 0 
                        ? `${(avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(0)}%`
                        : "-"
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground">Class Average</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="neu rounded-2xl border-0">
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
                  <Percent className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {(() => {
                      const passed = filteredStudents.filter(s => 
                        getStudentComprehensiveGrades(s).overallPercentage >= 50
                      ).length
                      return filteredStudents.length > 0 
                        ? `${Math.round((passed / filteredStudents.length) * 100)}%`
                        : "-"
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground">Pass Rate</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="neu rounded-2xl border-0">
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
                  <Award className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {filteredStudents.filter(s => 
                      getStudentComprehensiveGrades(s).overallGrade === "A"
                    ).length}
                  </p>
                  <p className="text-xs text-muted-foreground">A Grades</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="neu rounded-2xl border-0">
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-bold">{filteredStudents.length}</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Single Category View - Grades Table */}
      {viewMode === "single" && (
        <>
          <Card className="neu rounded-2xl border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5" />
                {examTypeConfig?.label || "Grades"} 
                <span className="text-sm font-normal text-muted-foreground">
                  (Max: {examTypeConfig?.maxScore || 100} marks)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "No students match your search" 
                  : "No students enrolled in this class yet"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="min-w-[200px]">Comments</TableHead>
                    <TableHead className="text-center w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => {
                    const result = getStudentScoreForExamType(student, selectedExamType)
                    const isEditing = editingStudent === student.id
                    
                    return (
                      <TableRow 
                        key={student.id}
                        className={cn(!student.isActive && "opacity-60")}
                      >
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {student.firstName} {student.lastName}
                            </span>
                            {!student.isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {student.studentId || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="number"
                                value={editScore}
                                onChange={(e) => setEditScore(e.target.value)}
                                className="w-16 h-8 text-center"
                                min={0}
                                placeholder="Score"
                                autoFocus
                              />
                              <span className="text-muted-foreground">/</span>
                              <Input
                                type="number"
                                value={editMaxScore}
                                onChange={(e) => setEditMaxScore(e.target.value)}
                                className="w-16 h-8 text-center"
                                min={1}
                                placeholder="Max"
                              />
                            </div>
                          ) : (
                            <span className={cn(
                              "font-semibold",
                              result ? "" : "text-muted-foreground"
                            )}>
                              {result ? `${result.score}/${result.maxScore}` : "-"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {result ? (
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "rounded-lg",
                                result.grade === "A" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
                                result.grade === "B" && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                                result.grade === "C" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                                result.grade === "D" && "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
                                (result.grade === "E" || result.grade === "F") && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              )}
                            >
                              {result.grade}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="text"
                              value={editComment}
                              onChange={(e) => setEditComment(e.target.value)}
                              className="h-8 text-sm"
                              placeholder="Add comment..."
                            />
                          ) : (
                            <span className={cn(
                              "text-sm",
                              result?.remarks ? "" : "text-muted-foreground italic"
                            )}>
                              {result?.remarks || "No comment"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleSaveGrade(student.id)}
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 text-emerald-500" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleStartEdit(student.id)}
                              disabled={!selectedPeriodId}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Summary */}
      {filteredStudents.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="neu rounded-2xl border-0">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">
                {filteredStudents.filter(s => getStudentScoreForExamType(s, selectedExamType)).length}
              </p>
              <p className="text-sm text-muted-foreground">Graded</p>
            </CardContent>
          </Card>
          <Card className="neu rounded-2xl border-0">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">
                {filteredStudents.filter(s => !getStudentScoreForExamType(s, selectedExamType)).length}
              </p>
              <p className="text-sm text-muted-foreground">Not Graded</p>
            </CardContent>
          </Card>
          <Card className="neu rounded-2xl border-0">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">
                {(() => {
                  const scores = filteredStudents
                    .map(s => getStudentScoreForExamType(s, selectedExamType))
                    .filter(r => r !== null)
                    .map(r => (r!.score / r!.maxScore) * 100)
                  return scores.length > 0 
                    ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%`
                    : "-"
                })()}
              </p>
              <p className="text-sm text-muted-foreground">Average</p>
            </CardContent>
          </Card>
          <Card className="neu rounded-2xl border-0">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">
                {(() => {
                  const passedCount = filteredStudents
                    .map(s => getStudentScoreForExamType(s, selectedExamType))
                    .filter(r => r !== null && (r.score / r.maxScore) * 100 >= 50)
                    .length
                  const totalGraded = filteredStudents.filter(s => 
                    getStudentScoreForExamType(s, selectedExamType)
                  ).length
                  return totalGraded > 0 ? `${Math.round((passedCount / totalGraded) * 100)}%` : "-"
                })()}
              </p>
              <p className="text-sm text-muted-foreground">Pass Rate</p>
            </CardContent>
          </Card>
        </div>
      )}
        </>
      )}
    </div>
  )
}
