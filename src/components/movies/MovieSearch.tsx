import { useState } from 'react'
import { useMovieSearch } from '../../hooks'
import { getPosterUrl } from '../../api/tmdb'
import { cn } from '../../lib/utils'

interface MovieSearchProps {
  existingMovieIds: string[]
}

export function MovieSearch({ existingMovieIds }: MovieSearchProps) {
  const {
    query,
    setQuery,
    results,
    isSearching,
    error,
    addMovie,
    isAdding,
    isTMDBConfigured,
  } = useMovieSearch(existingMovieIds)

  const [addingId, setAddingId] = useState<number | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  const handleAdd = async (tmdbId: number) => {
    setAddingId(tmdbId)
    setAddError(null)
    const result = await addMovie(tmdbId)
    if (!result.success) {
      setAddError(result.error || 'Failed to add movie')
    }
    setAddingId(null)
  }

  if (!isTMDBConfigured) {
    return (
      <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
        <p className="text-yellow-200 text-sm">
          TMDB API key not configured. Add <code className="px-1 bg-yellow-900/50 rounded">VITE_TMDB_API_KEY</code> to your environment.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a movie..."
          className="w-full px-4 py-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          autoFocus
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
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
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Error message */}
      {(error || addError) && (
        <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg text-red-300 text-sm">
          {error || addError}
        </div>
      )}

      {/* Search results */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((movie) => {
            const year = movie.release_date
              ? new Date(movie.release_date).getFullYear()
              : null
            const isThisAdding = addingId === movie.id

            return (
              <div
                key={movie.id}
                className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {/* Poster */}
                <div className="w-12 h-18 flex-shrink-0 rounded overflow-hidden bg-gray-700">
                  {movie.poster_path ? (
                    <img
                      src={getPosterUrl(movie.poster_path, 'w200') || ''}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{movie.title}</p>
                  {year && (
                    <p className="text-gray-400 text-sm">{year}</p>
                  )}
                </div>

                {/* Add button */}
                <button
                  onClick={() => handleAdd(movie.id)}
                  disabled={isAdding}
                  className={cn(
                    'flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    isThisAdding
                      ? 'bg-gray-700 text-gray-400 cursor-wait'
                      : 'bg-primary-600 text-white hover:bg-primary-500'
                  )}
                >
                  {isThisAdding ? (
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding
                    </span>
                  ) : (
                    'Add'
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {query && !isSearching && results.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          <p>No movies found for "{query}"</p>
        </div>
      )}

      {/* Initial state */}
      {!query && (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-600"
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
          <p>Search TMDB to add movies to the list</p>
        </div>
      )}
    </div>
  )
}
