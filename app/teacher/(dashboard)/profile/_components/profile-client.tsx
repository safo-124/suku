"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  BookOpen, 
  GraduationCap,
  Building,
  Lock,
  Save,
  Eye,
  EyeOff,
  CheckCircle
} from "lucide-react"
import { updateTeacherProfile, changeTeacherPassword } from "../../_actions/teacher-actions"
import { toast } from "sonner"

interface TeacherProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatarUrl: string | null
  teacherProfile: {
    employeeId: string | null
    qualification: string | null
    specialization: string | null
    dateOfJoining: Date | null
    address: string | null
  } | null
  school: {
    name: string
  }
  classTeacherOf: Array<{
    id: string
    name: string
    grade: { name: string }
  }>
  subjectTeachers: Array<{
    subject: { name: string; code: string | null }
    class: { name: string; grade: { name: string } }
  }>
}

interface ProfileClientProps {
  profile: TeacherProfile
}

export function ProfileClient({ profile }: ProfileClientProps) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone || "",
    address: profile.teacherProfile?.address || "",
    qualification: profile.teacherProfile?.qualification || "",
    specialization: profile.teacherProfile?.specialization || "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const getInitials = () => {
    return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const handleSaveProfile = () => {
    startTransition(async () => {
      const result = await updateTeacherProfile(formData)
      if (result.success) {
        toast.success("Profile updated successfully")
        setIsEditing(false)
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    })
  }

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    startTransition(async () => {
      const result = await changeTeacherPassword(passwordData.currentPassword, passwordData.newPassword)
      if (result.success) {
        toast.success("Password changed successfully")
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        setShowPasswordSection(false)
      } else {
        toast.error(result.error || "Failed to change password")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">View and manage your profile information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="glass-card neu-flat lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profile.avatarUrl || ""} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              <h2 className="text-xl font-bold">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-muted-foreground">{profile.email}</p>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-primary/10 text-primary">Teacher</Badge>
                {profile.classTeacherOf.length > 0 && (
                  <Badge className="bg-green-500/10 text-green-500">Class Teacher</Badge>
                )}
              </div>

              <Separator className="my-4 w-full" />

              <div className="w-full space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.school.name}</span>
                </div>
                {profile.teacherProfile?.employeeId && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">ID: {profile.teacherProfile.employeeId}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}
                {profile.teacherProfile?.dateOfJoining && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Joined {formatDate(profile.teacherProfile.dateOfJoining)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details & Edit Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Teaching Info */}
          <Card className="glass-card neu-flat">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Teaching Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.classTeacherOf.length > 0 && (
                <div>
                  <Label className="text-muted-foreground text-sm">Class Teacher Of</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.classTeacherOf.map((cls) => (
                      <Badge key={cls.id} variant="secondary" className="neu-convex">
                        {cls.grade.name} - {cls.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground text-sm">Subjects Teaching</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profile.subjectTeachers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No subjects assigned</p>
                  ) : (
                    [...new Map(profile.subjectTeachers.map(st => [st.subject.code, st.subject])).values()].map((subject) => (
                      <Badge key={subject.code} variant="outline">
                        {subject.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground text-sm">Classes Teaching</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profile.subjectTeachers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No classes assigned</p>
                  ) : (
                    [...new Map(profile.subjectTeachers.map(st => 
                      [`${st.class.grade.name}-${st.class.name}`, { grade: st.class.grade.name, name: st.class.name }]
                    )).values()].map((cls, idx) => (
                      <Badge key={idx} variant="outline">
                        {cls.grade} - {cls.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="glass-card neu-flat">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-foreground">{profile.firstName}</p>
                  )}
                </div>

                <div>
                  <Label>Last Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-foreground">{profile.lastName}</p>
                  )}
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </Label>
                  <p className="mt-1 text-muted-foreground">{profile.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Phone
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="mt-1 text-foreground">{profile.phone || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" /> Qualification
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      className="mt-1"
                      placeholder="e.g., M.Ed, B.Sc"
                    />
                  ) : (
                    <p className="mt-1 text-foreground">{profile.teacherProfile?.qualification || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <Label>Specialization</Label>
                  {isEditing ? (
                    <Input
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="mt-1"
                      placeholder="e.g., Mathematics, Science"
                    />
                  ) : (
                    <p className="mt-1 text-foreground">{profile.teacherProfile?.specialization || "Not provided"}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Address
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="mt-1"
                      placeholder="Enter your address"
                    />
                  ) : (
                    <p className="mt-1 text-foreground">{profile.teacherProfile?.address || "Not provided"}</p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveProfile} disabled={isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isPending}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="glass-card neu-flat">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Security
                </CardTitle>
                <CardDescription>Change your password</CardDescription>
              </div>
              {!showPasswordSection && (
                <Button variant="outline" onClick={() => setShowPasswordSection(true)}>
                  Change Password
                </Button>
              )}
            </CardHeader>
            {showPasswordSection && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Current Password</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>New Password</Label>
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="mt-1"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <Label>Confirm New Password</Label>
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="mt-1"
                    placeholder="Confirm new password"
                  />
                  {passwordData.newPassword && passwordData.confirmPassword && (
                    passwordData.newPassword === passwordData.confirmPassword ? (
                      <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Passwords match
                      </p>
                    ) : (
                      <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                    )
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleChangePassword} disabled={isPending}>
                    {isPending ? "Changing..." : "Change Password"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowPasswordSection(false)
                      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
                    }} 
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
