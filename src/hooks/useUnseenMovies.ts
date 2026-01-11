import { useState, useCallback, useEffect } from 'react'
import { updateUserUnseenMovies } from '../db/users'
import { isFirebaseConfigured } from '../db/firebase'
import type { User } from '../types'
import { debounce } from '../lib/utils'

interface UseUnseenMoviesResult {
  unseenMovies: string[]
  toggleUnseen: (movieId: string) => void
  reorderUnseenMovies: (newOrder: string[]) => void
  isUpdating: boolean
}

/**
 * Hook to manage the current user's unseen movies list.
 * Handles both local state and Firestore synchronization.
 */
export function useUnseenMovies(
  userName: string | null,
  firestoreUser: User | null
): UseUnseenMoviesResult {
  // Local state for unseen movies (used in both mock and connected modes)
  const [localUnseenMovies, setLocalUnseenMovies] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)

  // Sync with Firestore user when it changes
  useEffect(() => {
    if (firestoreUser) {
      setLocalUnseenMovies(firestoreUser.unseenMovies)
    }
  }, [firestoreUser])

  // Persist to localStorage for mock mode
  useEffect(() => {
    if (!isFirebaseConfigured && userName) {
      const key = `movieNightUnseen_${userName.toLowerCase()}`
      const stored = localStorage.getItem(key)
      if (stored) {
        try {
          setLocalUnseenMovies(JSON.parse(stored))
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [userName])

  // Save to localStorage (mock mode) or Firestore (connected mode)
  const saveUnseenMovies = useCallback(
    async (movies: string[]) => {
      if (!userName) return

      if (isFirebaseConfigured) {
        setIsUpdating(true)
        try {
          await updateUserUnseenMovies(userName, movies)
        } catch (error) {
          console.error('Failed to update unseen movies:', error)
        } finally {
          setIsUpdating(false)
        }
      } else {
        // Mock mode: save to localStorage
        const key = `movieNightUnseen_${userName.toLowerCase()}`
        localStorage.setItem(key, JSON.stringify(movies))
      }
    },
    [userName]
  )

  // Debounced save for reordering
  const debouncedSave = useCallback(
    debounce((movies: string[]) => {
      saveUnseenMovies(movies)
    }, 500),
    [saveUnseenMovies]
  )

  const toggleUnseen = useCallback(
    (movieId: string) => {
      setLocalUnseenMovies((prev) => {
        const newList = prev.includes(movieId)
          ? prev.filter((id) => id !== movieId)
          : [...prev, movieId]

        // Save immediately for toggles
        saveUnseenMovies(newList)
        return newList
      })
    },
    [saveUnseenMovies]
  )

  const reorderUnseenMovies = useCallback(
    (newOrder: string[]) => {
      setLocalUnseenMovies(newOrder)
      // Debounced save for reordering
      debouncedSave(newOrder)
    },
    [debouncedSave]
  )

  return {
    unseenMovies: localUnseenMovies,
    toggleUnseen,
    reorderUnseenMovies,
    isUpdating,
  }
}
