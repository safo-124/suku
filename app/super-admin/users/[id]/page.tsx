import { notFound } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Pencil, 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  Shield,
  GraduationCap,
  BookOpen,
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { getUserById } from "../_actions/user-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UserRole } from "@/app/generated/prisma/client"

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

const roleConfig: Record<UserRole, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  SUPER_ADMIN: { 
    label: "Super Admin", 
    icon: Shield, 
    color: "bg-red-500/20 text-red-300 border-red-500/30" 
  },
  SCHOOL_ADMIN: { 
    label: "School Admin", 
    icon: Building2, 
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30" 
  },
  TEACHER: { 
    label: "Teacher", 
    icon: BookOpen, 
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30" 
  },
  STUDENT: { 
    label: "Student", 
    icon: GraduationCap, 
    color: "bg-green-500/20 text-green-300 border-green-500/30" 
  },
  PARENT: { 
    label: "Parent", 
    icon: Users, 
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30" 
  },
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

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params
  const result = await getUserById(id)

  if (!result.success || !result.user) {
    notFound()
  }

  const user = result.user
  const roleInfo = roleConfig[user.role]
  const RoleIcon = roleInfo.icon

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/super-admin/users">
            <Button variant="ghost" size="icon" className="neu-flat hover:neu-inset rounded-xl h-10 w-10 mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl neu-convex flex items-center justify-center">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  <span className="font-bold text-lg">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border",
            user.isActive 
              ? "bg-green-500/20 text-green-300 border-green-500/30" 
              : "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
          )}>
            <span className={cn(
              "h-2 w-2 rounded-full",
              user.isActive ? "bg-green-400 animate-pulse" : "bg-zinc-400"
            )} />
            {user.isActive ? "Active" : "Inactive"}
          </div>
          <Link href={`/super-admin/users/${user.id}/edit`}>
            <Button className="neu-convex hover:scale-[0.98] active:neu-inset rounded-xl h-10">
              <Pencil className="mr-2 h-4 w-4" />
              Edit User
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Info Card */}
        <div className="neu-flat rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">User Information</h3>
            <div className="space-y-1">
              <InfoRow 
                icon={Mail} 
                label="Email" 
                value={user.email}
              />
              <InfoRow 
                icon={Phone} 
                label="Phone" 
                value={user.phone || "Not set"}
                isEmpty={!user.phone}
              />
              <InfoRow 
                icon={RoleIcon} 
                label="Role" 
                value={
                  <Badge className={cn("border mt-1", roleInfo.color)}>
                    <RoleIcon className="h-3 w-3 mr-1" />
                    {roleInfo.label}
                  </Badge>
                }
              />
              <InfoRow 
                icon={Clock} 
                label="Joined" 
                value={new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="neu-flat rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500/50 via-blue-500/20 to-transparent" />
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">Account Status</h3>
            <div className="space-y-4">
              <div className="neu-inset rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {user.isActive ? (
                      <UserCheck className="h-4 w-4 text-green-400" />
                    ) : (
                      <UserX className="h-4 w-4 text-zinc-400" />
                    )}
                    <span className="text-muted-foreground">Account Status</span>
                  </div>
                  <span className={cn(
                    "font-medium",
                    user.isActive ? "text-green-400" : "text-zinc-400"
                  )}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {user.emailVerified ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-amber-400" />
                    )}
                    <span className="text-muted-foreground">Email Verified</span>
                  </div>
                  <span className={cn(
                    "font-medium",
                    user.emailVerified ? "text-green-400" : "text-amber-400"
                  )}>
                    {user.emailVerified ? "Verified" : "Pending"}
                  </span>
                </div>
              </div>

              {user.school && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="h-10 w-10 rounded-lg neu-inset flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">School</p>
                    <Link 
                      href={`/super-admin/schools/${user.school.id}`}
                      className="font-medium hover:underline"
                    >
                      {user.school.name}
                    </Link>
                  </div>
                </div>
              )}

              {!user.school && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Building2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-400">
                    This user is not assigned to any school
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
