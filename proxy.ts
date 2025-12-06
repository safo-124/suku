import { NextResponse, NextRequest } from "next/server"

export default function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || ""

  // Get the pathname
  const pathname = request.nextUrl.pathname

  // Skip static files and API routes that don't need rewriting
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Extract subdomain
  let subdomain = ""
  
  // Check if this is a Vercel preview/production URL (*.vercel.app)
  // These don't support real subdomains, so we use query params only
  const isVercelApp = hostname.endsWith(".vercel.app")
  
  // Check if this is a localhost domain (for local development with subdomains)
  // e.g., beacon-school.localhost:3000 or just localhost:3000
  const isLocalhost = hostname.includes("localhost")
  
  if (isVercelApp) {
    // Vercel: Use query param for subdomain only
    const subdomainParam = request.nextUrl.searchParams.get("subdomain")
    if (subdomainParam) {
      subdomain = subdomainParam
    }
  } else if (isLocalhost) {
    // Local development: check for subdomain.localhost or ?subdomain= param
    // First check query param
    const subdomainParam = request.nextUrl.searchParams.get("subdomain")
    if (subdomainParam) {
      subdomain = subdomainParam
    } else {
      // Check for subdomain.localhost:port pattern
      const hostnameWithoutPort = hostname.split(":")[0]
      if (hostnameWithoutPort.endsWith(".localhost")) {
        // Extract subdomain from beacon-school.localhost
        subdomain = hostnameWithoutPort.replace(".localhost", "")
      }
    }
  } else if (hostname.includes(".")) {
    // Production with custom domain: subdomain.domain.com
    // e.g., springfield.suku.app or admin.suku.app
    const parts = hostname.split(".")
    // Need at least 3 parts for a subdomain (sub.domain.tld)
    if (parts.length >= 3) {
      subdomain = parts[0]
    }
  }

  // Super admin routes (admin.domain.com or ?subdomain=admin)
  if (subdomain === "admin") {
    // If already in super-admin path, continue
    if (pathname.startsWith("/super-admin")) {
      return NextResponse.next()
    }
    // Rewrite root to super-admin dashboard
    const url = request.nextUrl.clone()
    if (pathname === "/") {
      url.pathname = "/super-admin"
    } else {
      url.pathname = `/super-admin${pathname}`
    }
    return NextResponse.rewrite(url)
  }

  // School routes (schoolslug.domain.com or ?subdomain=schoolslug)
  if (subdomain && subdomain !== "www" && subdomain !== "app") {
    // Create new request headers with the school slug
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-school-slug", subdomain)
    
    // Already in school/teacher/student path, continue but pass slug header
    if (pathname.startsWith("/school") || pathname.startsWith("/teacher") || pathname.startsWith("/student")) {
      // Use rewrite to the same URL to ensure headers are properly set
      const url = request.nextUrl.clone()
      return NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      })
    }
    
    // Rewrite to appropriate routes based on path
    const url = request.nextUrl.clone()
    
    // All login routes redirect to unified school login
    if (pathname === "/" || pathname === "/login" || pathname === "/teacher-login" || pathname === "/student-login") {
      url.pathname = "/school/login"
    } else {
      // Default: add /school prefix for all other routes
      // This includes /teachers, /students, /classes, /dashboard, etc.
      url.pathname = `/school${pathname}`
    }
    
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Main marketing site / landing page (no subdomain or www)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
