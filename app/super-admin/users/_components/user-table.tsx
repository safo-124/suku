"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { 
  MoreHorizontal, 
  Eye, 
  Pencil, 
  Trash2, 
  UserCheck, 
  UserX,
  Shield,
  GraduationCap,
  Users,
  BookOpen,
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { UserRole } from "@/app/generated/prisma/client"
import { UserWithSchool, updateUserStatus, deleteUser } from "../_actions/user-actions"

interface UserTableProps {
  users: UserWithSchool[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onRefresh: () => void
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

export function UserTable({ 
  users, 
  currentPage, 
  totalPages, 
  onPageChange,
  onRefresh 
}: UserTableProps) {
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserWithSchool | null>(null)
  const [actionUserId, setActionUserId] = useState<string | null>(null)

  const handleToggleStatus = (user: UserWithSchool) => {
    setActionUserId(user.id)
    startTransition(async () => {
      await updateUserStatus(user.id, !user.isActive)
      onRefresh()
      setActionUserId(null)
    })
  }

  const handleDelete = (user: UserWithSchool) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!userToDelete) return
    setActionUserId(userToDelete.id)
    startTransition(async () => {
      await deleteUser(userToDelete.id)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      onRefresh()
      setActionUserId(null)
    })
  }

  if (users.length === 0) {
    return (
      <div className="neu-inset rounded-2xl p-12 text-center">
        <div className="h-16 w-16 rounded-2xl neu-flat flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No users found</h3>
        <p className="text-muted-foreground text-sm">
          Try adjusting your filters or search criteria
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {users.map((user) => {
          const roleInfo = roleConfig[user.role]
          const RoleIcon = roleInfo.icon
          const isLoading = actionUserId === user.id && isPending

          return (
            <div
              key={user.id}
              className="neu-flat rounded-2xl p-4 hover-lift transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="h-12 w-12 rounded-xl neu-inset flex items-center justify-center shrink-0">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={`${user.firstName} ${user.lastName}`}
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <span className="font-medium text-sm">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </span>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">
                      {user.firstName} {user.lastName}
                    </h4>
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      user.isActive ? "bg-green-400" : "bg-zinc-400"
                    )} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>

                {/* Role Badge */}
                <Badge className={cn("hidden sm:flex items-center gap-1.5 border", roleInfo.color)}>
                  <RoleIcon className="h-3 w-3" />
                  {roleInfo.label}
                </Badge>

                {/* School */}
                <div className="hidden md:block text-sm text-right min-w-[120px]">
                  {user.school ? (
                    <Link 
                      href={`/super-admin/schools/${user.school.id}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {user.school.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground/50 italic">No school</span>
                  )}
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="neu-flat hover:neu-inset rounded-xl h-9 w-9"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="neu-flat border-white/10 w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem asChild>
                      <Link href={`/super-admin/users/${user.id}`} className="cursor-pointer">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/super-admin/users/${user.id}/edit`} className="cursor-pointer">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit User
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                      {user.isActive ? (
                        <>
                          <UserX className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem 
                      onClick={() => handleDelete(user)}
                      className="text-red-400 focus:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Role & School */}
              <div className="flex items-center gap-2 mt-3 sm:hidden">
                <Badge className={cn("flex items-center gap-1.5 border text-xs", roleInfo.color)}>
                  <RoleIcon className="h-3 w-3" />
                  {roleInfo.label}
                </Badge>
                {user.school && (
                  <span className="text-xs text-muted-foreground">
                    {user.school.name}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="neu-flat hover:neu-inset rounded-xl h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="neu-flat hover:neu-inset rounded-xl h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="neu-flat border-white/10">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {userToDelete?.firstName} {userToDelete?.lastName}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              className="neu-flat hover:neu-inset rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 rounded-xl"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
