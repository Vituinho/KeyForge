"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import {
  AuthUser,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
} from "@/types/auth"
import {
  saveStoredUser,
  createGuestUser,
  loginWithCredentials,
  registerWithCredentials,
  logoutUser,
  getStoredUser,
  refreshSessionUser,
} from "./authService"

const DEFAULT_GUEST: AuthUser = {
  id: "guest_initial",
  username: "Shinobi Warrior",
  isGuest: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  lastLoginAt: "2026-01-01T00:00:00.000Z",
}

const authListeners = new Set<() => void>()

function notifyAuthListeners() {
  authListeners.forEach((fn) => fn())
}

let cachedUser: AuthUser = DEFAULT_GUEST
let cachedRaw: string | null = null

function subscribe(callback: () => void) {
  authListeners.add(callback)

  const handleStorage = (e: StorageEvent) => {
    if (e.key === "keyforge_auth_user") {
      notifyAuthListeners()
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage)
  }

  return () => {
    authListeners.delete(callback)
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage)
    }
  }
}

function getSnapshot(): AuthUser {
  if (typeof window === "undefined") return DEFAULT_GUEST
  try {
    const raw = localStorage.getItem("keyforge_auth_user")
    if (raw !== cachedRaw || cachedUser === DEFAULT_GUEST) {
      cachedUser = getStoredUser()
      cachedRaw = localStorage.getItem("keyforge_auth_user")
    }
  } catch {
    cachedUser = DEFAULT_GUEST
  }
  return cachedUser
}

function getServerSnapshot(): AuthUser {
  return DEFAULT_GUEST
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthUser>
  register: (credentials: RegisterCredentials) => Promise<AuthUser>
  loginAsGuest: (customUsername?: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cookies are verified by the backend on hydration and when this tab regains focus.
  useEffect(()=>{
    let active=true
    const refresh=()=>{void refreshSessionUser().then(()=>{if(active) notifyAuthListeners()}).catch(()=>{})}
    refresh();window.addEventListener('focus',refresh)
    return()=>{active=false;window.removeEventListener('focus',refresh)}
  },[])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)
    try {
      const loggedUser = await loginWithCredentials(credentials)
      notifyAuthListeners()
      return loggedUser
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log in"
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsLoading(true)
    setError(null)
    try {
      const newUser = await registerWithCredentials(credentials)
      notifyAuthListeners()
      return newUser
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register"
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loginAsGuest = useCallback((customUsername?: string) => {
    if(!getStoredUser().isGuest) {
      void logoutUser().then(()=>{
        saveStoredUser(createGuestUser(customUsername));notifyAuthListeners();setError(null)
      }).catch(()=>setError('AUTH_UNAVAILABLE'))
      return
    }
    const guest = createGuestUser(customUsername)
    saveStoredUser(guest)
    notifyAuthListeners()
    setError(null)
  }, [])

  const logout = useCallback(async () => {
    try { await logoutUser() } finally { notifyAuthListeners() }
  }, [])

  const value: AuthContextValue = {
    user,
    isAuthenticated: !user.isGuest,
    isGuest: user.isGuest,
    isLoading,
    error,
    login,
    register,
    loginAsGuest,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
