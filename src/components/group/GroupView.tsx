import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { User, Movie } from '../../types'
import { getIntersectionWithScores } from '../../lib/priority'
import { getPosterUrl, getImdbUrl } from '../../lib/mockData'
import { cn } from '../../lib/utils'

interface GroupViewProps {
  users: User[]
  movies: Movie[]
  currentUserName: string | null
}

interface UserListItemProps {
  user: User
  movies: Movie[]
  isExpanded: boolean
  onToggle: () => void
  isCurrentUser: boolean
}

function UserListItem({ user, movies, isExpanded, onToggle, isCurrentUser }: UserListItemProps) {
  const movieMap = useMemo(
    () => new Map(movies.map((m) => [m.tmdbId, m])),
    [movies]
  )

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 hover:bg-gray-750 transition-colors"
      >
        {/* Avatar */}
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-white font-medium',
          isCurrentUser ? 'bg-primary-600' : 'bg-gray-600'
        )}>
          {user.name.charAt(0).toUpperCase()}
        </div>

        {/* Name and count */}
        <div className="flex-1 text-left">
          <p className={cn(
            'font-medium',
            isCurrentUser ? 'text-primary-300' : 'text-gray-200'
          )}>
            {user.name}
            {isCurrentUser && <span className="text-xs ml-2 text-gray-400">(you)</span>}
          </p>
          <p className="text-sm text-gray-500">
            {user.unseenMovies.length} unseen movies
          </p>
        </div>

        {/* Expand icon */}
        <svg
          className={cn(
            'w-5 h-5 text-gray-400 transition-transform',
            isExpanded && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded movie list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-2">
              {user.unseenMovies.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No movies selected</p>
              ) : (
                user.unseenMovies.slice(0, 10).map((movieId, index) => {
                  const movie = movieMap.get(movieId)
                  if (!movie) return null
                  return (
                    <div
                      key={movieId}
                      className="flex items-center gap-3 py-1"
                    >
                      <span className="text-xs text-primary-400 w-5 text-right font-bold">
                        {index + 1}
                      </span>
                      <img
                        src={getPosterUrl(movie.posterPath, 'w185')}
                        alt=""
                        className="w-8 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">{movie.title}</p>
                        <p className="text-xs text-gray-500">{movie.year}</p>
                      </div>
                    </div>
                  )
                })
              )}
              {user.unseenMovies.length > 10 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  +{user.unseenMovies.length - 10} more
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function GroupView({ users, movies, currentUserName }: GroupViewProps) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  // Calculate intersection with scores
  const intersectionMovies = useMemo(
    () => getIntersectionWithScores(users, movies),
    [users, movies]
  )

  // Max score for relative bar sizing
  const maxScore = intersectionMovies.length > 0
    ? Math.max(...intersectionMovies.map((m) => m.score))
    : 0

  if (users.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm font-medium">No one here yet</p>
          <p className="text-xs text-gray-600 mt-1">
            Be the first to join and select some movies!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Group members section */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Group Members ({users.length})
        </h3>
        <div className="space-y-2">
          {users.map((user) => (
            <UserListItem
              key={user.name}
              user={user}
              movies={movies}
              isExpanded={expandedUser === user.name}
              onToggle={() => setExpandedUser(
                expandedUser === user.name ? null : user.name
              )}
              isCurrentUser={user.name.toLowerCase() === currentUserName?.toLowerCase()}
            />
          ))}
        </div>
      </section>

      {/* Intersection section */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Everyone's Unseen ({intersectionMovies.length})
        </h3>

        {intersectionMovies.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400">No movies that everyone hasn't seen yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Add more movies to your lists to find common ones!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {intersectionMovies.slice(0, 10).map((item, index) => {
              const imdbUrl = getImdbUrl(item.movie.imdbId)
              return (
                <motion.div
                  key={item.movieId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-colors cursor-pointer"
                  onClick={() => imdbUrl && window.open(imdbUrl, '_blank', 'noopener,noreferrer')}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <span className={cn(
                      'text-lg font-bold w-6 text-center',
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-amber-600' :
                      'text-gray-500'
                    )}>
                      {index + 1}
                    </span>

                    {/* Poster */}
                    <img
                      src={getPosterUrl(item.movie.posterPath, 'w185')}
                      alt=""
                      className="w-12 h-18 object-cover rounded"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-200 truncate">
                        {item.movie.title}
                      </p>
                      <p className="text-sm text-gray-500">{item.movie.year}</p>

                      {/* Priority score bar */}
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${(item.score / maxScore) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{item.score}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
            {intersectionMovies.length > 10 && (
              <p className="text-xs text-gray-500 text-center pt-2">
                +{intersectionMovies.length - 10} more movies everyone wants to see
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
