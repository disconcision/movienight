import {
  doc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'

const USERS_COLLECTION = 'users'
const MOVIES_COLLECTION = 'movies'
const AVAILABILITY_COLLECTION = 'availability'
const EVENTS_COLLECTION = 'events'

/**
 * Delete a user and their availability data
 */
export async function deleteUser(userName: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase not configured')
  }

  const normalizedName = userName.toLowerCase().trim()
  const batch = writeBatch(db)

  // Delete user document
  const userRef = doc(db, USERS_COLLECTION, normalizedName)
  batch.delete(userRef)

  // Delete availability document
  const availRef = doc(db, AVAILABILITY_COLLECTION, normalizedName)
  batch.delete(availRef)

  await batch.commit()
}

/**
 * Delete a movie from the list
 */
export async function deleteMovie(tmdbId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase not configured')
  }

  const movieRef = doc(db, MOVIES_COLLECTION, tmdbId)
  await deleteDoc(movieRef)
}

/**
 * Get all users for admin display
 */
export async function getAllUsers(): Promise<{ name: string; moviesCount: number }[]> {
  if (!isFirebaseConfigured || !db) {
    return []
  }

  const usersRef = collection(db, USERS_COLLECTION)
  const snapshot = await getDocs(usersRef)

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      name: data.name,
      moviesCount: (data.unseenMovies || []).length,
    }
  })
}

/**
 * Clear all movies (use with caution!)
 */
export async function clearAllMovies(): Promise<number> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase not configured')
  }

  const moviesRef = collection(db, MOVIES_COLLECTION)
  const snapshot = await getDocs(moviesRef)

  const batch = writeBatch(db)
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })

  await batch.commit()
  return snapshot.docs.length
}

/**
 * Clear all events
 */
export async function clearAllEvents(): Promise<number> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase not configured')
  }

  const eventsRef = collection(db, EVENTS_COLLECTION)
  const snapshot = await getDocs(eventsRef)

  const batch = writeBatch(db)
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })

  await batch.commit()
  return snapshot.docs.length
}
