"use client"

import { useState, useEffect, useCallback } from "react"
import { UserFilters } from "./user-filters"
import { UserTable } from "./user-table"
import { getUsers, UsersFilter, UserWithSchool } from "../_actions/user-actions"
import { Loader2 } from "lucide-react"

export function UsersClient() {
  const [users, setUsers] = useState<UserWithSchool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState<UsersFilter>({
    search: "",
    role: "ALL",
    schoolId: "ALL",
    status: "ALL",
    page: 1,
    limit: 10,
  })

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getUsers(filters)
      if (result.success && result.users) {
        setUsers(result.users)
        setTotalPages(result.pages || 1)
      }
    } catch (error) {
      console.error("Failed to load users:", error)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleFiltersChange = (newFilters: UsersFilter) => {
    setFilters(newFilters)
  }

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  return (
    <div className="space-y-6">
      <UserFilters filters={filters} onFiltersChange={handleFiltersChange} />
      
      {isLoading ? (
        <div className="neu-inset rounded-2xl p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <UserTable
          users={users}
          currentPage={filters.page || 1}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRefresh={loadUsers}
        />
      )}
    </div>
  )
}
