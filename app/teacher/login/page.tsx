import { headers } from "next/headers"
import { TeacherLoginClient } from "./_components/login-client"
import { getSchoolBySlug } from "./_actions/teacher-auth-actions"

export default async function TeacherLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ subdomain?: string }>
}) {
  const headersList = await headers()
  const params = await searchParams
  
  // Get subdomain from header (set by proxy) or from query param (dev fallback)
  const slugHeader = headersList.get("x-school-slug")
  const subdomain = slugHeader || params.subdomain || ""
  
  // Fetch school data on the server
  const school = subdomain ? await getSchoolBySlug(subdomain) : null
  
  return (
    <TeacherLoginClient 
      subdomain={subdomain}
      school={school ? {
        name: school.name,
        logo: school.logo,
        slug: school.slug,
      } : null}
    />
  )
}
