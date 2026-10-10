"use client"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/authContext"
import { subscribeRealtime } from "@/lib/backend/realtime"
export type PresenceStatus = "in_lobby" | "in_queue" | "in_match"
export interface OnlineUserPresence { userId: string; username: string; level: number; rank: string; status: PresenceStatus; joinedAt: string }
export function useMultiplayerPresence(currentStatus: PresenceStatus = "in_lobby") {
  const { user, isAuthenticated } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUserPresence[]>([])
  const [onlineCount, setOnlineCount] = useState<number | null>(null)
  useEffect(() => {
    if (!isAuthenticated) return
    return subscribeRealtime(message => {
      if (message.type === "presence") { const users = message.users as OnlineUserPresence[]; setOnlineUsers(users); setOnlineCount(users.length) }
    }, undefined, currentStatus)
  }, [user.id, isAuthenticated, currentStatus])
  return { onlineUsers, onlineCount }
}
