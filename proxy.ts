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
  if (hostname.includes(".") && !hostname.startsWith("localhost")) {
    // Production: subdomain.domain.com
    const parts = hostname.split(".")
    if (parts.length >= 2) {
      subdomain = parts[0]
    }
  } else {
    // Development: Use query param for testing
    // e.g., localhost:3000?subdomain=admin or localhost:3000?subdomain=springfield
    const subdomainParam = request.nextUrl.searchParams.get("subdomain")
    if (subdomainParam) {
      subdomain = subdomainParam
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
    // Already in school/teacher/student path, continue but pass slug header
    if (pathname.startsWith("/school") || pathname.startsWith("/teacher") || pathname.startsWith("/student")) {
      // Use rewrite to the same URL to ensure headers are properly set
      const url = request.nextUrl.clone()
      const response = NextResponse.rewrite(url)
      response.headers.set("x-school-slug", subdomain)
      return response
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
    
    const rewriteResponse = NextResponse.rewrite(url)
    rewriteResponse.headers.set("x-school-slug", subdomain)
    return rewriteResponse
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
