"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X, Filter } from "lucide-react"
import { UserRole } from "@/app/generated/prisma/client"
import { getSchoolsForFilter, UsersFilter } from "../_actions/user-actions"
import { cn } from "@/lib/utils"

interface UserFiltersProps {
  filters: UsersFilter
  onFiltersChange: (filters: UsersFilter) => void
}

export function UserFilters({ filters, onFiltersChange }: UserFiltersProps) {
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([])
  const [searchValue, setSearchValue] = useState(filters.search || "")
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const loadSchools = async () => {
      const result = await getSchoolsForFilter()
      if (result.success && result.schools) {
        setSchools(result.schools)
      }
    }
    loadSchools()
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue, page: 1 })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue, filters, onFiltersChange])

  const handleRoleChange = (role: string) => {
    onFiltersChange({ ...filters, role: role as UserRole | "ALL", page: 1 })
  }

  const handleSchoolChange = (schoolId: string) => {
    onFiltersChange({ ...filters, schoolId, page: 1 })
  }

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status: status as "ACTIVE" | "INACTIVE" | "ALL", page: 1 })
  }

  const clearFilters = () => {
    setSearchValue("")
    onFiltersChange({
      search: "",
      role: "ALL",
      schoolId: "ALL",
      status: "ALL",
      page: 1,
    })
  }

  const hasActiveFilters = 
    filters.search || 
    filters.role !== "ALL" || 
    filters.schoolId !== "ALL" || 
    filters.status !== "ALL"

  const inputClass = "neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl h-11"
  const selectClass = "neu-inset border-0 bg-transparent rounded-xl h-11 [&>span]:text-sm"

  return (
    <div className="space-y-4">
      {/* Search and Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by name or email..."
            className={cn(inputClass, "pl-11")}
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "neu-flat hover:neu-inset rounded-xl h-11 px-4",
            isExpanded && "neu-inset"
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 h-2 w-2 rounded-full bg-white" />
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="neu-flat hover:neu-inset rounded-xl h-11 px-4 text-muted-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="neu-inset rounded-2xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Role</Label>
              <Select value={filters.role || "ALL"} onValueChange={handleRoleChange}>
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="neu-flat border-white/10">
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="SCHOOL_ADMIN">School Admin</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="PARENT">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">School</Label>
              <Select value={filters.schoolId || "ALL"} onValueChange={handleSchoolChange}>
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="All Schools" />
                </SelectTrigger>
                <SelectContent className="neu-flat border-white/10">
                  <SelectItem value="ALL">All Schools</SelectItem>
                  <SelectItem value="NONE">No School</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
              <Select value={filters.status || "ALL"} onValueChange={handleStatusChange}>
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="neu-flat border-white/10">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
