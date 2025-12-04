"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, TrendingUp, AlertTriangle } from "lucide-react"
import { savePromotionRule, updateSubjectPromotionRequirement } from "../_actions/settings-actions"
import { toast } from "sonner"

// Use string literals instead of importing from Prisma client in "use client" component
const PROMOTION_RULE_TYPES = {
  AVERAGE_ONLY: "AVERAGE_ONLY",
  REQUIRED_SUBJECTS: "REQUIRED_SUBJECTS",
} as const

type PromotionRuleType = typeof PROMOTION_RULE_TYPES[keyof typeof PROMOTION_RULE_TYPES]

interface PromotionRule {
  id: string
  type: string
  threshold: unknown
  isActive: boolean
}

interface Subject {
  id: string
  name: string
  code: string | null
  isRequiredForPromotion: boolean
}

interface PromotionRulesManagerProps {
  rule: PromotionRule | null
  subjects: Subject[]
}

export function PromotionRulesManager({ rule, subjects }: PromotionRulesManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    type: (rule?.type as PromotionRuleType) || PROMOTION_RULE_TYPES.AVERAGE_ONLY,
    threshold: rule?.threshold ? String(rule.threshold) : "50",
  })
  const [localSubjects, setLocalSubjects] = useState(subjects)

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault()

    const threshold = parseFloat(formData.threshold)
    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      toast.error("Please enter a valid threshold percentage (0-100)")
      return
    }

    startTransition(async () => {
      const result = await savePromotionRule({
        type: formData.type,
        threshold,
      })

      if (result.success) {
        toast.success("Promotion rules saved successfully")
      } else {
        toast.error(result.error || "Failed to save rules")
      }
    })
  }

  const handleToggleSubject = (subjectId: string, isRequired: boolean) => {
    // Optimistic update
    setLocalSubjects(prev => 
      prev.map(s => s.id === subjectId ? { ...s, isRequiredForPromotion: isRequired } : s)
    )

    startTransition(async () => {
      const result = await updateSubjectPromotionRequirement(subjectId, isRequired)

      if (!result.success) {
        // Revert on error
        setLocalSubjects(prev => 
          prev.map(s => s.id === subjectId ? { ...s, isRequiredForPromotion: !isRequired } : s)
        )
        toast.error(result.error || "Failed to update subject")
      }
    })
  }

  const inputClass = "neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-foreground/20 rounded-xl h-11"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Promotion Rules
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure how students are promoted to the next grade level
        </p>
      </div>

      {/* Rule Configuration */}
      <form onSubmit={handleSaveRule} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Rule Type */}
          <div className="space-y-2">
            <Label>Promotion Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as PromotionRuleType })}
              disabled={isPending}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-0 neu rounded-xl">
                <SelectItem value={PROMOTION_RULE_TYPES.AVERAGE_ONLY}>
                  Average Only
                </SelectItem>
                <SelectItem value={PROMOTION_RULE_TYPES.REQUIRED_SUBJECTS}>
                  Must Pass Required Subjects
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.type === PROMOTION_RULE_TYPES.AVERAGE_ONLY
                ? "Students are promoted based on overall average score only"
                : "Students must also pass all required subjects to be promoted"}
            </p>
          </div>

          {/* Threshold */}
          <div className="space-y-2">
            <Label htmlFor="threshold">Passing Threshold (%)</Label>
            <Input
              id="threshold"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
              className={inputClass}
              placeholder="50"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Minimum average score required for promotion
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="neu-convex hover:scale-[0.98] active:neu-inset rounded-xl"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Rules
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Required Subjects (only show if REQUIRED_SUBJECTS type) */}
      {formData.type === PROMOTION_RULE_TYPES.REQUIRED_SUBJECTS && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="space-y-4">
            <div>
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Required Subjects
              </h4>
              <p className="text-sm text-muted-foreground">
                Students must pass these subjects to be eligible for promotion
              </p>
            </div>

            {localSubjects.length === 0 ? (
              <div className="text-center py-8 neu-sm rounded-xl">
                <p className="text-muted-foreground">
                  No subjects found. Add subjects in the Classes module first.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {localSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between p-4 neu-sm rounded-xl"
                  >
                    <div>
                      <p className="font-medium">{subject.name}</p>
                      {subject.code && (
                        <p className="text-sm text-muted-foreground">{subject.code}</p>
                      )}
                    </div>
                    <Switch
                      checked={subject.isRequiredForPromotion}
                      onCheckedChange={(checked) => handleToggleSubject(subject.id, checked)}
                      disabled={isPending}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Info Box */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <h4 className="font-medium text-blue-600 mb-2">How Promotion Works</h4>
        <ul className="text-sm text-blue-500/80 space-y-1 list-disc list-inside">
          <li>At the end of each academic year, the system calculates student averages</li>
          <li>Students meeting the threshold are marked as &quot;promotion eligible&quot;</li>
          <li>School admin can review and manually override decisions</li>
          <li>Students who repeat are tracked with a repeat counter</li>
          <li>An alert is shown for students repeating 2+ times</li>
        </ul>
      </div>
    </div>
  )
}
