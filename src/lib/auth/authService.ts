import { AuthUser, LoginCredentials, RegisterCredentials } from "@/types/auth"
import { getSupabaseClient } from "@/lib/supabase/client"

const AUTH_USER_KEY = "keyforge_auth_user"
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/

/**
 * Validates shinobi username format: 3-20 chars, letters, numbers, _, -
 */
export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username.trim())
}

/**
 * Checks whether a given username is available (case-insensitive).
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  const trimmed = username.trim()
  if (!isValidUsername(trimmed)) return false

  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from("profiles")
        .select("id")
        .ilike("username", trimmed)
        .maybeSingle()

      if (error) {
        console.warn("Could not query remote profiles for username:", error.message)
        return true
      }
      return !data
    } catch {
      return true
    }
  }

  // Offline / local validation
  return true
}

/**
 * Creates a standard guest user representation.
 * Guest users preserve 100% of their local progression without requiring an online account.
 */
export function createGuestUser(customUsername?: string): AuthUser {
  const timestamp = new Date().toISOString()
  return {
    id: `guest_${Date.now()}`,
    username: customUsername?.trim() || "Shinobi Warrior",
    isGuest: true,
    createdAt: timestamp,
    lastLoginAt: timestamp,
  }
}

/**
 * Retrieves the currently active user session from client storage.
 * Defaults safely to a guest user if no session exists.
 * IMPORTANT: No sensitive credentials or passwords are ever stored here.
 */
export function getStoredUser(): AuthUser {
  if (typeof window === "undefined") {
    return createGuestUser()
  }

  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AuthUser
      if (parsed && parsed.id && parsed.username) {
        return parsed
      }
    }
  } catch {
    // Fallback to guest if parsing fails
  }

  const defaultGuest = createGuestUser()
  saveStoredUser(defaultGuest)
  return defaultGuest
}

/**
 * Persists non-sensitive user metadata to localStorage.
 */
export function saveStoredUser(user: AuthUser): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  } catch (err) {
    console.warn("Failed to persist auth user metadata:", err)
  }
}

/**
 * Clears user session and resets to guest.
 */
export function clearStoredUser(): AuthUser {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(AUTH_USER_KEY)
    } catch (err) {
      console.warn("Failed to clear auth user:", err)
    }
  }
  const freshGuest = createGuestUser()
  saveStoredUser(freshGuest)
  return freshGuest
}

/**
 * Signs the user out from Supabase (if connected) and resets local session to guest.
 */
export async function logoutUser(): Promise<AuthUser> {
  const client = getSupabaseClient()
  if (client) {
    try {
      await client.auth.signOut()
    } catch (err) {
      console.warn("Supabase signOut error:", err)
    }
  }
  return clearStoredUser()
}

/**
 * Real / Service layer for user login.
 */
export async function loginWithCredentials(
  credentials: LoginCredentials
): Promise<AuthUser> {
  const client = getSupabaseClient()
  if (client) {
    const { data, error } = await client.auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password || "",
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes("invalid") || msg.includes("credentials") || error.status === 400) {
        throw new Error("INVALID_CREDENTIALS")
      }
      throw error
    }

    if (!data.user) {
      throw new Error("Login failed: no user returned")
    }

    const username =
      (data.user.user_metadata?.username as string) ||
      credentials.email.split("@")[0] ||
      "Shinobi"

    const timestamp = new Date().toISOString()
    const authenticatedUser: AuthUser = {
      id: data.user.id,
      username,
      email: data.user.email || credentials.email,
      isGuest: false,
      createdAt: data.user.created_at || timestamp,
      lastLoginAt: timestamp,
    }

    saveStoredUser(authenticatedUser)
    return authenticatedUser
  }

  // Offline / local development fallback
  await new Promise((resolve) => setTimeout(resolve, 500))

  const usernameFromEmail = credentials.email.split("@")[0] || "Shinobi"
  const timestamp = new Date().toISOString()
  const authenticatedUser: AuthUser = {
    id: `user_${Date.now()}`,
    username: usernameFromEmail,
    email: credentials.email,
    isGuest: false,
    createdAt: timestamp,
    lastLoginAt: timestamp,
  }

  saveStoredUser(authenticatedUser)
  return authenticatedUser
}

/**
 * Real / Service layer for user registration.
 */
export async function registerWithCredentials(
  credentials: RegisterCredentials
): Promise<AuthUser> {
  const trimmedUser = credentials.username.trim()
  if (!isValidUsername(trimmedUser)) {
    throw new Error("INVALID_USERNAME_FORMAT")
  }

  const client = getSupabaseClient()
  if (client) {
    const isAvailable = await checkUsernameAvailability(trimmedUser)
    if (!isAvailable) {
      throw new Error("USERNAME_TAKEN")
    }

    const { data, error } = await client.auth.signUp({
      email: credentials.email.trim(),
      password: credentials.password || "",
      options: {
        data: {
          username: trimmedUser,
        },
      },
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes("already registered") || msg.includes("already exists")) {
        throw new Error("EMAIL_EXISTS")
      }
      throw error
    }

    if (!data.user) {
      throw new Error("Registration failed: no user returned")
    }

    const timestamp = new Date().toISOString()
    const newUser: AuthUser = {
      id: data.user.id,
      username: trimmedUser,
      email: data.user.email || credentials.email.trim(),
      isGuest: false,
      createdAt: data.user.created_at || timestamp,
      lastLoginAt: timestamp,
    }

    saveStoredUser(newUser)
    return newUser
  }

  // Offline / local development fallback
  await new Promise((resolve) => setTimeout(resolve, 500))

  const timestamp = new Date().toISOString()
  const newUser: AuthUser = {
    id: `user_${Date.now()}`,
    username: trimmedUser,
    email: credentials.email.trim(),
    isGuest: false,
    createdAt: timestamp,
    lastLoginAt: timestamp,
  }

  saveStoredUser(newUser)
  return newUser
}
