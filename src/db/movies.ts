import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  query,
  Unsubscribe,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'
import type { Movie, Config } from '../types'

const MOVIES_COLLECTION = 'movies'
const CONFIG_DOC = 'config'

/**
 * Get the master movie list configuration
 */
export async function getConfig(): Promise<Config | null> {
  if (!isFirebaseConfigured || !db) {
    return null
  }

  const configRef = doc(db, CONFIG_DOC, 'main')
  const snapshot = await getDoc(configRef)

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as Config
}

/**
 * Update the master movie list
 */
export async function updateMovieList(movieList: string[]): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    return
  }

  const configRef = doc(db, CONFIG_DOC, 'main')
  await setDoc(configRef, { movieList }, { merge: true })
}

/**
 * Get a movie by TMDB ID
 */
export async function getMovie(tmdbId: string): Promise<Movie | null> {
  if (!isFirebaseConfigured || !db) {
    return null
  }

  const movieRef = doc(db, MOVIES_COLLECTION, tmdbId)
  const snapshot = await getDoc(movieRef)

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()
  return {
    tmdbId: data.tmdbId,
    imdbId: data.imdbId,
    title: data.title,
    year: data.year,
    posterPath: data.posterPath,
    overview: data.overview,
    runtime: data.runtime,
    genres: data.genres || [],
    director: data.director,
    cast: data.cast || [],
    rating: data.rating,
    fetchedAt: data.fetchedAt?.toDate() || new Date(),
  }
}

/**
 * Save a movie to Firestore
 */
export async function saveMovie(movie: Movie): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    return
  }

  const movieRef = doc(db, MOVIES_COLLECTION, movie.tmdbId)
  await setDoc(movieRef, {
    ...movie,
    fetchedAt: serverTimestamp(),
  })
}

/**
 * Delete a movie from Firestore
 */
export async function deleteMovie(tmdbId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    return
  }

  const movieRef = doc(db, MOVIES_COLLECTION, tmdbId)
  await deleteDoc(movieRef)
}

/**
 * Subscribe to all movies
 */
export function subscribeToMovies(
  onUpdate: (movies: Movie[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    // Return empty array in mock mode
    onUpdate([])
    return () => {}
  }

  const moviesRef = collection(db, MOVIES_COLLECTION)
  const q = query(moviesRef)

  return onSnapshot(
    q,
    (snapshot) => {
      const movies: Movie[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          tmdbId: data.tmdbId,
          imdbId: data.imdbId,
          title: data.title,
          year: data.year,
          posterPath: data.posterPath,
          overview: data.overview,
          runtime: data.runtime,
          genres: data.genres || [],
          director: data.director,
          cast: data.cast || [],
          rating: data.rating,
          fetchedAt: data.fetchedAt?.toDate() || new Date(),
        }
      })
      onUpdate(movies)
    },
    onError
  )
}

/**
 * Subscribe to config (movie list)
 */
export function subscribeToConfig(
  onUpdate: (config: Config | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    onUpdate(null)
    return () => {}
  }

  const configRef = doc(db, CONFIG_DOC, 'main')

  return onSnapshot(
    configRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate(null)
        return
      }
      onUpdate(snapshot.data() as Config)
    },
    onError
  )
}
