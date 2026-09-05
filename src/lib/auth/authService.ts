import { AuthUser, LoginCredentials, RegisterCredentials } from "@/types/auth"

const AUTH_USER_KEY = "keyforge_auth_user"

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
 * Mock / Service layer for user login.
 * Prepared for future Cloud Backend (e.g. Supabase Auth / NextAuth).
 */
export async function loginWithCredentials(
  credentials: LoginCredentials
): Promise<AuthUser> {
  // Simulate asynchronous network roundtrip
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
 * Mock / Service layer for user registration.
 * Prepared for future Cloud Backend.
 */
export async function registerWithCredentials(
  credentials: RegisterCredentials
): Promise<AuthUser> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const timestamp = new Date().toISOString()
  const newUser: AuthUser = {
    id: `user_${Date.now()}`,
    username: credentials.username.trim(),
    email: credentials.email.trim(),
    isGuest: false,
    createdAt: timestamp,
    lastLoginAt: timestamp,
  }

  saveStoredUser(newUser)
  return newUser
}
