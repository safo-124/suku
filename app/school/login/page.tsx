import { Metadata } from "next"
import { headers } from "next/headers"
import { Suspense } from "react"
import { UnifiedLoginForm } from "./_components/unified-login-form"
import { getSchoolBySlug } from "./_actions/auth-actions"
import { School, Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Login | School Portal",
  description: "Sign in to your school portal",
}

async function getSubdomain(): Promise<string> {
  const headersList = await headers()
  
  // Check x-school-slug header from proxy
  const slugHeader = headersList.get("x-school-slug")
  if (slugHeader) {
    return slugHeader
  }
  
  // Check referer for subdomain query param (dev mode)
  const referer = headersList.get("referer")
  if (referer) {
    try {
      const url = new URL(referer)
      const subdomain = url.searchParams.get("subdomain")
      if (subdomain && subdomain !== "admin" && subdomain !== "www") {
        return subdomain
      }
    } catch {
      // Invalid URL
    }
  }
  
  return ""
}

interface LoginPageProps {
  searchParams: Promise<{ subdomain?: string }>
}

export default async function SchoolLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  // Get subdomain from query param (dev) or header (prod)
  const subdomain = params.subdomain || await getSubdomain()
  
  // Fetch school info
  const school = subdomain ? await getSchoolBySlug(subdomain) : null

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-tr from-black/5 to-transparent blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          {/* School Logo or Default */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl neu-convex mb-4 overflow-hidden">
            {school?.logo ? (
              <img 
                src={school.logo} 
                alt={school.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <School className="w-9 h-9" />
            )}
          </div>
          
          {/* School Name */}
          <h1 className="text-2xl font-bold">
            {school?.name || "School Portal"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Sign in to access your portal
          </p>
          
          {/* Subdomain badge */}
          {subdomain && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <code className="text-xs text-muted-foreground">{subdomain}.suku.app</code>
            </div>
          )}
        </div>

        {/* Login Card */}
        <div className="neu rounded-3xl p-8">
          <Suspense fallback={<LoginFormSkeleton />}>
            <UnifiedLoginForm school={school} subdomain={subdomain} />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Having trouble signing in?{" "}
          <a href="#" className="text-foreground underline-offset-4 hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}

function LoginFormSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
