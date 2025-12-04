import { Suspense } from "react"
import Link from "next/link"
import { Plus, Building2 } from "lucide-react"
import { SchoolsTable } from "./_components/schools-table"
import { SchoolsTableSkeleton } from "./_components/schools-table-skeleton"

export default function SchoolsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Building2 className="h-4 w-4" />
            <span>Management</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight">Schools</h2>
          <p className="text-muted-foreground mt-2">
            Manage all schools on your platform
          </p>
        </div>
        <Link href="/super-admin/schools/new">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-foreground text-background font-medium text-sm hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" />
            Add School
          </button>
        </Link>
      </div>

      <Suspense fallback={<SchoolsTableSkeleton />}>
        <SchoolsTable />
      </Suspense>
    </div>
  )
}
