"use client"

import { useState, useEffect, useCallback } from "react"
import { SubscriptionFilters } from "./subscription-filters"
import { SubscriptionTable } from "./subscription-table"
import { getSubscriptions, SubscriptionFilter, SchoolSubscription } from "../_actions/subscription-actions"
import { Loader2 } from "lucide-react"

export function SubscriptionsClient() {
  const [subscriptions, setSubscriptions] = useState<SchoolSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState<SubscriptionFilter>({
    search: "",
    plan: "ALL",
    status: "ALL",
    page: 1,
    limit: 10,
  })

  const loadSubscriptions = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getSubscriptions(filters)
      if (result.success && result.subscriptions) {
        setSubscriptions(result.subscriptions)
        setTotalPages(result.pages || 1)
      }
    } catch (error) {
      console.error("Failed to load subscriptions:", error)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadSubscriptions()
  }, [loadSubscriptions])

  const handleFiltersChange = (newFilters: SubscriptionFilter) => {
    setFilters(newFilters)
  }

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  return (
    <div className="space-y-6">
      <SubscriptionFilters filters={filters} onFiltersChange={handleFiltersChange} />
      
      {isLoading ? (
        <div className="neu-inset rounded-2xl p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <SubscriptionTable
          subscriptions={subscriptions}
          currentPage={filters.page || 1}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRefresh={loadSubscriptions}
        />
      )}
    </div>
  )
}
