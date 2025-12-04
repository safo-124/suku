"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { 
  MoreHorizontal, 
  Eye, 
  ArrowUpCircle,
  Clock,
  XCircle,
  RefreshCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Building2,
  Users,
  Sparkles,
  Crown,
  Zap,
} from "lucide-react"
import { 
  SchoolSubscription, 
  SubscriptionFilter,
  updateSubscription,
  extendTrial,
  cancelSubscription,
  reactivateSubscription,
} from "../_actions/subscription-actions"
import { SubscriptionPlan, SubscriptionStatus, PLAN_CONFIGS } from "../_lib/plans"

interface SubscriptionTableProps {
  subscriptions: SchoolSubscription[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onRefresh: () => void
}

const planIcons: Record<SubscriptionPlan, React.ComponentType<{ className?: string }>> = {
  FREE: Sparkles,
  BASIC: Zap,
  PROFESSIONAL: Crown,
  ENTERPRISE: Building2,
}

const planColors: Record<SubscriptionPlan, string> = {
  FREE: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  BASIC: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  PROFESSIONAL: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  ENTERPRISE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
}

const statusColors: Record<SubscriptionStatus, string> = {
  ACTIVE: "bg-green-500/20 text-green-300 border-green-500/30",
  TRIAL: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  PAST_DUE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  CANCELLED: "bg-red-500/20 text-red-300 border-red-500/30",
  EXPIRED: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
}

export function SubscriptionTable({ 
  subscriptions, 
  currentPage, 
  totalPages, 
  onPageChange,
  onRefresh 
}: SubscriptionTableProps) {
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)
  
