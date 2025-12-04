"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardList,
  CreditCard,
  MessageSquare,
  Settings,
  ChevronDown,
  LogOut,
  Menu,
  Bell,
  Search,
  School,
  Loader2,
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
import { getCurrentUser, logoutFromSchool } from "../login/_actions/auth-actions"
import type { SessionUser } from "@/lib/auth"

// Base menu items - hrefs will be adjusted based on subdomain
const baseMenuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { title: "Students", icon: GraduationCap, path: "/students" },
  { title: "Teachers", icon: Users, path: "/teachers" },
  { title: "Classes", icon: BookOpen, path: "/classes" },
  { title: "Timetable", icon: Calendar, path: "/timetable" },
  { title: "Attendance", icon: ClipboardList, path: "/attendance" },
  { title: "Fees", icon: CreditCard, path: "/fees" },
  { title: "Messages", icon: MessageSquare, path: "/messages" },
  { title: "Settings", icon: Settings, path: "/settings" },
]

function useSubdomainLink(path: string) {
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  
  // In development with subdomain param, preserve it
  if (subdomain) {
    return `${path}?subdomain=${subdomain}`
  }
  // In production (real subdomain) or direct access, use path as-is
  return path
}

function SidebarNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")

  const menuItems = baseMenuItems.map(item => ({
    ...item,
    href: subdomain ? `${item.path}?subdomain=${subdomain}` : item.path,
  }))

  return (
    <nav className="flex flex-col gap-1.5 px-3">
      {menuItems.map((item) => {
        // Check if active based on path (ignoring query params)
        const isActive = pathname.endsWith(item.path) || pathname.includes(`/school${item.path}`)
        return (
          <Link key={item.path} href={item.href}>
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
        )
      })}
    </nav>
  )
}

function SidebarContent({ user, schoolName }: { user: SessionUser | null; schoolName: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const logoutHref = subdomain ? `/login?subdomain=${subdomain}` : "/login"
  
  const handleLogout = async () => {
    await logoutFromSchool()
    router.push(logoutHref)
    router.refresh()
  }

  // Get user initials
  const userInitials = user 
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'U'
    : 'U'

  // Format role for display
  const roleDisplay = user?.role?.replace('_', ' ').split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'User'

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl neu-convex">
            <School className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight">{schoolName}</span>
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">School Admin</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-6">
        <SidebarNav />
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
                <p className="text-xs text-muted-foreground truncate">{roleDisplay}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 glass-card p-2">
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem className="rounded-xl py-2.5 cursor-pointer">
              <Settings className="mr-3 h-4 w-4" />
              <span>Settings</span>
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

export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <React.Suspense fallback={<LayoutSkeleton />}>
      <SchoolLayoutContent>{children}</SchoolLayoutContent>
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

function SchoolLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")
  const [user, setUser] = React.useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [schoolName, setSchoolName] = React.useState("School")

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getCurrentUser()
        
        if (!session?.user) {
          // Not authenticated, redirect to login
          const loginPath = subdomain ? `/login?subdomain=${subdomain}` : "/school/login"
          router.push(loginPath)
          return
        }

        setUser(session.user)
        setSchoolName(session.user.schoolName || subdomain || "School")
      } catch (error) {
        console.error("Auth check error:", error)
        const loginPath = subdomain ? `/login?subdomain=${subdomain}` : "/school/login"
        router.push(loginPath)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, subdomain])

  if (isLoading) {
    return <LayoutSkeleton />
  }

  if (!user) {
    return <LayoutSkeleton />
  }

  // Get user initials for mobile avatar
  const userInitials = user 
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'U'
    : 'U'

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[280px] lg:flex-col neu m-5 rounded-3xl">
        <SidebarContent user={user} schoolName={schoolName} />
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
                  <SidebarContent user={user} schoolName={schoolName} />
                </SheetContent>
              </Sheet>

              {/* Search */}
              <div className="hidden sm:flex flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text"
                    placeholder="Search students, teachers..."
                    className="w-full h-10 pl-11 pr-4 rounded-xl neu-inset-sm bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 lg:hidden" />

              {/* Header Actions */}
              <div className="flex items-center gap-3">
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
