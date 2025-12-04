import Link from "next/link"
import { Building2, MoreHorizontal, Pencil, Eye, ExternalLink } from "lucide-react"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ToggleSchoolStatusButton } from "./toggle-school-status-button"
import { cn } from "@/lib/utils"

type SchoolWithCounts = {
  id: string
  name: string
  slug: string
  isActive: boolean
  subscriptionPlan: string
  subscriptionStatus: string
  createdAt: Date
  _count: {
    users: number
    classes: number
  }
}

async function getSchools(): Promise<SchoolWithCounts[]> {
  const schools = await prisma.school.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          users: true,
          classes: true,
        },
      },
    },
  })
  return schools as unknown as SchoolWithCounts[]
}

function getStatusStyle(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-200"
    case "TRIAL":
      return "bg-blue-500/10 text-blue-700 border-blue-200"
    case "PAST_DUE":
      return "bg-amber-500/10 text-amber-700 border-amber-200"
    case "CANCELLED":
      return "bg-red-500/10 text-red-700 border-red-200"
    case "EXPIRED":
      return "bg-neutral-500/10 text-neutral-600 border-neutral-200"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

function getPlanStyle(plan: string) {
  switch (plan) {
    case "ENTERPRISE":
      return "bg-violet-500/10 text-violet-700 border-violet-200"
    case "PROFESSIONAL":
      return "bg-indigo-500/10 text-indigo-700 border-indigo-200"
    case "BASIC":
      return "bg-sky-500/10 text-sky-700 border-sky-200"
    default:
      return "bg-muted/50 text-muted-foreground border-border"
  }
}

export async function SchoolsTable() {
  const schools = await getSchools()

  if (schools.length === 0) {
    return (
      <div className="neu rounded-3xl p-16">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="p-8 rounded-3xl neu-inset mb-8">
            <Building2 className="h-16 w-16 text-muted-foreground/40" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">No schools yet</h3>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Get started by creating your first school. Each school gets its own
            subdomain and can be managed independently.
          </p>
          <Link href="/super-admin/schools/new">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
              <Building2 className="h-4 w-4" />
              Create First School
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="neu rounded-3xl overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-border/50">
        <h3 className="text-xl font-semibold">All Schools</h3>
        <p className="text-sm text-muted-foreground mt-1">
          A list of all schools registered on your platform
        </p>
      </div>
      
      {/* Table Header - Desktop */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-muted/30 text-sm font-medium text-muted-foreground border-b border-border/30">
        <div className="col-span-4">School</div>
        <div className="col-span-2">Plan</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1 text-center">Users</div>
        <div className="col-span-2 text-center">Active</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>
      
      {/* Table Body */}
      <div className="divide-y divide-border/30">
        {schools.map((school) => (
          <div
            key={school.id}
            className="group grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 sm:px-8 py-5 items-center hover:bg-muted/20 transition-colors"
          >
            {/* School Info */}
            <div className="lg:col-span-4 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl neu-convex group-hover:neu-inset-sm transition-all duration-300 shrink-0">
                <Building2 className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{school.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground">
                    {school.slug}
                  </code>
                  <ExternalLink className="h-3 w-3 text-muted-foreground/50" />
                </div>
              </div>
            </div>
            
            {/* Plan - Mobile Label */}
            <div className="lg:hidden flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Plan:</span>
              <span className={cn(
                "inline-flex px-3 py-1.5 rounded-xl text-xs font-medium border",
                getPlanStyle(school.subscriptionPlan)
              )}>
                {school.subscriptionPlan.charAt(0) + school.subscriptionPlan.slice(1).toLowerCase()}
              </span>
            </div>
            
            {/* Plan - Desktop */}
            <div className="hidden lg:block lg:col-span-2">
              <span className={cn(
                "inline-flex px-3 py-1.5 rounded-xl text-xs font-medium border",
                getPlanStyle(school.subscriptionPlan)
              )}>
                {school.subscriptionPlan.charAt(0) + school.subscriptionPlan.slice(1).toLowerCase()}
              </span>
            </div>
            
            {/* Status - Mobile Label */}
            <div className="lg:hidden flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Status:</span>
              <span className={cn(
                "inline-flex px-3 py-1.5 rounded-xl text-xs font-medium border",
                getStatusStyle(school.subscriptionStatus)
              )}>
                {school.subscriptionStatus.charAt(0) + school.subscriptionStatus.slice(1).toLowerCase()}
              </span>
            </div>
            
            {/* Status - Desktop */}
            <div className="hidden lg:block lg:col-span-2">
              <span className={cn(
                "inline-flex px-3 py-1.5 rounded-xl text-xs font-medium border",
                getStatusStyle(school.subscriptionStatus)
              )}>
                {school.subscriptionStatus.charAt(0) + school.subscriptionStatus.slice(1).toLowerCase()}
              </span>
            </div>
            
            {/* Users Count */}
            <div className="hidden lg:flex lg:col-span-1 justify-center">
              <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl neu-inset-sm text-sm font-semibold">
                {school._count.users}
              </span>
            </div>
            
            {/* Active Toggle */}
            <div className="lg:col-span-2 flex items-center gap-2 lg:justify-center">
              <span className="lg:hidden text-xs text-muted-foreground w-16">Active:</span>
              <ToggleSchoolStatusButton
                schoolId={school.id}
                isActive={school.isActive}
              />
            </div>
            
            {/* Actions */}
            <div className="lg:col-span-1 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="neu-sm hover:neu rounded-xl h-10 w-10">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card w-48 p-2">
                  <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider px-2">Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer">
                    <Link href={`/super-admin/schools/${school.id}`}>
                      <Eye className="mr-3 h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer">
                    <Link href={`/super-admin/schools/${school.id}/edit`}>
                      <Pencil className="mr-3 h-4 w-4" />
                      Edit School
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