  // Dialogs
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [extendTrialDialogOpen, setExtendTrialDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<SchoolSubscription | null>(null)
  
  // Form state
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("BASIC")
  const [trialDays, setTrialDays] = useState("14")

  const handleUpgrade = (subscription: SchoolSubscription) => {
    setSelectedSubscription(subscription)
    setSelectedPlan(subscription.subscriptionPlan === "FREE" ? "BASIC" : subscription.subscriptionPlan)
    setUpgradeDialogOpen(true)
  }

  const handleExtendTrial = (subscription: SchoolSubscription) => {
    setSelectedSubscription(subscription)
    setTrialDays("14")
    setExtendTrialDialogOpen(true)
  }

  const handleCancel = (subscription: SchoolSubscription) => {
    setSelectedSubscription(subscription)
    setCancelDialogOpen(true)
  }

  const handleReactivate = (subscription: SchoolSubscription) => {
    setActionId(subscription.id)
    startTransition(async () => {
      await reactivateSubscription(subscription.id)
      onRefresh()
      setActionId(null)
    })
  }

  const confirmUpgrade = () => {
    if (!selectedSubscription) return
    setActionId(selectedSubscription.id)
    startTransition(async () => {
      await updateSubscription(selectedSubscription.id, {
        subscriptionPlan: selectedPlan,
        subscriptionStatus: "ACTIVE",
      })
      setUpgradeDialogOpen(false)
      setSelectedSubscription(null)
      onRefresh()
      setActionId(null)
    })
  }

  const confirmExtendTrial = () => {
    if (!selectedSubscription) return
    setActionId(selectedSubscription.id)
    startTransition(async () => {
      await extendTrial(selectedSubscription.id, parseInt(trialDays))
      setExtendTrialDialogOpen(false)
      setSelectedSubscription(null)
      onRefresh()
      setActionId(null)
    })
  }

  const confirmCancel = () => {
    if (!selectedSubscription) return
    setActionId(selectedSubscription.id)
    startTransition(async () => {
      await cancelSubscription(selectedSubscription.id)
      setCancelDialogOpen(false)
      setSelectedSubscription(null)
      onRefresh()
      setActionId(null)
    })
  }

  if (subscriptions.length === 0) {
    return (
      <div className="neu-inset rounded-2xl p-12 text-center">
        <div className="h-16 w-16 rounded-2xl neu-flat flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No subscriptions found</h3>
        <p className="text-muted-foreground text-sm">
          Try adjusting your filters or search criteria
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {subscriptions.map((sub) => {
          const PlanIcon = planIcons[sub.subscriptionPlan]
          const isLoading = actionId === sub.id && isPending
          const daysUntilTrialEnd = sub.trialEndsAt 
            ? Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null

          return (
            <div
              key={sub.id}
              className="neu-flat rounded-2xl p-4 hover-lift transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                {/* School Info */}
                <div className="h-12 w-12 rounded-xl neu-inset flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/super-admin/schools/${sub.id}`}
                      className="font-medium truncate hover:underline"
                    >
                      {sub.name}
                    </Link>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {sub.slug}.suku.app
                  </p>
                </div>

                {/* Plan Badge */}
                <Badge className={cn("hidden sm:flex items-center gap-1.5 border", planColors[sub.subscriptionPlan])}>
                  <PlanIcon className="h-3 w-3" />
                  {PLAN_CONFIGS[sub.subscriptionPlan].name}
                </Badge>

                {/* Status Badge */}
                <Badge className={cn("hidden md:flex border", statusColors[sub.subscriptionStatus])}>
                  {sub.subscriptionStatus}
                </Badge>

                {/* Trial Info */}
                {sub.subscriptionStatus === "TRIAL" && daysUntilTrialEnd !== null && (
                  <div className={cn(
                    "hidden lg:flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg",
                    daysUntilTrialEnd <= 3 
                      ? "bg-red-500/10 text-red-300" 
                      : daysUntilTrialEnd <= 7 
                        ? "bg-amber-500/10 text-amber-300"
                        : "bg-blue-500/10 text-blue-300"
                  )}>
                    <Clock className="h-3 w-3" />
                    {daysUntilTrialEnd > 0 ? `${daysUntilTrialEnd}d left` : "Expired"}
                  </div>
                )}

                {/* Users Count */}
                <div className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {sub._count.users}
                </div>

                {/* Price */}
                <div className="hidden xl:block text-right min-w-[80px]">
                  <p className="font-semibold">
                    ${PLAN_CONFIGS[sub.subscriptionPlan].price}
                    <span className="text-xs text-muted-foreground font-normal">/mo</span>
                  </p>
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
                      <Link href={`/super-admin/schools/${sub.id}`} className="cursor-pointer">
                        <Eye className="h-4 w-4 mr-2" />
                        View School
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={() => handleUpgrade(sub)}>
                      <ArrowUpCircle className="h-4 w-4 mr-2" />
                      Change Plan
                    </DropdownMenuItem>
                    {sub.subscriptionStatus === "TRIAL" && (
                      <DropdownMenuItem onClick={() => handleExtendTrial(sub)}>
                        <Clock className="h-4 w-4 mr-2" />
                        Extend Trial
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-white/10" />
                    {sub.subscriptionStatus === "CANCELLED" ? (
                      <DropdownMenuItem onClick={() => handleReactivate(sub)}>
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Reactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem 
                        onClick={() => handleCancel(sub)}
                        className="text-red-400 focus:text-red-400"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Subscription
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile badges */}
              <div className="flex items-center gap-2 mt-3 sm:hidden">
                <Badge className={cn("flex items-center gap-1.5 border text-xs", planColors[sub.subscriptionPlan])}>
                  <PlanIcon className="h-3 w-3" />
                  {PLAN_CONFIGS[sub.subscriptionPlan].name}
                </Badge>
                <Badge className={cn("border text-xs", statusColors[sub.subscriptionStatus])}>
                  {sub.subscriptionStatus}
                </Badge>
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

      {/* Change Plan Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="neu-flat border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Update the plan for {selectedSubscription?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as SubscriptionPlan)}>
                <SelectTrigger className="neu-inset border-0 bg-transparent rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="neu-flat border-white/10">
                  {(["FREE", "BASIC", "PROFESSIONAL", "ENTERPRISE"] as SubscriptionPlan[]).map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      <div className="flex items-center gap-2">
                        <span>{PLAN_CONFIGS[plan].name}</span>
                        <span className="text-muted-foreground">
                          ${PLAN_CONFIGS[plan].price}/mo
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="neu-inset rounded-xl p-4 space-y-2 text-sm">
              <p className="font-medium">{PLAN_CONFIGS[selectedPlan].name} Plan Features:</p>
              <ul className="space-y-1 text-muted-foreground">
                {PLAN_CONFIGS[selectedPlan].features.slice(0, 4).map((feature, i) => (
                  <li key={i}>• {feature}</li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setUpgradeDialogOpen(false)}
              className="neu-flat hover:neu-inset rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUpgrade}
              disabled={isPending}
              className="neu-convex hover:scale-[0.98] rounded-xl"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Plan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Trial Dialog */}
      <Dialog open={extendTrialDialogOpen} onOpenChange={setExtendTrialDialogOpen}>
        <DialogContent className="neu-flat border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Extend Trial Period</DialogTitle>
            <DialogDescription>
              Add more days to the trial for {selectedSubscription?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Days to Add</Label>
              <Input
                type="number"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                min="1"
                max="90"
                className="neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl h-11"
              />
            </div>
            {selectedSubscription?.trialEndsAt && (
              <p className="text-sm text-muted-foreground">
                Current trial ends:{" "}
                <span className="font-medium text-foreground">
                  {new Date(selectedSubscription.trialEndsAt).toLocaleDateString()}
                </span>
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setExtendTrialDialogOpen(false)}
              className="neu-flat hover:neu-inset rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmExtendTrial}
              disabled={isPending}
              className="neu-convex hover:scale-[0.98] rounded-xl"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extending...
                </>
              ) : (
                "Extend Trial"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="neu-flat border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the subscription for{" "}
              <span className="font-medium text-foreground">{selectedSubscription?.name}</span>?
              This will deactivate the school account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setCancelDialogOpen(false)}
              className="neu-flat hover:neu-inset rounded-xl"
            >
              Keep Active
            </Button>
            <Button
              onClick={confirmCancel}
              disabled={isPending}
              className="bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 rounded-xl"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
