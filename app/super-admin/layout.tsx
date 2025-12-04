"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  LayoutDashboard,
  Users,
  Settings,
  CreditCard,
  BarChart3,
  ChevronDown,
  LogOut,
  Menu,
  Bell,
  Search,
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

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/super-admin",
  },
  {
    title: "Schools",
    icon: Building2,
    href: "/super-admin/schools",
  },
  {
    title: "Users",
    icon: Users,
    href: "/super-admin/users",
  },
  {
    title: "Subscriptions",
    icon: CreditCard,
    href: "/super-admin/subscriptions",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/super-admin/analytics",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/super-admin/settings",
  },
]

function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1.5 px-3">
      {menuItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link key={item.href} href={item.href}>
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

function SidebarContent() {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl neu-convex">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight">Suku</span>
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Super Admin</span>
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
                <AvatarFallback className="bg-foreground text-background font-semibold text-sm">SA</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold truncate">Super Admin</p>
                <p className="text-xs text-muted-foreground truncate">admin@suku.com</p>
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
            <DropdownMenuItem className="rounded-xl py-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
              <LogOut className="mr-3 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[280px] lg:flex-col neu m-5 rounded-3xl">
        <SidebarContent />
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
                  <SidebarContent />
                </SheetContent>
              </Sheet>

              {/* Search */}
              <div className="hidden sm:flex flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text"
                    placeholder="Search..."
                    className="w-full h-10 pl-11 pr-4 rounded-xl neu-inset-sm bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 lg:hidden" />

              {/* Header Actions */}
              <div className="flex items-center gap-3">
                {/* Status Indicator */}
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl neu-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 status-dot" />
                  <span className="text-xs font-medium text-muted-foreground">Online</span>
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="neu-sm hover:neu rounded-xl h-10 w-10 relative">
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                    3
                  </span>
                </Button>

                {/* Mobile User Avatar */}
                <Avatar className="h-10 w-10 lg:hidden ring-2 ring-background shadow-sm">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-foreground text-background font-semibold text-sm">SA</AvatarFallback>
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
