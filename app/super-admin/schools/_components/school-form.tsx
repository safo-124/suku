"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createSchool, updateSchool, checkSlugAvailability, checkEmailAvailability, type CreateSchoolInput, type CreateSchoolAdminInput } from "../_actions/school-actions"
import { SubscriptionPlan } from "@/app/generated/prisma/client"
import { cn } from "@/lib/utils"
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Users, 
  GraduationCap,
  AlertCircle,
  Loader2,
  Check,
  X,
  Info,
  UserCog,
  Key,
  Eye,
  EyeOff,
  Copy,
  Shield
} from "lucide-react"

interface SchoolFormProps {
  school?: {
    id: string
    name: string
    slug: string
    email: string | null
    phone: string | null
    address: string | null
    subscriptionPlan: SubscriptionPlan
    maxStudents: number
    maxTeachers: number
  }
}

const planLimits: Record<SubscriptionPlan, { students: number; teachers: number }> = {
  FREE: { students: 50, teachers: 10 },
  BASIC: { students: 100, teachers: 20 },
  PROFESSIONAL: { students: 500, teachers: 50 },
  ENTERPRISE: { students: 10000, teachers: 500 },
}

const planFeatures: Record<SubscriptionPlan, string[]> = {
  FREE: ["Basic features", "Email support"],
  BASIC: ["All Free features", "Priority support", "Custom branding"],
  PROFESSIONAL: ["All Basic features", "API access", "Advanced analytics"],
  ENTERPRISE: ["All Pro features", "Dedicated support", "Custom integrations"],
}

function FormField({ 
  label, 
  required, 
  hint, 
  icon: Icon,
  children 
}: { 
  label: string
  required?: boolean
  hint?: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode 
}) {
  return (
    <div className="space-y-2.5">
      <Label className="text-sm font-medium flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {label} 
        {required && <span className="text-red-400 text-xs">(required)</span>}
      </Label>
      {children}
      {hint && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
          {hint}
        </p>
      )}
    </div>
  )
}

