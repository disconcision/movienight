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
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] bg-gray-800 rounded-xl animate-pulse"
          />
        ))}
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

  const unseenSet = new Set(userUnseenMovies)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
      {movies.map((movie) => (
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
  )
}
