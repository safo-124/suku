"use client"

import { useState } from "react"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  BookOpen,
  Droplet,
  Hash,
  GraduationCap,
  Lock,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { changeStudentPassword } from "@/app/student/login/_actions/student-auth-actions"

interface StudentClass {
  id: string
  name: string
  schoolLevel: {
    id: string
    name: string
    shortName: string
  } | null
  classTeacher: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  academicYear: {
    id: string
    name: string
    isCurrent: boolean
  } | null
}

interface Profile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatar: string | null
  studentId: string | null
  dateOfBirth: Date | null
  gender: string | null
  bloodGroup: string | null
  address: string | null
  admissionDate: Date | null
  class: StudentClass | null
}

export function ProfileClient({ profile }: { profile: Profile }) {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const userInitials = `${profile.firstName?.charAt(0) || ''}${profile.lastName?.charAt(0) || ''}`.toUpperCase()

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setIsChangingPassword(true)
    try {
      const result = await changeStudentPassword(currentPassword, newPassword)
      
      if (result.success) {
        toast.success("Password changed successfully")
        setIsPasswordDialogOpen(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast.error(result.error || "Failed to change password")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          View your personal information and account details.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="neu-sm lg:col-span-1">
          <CardContent className="pt-6">
            <div className="text-center">
              <Avatar className="h-24 w-24 mx-auto ring-4 ring-background shadow-lg">
                <AvatarImage src={profile.avatar || undefined} />
                <AvatarFallback className="text-2xl bg-foreground text-background">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-bold">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-muted-foreground">{profile.email}</p>
              {profile.studentId && (
                <Badge variant="secondary" className="mt-2">
                  ID: {profile.studentId}
                </Badge>
              )}

              {/* Class Info */}
              {profile.class && (
                <div className="mt-6 p-4 rounded-xl neu-inset-sm">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <GraduationCap className="h-4 w-4" />
                    <span className="font-medium">{profile.class.name}</span>
                  </div>
                  {profile.class.schoolLevel && (
                    <p className="text-sm text-muted-foreground">
                      {profile.class.schoolLevel.name}
                    </p>
                  )}
                  {profile.class.academicYear && (
                    <Badge variant="outline" className="mt-2">
                      {profile.class.academicYear.name}
                    </Badge>
                  )}
                </div>
              )}

              {/* Change Password Button */}
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="mt-6 neu-sm hover:neu">
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new one.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsPasswordDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword || !currentPassword || !newPassword}
                    >
                      {isChangingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Change Password
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="neu-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <InfoItem
                icon={User}
                label="Full Name"
                value={`${profile.firstName} ${profile.lastName}`}
              />
              <InfoItem
                icon={Mail}
                label="Email Address"
                value={profile.email}
              />
              <InfoItem
                icon={Phone}
                label="Phone Number"
                value={profile.phone}
              />
              <InfoItem
                icon={Hash}
                label="Student ID"
                value={profile.studentId}
              />
              <InfoItem
                icon={Calendar}
                label="Date of Birth"
                value={profile.dateOfBirth 
                  ? new Date(profile.dateOfBirth).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : null
                }
              />
              <InfoItem
                icon={User}
                label="Gender"
                value={profile.gender}
              />
              <InfoItem
                icon={Droplet}
                label="Blood Group"
                value={profile.bloodGroup}
              />
              <InfoItem
                icon={Calendar}
                label="Admission Date"
                value={profile.admissionDate
                  ? new Date(profile.admissionDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : null
                }
              />
              <div className="sm:col-span-2">
                <InfoItem
                  icon={MapPin}
                  label="Address"
                  value={profile.address}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class Teacher Card */}
        {profile.class?.classTeacher && (
          <Card className="neu-sm lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Class Teacher
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>
                    {profile.class.classTeacher.firstName.charAt(0)}
                    {profile.class.classTeacher.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {profile.class.classTeacher.firstName} {profile.class.classTeacher.lastName}
                  </h3>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {profile.class.classTeacher.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl neu-inset-sm">
      <div className="h-10 w-10 rounded-lg neu flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium truncate">{value || "Not provided"}</p>
      </div>
    </div>
  )
}
