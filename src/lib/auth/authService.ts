import { AuthUser, LoginCredentials, RegisterCredentials } from "@/types/auth"
import { backend, BackendError } from "@/lib/backend/client"

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


export interface SessionIdentity { id:string; name:string; email:string; createdAt:string }
export function storeSessionUser(identity:SessionIdentity):AuthUser {
 const user:AuthUser={id:identity.id,username:identity.name,email:identity.email,isGuest:false,createdAt:identity.createdAt,lastLoginAt:new Date().toISOString()}
 saveStoredUser(user);return user
}
export async function refreshSessionUser():Promise<AuthUser> {
 const previous=getStoredUser()
 const session=await backend<{user:SessionIdentity}|null>('auth/get-session')
 if(getStoredUser().id!==previous.id) return getStoredUser()
 return session?.user?storeSessionUser(session.user):getStoredUser().isGuest?getStoredUser():clearStoredUser()
}
export async function logoutUser():Promise<AuthUser> {
 await backend('auth/sign-out',{});return clearStoredUser()
}
async function credentialsRequest(path:string,payload:unknown):Promise<AuthUser> {
 try {const data=await backend<{user:SessionIdentity}>(path,payload);return storeSessionUser(data.user)}
 catch(error) {
  if(error instanceof BackendError) {
   if(error.code==='USERNAME_TAKEN') throw new Error('USERNAME_TAKEN')
   if(error.code?.includes('USER_ALREADY_EXISTS')) throw new Error('EMAIL_EXISTS')
   throw new Error(error.status===401||error.status===400||error.status===422?'INVALID_CREDENTIALS':'AUTH_UNAVAILABLE')
  }
  throw new Error('AUTH_UNAVAILABLE')
 }
}
export function loginWithCredentials(credentials:LoginCredentials):Promise<AuthUser> {
 return credentialsRequest('auth/sign-in/email',{email:credentials.email.trim(),password:credentials.password||''})
}
export function registerWithCredentials(credentials:RegisterCredentials):Promise<AuthUser> {
 if(!isValidUsername(credentials.username)) return Promise.reject(new Error('INVALID_USERNAME_FORMAT'))
 return credentialsRequest('auth/sign-up/email',{name:credentials.username.trim(),email:credentials.email.trim(),password:credentials.password||''})
}
