import { useState, useEffect } from 'react'
import type { Movie } from '../types'
import { subscribeToMovies } from '../db/movies'
import { isFirebaseConfigured } from '../db/firebase'
import { MOCK_MOVIES } from '../lib/mockData'

interface UseMoviesResult {
  movies: Movie[]
  isLoading: boolean
  error: Error | null
  isUsingMockData: boolean
}

/**
 * Hook to subscribe to the movies collection.
 * Falls back to mock data when Firebase is not configured.
 */
export function useMovies(): UseMoviesResult {
  const [movies, setMovies] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Use mock data
      setMovies(MOCK_MOVIES)
      setIsLoading(false)
      return
    }

    // Subscribe to Firestore
    const unsubscribe = subscribeToMovies(
      (updatedMovies) => {
        setMovies(updatedMovies.length > 0 ? updatedMovies : MOCK_MOVIES)
        setIsLoading(false)
      },
      (err) => {
        setError(err)
        setIsLoading(false)
        // Fall back to mock data on error
        setMovies(MOCK_MOVIES)
      }
    )

    return unsubscribe
  }, [])

  return {
    movies,
    isLoading,
    error,
    isUsingMockData: !isFirebaseConfigured || movies === MOCK_MOVIES,
  }
}
