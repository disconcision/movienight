import { useCurrentUser, useMovies, useUsers } from './hooks'
import { UserIdentityModal, UserBadge } from './components/user'
import { MovieGrid } from './components/movies'
import { countUnseenBy } from './lib/priority'

function App() {
  const {
    localUser,
    isLoading: isUserLoading,
    login,
    logout,
    isFirebaseConnected,
  } = useCurrentUser()

  const { movies, isLoading: isMoviesLoading, isUsingMockData } = useMovies()
  const { users } = useUsers()

  // Show login modal if no user
  const showLoginModal = !isUserLoading && !localUser

  // Calculate unseen counts per movie
  const unseenCountByMovie = new Map<string, number>()
  movies.forEach((movie) => {
    unseenCountByMovie.set(movie.tmdbId, countUnseenBy(movie.tmdbId, users))
  })

  // Get current user's unseen movies
  const currentUserFirestore = users.find(
    (u) => u.name.toLowerCase() === localUser?.name.toLowerCase()
  )
  const userUnseenMovies = currentUserFirestore?.unseenMovies || []

  const handleToggleUnseen = (movieId: string) => {
    // TODO: Implement toggle unseen functionality with Firestore
    console.log('Toggle unseen:', movieId)
  }

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

      {/* Main content */}
      <main className="max-w-7xl mx-auto">
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
                  Firebase is not configured. To connect to your database, create a{' '}
                  <code className="px-1 py-0.5 bg-yellow-900/50 rounded">.env.local</code> file
                  with your Firebase credentials. See{' '}
                  <code className="px-1 py-0.5 bg-yellow-900/50 rounded">claude.md</code> for
                  setup instructions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Movie grid */}
        <MovieGrid
          movies={movies}
          userUnseenMovies={userUnseenMovies}
          unseenCountByMovie={unseenCountByMovie}
          onToggleUnseen={localUser ? handleToggleUnseen : undefined}
          isLoading={isMoviesLoading}
        />
      </main>

      {/* Login modal */}
      <UserIdentityModal isOpen={showLoginModal} onLogin={login} />
    </div>
  )
}

export default App
