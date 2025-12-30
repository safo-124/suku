"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  AlertCircle,
  Shield,
  GraduationCap,
  Users,
  ChevronLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { loginToSchool } from "../_actions/auth-actions"

type UserRole = "admin" | "teacher" | "student"

interface SchoolInfo {
  id: string
  name: string
  slug: string
  logo: string | null
  phone: string | null
  email: string | null
  address: string | null
  isActive: boolean
}

interface UnifiedLoginFormProps {
  school: SchoolInfo | null
  subdomain: string
}

const roleConfig = {
  admin: {
    title: "School Administrator",
    description: "Access school management dashboard",
    icon: Shield,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    redirectPath: "/school/dashboard",
  },
  teacher: {
    title: "Teacher",
    description: "Access classes, grades & attendance",
    icon: Users,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    redirectPath: "/teacher/dashboard",
  },
  student: {
    title: "Student",
    description: "View grades, timetable & assignments",
    icon: GraduationCap,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    redirectPath: "/student/dashboard",
  },
}

export function UnifiedLoginForm({ school, subdomain }: UnifiedLoginFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const inputClass = "neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl h-12 pl-11"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields")
      return
    }

    if (!school) {
      setError("School not found")
      return
    }

    if (!school.isActive) {
      setError("This school is currently inactive. Please contact support.")
      return
    }

    if (!selectedRole) {
      setError("Please select a role")
      return
    }

    startTransition(async () => {
      const result = await loginToSchool(formData.email, formData.password, subdomain)

      if (result.success) {
        // Check if user must reset their password
        if (result.mustResetPassword) {
          router.push(`/school/reset-password?subdomain=${subdomain}`)
          return
        }
        
        // Get the user's actual role from the login result
        const userRole = result.user?.role?.toLowerCase()
        
        // Map database roles to our role types
        const roleMapping: Record<string, UserRole> = {
          'school_admin': 'admin',
          'teacher': 'teacher',
          'student': 'student',
        }
        
        const actualRole = roleMapping[userRole || '']
        
        // Check if user role matches selected role (optional validation)
        if (actualRole && actualRole !== selectedRole) {
          setError(`This account is registered as a ${roleConfig[actualRole].title}. Please select the correct role.`)
          return
        }
        
        // Use the actual role from the database for redirect (not the selected role)
        // This ensures we always redirect to the correct dashboard
        const targetRole = actualRole || selectedRole
        const basePath = roleConfig[targetRole].redirectPath
        const redirectPath = subdomain ? `${basePath}?subdomain=${subdomain}` : basePath
        
        // Use window.location for a full page navigation to ensure clean routing
        window.location.href = redirectPath
      } else {
        setError(result.error || "Login failed")
      }
    })
  }

  const handleBack = () => {
    setSelectedRole(null)
    setError(null)
    setFormData({ email: "", password: "" })
  }

  // School not found
  if (!school) {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-500 mb-2">School Not Found</h3>
          <p className="text-sm text-red-400">
            The school you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Subdomain: <code className="px-2 py-1 rounded bg-muted">{subdomain || "none"}</code>
          </p>
        </div>
      </div>
    )
  }

  // School inactive
  if (!school.isActive) {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-500 mb-2">School Inactive</h3>
          <p className="text-sm text-amber-400">
            {school.name} is currently inactive. Please contact your administrator.
          </p>
        </div>
        <SchoolContactInfo school={school} />
      </div>
    )
  }

  // Role selection view
  if (!selectedRole) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center mb-6">
          Select your role to continue
        </p>
        
        {(Object.entries(roleConfig) as [UserRole, typeof roleConfig.admin][]).map(([role, config]) => {
          const Icon = config.icon
          return (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={cn(
                "w-full p-4 rounded-xl border-2 transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
                "flex items-center gap-4 text-left",
                "neu-sm hover:neu",
                config.borderColor,
                config.bgColor
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl",
                "neu-convex"
              )}>
                <Icon className={cn("h-6 w-6", config.color)} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{config.title}</h3>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>
            </button>
          )
        })}
        
        <SchoolContactInfo school={school} />
      </div>
    )
  }

  // Login form view
  const currentRoleConfig = roleConfig[selectedRole]
  const Icon = currentRoleConfig.icon

  return (
    <div className="space-y-6">
      {/* Role indicator with back button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="p-2 rounded-xl neu-sm hover:neu transition-all"
          disabled={isPending}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className={cn(
          "flex items-center gap-3 flex-1 p-3 rounded-xl",
          currentRoleConfig.bgColor,
          "border",
          currentRoleConfig.borderColor
        )}>
          <Icon className={cn("h-5 w-5", currentRoleConfig.color)} />
          <span className="font-medium">{currentRoleConfig.title}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={inputClass}
              autoComplete="email"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href={`/school/login/forgot-password?subdomain=${subdomain}`} className="text-xs text-muted-foreground hover:text-foreground">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={cn(inputClass, "pr-11")}
              autoComplete="current-password"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isPending}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="remember"
            className="h-4 w-4 rounded border-gray-300 neu-inset-sm"
            disabled={isPending}
          />
          <Label htmlFor="remember" className="text-sm font-normal">
            Keep me signed in
          </Label>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className={cn(
            "w-full h-12 neu-convex hover:scale-[0.98] active:neu-inset rounded-xl font-semibold"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    </div>
  )
}

function SchoolContactInfo({ school }: { school: SchoolInfo }) {
  const hasContactInfo = school.phone || school.email || school.address

  if (!hasContactInfo) {
    return null
  }

  return (
    <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
      <p className="text-xs text-muted-foreground text-center mb-3 font-medium uppercase tracking-wider">
        School Contact
      </p>
      <div className="space-y-2">
        {school.phone && (
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <a 
              href={`tel:${school.phone}`}
              className="text-foreground hover:underline"
            >
              {school.phone}
            </a>
          </div>
        )}
        {school.email && (
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <a 
              href={`mailto:${school.email}`}
              className="text-foreground hover:underline truncate"
            >
              {school.email}
            </a>
          </div>
        )}
        {school.address && (
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{school.address}</span>
          </div>
        )}
      </div>
    </div>
  )
}
