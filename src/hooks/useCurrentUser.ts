import { useState, useEffect, useCallback } from 'react'
import type { LocalUser, User } from '../types'
import { createUser, getUser, isUsernameAvailable } from '../db/users'
import { isFirebaseConfigured } from '../db/firebase'

const LOCAL_STORAGE_KEY = 'movieNightUser'

interface UseCurrentUserResult {
  localUser: LocalUser | null
  firestoreUser: User | null
  isLoading: boolean
  error: string | null
  login: (name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isFirebaseConnected: boolean
}

/**
 * Hook to manage the current user's identity.
 * Handles localStorage persistence and Firestore sync.
 */
export function useCurrentUser(): UseCurrentUserResult {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null)
  const [firestoreUser, setFirestoreUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LocalUser
        setLocalUser(parsed)
      } catch {
        localStorage.removeItem(LOCAL_STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  // Sync with Firestore when local user changes
  useEffect(() => {
    if (!localUser || !isFirebaseConfigured) {
      setFirestoreUser(null)
      return
    }

    const syncUser = async () => {
      try {
        const user = await getUser(localUser.name)
        setFirestoreUser(user)
      } catch (err) {
        console.error('Failed to sync user with Firestore:', err)
      }
    }

    syncUser()
  }, [localUser])

  const login = useCallback(async (name: string): Promise<{ success: boolean; error?: string }> => {
    setError(null)
    const trimmedName = name.trim()

    // Check if username is available (if Firebase is configured)
    if (isFirebaseConfigured) {
      const available = await isUsernameAvailable(trimmedName)
      if (!available) {
        // Username exists, try to get the existing user
        const existingUser = await getUser(trimmedName)
        if (existingUser) {
          // User exists, log them in
          const newLocalUser: LocalUser = { name: existingUser.name }
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newLocalUser))
          setLocalUser(newLocalUser)
          setFirestoreUser(existingUser)
          return { success: true }
        }
      } else {
        // Create new user
        try {
          const newUser = await createUser(trimmedName)
          const newLocalUser: LocalUser = { name: newUser.name }
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newLocalUser))
          setLocalUser(newLocalUser)
          setFirestoreUser(newUser)
          return { success: true }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to create user'
          setError(message)
          return { success: false, error: message }
        }
      }
    }

    // Mock mode or fallback - just save locally
    const newLocalUser: LocalUser = { name: trimmedName }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newLocalUser))
    setLocalUser(newLocalUser)
    return { success: true }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    setLocalUser(null)
    setFirestoreUser(null)
    setError(null)
  }, [])

  return {
    localUser,
    firestoreUser,
    isLoading,
    error,
    login,
    logout,
    isFirebaseConnected: isFirebaseConfigured,
  }
}
