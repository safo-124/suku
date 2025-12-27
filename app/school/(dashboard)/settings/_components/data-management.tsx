"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Database, 
  Users, 
  GraduationCap, 
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { assignMissingEmployeeIds } from "../../teachers/_actions/teacher-actions"
import { assignMissingStudentIds } from "../../students/_actions/student-actions"

export function DataManagement() {
  const [isUpdatingTeachers, setIsUpdatingTeachers] = useState(false)
  const [isUpdatingStudents, setIsUpdatingStudents] = useState(false)
  const [teacherResult, setTeacherResult] = useState<{ success: boolean; message?: string; updated?: number; error?: string } | null>(null)
  const [studentResult, setStudentResult] = useState<{ success: boolean; message?: string; updated?: number; error?: string } | null>(null)

  async function handleAssignTeacherIds() {
    setIsUpdatingTeachers(true)
    setTeacherResult(null)
    try {
      const result = await assignMissingEmployeeIds()
      setTeacherResult(result)
      if (result.success) {
        toast.success(result.message || "Employee IDs assigned successfully")
      } else {
        toast.error(result.error || "Failed to assign employee IDs")
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred while assigning employee IDs")
    } finally {
      setIsUpdatingTeachers(false)
    }
  }

  async function handleAssignStudentIds() {
    setIsUpdatingStudents(true)
    setStudentResult(null)
    try {
      const result = await assignMissingStudentIds()
      setStudentResult(result)
      if (result.success) {
        toast.success(result.message || "Student IDs assigned successfully")
      } else {
        toast.error(result.error || "Failed to assign student IDs")
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred while assigning student IDs")
    } finally {
      setIsUpdatingStudents(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Data Management</h3>
        <p className="text-sm text-muted-foreground">
          Manage and maintain your school&apos;s data integrity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Teacher ID Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-blue-500" />
              Teacher Employee IDs
            </CardTitle>
            <CardDescription>
              Assign unique employee IDs to teachers who don&apos;t have one (format: TCH-XXXXX)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleAssignTeacherIds}
              disabled={isUpdatingTeachers}
              className="w-full"
              variant="outline"
            >
              {isUpdatingTeachers ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Assigning IDs...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Assign Missing Employee IDs
                </>
              )}
            </Button>

            {teacherResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                teacherResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {teacherResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {teacherResult.message || teacherResult.error}
                </span>
                {teacherResult.updated !== undefined && (
                  <Badge variant="secondary" className="ml-auto">
                    {teacherResult.updated} updated
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student ID Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-5 w-5 text-purple-500" />
              Student IDs
            </CardTitle>
            <CardDescription>
              Assign unique student IDs to students who don&apos;t have one (format: STU-YYMM-XXXXX)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleAssignStudentIds}
              disabled={isUpdatingStudents}
              className="w-full"
              variant="outline"
            >
              {isUpdatingStudents ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Assigning IDs...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Assign Missing Student IDs
                </>
              )}
            </Button>

            {studentResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                studentResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {studentResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {studentResult.message || studentResult.error}
                </span>
                {studentResult.updated !== undefined && (
                  <Badge variant="secondary" className="ml-auto">
                    {studentResult.updated} updated
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
