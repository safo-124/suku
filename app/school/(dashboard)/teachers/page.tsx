import { Metadata } from "next"
import { Suspense } from "react"
import { Users, Loader2 } from "lucide-react"
import { TeachersClient } from "./_components/teachers-client"
import { getTeachers } from "./_actions/teacher-actions"

export const metadata: Metadata = {
  title: "Teachers | School Admin",
  description: "Manage teachers in your school",
}

interface TeachersPageProps {
  searchParams: Promise<{
    search?: string
    isActive?: string
    page?: string
  }>
}

export default async function TeachersPage({ searchParams }: TeachersPageProps) {
  const params = await searchParams

  return (
    <Suspense fallback={<TeachersLoading />}>
      <TeachersContent params={params} />
    </Suspense>
  )
}

async function TeachersContent({ params }: { params: Awaited<TeachersPageProps["searchParams"]> }) {
  const page = parseInt(params.page || "1", 10)
  const isActive = params.isActive ? params.isActive === "true" : undefined

  const result = await getTeachers({
    search: params.search,
    isActive,
    page,
    limit: 20,
  })

  return (
    <TeachersClient
      teachers={result.teachers as any}
      total={result.total}
      page={result.page || 1}
      totalPages={result.totalPages || 1}
    />
  )
}

function TeachersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-muted/50 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-muted/30 rounded-lg animate-pulse mt-2" />
        </div>
        <div className="h-10 w-32 bg-muted/50 rounded-xl animate-pulse" />
      </div>

      <div className="flex gap-4">
        <div className="h-11 flex-1 max-w-md bg-muted/30 rounded-xl animate-pulse" />
        <div className="h-11 w-32 bg-muted/30 rounded-xl animate-pulse" />
      </div>

      <div className="neu rounded-3xl p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}
