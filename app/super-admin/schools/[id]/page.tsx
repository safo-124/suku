import { notFound } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Pencil, 
  Building2, 
  Users, 
  BookOpen, 
  Calendar,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  CreditCard,
  ExternalLink,
  GraduationCap,
  UserCheck,
  Activity
} from "lucide-react"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SchoolAdminsManager } from "../_components/school-admins"

interface SchoolDetailPageProps {
  params: Promise<{ id: string }>
}

type SchoolWithDetails = {
  id: string
  name: string
  slug: string
  logo: string | null
  address: string | null
  phone: string | null
  email: string | null
  isActive: boolean
  subscriptionPlan: string
  subscriptionStatus: string
  trialEndsAt: Date | null
  maxStudents: number
  maxTeachers: number
  createdAt: Date
  _count: {
    users: number
    classes: number
    subjects: number
    academicYears: number
  }
  users: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }[]
}

async function getSchool(id: string): Promise<SchoolWithDetails | null> {
  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          classes: true,
          subjects: true,
          academicYears: true,
        },
      },
      users: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
    },
  })
  return school as unknown as SchoolWithDetails | null
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext 
}: { 
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  subtext?: string
}) {
  return (
    <div className="neu-flat rounded-xl p-5 hover-lift">
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 rounded-lg neu-inset flex items-center justify-center">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {subtext && (
          <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>
        )}
      </div>
    </div>
  )
}

function InfoRow({ 
  icon: Icon, 
  label, 
  value, 
  isEmpty = false 
}: { 
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  isEmpty?: boolean
}) {
  return (
    <div className="flex items-start gap-4 py-3">
      <div className="h-9 w-9 rounded-lg neu-inset flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={cn("font-medium mt-0.5", isEmpty && "text-muted-foreground italic text-sm")}>
          {value}
        </p>
      </div>
    </div>
  )
}

export default async function SchoolDetailPage({ params }: SchoolDetailPageProps) {
  const { id } = await params
  const school = await getSchool(id)

  if (!school) {
    notFound()
  }

  const planColors = {
    FREE: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
    BASIC: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    PROFESSIONAL: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    ENTERPRISE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  }

  const statusColors = {
    ACTIVE: "bg-green-500/20 text-green-300 border-green-500/30",
    TRIAL: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    PAST_DUE: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    CANCELLED: "bg-red-500/20 text-red-300 border-red-500/30",
    EXPIRED: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/super-admin/schools">
            <Button variant="ghost" size="icon" className="neu-flat hover:neu-inset rounded-xl h-10 w-10 mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl neu-convex flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{school.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-mono">
                    {school.slug}.suku.app
                  </span>
                  <a 
                    href={`https://${school.slug}.suku.app`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border",
            school.isActive 
              ? "bg-green-500/20 text-green-300 border-green-500/30" 
              : "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
          )}>
            <span className={cn(
              "h-2 w-2 rounded-full",
              school.isActive ? "bg-green-400 animate-pulse" : "bg-zinc-400"
            )} />
            {school.isActive ? "Active" : "Inactive"}
          </div>
          <Link href={`/super-admin/schools/${school.id}/edit`}>
            <Button className="neu-convex hover:scale-[0.98] active:neu-inset rounded-xl h-10">
              <Pencil className="mr-2 h-4 w-4" />
              Edit School
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={Users} 
          label="Total Users" 
          value={school._count.users}
          subtext={`Max: ${school.maxStudents + school.maxTeachers}`}
        />
        <StatCard 
          icon={Building2} 
          label="Classes" 
          value={school._count.classes}
        />
        <StatCard 
          icon={BookOpen} 
          label="Subjects" 
          value={school._count.subjects}
        />
        <StatCard 
          icon={Calendar} 
          label="Academic Years" 
          value={school._count.academicYears}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* School Info Card */}
        <div className="neu-flat rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">School Information</h3>
            <div className="space-y-1">
              <InfoRow 
                icon={Mail} 
                label="Email" 
                value={school.email || "Not set"} 
                isEmpty={!school.email}
              />
              <InfoRow 
                icon={Phone} 
                label="Phone" 
                value={school.phone || "Not set"}
                isEmpty={!school.phone}
              />
              <InfoRow 
                icon={MapPin} 
                label="Address" 
                value={school.address || "Not set"}
                isEmpty={!school.address}
              />
              <InfoRow 
                icon={Clock} 
                label="Created" 
                value={new Date(school.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="neu-flat rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-purple-500/50 via-purple-500/20 to-transparent" />
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">Subscription</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Plan</p>
                  <div className="mt-1.5">
                    <Badge 
                      className={cn(
                        "font-medium",
                        planColors[school.subscriptionPlan as keyof typeof planColors]
                      )}
                    >
                      {school.subscriptionPlan}
                    </Badge>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                  <div className="mt-1.5">
                    <Badge 
                      className={cn(
                        "font-medium",
                        statusColors[school.subscriptionStatus as keyof typeof statusColors]
                      )}
                    >
                      {school.subscriptionStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="neu-inset rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Max Students</span>
                  </div>
                  <span className="font-medium">{school.maxStudents.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Max Teachers</span>
                  </div>
                  <span className="font-medium">{school.maxTeachers.toLocaleString()}</span>
                </div>
              </div>

              {school.trialEndsAt && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Trial ends </span>
                    <span className="font-medium text-blue-300">
                      {new Date(school.trialEndsAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* School Administrators */}
      <SchoolAdminsManager schoolId={school.id} schoolName={school.name} />

      {/* Recent Users */}
      <div className="neu-flat rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Recent Users</h3>
            <span className="text-sm text-muted-foreground">{school._count.users} total</span>
          </div>

          {school.users.length === 0 ? (
            <div className="neu-inset rounded-xl p-8 text-center">
              <div className="h-12 w-12 rounded-xl neu-flat flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No users added yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Users will appear here when added to this school
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {school.users.map((user, i) => (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-white/[0.02]",
                    i !== school.users.length - 1 && "border-b border-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full neu-inset flex items-center justify-center text-sm font-medium">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="neu-flat border-0 text-xs"
                  >
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
