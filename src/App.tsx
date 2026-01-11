import { useState } from 'react'
import { useCurrentUser, useMovies, useUsers, useUnseenMovies } from './hooks'
import { UserIdentityModal, UserBadge } from './components/user'
import { MovieGrid, UnseenList } from './components/movies'
import { countUnseenBy } from './lib/priority'
import { cn } from './lib/utils'

type Tab = 'movies' | 'my-list'

function App() {
  const {
    localUser,
    firestoreUser,
    isLoading: isUserLoading,
    login,
    logout,
    isFirebaseConnected,
  } = useCurrentUser()

  const { movies, isLoading: isMoviesLoading, isUsingMockData } = useMovies()
  const { users } = useUsers()

  // Unseen movies management
  const { unseenMovies, toggleUnseen, reorderUnseenMovies } = useUnseenMovies(
    localUser?.name ?? null,
    firestoreUser
  )

  // Mobile tab state
  const [activeTab, setActiveTab] = useState<Tab>('movies')

  // Show login modal if no user
  const showLoginModal = !isUserLoading && !localUser

  // Calculate unseen counts per movie (combining Firestore users and local data)
  const unseenCountByMovie = new Map<string, number>()
  movies.forEach((movie) => {
    // Count from Firestore users
    let count = countUnseenBy(movie.tmdbId, users)
    // Add current user if they have it in their local list and not in Firestore
    const currentUserInFirestore = users.some(
      (u) => u.name.toLowerCase() === localUser?.name.toLowerCase()
    )
    if (!currentUserInFirestore && unseenMovies.includes(movie.tmdbId)) {
      count += 1
    }
    unseenCountByMovie.set(movie.tmdbId, count)
  })

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/popcorn.svg" alt="" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-white">Movie Night</h1>
              {isUsingMockData && (
                <p className="text-xs text-yellow-400">Demo mode - using sample data</p>
              )}
            </div>
          </div>

          {localUser && (
            <UserBadge
              name={localUser.name}
              onLogout={logout}
              isFirebaseConnected={isFirebaseConnected}
            />
          )}
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="md:hidden sticky top-[73px] z-30 bg-gray-900 border-b border-gray-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab('movies')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === 'movies'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-400'
            )}
          >
            All Movies
          </button>
          <button
            onClick={() => setActiveTab('my-list')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors relative',
              activeTab === 'my-list'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-400'
            )}
          >
            My List
            {unseenMovies.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary-600 text-white rounded-full">
                {unseenMovies.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto flex">
        {/* Movie grid - full width on mobile when active, left side on desktop */}
        <div
          className={cn(
            'flex-1',
            activeTab !== 'movies' && 'hidden md:block'
          )}
        >
          {/* Info banner when using mock data */}
          {isUsingMockData && (
            <div className="mx-4 mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-yellow-200 font-medium">Running in demo mode</p>
                  <p className="text-yellow-300/70 text-sm mt-1">
                    Firebase is not configured. Your selections are saved locally.
                    See <code className="px-1 py-0.5 bg-yellow-900/50 rounded">claude.md</code> for
                    setup instructions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Movie grid */}
          <MovieGrid
            movies={movies}
            userUnseenMovies={unseenMovies}
            unseenCountByMovie={unseenCountByMovie}
            onToggleUnseen={localUser ? toggleUnseen : undefined}
            isLoading={isMoviesLoading}
          />
        </div>

        {/* Sidebar - hidden on mobile unless active, right side on desktop */}
        <aside
          className={cn(
            'w-full md:w-80 md:border-l border-gray-800 md:sticky md:top-[73px] md:h-[calc(100vh-73px)] overflow-y-auto',
            activeTab !== 'my-list' && 'hidden md:block'
          )}
        >
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              My Priority List
              {unseenMovies.length > 0 && (
                <span className="text-sm font-normal text-gray-400">
                  ({unseenMovies.length} movies)
                </span>
              )}
            </h2>

            {localUser ? (
              <UnseenList
                movies={movies}
                unseenMovieIds={unseenMovies}
                onReorder={reorderUnseenMovies}
                onRemove={toggleUnseen}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Enter your name to start tracking movies</p>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Login modal */}
      <UserIdentityModal isOpen={showLoginModal} onLogin={login} />
    </div>
  )
}

export default App
