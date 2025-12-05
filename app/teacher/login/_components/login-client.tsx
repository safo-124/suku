"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { GraduationCap, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { loginAsTeacher } from "../_actions/teacher-auth-actions"

interface TeacherLoginClientProps {
  subdomain: string
  school: {
    name: string
    logo: string | null
    slug: string
  } | null
}

export function TeacherLoginClient({ subdomain, school }: TeacherLoginClientProps) {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    if (!subdomain) {
      setError("School not found. Please access through your school's portal.")
      return
    }

    startTransition(async () => {
      const result = await loginAsTeacher(email, password, subdomain)

      if (result.success) {
        // Navigate to dashboard - the proxy will handle subdomain routing
        router.push("/teacher/dashboard")
        router.refresh()
      } else {
        setError(result.error || "Login failed")
      }
    })
  }

  if (!subdomain || !school) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="neu rounded-3xl p-8 max-w-md w-full text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl neu-convex mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">School Not Found</h1>
          <p className="text-muted-foreground mb-6">
            Please access this page through your school&apos;s portal URL.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Example: <code className="bg-muted px-2 py-1 rounded">yourschool.domain.com/teacher-login</code>
          </p>
          <Link href="/">
            <Button className="rounded-xl neu-convex">Go to Homepage</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-transparent" />
        <div className="relative z-10 max-w-md text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl neu-convex mx-auto mb-8">
            {school.logo ? (
              <img src={school.logo} alt={school.name} className="h-16 w-16 object-contain" />
            ) : (
              <GraduationCap className="h-12 w-12" />
            )}
          </div>
          <h1 className="text-4xl font-bold mb-4">{school.name}</h1>
          <p className="text-lg text-muted-foreground">
            Teacher Portal - Manage your classes, mark attendance, and track student progress
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl neu-convex mx-auto mb-4">
              {school.logo ? (
                <img src={school.logo} alt={school.name} className="h-10 w-10 object-contain" />
              ) : (
                <GraduationCap className="h-8 w-8" />
              )}
            </div>
            <h1 className="text-2xl font-bold">{school.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">Teacher Portal</p>
          </div>

          <div className="neu rounded-3xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold">Welcome back</h2>
              <p className="text-muted-foreground mt-1">Sign in to your teacher account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="teacher@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="neu-inset border-0 bg-transparent pl-11 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-white/20"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="neu-inset border-0 bg-transparent pl-11 pr-11 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-white/20"
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl neu-convex text-base font-medium"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Having trouble signing in? Contact your school administrator.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
