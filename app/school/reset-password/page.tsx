"use client"

import { useState, useTransition, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Eye, EyeOff, Shield, ArrowRight, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { setNewPassword } from "../login/_actions/auth-actions"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  const getLink = (path: string) => subdomain ? `${path}?subdomain=${subdomain}` : path

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

    startTransition(async () => {
      const result = await setNewPassword(formData.newPassword, formData.confirmPassword)
      
      if (result.success) {
        setSuccess(true)
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push(getLink("/school/dashboard"))
        }, 2000)
      } else {
        setError(result.error || "Failed to set new password")
      }
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="neu rounded-3xl p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl neu-convex flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Password Updated!</h1>
            <p className="text-muted-foreground mb-6">
              Your password has been successfully changed. You will be redirected to your dashboard.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl neu-convex flex items-center justify-center mb-6">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Create New Password</h1>
          <p className="text-muted-foreground mt-2">
            Your password was reset by an administrator. Please create a new password to continue.
          </p>
        </div>

        {/* Form Card */}
        <div className="neu rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending || !formData.newPassword || !formData.confirmPassword}
              className="w-full h-12 neu-convex hover:scale-[0.98] active:neu-inset rounded-xl font-semibold transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Password...
                </>
              ) : (
                <>
                  Set New Password
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Security Note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Choose a strong password that you haven&apos;t used before. Your password should include a mix of letters, numbers, and symbols.
        </p>
      </div>
    </div>
  )
}

function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl neu-convex flex items-center justify-center mb-6">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Create New Password</h1>
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
