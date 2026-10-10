"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/authContext"
import { ActivityRewardSummary } from "@/lib/progression/calculateActivityRewards"
import { useCompletedReward } from "./useCompletedReward"

/** Guest rewards stay personal; authenticated rewards must have a verified receipt. */
export function usePracticeReward(result: object, apply: () => ActivityRewardSummary, verified?: Promise<ActivityRewardSummary> | null) {
  const { isGuest } = useAuth()
  const localApply = useCallback(() => isGuest ? apply() : null, [isGuest, apply])
  const local = useCompletedReward(result, localApply)
  const [receipt, setReceipt] = useState<ActivityRewardSummary | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (isGuest) return
    let active = true
    Promise.resolve(verified).then(summary => {
      if (active) { setReceipt(summary ?? null); setError(!summary) }
    }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [isGuest, verified])
  return { summary: isGuest ? local : receipt, error }
}
