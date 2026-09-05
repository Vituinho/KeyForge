/**
 * KeyForge Authentication Types
 * Designed for decoupled authentication architecture with guest mode as a first-class citizen.
 * Passwords are NEVER stored in localStorage or client-side plain text.
 */

export interface AuthUser {
  id: string
  username: string
  email?: string
  isGuest: boolean
  createdAt: string
  lastLoginAt: string
}

export interface AuthState {
  user: AuthUser
  isAuthenticated: boolean
  isGuest: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password?: string
}

export interface RegisterCredentials {
  username: string
  email: string
  password?: string
}
