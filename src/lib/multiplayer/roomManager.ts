import { getSupabaseClient } from "@/lib/supabase/client"
import { MultiplayerPlayer, RoomState } from "@/types/multiplayer"
import type { RealtimeChannel } from "@supabase/supabase-js"

export type RoomEventType =
  | "PLAYER_JOINED"
  | "PLAYER_LEFT"
  | "PLAYER_READY"
  | "MATCH_START"

export interface RoomEventPayload {
  event: RoomEventType
  playerId: string
  roomCode: string
  timestamp: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extra?: any
}

/**
 * Generates an anime-styled 6-character room code: KF-XXXX
 */
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // excluding ambiguous I, O, 0, 1
  let code = ""
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `KF-${code}`
}

/**
 * Factory to create an initial RoomState for a hosting player
 */
export function createInitialRoomState(
  host: MultiplayerPlayer,
  customCode?: string
): RoomState {
  return {
    code: customCode || generateRoomCode(),
    status: "waiting",
    host: {
      ...host,
      isHost: true,
      ready: false,
    },
    guest: null,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Updates ready state of a player in a room.
 * Transitions room to "ready" when both players are ready.
 */
export function setPlayerReadyState(
  currentRoom: RoomState,
  playerId: string,
  ready: boolean
): RoomState {
  let updatedHost = currentRoom.host
  let updatedGuest = currentRoom.guest

  if (currentRoom.host.id === playerId) {
    updatedHost = { ...currentRoom.host, ready }
  } else if (currentRoom.guest && currentRoom.guest.id === playerId) {
    updatedGuest = { ...currentRoom.guest, ready }
  }

  const bothReady = updatedHost.ready && Boolean(updatedGuest?.ready)

  return {
    ...currentRoom,
    host: updatedHost,
    guest: updatedGuest,
    status: bothReady ? "ready" : "waiting",
  }
}

/**
 * Adds a guest player to a room.
 */
export function joinRoomState(
  currentRoom: RoomState,
  guest: MultiplayerPlayer
): RoomState {
  return {
    ...currentRoom,
    guest: {
      ...guest,
      isHost: false,
      ready: false,
    },
    status: "waiting",
  }
}

/**
 * Removes a player from a room.
 */
export function leaveRoomState(
  currentRoom: RoomState,
  playerId: string
): RoomState {
  if (currentRoom.host.id === playerId) {
    return {
      ...currentRoom,
      status: "closed",
    }
  }

  if (currentRoom.guest?.id === playerId) {
    return {
      ...currentRoom,
      guest: null,
      status: "waiting",
      host: { ...currentRoom.host, ready: false },
    }
  }

  return currentRoom
}

/**
 * Subscribes to a Supabase Realtime Broadcast Channel for room synchronization.
 */
export function subscribeToRoomChannel(
  roomCode: string,
  onRoomUpdate: (room: RoomState) => void,
  onRoomEvent?: (event: RoomEventPayload) => void
): {
  channel: RealtimeChannel | null
  broadcastRoom: (room: RoomState) => Promise<void>
  broadcastEvent: (event: RoomEventType, playerId: string, extra?: unknown) => Promise<void>
  unsubscribe: () => void
} {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return {
      channel: null,
      broadcastRoom: async () => {},
      broadcastEvent: async () => {},
      unsubscribe: () => {},
    }
  }

  const channel = supabase.channel(`room:${roomCode}`, {
    config: {
      broadcast: { self: true },
    },
  })

  channel.on("broadcast", { event: "room_state" }, ({ payload }) => {
    if (payload && typeof payload === "object") {
      onRoomUpdate(payload as RoomState)
    }
  })

  channel.on("broadcast", { event: "room_event" }, ({ payload }) => {
    if (payload && onRoomEvent) {
      onRoomEvent(payload as RoomEventPayload)
    }
  })

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      // Channel ready
    }
  })

  const broadcastRoom = async (room: RoomState) => {
    try {
      await channel.send({
        type: "broadcast",
        event: "room_state",
        payload: room,
      })
    } catch (err) {
      console.warn("[RoomManager] Failed to broadcast room state:", err)
    }
  }

  const broadcastEvent = async (
    event: RoomEventType,
    playerId: string,
    extra?: unknown
  ) => {
    try {
      const payload: RoomEventPayload = {
        event,
        playerId,
        roomCode,
        timestamp: new Date().toISOString(),
        extra,
      }
      await channel.send({
        type: "broadcast",
        event: "room_event",
        payload,
      })
    } catch (err) {
      console.warn("[RoomManager] Failed to broadcast room event:", err)
    }
  }

  const unsubscribe = () => {
    try {
      supabase.removeChannel(channel)
    } catch (err) {
      console.warn("[RoomManager] Error unsubscribing channel:", err)
    }
  }

  return {
    channel,
    broadcastRoom,
    broadcastEvent,
    unsubscribe,
  }
}
