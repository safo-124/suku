"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { School, Eye, EyeOff, Loader2, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSchoolBySlug, loginAsStudent } from "./_actions/student-auth-actions"

export default function StudentLoginPage() {
  return (
    <React.Suspense fallback={<LoginSkeleton />}>
      <StudentLoginContent />
    </React.Suspense>
  )
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-3xl p-8 animate-pulse">
          <div className="h-12 w-12 bg-muted/20 rounded-2xl mx-auto mb-6" />
          <div className="h-8 w-48 bg-muted/20 rounded-xl mx-auto mb-2" />
          <div className="h-4 w-32 bg-muted/20 rounded-lg mx-auto mb-8" />
          <div className="space-y-4">
            <div className="h-12 bg-muted/20 rounded-xl" />
            <div className="h-12 bg-muted/20 rounded-xl" />
            <div className="h-12 bg-muted/20 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StudentLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [schoolName, setSchoolName] = React.useState<string | null>(null)
  const [isLoadingSchool, setIsLoadingSchool] = React.useState(true)

  React.useEffect(() => {
    const loadSchool = async () => {
      if (!subdomain) {
        setIsLoadingSchool(false)
        return
      }

      try {
        const school = await getSchoolBySlug(subdomain)
        if (school) {
          setSchoolName(school.name)
        }
      } catch (err) {
        console.error("Error loading school:", err)
      } finally {
        setIsLoadingSchool(false)
      }
    }

    loadSchool()
  }, [subdomain])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!subdomain) {
        setError("School not found. Please access via your school portal.")
        return
      }

      const result = await loginAsStudent(email, password, subdomain)

      if (!result.success) {
        setError(result.error || "Login failed")
        return
      }

      // Redirect to student dashboard
      const dashboardPath = subdomain 
        ? `/student/dashboard?subdomain=${subdomain}` 
        : "/student/dashboard"
      router.push(dashboardPath)
      router.refresh()
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (!subdomain) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="glass-card rounded-3xl p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl neu-convex mx-auto mb-6">
              <School className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Student Portal</h1>
            <p className="text-muted-foreground mb-6">
              Please access the login page through your school&apos;s portal URL.
            </p>
            <Link href="/">
              <Button variant="outline" className="neu-sm hover:neu rounded-xl">
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-3xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl neu-convex mx-auto mb-4">
              <GraduationCap className="h-7 w-7" />
            </div>
            {isLoadingSchool ? (
              <div className="h-8 w-48 bg-muted/20 rounded-xl mx-auto mb-2 animate-pulse" />
            ) : (
              <h1 className="text-2xl font-bold">{schoolName || "Student Portal"}</h1>
            )}
            <p className="text-muted-foreground text-sm">
              Sign in to your student account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl neu-inset-sm bg-transparent border-0 focus-visible:ring-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl neu-inset-sm bg-transparent border-0 focus-visible:ring-1 pr-12"
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
              disabled={isLoading}
              className="w-full h-12 rounded-xl neu-convex hover:neu-sm transition-all duration-300 bg-foreground text-background"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <Link
              href={subdomain ? `/student/forgot-password?subdomain=${subdomain}` : "/student/forgot-password"}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot your password?
            </Link>
          </div>

          {/* School Admin/Teacher Login Link */}
          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              Staff member?{" "}
              <Link
                href={subdomain ? `/school/login?subdomain=${subdomain}` : "/school/login"}
                className="text-foreground font-medium hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
