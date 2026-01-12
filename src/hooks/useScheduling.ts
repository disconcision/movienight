import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Availability, ScheduledEvent, TimeSlot } from '../types'
import {
  subscribeToAvailability,
  subscribeToEvents,
  updateAvailability,
  createEvent,
  deleteEvent,
  updateEvent,
  toggleRSVP as toggleRSVPDb,
} from '../db/scheduling'
import { isFirebaseConfigured } from '../db/firebase'

interface UseSchedulingResult {
  // All users' availability
  allAvailability: Availability[]
  // Current user's availability (for easy access)
  myAvailability: Availability | null
  // Scheduled events
  events: ScheduledEvent[]
  // Loading states
  isLoading: boolean
  // Actions
  toggleAvailability: (date: string, slot: TimeSlot) => Promise<void>
  scheduleEvent: (date: string, slot: TimeSlot, movieId?: string) => Promise<string | null>
  cancelEvent: (eventId: string) => Promise<void>
  markWatched: (eventId: string, watched: boolean) => Promise<void>
  toggleRSVP: (eventId: string) => Promise<void>
  // Computed
  getOverlapForDate: (date: string) => { slot: TimeSlot; users: string[] }[]
}

/**
 * Hook for managing scheduling - availability and events
 */
export function useScheduling(currentUserName: string | null): UseSchedulingResult {
  const [allAvailability, setAllAvailability] = useState<Availability[]>([])
  const [events, setEvents] = useState<ScheduledEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Subscribe to availability and events
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false)
      return
    }

    const unsubAvail = subscribeToAvailability(
      (availability) => {
        setAllAvailability(availability)
        setIsLoading(false)
      },
      (err) => {
        console.error('Failed to subscribe to availability:', err)
        setIsLoading(false)
      }
    )

    const unsubEvents = subscribeToEvents(
      (events) => {
        setEvents(events)
      },
      (err) => {
        console.error('Failed to subscribe to events:', err)
      }
    )

    return () => {
      unsubAvail()
      unsubEvents()
    }
  }, [])

  // Get current user's availability
  const myAvailability = useMemo(() => {
    if (!currentUserName) return null
    return allAvailability.find(
      (a) => a.name.toLowerCase() === currentUserName.toLowerCase()
    ) ?? null
  }, [allAvailability, currentUserName])

  // Toggle availability for a date/slot
  const toggleAvailability = useCallback(
    async (date: string, slot: TimeSlot) => {
      if (!currentUserName) return

      const current = myAvailability?.slots[date] || []
      let newSlots: TimeSlot[]

      if (current.includes(slot)) {
        // Remove slot
        newSlots = current.filter((s) => s !== slot)
      } else {
        // Add slot
        newSlots = [...current, slot]
      }

      await updateAvailability(currentUserName, date, newSlots)
    },
    [currentUserName, myAvailability]
  )

  // Schedule a new event
  const scheduleEvent = useCallback(
    async (date: string, slot: TimeSlot, movieId?: string): Promise<string | null> => {
      if (!currentUserName) return null

      try {
        const eventId = await createEvent({
          date,
          timeSlot: slot,
          movieId: movieId || null,
          createdBy: currentUserName,
          watched: false,
          attendees: [currentUserName], // Creator automatically attends
        })
        return eventId
      } catch (err) {
        console.error('Failed to create event:', err)
        return null
      }
    },
    [currentUserName]
  )

  // Cancel an event
  const cancelEvent = useCallback(async (eventId: string) => {
    await deleteEvent(eventId)
  }, [])

  // Mark event as watched
  const markWatched = useCallback(async (eventId: string, watched: boolean) => {
    await updateEvent(eventId, { watched })
  }, [])

  // Toggle RSVP for an event
  const toggleRSVP = useCallback(
    async (eventId: string) => {
      if (!currentUserName) return
      await toggleRSVPDb(eventId, currentUserName)
    },
    [currentUserName]
  )

  // Get availability overlap for a date
  const getOverlapForDate = useCallback(
    (date: string): { slot: TimeSlot; users: string[] }[] => {
      const slots: TimeSlot[] = ['afternoon', 'evening']

      return slots.map((slot) => {
        const usersAvailable = allAvailability
          .filter((a) => a.slots[date]?.includes(slot))
          .map((a) => a.name)

        return { slot, users: usersAvailable }
      })
    },
    [allAvailability]
  )

  return {
    allAvailability,
    myAvailability,
    events,
    isLoading,
    toggleAvailability,
    scheduleEvent,
    cancelEvent,
    markWatched,
    toggleRSVP,
    getOverlapForDate,
  }
}
