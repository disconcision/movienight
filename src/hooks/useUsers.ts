import { useState, useEffect } from 'react'
import type { User } from '../types'
import { subscribeToUsers } from '../db/users'
import { isFirebaseConfigured } from '../db/firebase'

interface UseUsersResult {
  users: User[]
  isLoading: boolean
  error: Error | null
}

/**
 * Hook to subscribe to the users collection.
 */
export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false)
      return
    }

    const unsubscribe = subscribeToUsers(
      (updatedUsers) => {
        setUsers(updatedUsers)
        setIsLoading(false)
      },
      (err) => {
        setError(err)
        setIsLoading(false)
      }
    )

    return unsubscribe
  }, [])

  return {
    users,
    isLoading,
    error,
  }
}
