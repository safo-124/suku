"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { toggleSchoolStatus } from "../_actions/school-actions"

interface ToggleSchoolStatusButtonProps {
  schoolId: string
  isActive: boolean
}

export function ToggleSchoolStatusButton({
  schoolId,
  isActive,
}: ToggleSchoolStatusButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleToggle = () => {
    startTransition(async () => {
      await toggleSchoolStatus(schoolId, !isActive)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "relative w-14 h-7 rounded-full transition-all duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isActive 
          ? "neu-pressed bg-green-500/20" 
          : "neu-flat",
        isPending && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "absolute top-1 w-5 h-5 rounded-full transition-all duration-300",
          isActive 
            ? "left-8 bg-green-500 shadow-lg shadow-green-500/50" 
            : "left-1 bg-muted-foreground/50 neu-convex"
        )}
      />
    </button>
  )
}
