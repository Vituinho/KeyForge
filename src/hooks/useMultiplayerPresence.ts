"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/authContext"
import { usePlayer } from "@/hooks/usePlayer"

export type PresenceStatus = "in_lobby" | "in_queue" | "in_match"

export interface OnlineUserPresence {
  userId: string
  username: string
  level: number
  rank: string
  status: PresenceStatus
  joinedAt: string
}

export function useMultiplayerPresence(currentStatus: PresenceStatus = "in_lobby") {
  const { user, isAuthenticated } = useAuth()
  const { player } = usePlayer()

  const [onlineUsers, setOnlineUsers] = useState<OnlineUserPresence[]>([])
  const [onlineCount, setOnlineCount] = useState<number>(1)

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase || !isAuthenticated || !user || user.isGuest) {
      return
    }

    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    const updatePresenceState = () => {
      const state = channel.presenceState<OnlineUserPresence>()
      const users: OnlineUserPresence[] = []

      Object.values(state).forEach((presences) => {
        if (Array.isArray(presences)) {
          presences.forEach((p) => {
            if (p && typeof p === "object" && p.userId) {
              users.push(p as OnlineUserPresence)
            }
          })
        }
      })

      if (users.length > 0) {
        setOnlineUsers(users)
        setOnlineCount(users.length)
      } else {
        setOnlineCount(1)
      }
    }

    channel
      .on("presence", { event: "sync" }, () => {
        updatePresenceState()
      })
      .on("presence", { event: "join" }, () => {
        updatePresenceState()
      })
      .on("presence", { event: "leave" }, () => {
        updatePresenceState()
      })

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        try {
          await channel.track({
            userId: user.id,
            username: user.username,
            level: player.level,
            rank: player.rank,
            status: currentStatus,
            joinedAt: new Date().toISOString(),
          })
        } catch (err) {
          console.warn("[Presence] Failed to track user presence:", err)
        }
      }
    })

    return () => {
      try {
        supabase.removeChannel(channel)
      } catch (err) {
        console.warn("[Presence] Error removing presence channel:", err)
      }
    }
  }, [user, isAuthenticated, player.level, player.rank, player.username, currentStatus])

  return {
    onlineCount: Math.max(1, onlineCount),
    onlineUsers,
  }
}
