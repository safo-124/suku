"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  createSchoolAdmin, 
  updateSchoolAdmin, 
  deleteSchoolAdmin, 
  resetSchoolAdminPassword,
  checkEmailAvailability,
  getSchoolAdmins
} from "../_actions/school-actions"
import { cn } from "@/lib/utils"
import { 
  UserCog, 
  Plus, 
  Mail, 
  Phone, 
  MoreHorizontal,
  Pencil,
  Trash2,
  Key,
  Loader2,
  Check,
  X,
  Eye,
  EyeOff,
  Copy,
  AlertCircle,
  Shield,
  UserCheck,
  UserX
} from "lucide-react"

interface SchoolAdmin {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
}

interface SchoolAdminsProps {
  schoolId: string
  initialAdmins: SchoolAdmin[]
}

export function SchoolAdmins({ schoolId, initialAdmins }: SchoolAdminsProps) {
  const [admins, setAdmins] = useState<SchoolAdmin[]>(initialAdmins)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [selectedAdmin, setSelectedAdmin] = useState<SchoolAdmin | null>(null)
  const [isPending, startTransition] = useTransition()

  const refreshAdmins = async () => {
    const result = await getSchoolAdmins(schoolId)
    if (result.success && result.admins) {
      setAdmins(result.admins)
    }
  }

  const handleResetPassword = async (adminId: string) => {
    startTransition(async () => {
      const result = await resetSchoolAdminPassword(adminId)
      if (result.success && result.tempPassword) {
        setGeneratedPassword(result.tempPassword)
        setIsPasswordDialogOpen(true)
      }
    })
  }

  const handleToggleActive = async (admin: SchoolAdmin) => {
    startTransition(async () => {
      const result = await updateSchoolAdmin(admin.id, { isActive: !admin.isActive })
      if (result.success) {
        refreshAdmins()
      }
    })
  }

  const handleDelete = async (adminId: string) => {
    if (!confirm("Are you sure you want to delete this admin? This action cannot be undone.")) {
      return
    }
    startTransition(async () => {
      const result = await deleteSchoolAdmin(adminId)
      if (result.success) {
        refreshAdmins()
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl neu-flat flex items-center justify-center">
            <UserCog className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">School Administrators</h3>
            <p className="text-sm text-muted-foreground">{admins.length} admin{admins.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="neu-convex hover:scale-[0.98] rounded-xl h-10">
              <Plus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="neu-flat border-white/10 max-w-lg">
            <DialogHeader>
              <DialogTitle>Add School Administrator</DialogTitle>
              <DialogDescription>
                Create a new admin account for this school
              </DialogDescription>
            </DialogHeader>
            <AddAdminForm 
              schoolId={schoolId} 
              onSuccess={(password) => {
                setIsAddDialogOpen(false)
                if (password) {
                  setGeneratedPassword(password)
                  setIsPasswordDialogOpen(true)
                }
                refreshAdmins()
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Admins List */}
      {admins.length === 0 ? (
        <div className="neu-inset rounded-xl p-8 text-center">
          <div className="h-12 w-12 rounded-xl neu-flat flex items-center justify-center mx-auto mb-4">
            <UserCog className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No administrators added yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Add an admin to manage this school
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className={cn(
                "neu-flat rounded-xl p-4 flex items-center justify-between gap-4",
                !admin.isActive && "opacity-60"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center text-sm font-medium",
                  admin.isActive ? "neu-convex" : "neu-inset"
                )}>
                  {admin.firstName[0]}{admin.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{admin.firstName} {admin.lastName}</p>
                    {admin.isActive ? (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <UserCheck className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <UserX className="h-3 w-3" /> Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{admin.email}</p>
                  {admin.phone && (
                    <p className="text-xs text-muted-foreground/70">{admin.phone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={admin.isActive}
                  onCheckedChange={() => handleToggleActive(admin)}
                  disabled={isPending}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="neu-sm hover:neu rounded-xl h-9 w-9">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="neu-flat border-white/10 w-48">
                    <DropdownMenuItem 
                      onClick={() => handleResetPassword(admin.id)}
                      className="cursor-pointer"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem 
                      onClick={() => handleDelete(admin.id)}
                      className="cursor-pointer text-red-400 focus:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Admin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Password Generated Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="neu-flat border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-400" />
              Password Generated
            </DialogTitle>
            <DialogDescription>
              Share this password securely with the administrator
            </DialogDescription>
          </DialogHeader>
          <PasswordDisplay 
            password={generatedPassword} 
            onClose={() => {
              setIsPasswordDialogOpen(false)
              setGeneratedPassword(null)
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add Admin Form Component
function AddAdminForm({ 
  schoolId, 
  onSuccess 
}: { 
  schoolId: string
  onSuccess: (password?: string) => void 
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  })

  // Check email availability
  const checkEmail = useCallback(async (email: string) => {
    if (!email || !email.includes("@")) {
      setEmailStatus("idle")
      return
    }
    setEmailStatus("checking")
    const result = await checkEmailAvailability(email)
    setEmailStatus(result.available ? "available" : "taken")
  }, [])

  useEffect(() => {
    if (!formData.email) {
      setEmailStatus("idle")
      return
    }
    const timer = setTimeout(() => checkEmail(formData.email), 500)
    return () => clearTimeout(timer)
  }, [formData.email, checkEmail])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required")
      return
    }

    if (!formData.email.includes("@")) {
      setError("Valid email is required")
      return
    }

    if (emailStatus === "taken") {
      setError("Email is already registered")
      return
    }

    startTransition(async () => {
      const result = await createSchoolAdmin(schoolId, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || undefined,
        password: formData.password?.trim() || undefined,
      })

      if (result.success) {
        onSuccess(result.tempPassword)
      } else {
        setError(result.error || "Failed to create admin")
      }
    })
  }

  const inputClass = "neu-inset rounded-xl border-0 bg-transparent h-11 px-4 focus:ring-2 focus:ring-white/20"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name *</Label>
          <Input
            value={formData.firstName}
            onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
            placeholder="John"
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label>Last Name *</Label>
          <Input
            value={formData.lastName}
            onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
            placeholder="Doe"
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Email *</Label>
        <div className="relative">
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="admin@school.com"
            className={cn(
              inputClass,
              "pr-10",
              emailStatus === "taken" && "ring-2 ring-red-500/50",
              emailStatus === "available" && "ring-2 ring-green-500/50"
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {emailStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin" />}
            {emailStatus === "available" && <Check className="h-4 w-4 text-green-500" />}
            {emailStatus === "taken" && <X className="h-4 w-4 text-red-500" />}
          </div>
        </div>
        {emailStatus === "taken" && (
          <p className="text-xs text-red-400">This email is already registered</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Phone</Label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="+1 (555) 123-4567"
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <Label>Password (optional)</Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Leave empty to auto-generate"
            className={cn(inputClass, "pr-10")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          If not provided, a secure password will be generated
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="submit"
          disabled={isPending || emailStatus === "taken" || emailStatus === "checking"}
          className="neu-convex hover:scale-[0.98] rounded-xl"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Admin"
          )}
        </Button>
      </div>
    </form>
  )
}

// Password Display Component
function PasswordDisplay({ 
  password, 
  onClose 
}: { 
  password: string | null
  onClose: () => void 
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyPassword = async () => {
    if (password) {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="neu-inset rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Temporary Password:</span>
          <div className="flex items-center gap-2">
            <code className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
              {showPassword ? password : "••••••••••••"}
            </code>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1.5 rounded-lg hover:bg-muted/50"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={copyPassword}
              className="p-1.5 rounded-lg hover:bg-muted/50"
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
        <p className="text-xs text-amber-400">
          This password will only be shown once. Share it securely.
        </p>
      </div>

      <Button onClick={onClose} className="w-full neu-convex rounded-xl">
        Done
      </Button>
    </div>
  )
}

// Wrapper component that manages data fetching
export function SchoolAdminsManager({ 
  schoolId, 
  schoolName 
}: { 
  schoolId: string
  schoolName: string 
}) {
  const [admins, setAdmins] = useState<SchoolAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const result = await getSchoolAdmins(schoolId)
        if (result.success && result.admins) {
          setAdmins(result.admins)
        }
      } catch (error) {
        console.error("Failed to load admins:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadAdmins()
  }, [schoolId])

  if (isLoading) {
    return (
      <div className="neu-flat rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500/50 via-amber-500/20 to-transparent" />
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl neu-flat flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">School Administrators</h3>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="neu-flat rounded-2xl overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-amber-500/50 via-amber-500/20 to-transparent" />
      <div className="p-6">
        <SchoolAdmins schoolId={schoolId} initialAdmins={admins} />
      </div>
    </div>
  )
}
