"use client"

import { useEffect, useState } from "react"
import { oncePerCompletion } from "@/lib/progression/completedRewards"

/** Commit completed activity rewards after render, once, without side effects in initializers. */
export function useCompletedReward<T>(result: object, apply: () => T): T | null {
  const [summary, setSummary] = useState<T | null>(null)
  useEffect(() => {
    let active = true
    queueMicrotask(() => { if (active) setSummary(oncePerCompletion(result, apply)) })
    return () => { active = false }
  }, [result, apply])
  return summary
}