export function SchoolForm({ school }: SchoolFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const [slugError, setSlugError] = useState<string | null>(null)
  
  // Admin state
  const [createAdmin, setCreateAdmin] = useState(!school) // Default to creating admin for new schools
  const [adminEmailStatus, setAdminEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    name: school?.name || "",
    slug: school?.slug || "",
    email: school?.email || "",
    phone: school?.phone || "",
    address: school?.address || "",
    subscriptionPlan: school?.subscriptionPlan || "FREE" as SubscriptionPlan,
    maxStudents: school?.maxStudents || 50,
    maxTeachers: school?.maxTeachers || 10,
  })

  const [adminData, setAdminData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  })

  // Check admin email availability
  const checkAdminEmail = useCallback(async (email: string) => {
    if (!email || !email.includes("@")) {
      setAdminEmailStatus("idle")
      return
    }

    setAdminEmailStatus("checking")
    const result = await checkEmailAvailability(email)
    setAdminEmailStatus(result.available ? "available" : "taken")
  }, [])

  // Debounced admin email check
  useEffect(() => {
    if (!createAdmin || !adminData.email) {
      setAdminEmailStatus("idle")
      return
    }

    const timer = setTimeout(() => {
      checkAdminEmail(adminData.email)
    }, 500)

    return () => clearTimeout(timer)
  }, [adminData.email, checkAdminEmail, createAdmin])

  // Debounced slug check
  const checkSlug = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugStatus("idle")
      setSlugError(slug.length > 0 && slug.length < 3 ? "Subdomain must be at least 3 characters" : null)
      return
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugStatus("idle")
      setSlugError("Only lowercase letters, numbers, and hyphens allowed")
      return
    }

    if (slug.startsWith("-") || slug.endsWith("-")) {
      setSlugStatus("idle")
      setSlugError("Cannot start or end with a hyphen")
      return
    }

    setSlugError(null)
    setSlugStatus("checking")

    const result = await checkSlugAvailability(slug, school?.id)
    setSlugStatus(result.available ? "available" : "taken")
  }, [school?.id])

  // Check slug when it changes (with debounce)
  useEffect(() => {
    if (school && formData.slug === school.slug) {
      setSlugStatus("available")
      return
    }

    const timer = setTimeout(() => {
      checkSlug(formData.slug)
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.slug, checkSlug, school])

  const handlePlanChange = (plan: SubscriptionPlan) => {
    setFormData((prev) => ({
      ...prev,
      subscriptionPlan: plan,
      maxStudents: planLimits[plan].students,
      maxTeachers: planLimits[plan].teachers,
    }))
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: school ? prev.slug : generateSlug(name),
    }))
  }

  const handleSlugChange = (slug: string) => {
    // Only allow valid characters
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "")
    setFormData((prev) => ({ ...prev, slug: cleanSlug }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate before submit
    if (!formData.name.trim()) {
      setError("School name is required")
      return
    }

    if (!formData.slug || formData.slug.length < 3) {
      setError("Subdomain must be at least 3 characters")
      return
    }

    if (slugStatus === "taken") {
      setError("This subdomain is already taken")
      return
    }

    if (slugStatus === "checking") {
      setError("Please wait while we check subdomain availability")
      return
    }

    // Validate admin data if creating admin
    if (createAdmin && !school) {
      if (!adminData.firstName.trim() || !adminData.lastName.trim()) {
        setError("Admin first name and last name are required")
        return
      }
      if (!adminData.email.trim() || !adminData.email.includes("@")) {
        setError("Valid admin email is required")
        return
      }
      if (adminEmailStatus === "taken") {
        setError("Admin email is already registered")
        return
      }
      if (adminEmailStatus === "checking") {
        setError("Please wait while we check email availability")
        return
      }
    }

    startTransition(async () => {
      const input: CreateSchoolInput & { admin?: CreateSchoolAdminInput } = {
        name: formData.name.trim(),
        slug: formData.slug,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        subscriptionPlan: formData.subscriptionPlan,
        maxStudents: formData.maxStudents,
        maxTeachers: formData.maxTeachers,
      }

      // Add admin data if creating new school with admin
      if (createAdmin && !school) {
        input.admin = {
          firstName: adminData.firstName.trim(),
          lastName: adminData.lastName.trim(),
          email: adminData.email.trim(),
          phone: adminData.phone?.trim() || undefined,
          password: adminData.password?.trim() || undefined,
        }
      }

      const result = school
        ? await updateSchool({ ...input, id: school.id })
        : await createSchool(input)

      if (result.success) {
        setSuccess(true)
        // If a temp password was generated, show it
        const tempPwd = 'tempPassword' in result ? result.tempPassword : null
        if (tempPwd && typeof tempPwd === 'string') {
          setGeneratedPassword(tempPwd)
          // Don't auto-redirect if password was generated - user needs to copy it
        } else {
          setTimeout(() => {
            router.push("/super-admin/schools")
            router.refresh()
          }, 500)
        }
      } else {
        setError(result.error || "Something went wrong")
      }
    })
  }

  const copyPassword = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleContinue = () => {
    router.push("/super-admin/schools")
    router.refresh()
  }

  const inputClass = "neu-inset rounded-xl border-0 bg-transparent h-11 px-4 focus:ring-2 focus:ring-white/20 transition-all duration-300 placeholder:text-muted-foreground/50"

  // Form validation
  const isSchoolValid = formData.name.trim() && formData.slug.length >= 3 && slugStatus === "available" && !slugError
  const isAdminValid = !createAdmin || !school ? (
    !createAdmin || (
      adminData.firstName.trim() && 
      adminData.lastName.trim() && 
      adminData.email.includes("@") && 
      adminEmailStatus === "available"
    )
  ) : true
  const isFormValid = isSchoolValid && isAdminValid

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="neu-inset rounded-xl p-4 bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-red-400">Error</p>
            <p className="text-sm text-red-400/80">{error}</p>
          </div>
        </div>
      )}

      {success && !generatedPassword && (
        <div className="neu-inset rounded-xl p-4 bg-green-500/10 border border-green-500/20 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="h-4 w-4 text-green-400" />
          </div>
          <p className="font-medium text-green-400">
            School {school ? "updated" : "created"} successfully! Redirecting...
          </p>
        </div>
      )}

      {/* Password Generated Success Modal */}
      {success && generatedPassword && (
        <div className="neu-flat rounded-2xl p-6 border border-green-500/20 bg-green-500/5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-green-400">School Created Successfully!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The school admin account has been created. Please save the login credentials below.
              </p>
            </div>
          </div>

          <div className="neu-inset rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Admin Email:</span>
              <span className="font-mono text-sm">{adminData.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Temporary Password:</span>
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                  {showPassword ? generatedPassword : "••••••••••••"}
                </code>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={copyPassword}
                  className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-400">
              This password will only be shown once. Make sure to copy and share it securely with the school admin.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleContinue}
            className="w-full neu-convex hover:scale-[0.98] rounded-xl h-11"
          >
            Continue to Schools List
          </Button>
        </div>
      )}

      {/* Form Sections - Hidden when password is generated */}
      {!generatedPassword && (
        <>
      {/* Basic Information Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg neu-flat flex items-center justify-center">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-medium">Basic Information</h4>
            <p className="text-xs text-muted-foreground">School identity and subdomain</p>
          </div>
        </div>

        <div className="grid gap-5 pl-11">
          <FormField label="School Name" required icon={Building2}>
            <Input
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Springfield Elementary School"
              required
              className={inputClass}
            />
          </FormField>

          <FormField 
            label="Subdomain" 
            required
            icon={Globe}
            hint={slugError || "Only lowercase letters, numbers, and hyphens allowed"}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="springfield"
                    required
                    className={cn(
                      inputClass, 
                      "pr-10",
                      slugStatus === "taken" && "ring-2 ring-red-500/50",
                      slugStatus === "available" && formData.slug.length >= 3 && "ring-2 ring-green-500/50"
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {slugStatus === "checking" && (
                      <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                    )}
                    {slugStatus === "available" && formData.slug.length >= 3 && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {slugStatus === "taken" && (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap px-4 py-2.5 neu-flat rounded-xl font-mono">
                  .suku.app
                </span>
              </div>
              
              {/* Slug status message */}
              {formData.slug.length >= 3 && (
                <div className={cn(
                  "flex items-center gap-2 text-xs px-3 py-2 rounded-lg",
                  slugStatus === "available" && "bg-green-500/10 text-green-400",
                  slugStatus === "taken" && "bg-red-500/10 text-red-400",
                  slugStatus === "checking" && "bg-muted/50 text-muted-foreground"
                )}>
                  {slugStatus === "checking" && (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Checking availability...
                    </>
                  )}
                  {slugStatus === "available" && (
                    <>
                      <Check className="h-3 w-3" />
                      {formData.slug}.suku.app is available!
                    </>
                  )}
                  {slugStatus === "taken" && (
                    <>
                      <X className="h-3 w-3" />
                      This subdomain is already taken
                    </>
                  )}
                </div>
              )}
            </div>
          </FormField>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg neu-flat flex items-center justify-center">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-medium">Contact Information</h4>
            <p className="text-xs text-muted-foreground">How to reach the school</p>
          </div>
        </div>

        <div className="grid gap-5 pl-11">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Email" icon={Mail}>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="admin@school.com"
                className={inputClass}
              />
            </FormField>

            <FormField label="Phone" icon={Phone}>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+1 (555) 123-4567"
                className={inputClass}
              />
            </FormField>
          </div>

          <FormField label="Address" icon={MapPin}>
            <Textarea
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="123 School Street, City, State, ZIP"
              rows={3}
              className={cn(inputClass, "resize-none h-auto py-3")}
            />
          </FormField>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg neu-flat flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-medium">Subscription Plan</h4>
            <p className="text-xs text-muted-foreground">Choose the appropriate plan</p>
          </div>
        </div>

        <div className="pl-11 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["FREE", "BASIC", "PROFESSIONAL", "ENTERPRISE"] as SubscriptionPlan[]).map((plan) => (
              <button
                key={plan}
                type="button"
                onClick={() => handlePlanChange(plan)}
                className={cn(
                  "p-4 rounded-xl text-left transition-all duration-300",
                  formData.subscriptionPlan === plan
                    ? "neu-inset ring-2 ring-white/20"
                    : "neu-flat hover:neu-sm"
                )}
              >
                <div className="font-medium text-sm">{plan}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {planLimits[plan].students} students
                </div>
                <div className="text-xs text-muted-foreground">
                  {planLimits[plan].teachers} teachers
                </div>
              </button>
            ))}
          </div>

          {/* Plan Features */}
          <div className="neu-inset rounded-xl p-4">
            <p className="text-sm font-medium mb-2">{formData.subscriptionPlan} Plan Features:</p>
            <ul className="space-y-1">
              {planFeatures[formData.subscriptionPlan].map((feature, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Max Students" icon={GraduationCap}>
              <Input
                type="number"
                value={formData.maxStudents}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxStudents: parseInt(e.target.value) || 0,
                  }))
                }
                min={1}
                className={inputClass}
              />
            </FormField>
            <FormField label="Max Teachers" icon={Users}>
              <Input
                type="number"
                value={formData.maxTeachers}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxTeachers: parseInt(e.target.value) || 0,
                  }))
                }
                min={1}
                className={inputClass}
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* School Admin Section - Only for new schools */}
      {!school && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg neu-flat flex items-center justify-center">
                <UserCog className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium">School Administrator</h4>
                <p className="text-xs text-muted-foreground">Create an admin account for this school</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="create-admin" className="text-sm text-muted-foreground">
                {createAdmin ? "Enabled" : "Disabled"}
              </Label>
              <Switch
                id="create-admin"
                checked={createAdmin}
                onCheckedChange={setCreateAdmin}
              />
            </div>
          </div>

          {createAdmin && (
            <div className="pl-11 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="First Name" required icon={Users}>
                  <Input
                    value={adminData.firstName}
                    onChange={(e) =>
                      setAdminData((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    placeholder="John"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Last Name" required icon={Users}>
                  <Input
                    value={adminData.lastName}
                    onChange={(e) =>
                      setAdminData((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    placeholder="Doe"
                    className={inputClass}
                  />
                </FormField>
              </div>

              <FormField 
                label="Admin Email" 
                required 
                icon={Mail}
                hint="This will be used to login to the school admin portal"
              >
                <div className="relative">
                  <Input
                    type="email"
                    value={adminData.email}
                    onChange={(e) =>
                      setAdminData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="admin@school.com"
                    className={cn(
                      inputClass, 
                      "pr-10",
                      adminEmailStatus === "taken" && "ring-2 ring-red-500/50",
                      adminEmailStatus === "available" && adminData.email.includes("@") && "ring-2 ring-green-500/50"
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {adminEmailStatus === "checking" && (
                      <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                    )}
                    {adminEmailStatus === "available" && adminData.email.includes("@") && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {adminEmailStatus === "taken" && (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                {adminEmailStatus === "taken" && (
                  <p className="text-xs text-red-400 mt-1">This email is already registered</p>
                )}
              </FormField>

              <FormField label="Admin Phone" icon={Phone}>
                <Input
                  value={adminData.phone}
                  onChange={(e) =>
                    setAdminData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+1 (555) 123-4567"
                  className={inputClass}
                />
              </FormField>

              <FormField 
                label="Initial Password" 
                icon={Key}
                hint="Leave empty to auto-generate a secure password"
              >
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={adminData.password}
                    onChange={(e) =>
                      setAdminData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Leave empty to auto-generate"
                    className={cn(inputClass, "pr-10")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted/50 rounded transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </FormField>

              <div className="neu-inset rounded-xl p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Admin Account Details</p>
                  <ul className="space-y-1 text-xs">
                    <li>• The admin will receive login credentials after creation</li>
                    <li>• They can access the school portal at <code className="px-1 py-0.5 bg-muted rounded">{formData.slug || "subdomain"}.suku.app</code></li>
                    <li>• If no password is provided, a secure one will be generated</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
        </> 
      )} {/* End of !generatedPassword wrapper */}

      {/* Form Actions */}
      {!generatedPassword && (
      <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
          className="neu-flat hover:neu-inset rounded-xl px-6 h-11"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isPending || success || !isFormValid}
          className={cn(
            "neu-convex hover:scale-[0.98] active:neu-inset rounded-xl px-8 h-11 min-w-[140px] transition-all duration-200",
            !isFormValid && !isPending && !success && "opacity-50 cursor-not-allowed"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : success ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : school ? (
            "Update School"
          ) : (
            "Create School"
          )}
        </Button>
      </div>
      )}
    </form>
  )
}
