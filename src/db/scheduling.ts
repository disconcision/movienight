import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'
import type { Availability, ScheduledEvent, TimeSlot } from '../types'

const AVAILABILITY_COLLECTION = 'availability'
const EVENTS_COLLECTION = 'events'

// ============================================
// Availability
// ============================================

/**
 * Get a user's availability
 */
export async function getAvailability(userName: string): Promise<Availability | null> {
  if (!isFirebaseConfigured || !db) {
    return null
  }

  const normalizedName = userName.toLowerCase().trim()
  const availRef = doc(db, AVAILABILITY_COLLECTION, normalizedName)
  const snapshot = await getDoc(availRef)

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()
  return {
    name: data.name,
    slots: data.slots || {},
    updatedAt: data.updatedAt?.toDate() || new Date(),
  }
}

/**
 * Update a user's availability for a specific date
 */
export async function updateAvailability(
  userName: string,
  date: string, // ISO date string (YYYY-MM-DD)
  slots: TimeSlot[]
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    return
  }

  const normalizedName = userName.toLowerCase().trim()
  const availRef = doc(db, AVAILABILITY_COLLECTION, normalizedName)

  // Get existing availability
  const existing = await getAvailability(userName)
  const currentSlots = existing?.slots || {}

  // Update the slots for this date
  const updatedSlots = { ...currentSlots }
  if (slots.length === 0) {
    delete updatedSlots[date]
  } else {
    updatedSlots[date] = slots
  }

  await setDoc(availRef, {
    name: userName,
    slots: updatedSlots,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Subscribe to all users' availability
 */
export function subscribeToAvailability(
  onUpdate: (availability: Availability[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    onUpdate([])
    return () => {}
  }

  const availRef = collection(db, AVAILABILITY_COLLECTION)
  const q = query(availRef)

  return onSnapshot(
    q,
    (snapshot) => {
      const availability: Availability[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          name: data.name,
          slots: data.slots || {},
          updatedAt: data.updatedAt?.toDate() || new Date(),
        }
      })
      onUpdate(availability)
    },
    onError
  )
}

// ============================================
// Scheduled Events
// ============================================

/**
 * Create a new scheduled event
 */
export async function createEvent(
  event: Omit<ScheduledEvent, 'id' | 'createdAt'>
): Promise<string> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase not configured')
  }

  const eventsRef = collection(db, EVENTS_COLLECTION)
  const eventId = `${event.date}_${event.timeSlot}_${Date.now()}`
  const eventRef = doc(eventsRef, eventId)

  await setDoc(eventRef, {
    ...event,
    id: eventId,
    createdAt: serverTimestamp(),
  })

  return eventId
}

/**
 * Update an event (e.g., mark as watched, change movie)
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<Pick<ScheduledEvent, 'movieId' | 'watched'>>
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    return
  }

  const eventRef = doc(db, EVENTS_COLLECTION, eventId)
  await setDoc(eventRef, updates, { merge: true })
}

/**
 * Toggle RSVP for a user on an event
 */
export async function toggleRSVP(eventId: string, userName: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    return
  }

  const eventRef = doc(db, EVENTS_COLLECTION, eventId)
  const snapshot = await getDoc(eventRef)

  if (!snapshot.exists()) {
    throw new Error('Event not found')
  }

  const data = snapshot.data()
  const attendees: string[] = data.attendees || []
  const normalizedName = userName.toLowerCase().trim()

  // Check if user is already in the list (case-insensitive)
  const existingIndex = attendees.findIndex(
    (name) => name.toLowerCase() === normalizedName
  )

  if (existingIndex >= 0) {
    // Remove from attendees
    attendees.splice(existingIndex, 1)
  } else {
    // Add to attendees
    attendees.push(userName)
  }

  await setDoc(eventRef, { attendees }, { merge: true })
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    return
  }

  const eventRef = doc(db, EVENTS_COLLECTION, eventId)
  await deleteDoc(eventRef)
}

/**
 * Subscribe to all scheduled events
 */
export function subscribeToEvents(
  onUpdate: (events: ScheduledEvent[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    onUpdate([])
    return () => {}
  }

  const eventsRef = collection(db, EVENTS_COLLECTION)
  const q = query(eventsRef, orderBy('date', 'asc'))

  return onSnapshot(
    q,
    (snapshot) => {
      const events: ScheduledEvent[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: data.id,
          movieId: data.movieId,
          date: data.date,
          timeSlot: data.timeSlot,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate() || new Date(),
          watched: data.watched || false,
          attendees: data.attendees || [],
        }
      })
      onUpdate(events)
    },
    onError
  )
}
