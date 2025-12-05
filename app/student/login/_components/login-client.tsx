"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { School, Eye, EyeOff, Loader2, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAsStudent } from "../_actions/student-auth-actions"

interface StudentLoginClientProps {
  subdomain: string
  school: {
    name: string
    logo: string | null
    slug: string
  } | null
}

export function StudentLoginClient({ subdomain, school }: StudentLoginClientProps) {
  const router = useRouter()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

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

      // Redirect to student dashboard - proxy handles subdomain routing
      router.push("/student/dashboard")
      router.refresh()
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (!subdomain || !school) {
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
            <p className="text-sm text-muted-foreground mb-4">
              Example: <code className="bg-muted px-2 py-1 rounded">yourschool.domain.com/student-login</code>
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
              {school.logo ? (
                <img src={school.logo} alt={school.name} className="h-8 w-8 object-contain" />
              ) : (
                <GraduationCap className="h-7 w-7" />
              )}
            </div>
            <h1 className="text-2xl font-bold">{school.name}</h1>
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
              href="/student/forgot-password"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Teacher/Staff Login Link */}
          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              Teacher?{" "}
              <Link
                href="/teacher/login"
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
