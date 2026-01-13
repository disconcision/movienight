import { cn } from '../../lib/utils'
import { formatHour } from '../../types'
import type { ScheduledEvent, Movie } from '../../types'

interface ProposedDatesListProps {
  events: ScheduledEvent[]
  movies: Movie[]
  currentUserName: string
  onToggleRSVP: (eventId: string) => void
  onCancelEvent: (eventId: string) => void
  onSuggestTime: () => void
}

function formatDateLabel(dateStr: string): { dayName: string; monthDay: string; isToday: boolean; isTomorrow: boolean } {
  const date = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const isToday = dateOnly.getTime() === today.getTime()
  const isTomorrow = dateOnly.getTime() === tomorrow.getTime()

  let dayName = dayNames[date.getDay()]
  if (isToday) dayName = 'Today'
  if (isTomorrow) dayName = 'Tomorrow'

  return {
    dayName,
    monthDay: `${monthNames[date.getMonth()]} ${date.getDate()}`,
    isToday,
    isTomorrow,
  }
}

export function ProposedDatesList({
  events,
  movies,
  currentUserName,
  onToggleRSVP,
  onCancelEvent,
  onSuggestTime,
}: ProposedDatesListProps) {
  // Sort events by date and hour
  const sortedEvents = [...events].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.startHour - b.startHour
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Proposed Times
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Vote on times that work for you
          </p>
        </div>
        <button
          onClick={onSuggestTime}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-500 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Suggest Time
        </button>
      </div>

      {/* Events list */}
      {sortedEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-gray-400 mb-4">No times proposed yet</p>
          <button
            onClick={onSuggestTime}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-500 transition-colors"
          >
            Be the first to suggest a time
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedEvents.map((event) => {
            const movie = movies.find((m) => m.tmdbId === event.movieId)
            const { dayName, monthDay, isToday, isTomorrow } = formatDateLabel(event.date)
            const isAttending = event.attendees.some(
              (name) => name.toLowerCase() === currentUserName.toLowerCase()
            )
            const isCreator = event.createdBy.toLowerCase() === currentUserName.toLowerCase()

            return (
              <div
                key={event.id}
                className={cn(
                  'p-4 rounded-xl border transition-colors',
                  isAttending
                    ? 'bg-green-900/20 border-green-700/50'
                    : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Date badge */}
                  <div className={cn(
                    'text-center min-w-[60px] py-2 px-3 rounded-lg',
                    isToday ? 'bg-primary-900/50' : 'bg-gray-800'
                  )}>
                    <div className={cn(
                      'text-xs font-medium',
                      isToday ? 'text-primary-400' : isTomorrow ? 'text-amber-400' : 'text-gray-400'
                    )}>
                      {dayName}
                    </div>
                    <div className="text-lg font-bold text-gray-200">{monthDay}</div>
                    <div className="text-sm text-gray-400">{formatHour(event.startHour)}</div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Movie info or TBD */}
                    {movie ? (
                      <div className="flex items-center gap-2 mb-2">
                        {movie.posterPath && (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                            alt=""
                            className="w-8 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-200">{movie.title}</p>
                          <p className="text-xs text-gray-500">{movie.year}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="font-medium text-gray-400 mb-2">Movie TBD</p>
                    )}

                    {/* Attendees */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {event.attendees.map((name) => (
                        <span
                          key={name}
                          className={cn(
                            'px-2 py-0.5 text-xs rounded-full',
                            name.toLowerCase() === currentUserName.toLowerCase()
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-300'
                          )}
                        >
                          {name}
                        </span>
                      ))}
                      {event.attendees.length === 0 && (
                        <span className="text-xs text-gray-500">No votes yet</span>
                      )}
                    </div>

                    {/* Created by */}
                    <p className="text-xs text-gray-500 mt-2">
                      Suggested by {event.createdBy}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => onToggleRSVP(event.id)}
                      className={cn(
                        'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                        isAttending
                          ? 'bg-green-600 text-white hover:bg-green-500'
                          : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      )}
                    >
                      {isAttending ? "I'm in!" : 'Join'}
                    </button>

                    {isCreator && (
                      <button
                        onClick={() => {
                          if (confirm('Remove this proposed time?')) {
                            onCancelEvent(event.id)
                          }
                        }}
                        className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tip */}
      {sortedEvents.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          The time with the most votes wins! Click "Join" to vote for times that work for you.
        </p>
      )}
    </div>
  )
}
