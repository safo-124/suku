"use client"

import { useState, useTransition, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { requestPasswordReset } from "../_actions/auth-actions"

function ForgotPasswordContent() {
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain") || ""
  
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState("")

  const getLink = (path: string) => subdomain ? `${path}?subdomain=${subdomain}` : path

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError("Please enter your email address")
      return
    }

    if (!subdomain) {
      setError("School not specified. Please try again from the login page.")
      return
    }

    startTransition(async () => {
      const result = await requestPasswordReset(email, subdomain)
      
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || "Failed to send reset email")
      }
    })
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
            <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
            <p className="text-muted-foreground mb-4">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
            </p>
            <div className="bg-muted/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                📧 The link will expire in <strong>1 hour</strong>. Check your spam folder if you don&apos;t see it.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href={getLink("/school/login")}>
                <Button className="w-full neu-convex hover:scale-[0.98] active:neu-inset rounded-xl">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSuccess(false)
                  setEmail("")
                }}
                className="w-full"
              >
                Try a different email
              </Button>
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
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Forgot Password?</h1>
          <p className="text-muted-foreground mt-2">
            No worries! Enter your email and we&apos;ll send you a reset link.
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

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 neu-inset border-0 bg-transparent rounded-xl"
                  required
                  disabled={isPending}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the email you used to create your account
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending || !email}
              className="w-full h-12 neu-convex hover:scale-[0.98] active:neu-inset rounded-xl font-semibold transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                <>
                  Send Reset Link
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
            href={getLink("/school/login")}
            className="font-medium text-foreground hover:underline"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  )
}

function ForgotPasswordLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl neu-convex flex items-center justify-center mb-6">
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Forgot Password?</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
        <div className="neu rounded-3xl p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordLoading />}>
      <ForgotPasswordContent />
    </Suspense>
  )
}
