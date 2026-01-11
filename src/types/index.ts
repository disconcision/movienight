// ============================================
// Firestore Document Types
// ============================================

export interface Movie {
  tmdbId: string
  imdbId: string | null
  title: string
  year: number
  posterPath: string | null
  overview: string
  runtime: number | null
  genres: string[]
  director: string | null
  cast: string[] // Top 5 cast members
  rating: number | null // TMDB rating
  fetchedAt: Date
}

export interface User {
  name: string // Display name (also the doc ID)
  unseenMovies: string[] // Ordered TMDB IDs (first = highest priority)
  createdAt: Date
  updatedAt: Date
}

// Time slots (defined early since used in Availability)
export type TimeSlot = 'afternoon' | 'evening'

export interface Availability {
  name: string
  slots: Record<string, TimeSlot[]> // ISO date string -> ["afternoon", "evening"]
  updatedAt: Date
}

export interface ScheduledEvent {
  id: string
  movieId: string | null // TMDB ID, null if just a placeholder
  date: string // ISO date
  timeSlot: TimeSlot
  createdBy: string
  createdAt: Date
  watched: boolean
}

export interface Config {
  movieList: string[] // TMDB movie IDs in the master list
}

// ============================================
// Local State Types
// ============================================

export interface LocalUser {
  name: string
}

// ============================================
// Time Slots (additional exports)
// ============================================

export const TIME_SLOTS: readonly TimeSlot[] = ['afternoon', 'evening'] as const

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  afternoon: 'Afternoon (12pm-5pm)',
  evening: 'Evening (6pm-11pm)',
}

// ============================================
// TMDB API Types
// ============================================

export interface TMDBSearchResult {
  id: number
  title: string
  release_date: string
  poster_path: string | null
  overview: string
}

export interface TMDBMovieDetails {
  id: number
  imdb_id: string | null
  title: string
  release_date: string
  poster_path: string | null
  overview: string
  runtime: number | null
  genres: Array<{ id: number; name: string }>
  vote_average: number
  credits?: {
    crew: Array<{ job: string; name: string }>
    cast: Array<{ name: string; order: number }>
  }
}

// ============================================
// Utility Types
// ============================================

export interface MovieWithUnseenCount extends Movie {
  unseenCount: number
  isUnseenByCurrentUser: boolean
}

export interface AggregateMovieScore {
  movieId: string
  score: number
  movie: Movie
}
