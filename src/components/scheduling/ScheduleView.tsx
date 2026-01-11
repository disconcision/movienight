import { useState, useMemo } from 'react'
import { useScheduling } from '../../hooks'
import type { Movie, TimeSlot, ScheduledEvent } from '../../types'
import { TIME_SLOT_LABELS } from '../../types'
import { cn } from '../../lib/utils'

interface ScheduleViewProps {
  currentUserName: string | null
  movies: Movie[]
  isFirebaseConnected: boolean
}

// Get next 7 days starting from today
function getNextSevenDays(): string[] {
  const days: string[] = []
  const today = new Date()

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    days.push(date.toISOString().split('T')[0])
  }

  return days
}

// Format date for display
function formatDate(isoDate: string): { day: string; date: string; isToday: boolean } {
  const date = new Date(isoDate + 'T12:00:00')
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const isToday = date.toDateString() === today.toDateString()

  return {
    day: dayNames[date.getDay()],
    date: date.getDate().toString(),
    isToday,
  }
}

export function ScheduleView({ currentUserName, movies, isFirebaseConnected }: ScheduleViewProps) {
  const {
    myAvailability,
    events,
    toggleAvailability,
    scheduleEvent,
    cancelEvent,
    getOverlapForDate,
  } = useScheduling(currentUserName)

  const [isCreatingEvent, setIsCreatingEvent] = useState<{ date: string; slot: TimeSlot } | null>(null)
  const [selectedMovieId, setSelectedMovieId] = useState<string>('')

  const days = useMemo(() => getNextSevenDays(), [])
  const slots: TimeSlot[] = ['afternoon', 'evening']

  // Get events by date and slot
  const eventsByDateSlot = useMemo(() => {
    const map = new Map<string, ScheduledEvent>()
    events.forEach((event) => {
      const key = `${event.date}_${event.timeSlot}`
      map.set(key, event)
    })
    return map
  }, [events])

  // Handle creating an event
  const handleCreateEvent = async () => {
    if (!isCreatingEvent) return

    await scheduleEvent(isCreatingEvent.date, isCreatingEvent.slot, selectedMovieId || undefined)
    setIsCreatingEvent(null)
    setSelectedMovieId('')
  }

  if (!isFirebaseConnected) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Scheduling requires Firebase to be connected.</p>
      </div>
    )
  }

  if (!currentUserName) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Log in to manage your availability and schedule events.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-100 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Schedule
        </h2>
        <p className="text-sm text-gray-400">
          Click slots to mark your availability. Green shows overlap with others.
        </p>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-[500px]">
          {/* Header - Days */}
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div className="h-12" /> {/* Empty corner */}
            {days.map((day) => {
              const { day: dayName, date, isToday } = formatDate(day)
              return (
                <div
                  key={day}
                  className={cn(
                    'text-center py-1 rounded',
                    isToday && 'bg-primary-900/50'
                  )}
                >
                  <div className="text-xs text-gray-400">{dayName}</div>
                  <div className={cn(
                    'text-lg font-semibold',
                    isToday ? 'text-primary-400' : 'text-gray-200'
                  )}>
                    {date}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Slots rows */}
          {slots.map((slot) => (
            <div key={slot} className="grid grid-cols-8 gap-1 mb-1">
              {/* Slot label */}
              <div className="flex items-center justify-end pr-2">
                <span className="text-xs text-gray-400">
                  {slot === 'afternoon' ? '🌤️' : '🌙'}
                </span>
              </div>

              {/* Day cells */}
              {days.map((day) => {
                const overlap = getOverlapForDate(day).find((o) => o.slot === slot)
                const usersAvailable = overlap?.users || []
                const mySlots = myAvailability?.slots[day] || []
                const isMyAvailable = mySlots.includes(slot)
                const eventKey = `${day}_${slot}`
                const event = eventsByDateSlot.get(eventKey)

                return (
                  <div key={`${day}_${slot}`} className="relative">
                    {event ? (
                      // Show event
                      <EventCell
                        event={event}
                        movie={movies.find((m) => m.tmdbId === event.movieId)}
                        onCancel={() => cancelEvent(event.id)}
                        currentUserName={currentUserName}
                      />
                    ) : (
                      // Show availability cell
                      <button
                        onClick={() => toggleAvailability(day, slot)}
                        onDoubleClick={() => setIsCreatingEvent({ date: day, slot })}
                        className={cn(
                          'w-full h-12 rounded transition-colors relative',
                          isMyAvailable
                            ? usersAvailable.length > 1
                              ? 'bg-green-600/50 hover:bg-green-600/70 border border-green-500'
                              : 'bg-primary-600/50 hover:bg-primary-600/70 border border-primary-500'
                            : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                        )}
                        title={
                          usersAvailable.length > 0
                            ? `Available: ${usersAvailable.join(', ')}`
                            : 'Click to mark available'
                        }
                      >
                        {usersAvailable.length > 0 && (
                          <span className="absolute bottom-1 right-1 text-xs text-white/80">
                            {usersAvailable.length}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-800 border border-gray-700" />
          <span>Not available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary-600/50 border border-primary-500" />
          <span>You're available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-600/50 border border-green-500" />
          <span>Multiple available</span>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Double-click an available slot to schedule an event.
      </p>

      {/* Upcoming events */}
      {events.filter((e) => !e.watched).length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">Upcoming Events</h3>
          <div className="space-y-2">
            {events
              .filter((e) => !e.watched)
              .slice(0, 5)
              .map((event) => {
                const movie = movies.find((m) => m.tmdbId === event.movieId)
                const { day, date } = formatDate(event.date)
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg"
                  >
                    <div className="text-center min-w-[40px]">
                      <div className="text-xs text-gray-400">{day}</div>
                      <div className="text-lg font-semibold text-gray-200">{date}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-200 truncate">
                        {movie?.title || 'Movie TBD'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {event.timeSlot === 'afternoon' ? '🌤️ Afternoon' : '🌙 Evening'}
                        {' · '}
                        by {event.createdBy}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Create event modal */}
      {isCreatingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCreatingEvent(null)}
          />
          <div className="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Schedule Movie Night</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date & Time</label>
                <div className="text-gray-200">
                  {formatDate(isCreatingEvent.date).day}, {isCreatingEvent.date}
                  {' · '}
                  {TIME_SLOT_LABELS[isCreatingEvent.slot]}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Movie (optional)</label>
                <select
                  value={selectedMovieId}
                  onChange={(e) => setSelectedMovieId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="">Decide later</option>
                  {movies.map((movie) => (
                    <option key={movie.tmdbId} value={movie.tmdbId}>
                      {movie.title} ({movie.year})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsCreatingEvent(null)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEvent}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Event cell component
function EventCell({
  event,
  movie,
  onCancel,
  currentUserName,
}: {
  event: ScheduledEvent
  movie?: Movie
  onCancel: () => void
  currentUserName: string
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div
      className="relative w-full h-12 rounded bg-amber-600/50 border border-amber-500 flex items-center justify-center cursor-pointer"
      onClick={() => setShowMenu(!showMenu)}
    >
      <span className="text-xs text-white font-medium truncate px-1">
        {movie?.title?.slice(0, 8) || '🎬'}
        {movie?.title && movie.title.length > 8 && '...'}
      </span>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(false)
            }}
          />
          <div className="absolute top-full left-0 mt-1 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 min-w-[150px]">
            <div className="text-sm text-gray-200 mb-2">
              {movie?.title || 'Movie TBD'}
            </div>
            <div className="text-xs text-gray-400 mb-2">
              by {event.createdBy}
            </div>
            {event.createdBy.toLowerCase() === currentUserName.toLowerCase() && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCancel()
                  setShowMenu(false)
                }}
                className="w-full px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 rounded"
              >
                Cancel Event
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
