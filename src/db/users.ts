import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  query,
  Unsubscribe,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'
import type { User } from '../types'

const USERS_COLLECTION = 'users'

/**
 * Check if a username is available (case-insensitive)
 */
export async function isUsernameAvailable(name: string): Promise<boolean> {
  if (!isFirebaseConfigured || !db) {
    // In mock mode, always return true
    return true
  }

  const normalizedName = name.toLowerCase().trim()
  const userRef = doc(db, USERS_COLLECTION, normalizedName)
  const snapshot = await getDoc(userRef)
  return !snapshot.exists()
}

/**
 * Create a new user
 */
export async function createUser(name: string): Promise<User> {
  const normalizedName = name.toLowerCase().trim()

  const user: User = {
    name,
    unseenMovies: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  if (!isFirebaseConfigured || !db) {
    // In mock mode, just return the user object
    return user
  }

  const userRef = doc(db, USERS_COLLECTION, normalizedName)
  await setDoc(userRef, {
    ...user,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return user
}

/**
 * Get a user by name
 */
export async function getUser(name: string): Promise<User | null> {
  if (!isFirebaseConfigured || !db) {
    return null
  }

  const normalizedName = name.toLowerCase().trim()
  const userRef = doc(db, USERS_COLLECTION, normalizedName)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()
  return {
    name: data.name,
    unseenMovies: data.unseenMovies || [],
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  }
}

/**
 * Update user's unseen movies list
 */
export async function updateUserUnseenMovies(
  name: string,
  unseenMovies: string[]
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    return
  }

  const normalizedName = name.toLowerCase().trim()
  const userRef = doc(db, USERS_COLLECTION, normalizedName)
  await updateDoc(userRef, {
    unseenMovies,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Subscribe to all users
 */
export function subscribeToUsers(
  onUpdate: (users: User[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    // Return empty array in mock mode
    onUpdate([])
    return () => {}
  }

  const usersRef = collection(db, USERS_COLLECTION)
  const q = query(usersRef)

  return onSnapshot(
    q,
    (snapshot) => {
      const users: User[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          name: data.name,
          unseenMovies: data.unseenMovies || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        }
      })
      onUpdate(users)
    },
    onError
  )
}
