import {
  doc,
  deleteDoc,
  setDoc,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'
import { getTopRatedMovies, getMovieDetails, tmdbToMovie, isTMDBConfigured, findByIMDBId } from '../api/tmdb'

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

/**
 * Seed movies from TMDB Top Rated list
 * @param count Number of movies to seed (default 100)
 * @param onProgress Callback for progress updates
 */
export async function seedTopRatedMovies(
  count: number = 100,
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase not configured')
  }

  if (!isTMDBConfigured) {
    throw new Error('TMDB API key not configured')
  }

  // Calculate pages needed (20 movies per page)
  const pages = Math.ceil(count / 20)

  // Fetch top rated movies from TMDB
  const topRated = await getTopRatedMovies(pages)
  const moviesToSeed = topRated.slice(0, count)

  // Get existing movies to avoid duplicates
  const moviesRef = collection(db, MOVIES_COLLECTION)
  const existingSnapshot = await getDocs(moviesRef)
  const existingIds = new Set(existingSnapshot.docs.map((d) => d.id))

  let added = 0

  for (let i = 0; i < moviesToSeed.length; i++) {
    const movie = moviesToSeed[i]
    const tmdbId = String(movie.id)

    // Skip if already exists
    if (existingIds.has(tmdbId)) {
      if (onProgress) onProgress(i + 1, moviesToSeed.length)
      continue
    }

    try {
      // Fetch full details
      const details = await getMovieDetails(movie.id)
      if (!details) continue

      // Convert and save
      const movieData = tmdbToMovie(details)
      const movieRef = doc(db, MOVIES_COLLECTION, tmdbId)
      await setDoc(movieRef, {
        ...movieData,
        fetchedAt: serverTimestamp(),
      })

      added++

      // Rate limiting delay
      await new Promise((r) => setTimeout(r, 150))
    } catch (err) {
      console.error(`Failed to add movie ${movie.title}:`, err)
    }

    if (onProgress) onProgress(i + 1, moviesToSeed.length)
  }

  return added
}

/**
 * Seed movies from the static IMDB Top 250 list
 * Looks up TMDB IDs from IMDB IDs at runtime via TMDB API
 * @param onProgress Callback for progress updates
 */
export async function seedIMDBTop250(
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase not configured')
  }

  if (!isTMDBConfigured) {
    throw new Error('TMDB API key not configured')
  }

  // Import the static list
  const { default: imdbList } = await import('../data/imdb-top-250.json')

  // Get existing movies to avoid duplicates (by IMDB ID since we don't have TMDB IDs yet)
  const moviesRef = collection(db, MOVIES_COLLECTION)
  const existingSnapshot = await getDocs(moviesRef)
  const existingImdbIds = new Set(
    existingSnapshot.docs.map((d) => d.data().imdbId).filter(Boolean)
  )
  const existingTmdbIds = new Set(existingSnapshot.docs.map((d) => d.id))

  let added = 0

  for (let i = 0; i < imdbList.length; i++) {
    const item = imdbList[i]

    // Skip if already exists by IMDB ID
    if (existingImdbIds.has(item.imdbId)) {
      if (onProgress) onProgress(i + 1, imdbList.length)
      continue
    }

    try {
      // Look up TMDB ID from IMDB ID
      const tmdbId = await findByIMDBId(item.imdbId)
      if (!tmdbId) {
        console.warn(`Could not find TMDB ID for ${item.title} (${item.imdbId})`)
        if (onProgress) onProgress(i + 1, imdbList.length)
        continue
      }

      // Skip if we already have this TMDB ID
      if (existingTmdbIds.has(String(tmdbId))) {
        if (onProgress) onProgress(i + 1, imdbList.length)
        continue
      }

      // Small delay after lookup
      await new Promise((r) => setTimeout(r, 100))

      // Fetch full details from TMDB
      const details = await getMovieDetails(tmdbId)
      if (!details) {
        if (onProgress) onProgress(i + 1, imdbList.length)
        continue
      }

      // Convert and save
      const movieData = tmdbToMovie(details)
      const movieRef = doc(db, MOVIES_COLLECTION, String(tmdbId))
      await setDoc(movieRef, {
        ...movieData,
        fetchedAt: serverTimestamp(),
      })

      added++
      existingTmdbIds.add(String(tmdbId))
      existingImdbIds.add(item.imdbId)

      // Rate limiting delay
      await new Promise((r) => setTimeout(r, 150))
    } catch (err) {
      console.error(`Failed to add movie ${item.title}:`, err)
    }

    if (onProgress) onProgress(i + 1, imdbList.length)
  }

  return added
}
