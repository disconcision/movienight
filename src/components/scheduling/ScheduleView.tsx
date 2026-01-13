import { useState } from 'react'
import { useScheduling } from '../../hooks'
import type { Movie } from '../../types'
import { DateTimePicker } from './DateTimePicker'
import { ProposedDatesList } from './ProposedDatesList'

interface ScheduleViewProps {
  currentUserName: string | null
  movies: Movie[]
  isFirebaseConnected: boolean
}

export function ScheduleView({ currentUserName, movies, isFirebaseConnected }: ScheduleViewProps) {
  const {
    events,
    scheduleEvent,
    cancelEvent,
    toggleRSVP,
  } = useScheduling(currentUserName)

  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const handleSuggestTime = async (date: string, hour: number) => {
    const eventId = await scheduleEvent(date, hour)
    if (eventId) {
      setIsPickerOpen(false)
    }
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
        <p>Log in to view and vote on proposed times.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <ProposedDatesList
        events={events}
        movies={movies}
        currentUserName={currentUserName}
        onToggleRSVP={toggleRSVP}
        onCancelEvent={cancelEvent}
        onSuggestTime={() => setIsPickerOpen(true)}
      />

      <DateTimePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={handleSuggestTime}
      />
    </div>
  )
}
