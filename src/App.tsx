import { useState, useMemo } from 'react'
import { useCurrentUser, useMovies, useUsers, useUnseenMovies, useScheduling } from './hooks'
import { UserIdentityModal, UserBadge } from './components/user'
import { MovieGrid, UnseenList, MovieSearch } from './components/movies'
import { GroupView } from './components/group'
import { ScheduleView } from './components/scheduling'
import { SettingsPanel } from './components/settings'
import { MovieNightSummary } from './components/summary'
import { countUnseenBy } from './lib/priority'
import { cn } from './lib/utils'
import type { User, Movie, TimeSlot } from './types'
import { createEvent } from './db/scheduling'

type Tab = 'movies' | 'my-list' | 'group' | 'schedule'

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

  // Scheduling data for the summary
  const { allAvailability } = useScheduling(localUser?.name ?? null)

  // Mobile tab state
  const [activeTab, setActiveTab] = useState<Tab>('movies')

  // Movie search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Handle scheduling from summary
  const handleScheduleFromSummary = async (date: string, slot: TimeSlot, movieId: string) => {
    if (!localUser) return
    try {
      await createEvent({
        date,
        timeSlot: slot,
        movieId,
        createdBy: localUser.name,
        watched: false,
      })
    } catch (err) {
      console.error('Failed to create event:', err)
    }
  }

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

          <div className="flex items-center gap-2">
            {/* GitHub link */}
            <a
              href="https://github.com/disconcision/movienight"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="View on GitHub - Issues & PRs welcome!"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>

            {/* Add Movie button - only show when Firebase is connected */}
            {isFirebaseConnected && localUser && (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Movie</span>
              </button>
            )}

            {/* Settings button */}
            {localUser && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}

            {localUser && (
              <UserBadge
                name={localUser.name}
                onLogout={logout}
                isFirebaseConnected={isFirebaseConnected}
              />
            )}
          </div>
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
          <button
            onClick={() => setActiveTab('schedule')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === 'schedule'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-400'
            )}
          >
            📅
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

          {/* Movie Night Summary - shows best upcoming slot and top pick */}
          {isFirebaseConnected && localUser && (
            <MovieNightSummary
              users={allUsers}
              movies={movies}
              allAvailability={allAvailability}
              currentUserName={localUser.name}
              isFirebaseConnected={isFirebaseConnected}
              onSchedule={handleScheduleFromSummary}
            />
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

        {/* Schedule view - only visible on mobile when active */}
        <div
          className={cn(
            'w-full md:hidden',
            activeTab !== 'schedule' && 'hidden'
          )}
        >
          <ScheduleView
            currentUserName={localUser?.name ?? null}
            movies={movies}
            isFirebaseConnected={isFirebaseConnected}
          />
        </div>
      </main>

      {/* Desktop: Floating panels for Group and Schedule */}
      <div className="hidden md:flex fixed bottom-4 right-4 z-30 gap-2">
        <SchedulePanel
          currentUserName={localUser?.name ?? null}
          movies={movies}
          isFirebaseConnected={isFirebaseConnected}
        />
        <GroupPanel
          users={allUsers}
          movies={movies}
          currentUserName={localUser?.name ?? null}
        />
      </div>

      {/* Login modal */}
      <UserIdentityModal isOpen={showLoginModal} onLogin={login} />

      {/* Movie search modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Add Movie</h2>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <MovieSearch existingMovieIds={movies.map((m) => m.tmdbId)} />
            </div>
          </div>
        </div>
      )}

      {/* Settings panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        users={allUsers}
        movies={movies}
        currentUserName={localUser?.name ?? null}
        isFirebaseConnected={isFirebaseConnected}
      />
    </div>
  )
}

// Floating schedule panel for desktop
function SchedulePanel({
  currentUserName,
  movies,
  isFirebaseConnected,
}: {
  currentUserName: string | null
  movies: Movie[]
  isFirebaseConnected: boolean
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Schedule
      </button>

      {/* Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-14 right-0 w-[500px] max-h-[70vh] bg-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-100">Schedule</h3>
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
              <ScheduleView
                currentUserName={currentUserName}
                movies={movies}
                isFirebaseConnected={isFirebaseConnected}
              />
            </div>
          </div>
        </>
      )}
    </>
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
