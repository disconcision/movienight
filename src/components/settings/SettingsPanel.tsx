import { useState, useEffect } from 'react'
import { deleteUser, deleteMovie, clearAllMovies, clearAllEvents } from '../../db/admin'
import type { Movie, User } from '../../types'
import { cn } from '../../lib/utils'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  users: User[]
  movies: Movie[]
  currentUserName: string | null
  isFirebaseConnected: boolean
}

export function SettingsPanel({
  isOpen,
  onClose,
  users,
  movies,
  currentUserName,
  isFirebaseConnected,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'movies' | 'danger'>('users')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleDeleteUser = async (userName: string) => {
    if (!confirm(`Delete user "${userName}"? This will remove their unseen list and availability.`)) {
      return
    }

    setIsDeleting(userName)
    try {
      await deleteUser(userName)
      setMessage({ type: 'success', text: `Deleted user "${userName}"` })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete user' })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleDeleteMovie = async (movie: Movie) => {
    if (!confirm(`Remove "${movie.title}" from the movie list?`)) {
      return
    }

    setIsDeleting(movie.tmdbId)
    try {
      await deleteMovie(movie.tmdbId)
      setMessage({ type: 'success', text: `Removed "${movie.title}"` })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete movie' })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleClearAllMovies = async () => {
    if (!confirm('Delete ALL movies? This cannot be undone!')) {
      return
    }
    if (!confirm('Are you absolutely sure? Type "yes" in the next prompt to confirm.')) {
      return
    }

    setIsDeleting('all-movies')
    try {
      const count = await clearAllMovies()
      setMessage({ type: 'success', text: `Cleared ${count} movies` })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to clear movies' })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleClearAllEvents = async () => {
    if (!confirm('Delete ALL scheduled events? This cannot be undone!')) {
      return
    }

    setIsDeleting('all-events')
    try {
      const count = await clearAllEvents()
      setMessage({ type: 'success', text: `Cleared ${count} events` })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to clear events' })
    } finally {
      setIsDeleting(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={cn(
            'mx-4 mt-4 p-3 rounded-lg text-sm',
            message.type === 'success'
              ? 'bg-green-900/30 border border-green-700/50 text-green-300'
              : 'bg-red-900/30 border border-red-700/50 text-red-300'
          )}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(['users', 'movies', 'danger'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {tab === 'users' && 'Users'}
              {tab === 'movies' && 'Movies'}
              {tab === 'danger' && '⚠️ Danger'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!isFirebaseConnected ? (
            <div className="text-center py-8 text-gray-500">
              <p>Settings require Firebase to be connected.</p>
            </div>
          ) : (
            <>
              {/* Users tab */}
              {activeTab === 'users' && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 mb-4">
                    Delete test users or users who are no longer participating.
                  </p>
                  {users.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No users found</p>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.name}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                      >
                        <div>
                          <span className="text-gray-200">{user.name}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            {user.unseenMovies.length} movies
                          </span>
                          {user.name.toLowerCase() === currentUserName?.toLowerCase() && (
                            <span className="ml-2 text-xs text-primary-400">(you)</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteUser(user.name)}
                          disabled={isDeleting === user.name}
                          className={cn(
                            'px-2 py-1 text-xs rounded',
                            isDeleting === user.name
                              ? 'bg-gray-700 text-gray-500'
                              : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                          )}
                        >
                          {isDeleting === user.name ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Movies tab */}
              {activeTab === 'movies' && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 mb-4">
                    Remove movies from the shared list.
                  </p>
                  {movies.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No movies found</p>
                  ) : (
                    movies.map((movie) => (
                      <div
                        key={movie.tmdbId}
                        className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {movie.posterPath && (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                              alt=""
                              className="w-8 h-12 rounded object-cover"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-gray-200 truncate">{movie.title}</p>
                            <p className="text-xs text-gray-500">{movie.year}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMovie(movie)}
                          disabled={isDeleting === movie.tmdbId}
                          className={cn(
                            'px-2 py-1 text-xs rounded flex-shrink-0',
                            isDeleting === movie.tmdbId
                              ? 'bg-gray-700 text-gray-500'
                              : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                          )}
                        >
                          {isDeleting === movie.tmdbId ? '...' : 'Remove'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Danger zone tab */}
              {activeTab === 'danger' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                    <h3 className="text-red-400 font-medium mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      These actions cannot be undone. Use with caution.
                    </p>

                    <div className="space-y-3">
                      <button
                        onClick={handleClearAllEvents}
                        disabled={isDeleting === 'all-events'}
                        className="w-full px-4 py-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 disabled:opacity-50"
                      >
                        {isDeleting === 'all-events' ? 'Clearing...' : 'Clear All Events'}
                      </button>

                      <button
                        onClick={handleClearAllMovies}
                        disabled={isDeleting === 'all-movies'}
                        className="w-full px-4 py-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 disabled:opacity-50"
                      >
                        {isDeleting === 'all-movies' ? 'Clearing...' : 'Clear All Movies'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
