"use client"

import { useState, useEffect, useTransition, Suspense } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { Lock, Eye, EyeOff, Shield, ArrowRight, Loader2, CheckCircle, AlertCircle, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { verifyResetToken, resetPasswordWithToken } from "@/app/school/login/_actions/auth-actions"

type TokenStatus = "loading" | "valid" | "invalid" | "expired" | "used"

function ResetPasswordContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const schoolSlug = params.schoolSlug as string
  
  const [isPending, startTransition] = useTransition()
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("loading")
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  // Verify token on mount
  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setTokenStatus("invalid")
        setTokenError("No reset token provided")
        return
      }

      const result = await verifyResetToken(token)
      
      if (result.success) {
        setTokenStatus("valid")
      } else {
        if (result.error?.includes("expired")) {
          setTokenStatus("expired")
        } else if (result.error?.includes("used")) {
          setTokenStatus("used")
        } else {
          setTokenStatus("invalid")
        }
        setTokenError(result.error || "Invalid reset link")
      }
    }

    checkToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (!token) {
      setError("No reset token provided")
      return
    }

    startTransition(async () => {
      const result = await resetPasswordWithToken(token, formData.newPassword, schoolSlug)
      
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || "Failed to reset password")
      }
    })
  }

  // Loading state
  if (tokenStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl neu-convex flex items-center justify-center mb-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Verifying Reset Link</h1>
          <p className="text-muted-foreground">
            Please wait while we verify your password reset link...
          </p>
        </div>
      </div>
    )
  }

  // Invalid/Expired/Used token state
  if (tokenStatus !== "valid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="neu rounded-3xl p-8 text-center">
            <div className={cn(
              "mx-auto w-16 h-16 rounded-2xl neu-convex flex items-center justify-center mb-6",
              tokenStatus === "expired" && "text-amber-500",
              tokenStatus === "used" && "text-blue-500",
              tokenStatus === "invalid" && "text-destructive"
            )}>
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {tokenStatus === "expired" && "Link Expired"}
              {tokenStatus === "used" && "Link Already Used"}
              {tokenStatus === "invalid" && "Invalid Link"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {tokenError}
            </p>
            {tokenStatus === "expired" && (
              <p className="text-sm text-muted-foreground mb-6">
                Password reset links are valid for 1 hour. Please request a new one.
              </p>
            )}
            <div className="flex flex-col gap-3">
              <Link href={`/school/login?subdomain=${schoolSlug}`}>
                <Button className="w-full neu-convex hover:scale-[0.98] active:neu-inset rounded-xl">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="neu rounded-3xl p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl neu-convex flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Password Reset Successfully!</h1>
            <p className="text-muted-foreground mb-6">
              Your password has been changed. You can now log in with your new password.
            </p>
            <Link href={`/school/login?subdomain=${schoolSlug}`}>
              <Button className="w-full neu-convex hover:scale-[0.98] active:neu-inset rounded-xl">
                <KeyRound className="mr-2 h-4 w-4" />
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl neu-convex flex items-center justify-center mb-6">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Reset Your Password</h1>
          <p className="text-muted-foreground mt-2">
            Enter your new password below to complete the reset.
          </p>
        </div>

        {/* Form Card */}
        <div className="neu rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="pl-11 pr-11 h-12 neu-inset border-0 bg-transparent rounded-xl"
                  required
                  minLength={8}
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={cn(
                    "pl-11 pr-11 h-12 neu-inset border-0 bg-transparent rounded-xl",
                    formData.confirmPassword && formData.newPassword !== formData.confirmPassword && "ring-2 ring-destructive"
                  )}
                  required
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="text-xs text-destructive">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => {
                    const strength = getPasswordStrength(formData.newPassword)
                    return (
                      <div
                        key={level}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-colors",
                          level <= strength
                            ? strength <= 1 ? "bg-red-500"
                            : strength === 2 ? "bg-amber-500"
                            : strength === 3 ? "bg-blue-500"
                            : "bg-emerald-500"
                            : "bg-muted"
                        )}
                      />
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getPasswordStrengthLabel(formData.newPassword)}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending || !formData.newPassword || !formData.confirmPassword || formData.newPassword !== formData.confirmPassword}
              className="w-full h-12 neu-convex hover:scale-[0.98] active:neu-inset rounded-xl font-semibold transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  Reset Password
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Back to Login */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Remember your password?{" "}
          <Link 
            href={`/school/login?subdomain=${schoolSlug}`}
            className="font-medium text-foreground hover:underline"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  )
}

// Helper functions for password strength
function getPasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++
  return strength
}

function getPasswordStrengthLabel(password: string): string {
  const strength = getPasswordStrength(password)
  if (strength <= 1) return "Weak - Add uppercase, numbers, and symbols"
  if (strength === 2) return "Fair - Add more character variety"
  if (strength === 3) return "Good - Almost there!"
  return "Strong password!"
}

function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl neu-convex flex items-center justify-center mb-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold">Reset Your Password</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
        <div className="neu rounded-3xl p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
