import { useState, useMemo } from 'react'
import type { Movie } from '../../types'
import { MovieCard } from './MovieCard'

interface MovieGridProps {
  movies: Movie[]
  userUnseenMovies?: string[]
  unseenCountByMovie?: Map<string, number>
  onToggleUnseen?: (movieId: string) => void
  isLoading?: boolean
}

export function MovieGrid({
  movies,
  userUnseenMovies = [],
  unseenCountByMovie = new Map(),
  onToggleUnseen,
  isLoading = false,
}: MovieGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'unseen' | 'seen'>('all')

  // Filter and sort movies (default: by rating descending)
  const filteredMovies = useMemo(() => {
    const unseenSet = new Set(userUnseenMovies)
    let result = [...movies]

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (movie) =>
          movie.title.toLowerCase().includes(query) ||
          movie.year.toString().includes(query) ||
          movie.director?.toLowerCase().includes(query) ||
          movie.genres.some((g) => g.toLowerCase().includes(query))
      )
    }

    // Apply filter mode
    if (filterMode === 'unseen') {
      result = result.filter((movie) => unseenSet.has(movie.tmdbId))
    } else if (filterMode === 'seen') {
      result = result.filter((movie) => !unseenSet.has(movie.tmdbId))
    }

    // Sort by rating (highest first)
    result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))

    return result
  }, [movies, searchQuery, filterMode, userUnseenMovies])

  const unseenSet = new Set(userUnseenMovies)

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg
          className="w-16 h-16 mb-4 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
          />
        </svg>
        <p className="text-lg font-medium">No movies yet</p>
        <p className="text-sm text-gray-500 mt-1">Add some movies to get started</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movies..."
            className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(['all', 'unseen', 'seen'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterMode === mode
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {mode === 'all' && 'All'}
              {mode === 'unseen' && "Haven't Seen"}
              {mode === 'seen' && 'Seen'}
            </button>
          ))}
        </div>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {filteredMovies.length === movies.length
            ? `${movies.length} movies`
            : `${filteredMovies.length} of ${movies.length} movies`}
        </span>
        {(searchQuery || filterMode !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('')
              setFilterMode('all')
            }}
            className="text-primary-400 hover:text-primary-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Movie grid */}
      {filteredMovies.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No movies match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie.tmdbId}
              movie={movie}
              isUnseen={unseenSet.has(movie.tmdbId)}
              unseenCount={unseenCountByMovie.get(movie.tmdbId) || 0}
              onToggleUnseen={
                onToggleUnseen ? () => onToggleUnseen(movie.tmdbId) : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
