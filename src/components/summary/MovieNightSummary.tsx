import { useMemo } from 'react'
import type { Movie, User, TimeSlot, Availability } from '../../types'
import { getIntersectionWithScores } from '../../lib/priority'
import { getPosterUrl } from '../../api/tmdb'

interface MovieNightSummaryProps {
  users: User[]
  movies: Movie[]
  allAvailability: Availability[]
  currentUserName: string | null
  isFirebaseConnected: boolean
  onSchedule?: (date: string, slot: TimeSlot, movieId: string) => void
}

interface BestSlot {
  date: string
  slot: TimeSlot
  users: string[]
  dateLabel: string
}

const SLOT_LABELS: Record<TimeSlot, string> = {
  afternoon: 'Afternoon',
  evening: 'Evening',
}

const SLOT_TIMES: Record<TimeSlot, string> = {
  afternoon: '12pm-5pm',
  evening: '6pm-11pm',
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  if (dateOnly.getTime() === today.getTime()) {
    return 'Today'
  }
  if (dateOnly.getTime() === tomorrow.getTime()) {
    return 'Tomorrow'
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Find the best upcoming slot with highest availability
 */
function findBestSlot(
  allAvailability: Availability[],
  weeksAhead: number = 5
): BestSlot | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const slots: TimeSlot[] = ['afternoon', 'evening']

  let bestSlot: BestSlot | null = null
  let maxUsers = 0

  // Check next N weeks
  for (let dayOffset = 0; dayOffset < weeksAhead * 7; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() + dayOffset)
    const dateStr = date.toISOString().split('T')[0]

    for (const slot of slots) {
      const usersAvailable = allAvailability
        .filter((a) => a.slots[dateStr]?.includes(slot))
        .map((a) => a.name)

      if (usersAvailable.length > maxUsers) {
        maxUsers = usersAvailable.length
        bestSlot = {
          date: dateStr,
          slot,
          users: usersAvailable,
          dateLabel: formatDateLabel(dateStr),
        }
      }
    }
  }

  return bestSlot
}

export function MovieNightSummary({
  users,
  movies,
  allAvailability,
  currentUserName,
  isFirebaseConnected,
  onSchedule,
}: MovieNightSummaryProps) {
  // Get intersection movies with scores
  const intersectionMovies = useMemo(() => {
    return getIntersectionWithScores(users, movies)
  }, [users, movies])

  // Find the best upcoming slot
  const bestSlot = useMemo(() => {
    return findBestSlot(allAvailability)
  }, [allAvailability])

  const topMovie = intersectionMovies[0]
  const runnerUps = intersectionMovies.slice(1, 4)

  // Check if current user is available for best slot
  const currentUserAvailable = bestSlot?.users.some(
    (name) => name.toLowerCase() === currentUserName?.toLowerCase()
  )

  // Don't show if not connected or not enough data
  if (!isFirebaseConnected) {
    return null
  }

  const hasAvailability = bestSlot && bestSlot.users.length > 0
  const hasIntersection = intersectionMovies.length > 0

  if (!hasAvailability && !hasIntersection) {
    return (
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-4 mx-4 mt-4">
        <div className="text-center text-gray-400">
          <p className="font-medium">No movie night planned yet</p>
          <p className="text-sm mt-1">
            Mark your availability in the Schedule tab and add movies to your list!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-primary-900/30 to-purple-900/30 border border-primary-700/30 rounded-xl p-4 mx-4 mt-4">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <span className="text-2xl">🎬</span>
        Next Movie Night
      </h3>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Left side: When */}
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Best Time</p>
            {bestSlot && bestSlot.users.length > 0 ? (
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-white font-medium">
                  {bestSlot.dateLabel} — {SLOT_LABELS[bestSlot.slot]}
                </p>
                <p className="text-sm text-gray-400">{SLOT_TIMES[bestSlot.slot]}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {bestSlot.users.map((name) => (
                    <span
                      key={name}
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        name.toLowerCase() === currentUserName?.toLowerCase()
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {name}
                    </span>
                  ))}
                </div>
                {!currentUserAvailable && currentUserName && (
                  <p className="text-xs text-yellow-400 mt-2">
                    You haven't marked yourself available for this slot
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                No availability marked yet — check the Schedule tab!
              </p>
            )}
          </div>

          {/* Who's in */}
          {bestSlot && bestSlot.users.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                {bestSlot.users.length} {bestSlot.users.length === 1 ? 'person' : 'people'} available
              </p>
            </div>
          )}
        </div>

        {/* Right side: What */}
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
            {hasIntersection ? 'Top Pick (everyone wants to see)' : 'Movie Suggestion'}
          </p>
          {topMovie ? (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex gap-3">
                {topMovie.movie.posterPath && (
                  <img
                    src={getPosterUrl(topMovie.movie.posterPath, 'w200') ?? undefined}
                    alt={topMovie.movie.title}
                    className="w-12 h-18 rounded object-cover shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{topMovie.movie.title}</p>
                  <p className="text-sm text-gray-400">
                    {topMovie.movie.year} • {topMovie.movie.rating?.toFixed(1)} ★
                  </p>
                  <p className="text-xs text-primary-400 mt-1">
                    Priority score: {topMovie.score}
                  </p>
                </div>
              </div>

              {/* Runner-ups */}
              {runnerUps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-2">Runner-ups:</p>
                  <div className="flex gap-2">
                    {runnerUps.map((item) => (
                      <div
                        key={item.movieId}
                        className="flex items-center gap-1.5 text-xs text-gray-400"
                        title={`${item.movie.title} (score: ${item.score})`}
                      >
                        {item.movie.posterPath ? (
                          <img
                            src={getPosterUrl(item.movie.posterPath, 'w200') ?? undefined}
                            alt={item.movie.title}
                            className="w-6 h-9 rounded object-cover"
                          />
                        ) : (
                          <div className="w-6 h-9 rounded bg-gray-700 flex items-center justify-center text-xs">
                            🎬
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule action */}
              {bestSlot && bestSlot.users.length > 0 && onSchedule && (
                <button
                  onClick={() => onSchedule(bestSlot.date, bestSlot.slot, topMovie.movieId)}
                  className="mt-3 w-full py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Schedule This Movie Night
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              No movies in everyone's unseen list yet.
              <br />
              Add movies to your list and invite friends!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
