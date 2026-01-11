import { useState, useCallback } from 'react'
import type { TMDBSearchResult } from '../types'
import { searchMovies, getMovieDetails, tmdbToMovie, isTMDBConfigured } from '../api/tmdb'
import { saveMovie, getMovie } from '../db/movies'
import { isFirebaseConfigured } from '../db/firebase'
import { debounce } from '../lib/utils'

interface UseMovieSearchResult {
  query: string
  setQuery: (query: string) => void
  results: TMDBSearchResult[]
  isSearching: boolean
  error: string | null
  addMovie: (tmdbId: number) => Promise<{ success: boolean; error?: string }>
  isAdding: boolean
  isTMDBConfigured: boolean
}

/**
 * Hook for searching TMDB and adding movies to the list
 */
export function useMovieSearch(existingMovieIds: string[]): UseMovieSearchResult {
  const [query, setQueryState] = useState('')
  const [results, setResults] = useState<TMDBSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        setIsSearching(false)
        return
      }

      if (!isTMDBConfigured) {
        setError('TMDB API key not configured')
        setIsSearching(false)
        return
      }

      try {
        const searchResults = await searchMovies(searchQuery)
        // Filter out movies already in the list
        const filtered = searchResults.filter(
          (r) => !existingMovieIds.includes(String(r.id))
        )
        setResults(filtered)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300),
    [existingMovieIds]
  )

  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery)
      if (newQuery.trim()) {
        setIsSearching(true)
        performSearch(newQuery)
      } else {
        setResults([])
      }
    },
    [performSearch]
  )

  const addMovie = useCallback(
    async (tmdbId: number): Promise<{ success: boolean; error?: string }> => {
      if (!isFirebaseConfigured) {
        return { success: false, error: 'Firebase not configured' }
      }

      setIsAdding(true)
      try {
        // Check if movie already exists in Firestore
        const existing = await getMovie(String(tmdbId))
        if (existing) {
          return { success: true } // Already added
        }

        // Fetch full movie details from TMDB
        const details = await getMovieDetails(tmdbId)
        if (!details) {
          return { success: false, error: 'Movie not found' }
        }

        // Convert to our Movie type and save
        const movie = tmdbToMovie(details)
        await saveMovie(movie)

        // Remove from search results
        setResults((prev) => prev.filter((r) => r.id !== tmdbId))

        return { success: true }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add movie'
        return { success: false, error: message }
      } finally {
        setIsAdding(false)
      }
    },
    []
  )

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    addMovie,
    isAdding,
    isTMDBConfigured,
  }
}
