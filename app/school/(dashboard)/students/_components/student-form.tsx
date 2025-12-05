"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, AlertCircle, Copy, Check, Users } from "lucide-react"
import { Gender } from "@/app/generated/prisma/client"
import { createStudent, updateStudent, type CreateStudentInput, type ParentInput } from "../_actions/student-actions"

interface ClassOption {
  id: string
  name: string
  gradeLevel: number
  section: string | null
  _count: { students: number }
}

interface StudentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone: string | null
    studentProfile?: {
      studentId: string | null
      dateOfBirth: Date | null
      gender: Gender | null
      bloodGroup: string | null
      address: string | null
      classId: string | null
    } | null
  }
  classes: ClassOption[]
}

export function StudentForm({ open, onOpenChange, student, classes }: StudentFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [parentCredentials, setParentCredentials] = useState<Array<{ email: string; tempPassword: string }> | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedParent, setCopiedParent] = useState<string | null>(null)

  const isEditing = !!student

  const [formData, setFormData] = useState<CreateStudentInput>({
    firstName: student?.firstName || "",
    lastName: student?.lastName || "",
    email: student?.email || "",
    phone: student?.phone || "",
    studentId: student?.studentProfile?.studentId || "",
    dateOfBirth: student?.studentProfile?.dateOfBirth 
      ? new Date(student.studentProfile.dateOfBirth).toISOString().split("T")[0]
      : "",
    gender: student?.studentProfile?.gender || undefined,
    bloodGroup: student?.studentProfile?.bloodGroup || "",
    address: student?.studentProfile?.address || "",
    classId: student?.studentProfile?.classId || "",
    // Parent details
    parent1: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      relationship: "",
      occupation: "",
    },
    parent2: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      relationship: "",
      occupation: "",
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError("First name, last name, and email are required")
      return
    }

    startTransition(async () => {
      let result: { success: boolean; error?: string; tempPassword?: string; parentCredentials?: Array<{ email: string; tempPassword: string }> }
      if (isEditing) {
        result = await updateStudent({ ...formData, id: student.id })
      } else {
        // Only include parent data if at least email is provided
        const dataToSubmit = {
          ...formData,
          parent1: formData.parent1?.email ? formData.parent1 : undefined,
          parent2: formData.parent2?.email ? formData.parent2 : undefined,
        }
        result = await createStudent(dataToSubmit)
      }

      if (result.success) {
        if (!isEditing && (result.tempPassword || result.parentCredentials)) {
          setTempPassword(result.tempPassword || null)
          setParentCredentials(result.parentCredentials || null)
        } else {
          onOpenChange(false)
          router.refresh()
        }
      } else {
        setError(result.error || "Operation failed")
      }
    })
  }

  const handleCopyPassword = async () => {
    if (tempPassword) {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyParentPassword = async (email: string, password: string) => {
    await navigator.clipboard.writeText(password)
    setCopiedParent(email)
    setTimeout(() => setCopiedParent(null), 2000)
  }

  const handleClose = () => {
    setTempPassword(null)
    setParentCredentials(null)
    setError(null)
    onOpenChange(false)
    router.refresh()
  }

  const inputClass = "neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl h-11"

  // Show password after successful creation
  if (tempPassword || parentCredentials) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="neu rounded-3xl border-0 sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Student Created Successfully</DialogTitle>
            <DialogDescription>
              The student account has been created. Share these credentials:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Student credentials */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Student Credentials
              </h4>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{formData.email}</p>
              </div>

              {tempPassword && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-muted-foreground mb-1">Temporary Password</p>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-lg">{tempPassword}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={handleCopyPassword}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Parent credentials */}
            {parentCredentials && parentCredentials.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Parent/Guardian Credentials
                </h4>
                {parentCredentials.map((parent, index) => (
                  <div key={parent.email} className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-muted-foreground mb-1">
                      Parent/Guardian {index + 1}
                    </p>
                    <p className="text-sm font-medium mb-2">{parent.email}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Password:</span>
                      <code className="font-mono">{parent.tempPassword}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-lg"
                        onClick={() => handleCopyParentPassword(parent.email, parent.tempPassword)}
                      >
                        {copiedParent === parent.email ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              ⚠️ These passwords will only be shown once. Make sure to save them.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="rounded-xl">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neu rounded-3xl border-0 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? "Edit Student" : "Add New Student"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the student's information below."
              : "Fill in the details to create a new student account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Personal Information
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={inputClass}
                  placeholder="John"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={inputClass}
                  placeholder="Doe"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputClass}
                  placeholder="john.doe@email.com"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClass}
                  placeholder="+1 234 567 890"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth || ""}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className={inputClass}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender || ""}
                  onValueChange={(value) => setFormData({ ...formData, gender: value as Gender })}
                  disabled={isPending}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="neu rounded-xl border-0">
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select
                  value={formData.bloodGroup || ""}
                  onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                  disabled={isPending}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="neu rounded-xl border-0">
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Academic Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Admission Number</Label>
                <Input
                  id="studentId"
                  value={formData.studentId || ""}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className={inputClass}
                  placeholder="STU-2024-001"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="classId">Class</Label>
                <Select
                  value={formData.classId || ""}
                  onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  disabled={isPending}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent className="neu rounded-xl border-0">
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({cls._count.students} students)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Address
            </h4>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Textarea
                id="address"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl min-h-[80px]"
                placeholder="123 Main St, City, State, ZIP"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Parent/Guardian Information - Only show when creating new student */}
          {!isEditing && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4" />
                Parent/Guardian Information
              </h4>
              <p className="text-xs text-muted-foreground">
                Add parent/guardian details to automatically create their accounts. They will be able to access the parent portal to monitor the student&apos;s progress.
              </p>

              {/* Parent 1 */}
              <div className="p-4 rounded-xl bg-muted/30 space-y-4">
                <h5 className="text-sm font-medium">Parent/Guardian 1</h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent1FirstName">First Name</Label>
                    <Input
                      id="parent1FirstName"
                      value={formData.parent1?.firstName || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        parent1: { ...formData.parent1!, firstName: e.target.value } 
                      })}
                      className={inputClass}
                      placeholder="Parent first name"
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parent1LastName">Last Name</Label>
                    <Input
                      id="parent1LastName"
                      value={formData.parent1?.lastName || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        parent1: { ...formData.parent1!, lastName: e.target.value } 
                      })}
                      className={inputClass}
                      placeholder="Parent last name"
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent1Email">Email *</Label>
                    <Input
                      id="parent1Email"
                      type="email"
                      value={formData.parent1?.email || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        parent1: { ...formData.parent1!, email: e.target.value } 
                      })}
                      className={inputClass}
                      placeholder="parent@email.com"
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parent1Phone">Phone</Label>
                    <Input
                      id="parent1Phone"
                      value={formData.parent1?.phone || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        parent1: { ...formData.parent1!, phone: e.target.value } 
                      })}
                      className={inputClass}
                      placeholder="+1 234 567 890"
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent1Relationship">Relationship</Label>
                    <Select
                      value={formData.parent1?.relationship || ""}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        parent1: { ...formData.parent1!, relationship: value } 
                      })}
                      disabled={isPending}
                    >
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent className="neu rounded-xl border-0">
                        <SelectItem value="Father">Father</SelectItem>
                        <SelectItem value="Mother">Mother</SelectItem>
                        <SelectItem value="Guardian">Guardian</SelectItem>
                        <SelectItem value="Grandparent">Grandparent</SelectItem>
                        <SelectItem value="Uncle">Uncle</SelectItem>
                        <SelectItem value="Aunt">Aunt</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parent1Occupation">Occupation</Label>
                    <Input
                      id="parent1Occupation"
                      value={formData.parent1?.occupation || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        parent1: { ...formData.parent1!, occupation: e.target.value } 
                      })}
                      className={inputClass}
                      placeholder="e.g. Engineer, Teacher"
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>

              {/* Parent 2 */}
              <div className="p-4 rounded-xl bg-muted/30 space-y-4">
                <h5 className="text-sm font-medium">Parent/Guardian 2 (Optional)</h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent2FirstName">First Name</Label>
                    <Input
                      id="parent2FirstName"
                      value={formData.parent2?.firstName || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        parent2: { ...formData.parent2!, firstName: e.target.value } 
                      })}
                      className={inputClass}
                      placeholder="Parent first name"
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parent2LastName">Last Name</Label>
                    <Input
                      id="parent2LastName"
                      value={formData.parent2?.lastName || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        parent2: { ...formData.parent2!, lastName: e.target.value } 
                      })}
                      className={inputClass}
                      placeholder="Parent last name"
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent2Email">Email</Label>
                    <Input
                      id="parent2Email"
                      type="email"
                      value={formData.parent2?.email || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        parent2: { ...formData.parent2!, email: e.target.value } 
                      })}
                      className={inputClass}
                      placeholder="parent@email.com"
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parent2Phone">Phone</Label>
                    <Input
                      id="parent2Phone"
                      value={formData.parent2?.phone || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        parent2: { ...formData.parent2!, phone: e.target.value } 
                      })}
                      className={inputClass}
                      placeholder="+1 234 567 890"
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent2Relationship">Relationship</Label>
                    <Select
                      value={formData.parent2?.relationship || ""}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        parent2: { ...formData.parent2!, relationship: value } 
                      })}
                      disabled={isPending}
                    >
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent className="neu rounded-xl border-0">
                        <SelectItem value="Father">Father</SelectItem>
                        <SelectItem value="Mother">Mother</SelectItem>
                        <SelectItem value="Guardian">Guardian</SelectItem>
                        <SelectItem value="Grandparent">Grandparent</SelectItem>
                        <SelectItem value="Uncle">Uncle</SelectItem>
                        <SelectItem value="Aunt">Aunt</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parent2Occupation">Occupation</Label>
                    <Input
                      id="parent2Occupation"
                      value={formData.parent2?.occupation || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        parent2: { ...formData.parent2!, occupation: e.target.value } 
                      })}
                      className={inputClass}
                      placeholder="e.g. Engineer, Teacher"
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl neu-convex"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Student"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
