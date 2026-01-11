import { useState, useMemo } from 'react'
import { useCurrentUser, useMovies, useUsers, useUnseenMovies } from './hooks'
import { UserIdentityModal, UserBadge } from './components/user'
import { MovieGrid, UnseenList } from './components/movies'
import { GroupView } from './components/group'
import { countUnseenBy } from './lib/priority'
import { cn } from './lib/utils'
import type { User, Movie } from './types'

type Tab = 'movies' | 'my-list' | 'group'

function App() {
  const {
    localUser,
    isLoading: isUserLoading,
    login,
    logout,
    isFirebaseConnected,
  } = useCurrentUser()

  const { movies, isLoading: isMoviesLoading } = useMovies()
  const { users: firestoreUsers } = useUsers()

  // Get the current user from the real-time users subscription
  // This ensures we get real-time updates when other devices modify our list
  const currentUserFromSubscription = useMemo(() => {
    if (!localUser) return null
    return firestoreUsers.find(
      (u) => u.name.toLowerCase() === localUser.name.toLowerCase()
    ) ?? null
  }, [firestoreUsers, localUser])

  // Unseen movies management - use real-time subscription data
  const { unseenMovies, toggleUnseen, reorderUnseenMovies } = useUnseenMovies(
    localUser?.name ?? null,
    currentUserFromSubscription
  )

  // Mobile tab state
  const [activeTab, setActiveTab] = useState<Tab>('movies')

  // Show login modal if no user
  const showLoginModal = !isUserLoading && !localUser

  // Combine Firestore users with local user for display
  const allUsers = useMemo(() => {
    const currentUserInFirestore = firestoreUsers.some(
      (u) => u.name.toLowerCase() === localUser?.name.toLowerCase()
    )

    if (!localUser || currentUserInFirestore) {
      return firestoreUsers
    }

    // Add local user to the list for demo mode
    const localUserData: User = {
      name: localUser.name,
      unseenMovies: unseenMovies,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    return [...firestoreUsers, localUserData]
  }, [firestoreUsers, localUser, unseenMovies])

  // Calculate unseen counts per movie
  const unseenCountByMovie = useMemo(() => {
    const counts = new Map<string, number>()
    movies.forEach((movie) => {
      counts.set(movie.tmdbId, countUnseenBy(movie.tmdbId, allUsers))
    })
    return counts
  }, [movies, allUsers])

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎬</span>
            <div>
              <h1 className="text-xl font-bold text-white">Movie Night</h1>
              {!isFirebaseConnected && (
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
            Movies
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
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-600 text-white rounded-full">
                {unseenMovies.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === 'group'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-400'
            )}
          >
            Group
            {allUsers.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-700 text-gray-300 rounded-full">
                {allUsers.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto flex">
        {/* Movie grid - full width on mobile when active, center on desktop */}
        <div
          className={cn(
            'flex-1 min-w-0',
            activeTab !== 'movies' && 'hidden md:block'
          )}
        >
          {/* Info banner when Firebase not configured */}
          {!isFirebaseConnected && (
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

        {/* Right sidebar - My List on desktop, full screen on mobile */}
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
                  ({unseenMovies.length})
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

        {/* Group view - only visible on mobile when active */}
        <div
          className={cn(
            'w-full md:hidden',
            activeTab !== 'group' && 'hidden'
          )}
        >
          <GroupView
            users={allUsers}
            movies={movies}
            currentUserName={localUser?.name ?? null}
          />
        </div>
      </main>

      {/* Desktop: Group view as a collapsible panel or modal could be added later */}
      {/* For now, we show group info in a bottom sheet on desktop */}
      <div className="hidden md:block fixed bottom-4 right-4 z-30">
        <GroupPanel
          users={allUsers}
          movies={movies}
          currentUserName={localUser?.name ?? null}
        />
      </div>

      {/* Login modal */}
      <UserIdentityModal isOpen={showLoginModal} onLogin={login} />
    </div>
  )
}

// Floating group panel for desktop
function GroupPanel({
  users,
  movies,
  currentUserName,
}: {
  users: User[]
  movies: Movie[]
  currentUserName: string | null
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-colors',
          isOpen ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
        )}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Group
        {users.length > 0 && (
          <span className="px-1.5 py-0.5 text-xs bg-gray-700 rounded-full">
            {users.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-14 right-0 w-96 max-h-[70vh] bg-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-100">Group View</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              <GroupView
                users={users}
                movies={movies}
                currentUserName={currentUserName}
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default App
