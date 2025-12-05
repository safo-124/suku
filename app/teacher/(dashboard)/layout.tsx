"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  ClipboardList,
  Users,
  MessageSquare,
  ChevronDown,
  LogOut,
  Menu,
  Bell,
  GraduationCap,
  Award,
  User,
  Loader2,
  School,
  FileText,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { getCurrentTeacher, logoutTeacher } from "../login/_actions/teacher-auth-actions"
import { getTeacherInfo } from "./_actions/teacher-actions"
import type { SessionUser } from "@/lib/auth"

// Base menu items for all teachers
const baseMenuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { title: "My Subjects", icon: BookOpen, path: "/my-subjects" },
  { title: "Assignments", icon: FileText, path: "/assignments" },
  { title: "Timetable", icon: Calendar, path: "/timetable" },
  { title: "Messages", icon: MessageSquare, path: "/messages" },
  { title: "Profile", icon: User, path: "/profile" },
]

// Additional items for class teachers
const classTeacherItems = [
  { title: "My Class", icon: School, path: "/my-class", dividerBefore: true },
  { title: "Class Students", icon: Users, path: "/my-class/students" },
  { title: "Class Attendance", icon: ClipboardList, path: "/my-class/attendance" },
  { title: "Class Grades", icon: Award, path: "/my-class/grades" },
]

interface TeacherInfo {
  isClassTeacher: boolean
  classTeacherOf: Array<{ id: string; name: string }>
}

interface MenuItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  href: string
  dividerBefore?: boolean
}

function SidebarNav({ teacherInfo }: { teacherInfo: TeacherInfo | null }) {
  const pathname = usePathname()

  const menuItems: MenuItem[] = [
    ...baseMenuItems.map(item => ({
      ...item,
      href: `/teacher${item.path}`,
    })),
    ...(teacherInfo?.isClassTeacher ? classTeacherItems.map(item => ({
      ...item,
      href: `/teacher${item.path}`,
    })) : []),
  ]

  return (
    <nav className="flex flex-col gap-1.5 px-3">
      {menuItems.map((item) => {
        const isActive = pathname.endsWith(item.path) || pathname.includes(`/teacher${item.path}`)
        const showDivider = item.dividerBefore === true
        
        return (
          <React.Fragment key={item.path}>
            {showDivider && (
              <div className="my-2 mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            )}
            <Link href={item.href}>
              <div
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden",
                  isActive
                    ? "neu-inset-sm"
                    : "hover:neu-sm"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300",
                  isActive ? "neu-convex" : "group-hover:neu-sm"
                )}>
                  <item.icon className={cn(
                    "h-[18px] w-[18px] transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                </div>
                <span className={cn(
                  "font-medium transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}>
                  {item.title}
                </span>
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-foreground" />
                )}
              </div>
            </Link>
          </React.Fragment>
        )
      })}
    </nav>
  )
}

function SidebarContent({ 
  user, 
  schoolName, 
  teacherInfo 
}: { 
  user: SessionUser | null
  schoolName: string
  teacherInfo: TeacherInfo | null 
}) {
  const router = useRouter()
  
  const handleLogout = async () => {
    await logoutTeacher()
    router.push("/teacher/login")
    router.refresh()
  }

  const userInitials = user 
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'T'
    : 'T'

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl neu-convex">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight">{schoolName}</span>
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Teacher Portal</span>
          </div>
        </div>
      </div>

      {/* Class Teacher Badge */}
      {teacherInfo?.isClassTeacher && (
        <div className="px-6 pb-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <School className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">Class Teacher</span>
            </div>
            <p className="text-sm font-semibold mt-1">
              {teacherInfo.classTeacherOf.map(c => c.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mx-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-6">
        <SidebarNav teacherInfo={teacherInfo} />
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* User Menu */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-3 rounded-2xl neu-sm hover:neu transition-all duration-300 group">
              <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                <AvatarImage src="" />
                <AvatarFallback className="bg-foreground text-background font-semibold text-sm">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                </p>
                <p className="text-xs text-muted-foreground truncate">Teacher</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 glass-card p-2">
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem className="rounded-xl py-2.5 cursor-pointer">
              <User className="mr-3 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem 
              className="rounded-xl py-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <React.Suspense fallback={<LayoutSkeleton />}>
      <TeacherLayoutContent>{children}</TeacherLayoutContent>
    </React.Suspense>
  )
}

function LayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex lg:w-[280px] lg:flex-col neu m-5 rounded-3xl">
        <div className="flex flex-col h-full animate-pulse">
          <div className="p-6">
            <div className="h-11 w-full bg-muted/20 rounded-2xl" />
          </div>
          <div className="flex-1 p-3 space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/20 rounded-2xl" />
            ))}
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-50 m-5 mb-0 lg:ml-0">
          <div className="neu rounded-3xl h-16" />
        </header>
        <main className="flex-1 p-5 lg:pl-0">
          <div className="glass-card rounded-3xl p-8 min-h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    </div>
  )
}

function TeacherLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = React.useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [schoolName, setSchoolName] = React.useState("School")
  const [teacherInfo, setTeacherInfo] = React.useState<TeacherInfo | null>(null)

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getCurrentTeacher()
        
        if (!session?.user) {
          router.push("/teacher/login")
          return
        }

        setUser(session.user)
        setSchoolName(session.user.schoolName || "School")

        // Get teacher-specific info
        const info = await getTeacherInfo()
        if (info.success) {
          setTeacherInfo({
            isClassTeacher: info.isClassTeacher || false,
            classTeacherOf: info.classTeacherOf || [],
          })
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/teacher/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return <LayoutSkeleton />
  }

  if (!user) {
    return <LayoutSkeleton />
  }

  const userInitials = user 
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'T'
    : 'T'

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[280px] lg:flex-col neu m-5 rounded-3xl">
        <SidebarContent user={user} schoolName={schoolName} teacherInfo={teacherInfo} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-50 m-5 mb-0 lg:ml-0">
          <div className="neu rounded-3xl">
            <div className="flex h-16 items-center gap-4 px-6">
              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden neu-sm hover:neu rounded-xl h-10 w-10">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 neu rounded-r-3xl border-0">
                  <SidebarContent user={user} schoolName={schoolName} teacherInfo={teacherInfo} />
                </SheetContent>
              </Sheet>

              <div className="flex-1" />

              {/* Header Actions */}
              <div className="flex items-center gap-3">
                {/* Class Teacher Badge - Mobile */}
                {teacherInfo?.isClassTeacher && (
                  <Badge variant="secondary" className="hidden sm:flex md:hidden lg:flex gap-1 rounded-lg neu-sm px-3 py-1.5">
                    <School className="h-3 w-3" />
                    <span className="text-xs">Class Teacher</span>
                  </Badge>
                )}

                {/* Academic Year */}
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl neu-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">2024-2025</span>
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="neu-sm hover:neu rounded-xl h-10 w-10 relative">
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                    5
                  </span>
                </Button>

                {/* Mobile User Avatar */}
                <Avatar className="h-10 w-10 lg:hidden ring-2 ring-background shadow-sm">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-foreground text-background font-semibold text-sm">{userInitials}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-5 lg:pl-0">
          <div className="glass-card rounded-3xl p-8 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
