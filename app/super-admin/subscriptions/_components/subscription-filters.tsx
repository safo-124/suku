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
import { SubscriptionFilter } from "../_actions/subscription-actions"
import { SubscriptionPlan, SubscriptionStatus } from "../_lib/plans"
import { cn } from "@/lib/utils"

interface SubscriptionFiltersProps {
  filters: SubscriptionFilter
  onFiltersChange: (filters: SubscriptionFilter) => void
}

export function SubscriptionFilters({ filters, onFiltersChange }: SubscriptionFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "")
  const [isExpanded, setIsExpanded] = useState(false)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue, page: 1 })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue, filters, onFiltersChange])

  const handlePlanChange = (plan: string) => {
    onFiltersChange({ ...filters, plan: plan as SubscriptionPlan | "ALL", page: 1 })
  }

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status: status as SubscriptionStatus | "ALL", page: 1 })
  }

  const clearFilters = () => {
    setSearchValue("")
    onFiltersChange({
      search: "",
      plan: "ALL",
      status: "ALL",
      page: 1,
    })
  }

  const hasActiveFilters = 
    filters.search || 
    filters.plan !== "ALL" || 
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
            placeholder="Search by school name or email..."
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Plan</Label>
              <Select value={filters.plan || "ALL"} onValueChange={handlePlanChange}>
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent className="neu-flat border-white/10">
                  <SelectItem value="ALL">All Plans</SelectItem>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
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
                  <SelectItem value="TRIAL">Trial</SelectItem>
                  <SelectItem value="PAST_DUE">Past Due</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
