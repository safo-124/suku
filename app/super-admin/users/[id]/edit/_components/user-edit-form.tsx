"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { UserRole } from "@/app/generated/prisma/client"
import { getUserById, getSchoolsForFilter } from "../../../_actions/user-actions"

interface UserEditFormProps {
  userId: string
}

export function UserEditForm({ userId }: UserEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([])
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "STUDENT" as UserRole,
    schoolId: "",
    isActive: true,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userResult, schoolsResult] = await Promise.all([
          getUserById(userId),
          getSchoolsForFilter(),
        ])
        
        if (userResult.success && userResult.user) {
          const user = userResult.user
          setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone || "",
            role: user.role,
            schoolId: user.school?.id || "",
            isActive: user.isActive,
          })
        }
        
        if (schoolsResult.success && schoolsResult.schools) {
          setSchools(schoolsResult.schools)
        }
      } catch (error) {
        console.error("Failed to load user:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      try {
        const response = await fetch(`/api/super-admin/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        
        if (response.ok) {
          router.push(`/super-admin/users/${userId}`)
          router.refresh()
        }
      } catch (error) {
        console.error("Failed to update user:", error)
      }
    })
  }

  const inputClass = "neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl h-11"
  const selectClass = "neu-inset border-0 bg-transparent rounded-xl h-11 [&>span]:text-sm"

  if (isLoading) {
    return (
      <div className="neu-flat rounded-2xl p-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="neu-flat rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
        <div className="p-6 space-y-6">
          <h3 className="font-semibold text-lg">Personal Information</h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="neu-flat rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500/50 via-blue-500/20 to-transparent" />
        <div className="p-6 space-y-6">
          <h3 className="font-semibold text-lg">Role & Assignment</h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}
              >
                <SelectTrigger className={selectClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="neu-flat border-white/10">
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="SCHOOL_ADMIN">School Admin</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="PARENT">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>School</Label>
              <Select 
                value={formData.schoolId || "NONE"} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, schoolId: value === "NONE" ? "" : value }))}
              >
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="No School" />
                </SelectTrigger>
                <SelectContent className="neu-flat border-white/10">
                  <SelectItem value="NONE">No School</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 neu-inset rounded-xl">
            <div>
              <p className="font-medium">Account Status</p>
              <p className="text-sm text-muted-foreground">Enable or disable user access</p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Link href={`/super-admin/users/${userId}`}>
          <Button 
            type="button" 
            variant="ghost" 
            className="neu-flat hover:neu-inset rounded-xl"
          >
            Cancel
          </Button>
        </Link>
        <Button 
          type="submit" 
          disabled={isPending}
          className="neu-convex hover:scale-[0.98] active:neu-inset rounded-xl"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
