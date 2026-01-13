import type { TMDBSearchResult, TMDBMovieDetails, Movie } from '../types'

const TMDB_API_BASE = 'https://api.themoviedb.org/3'

// Get API key from environment
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY

export const isTMDBConfigured = Boolean(TMDB_API_KEY)

/**
 * Search for movies by title
 */
export async function searchMovies(query: string): Promise<TMDBSearchResult[]> {
  if (!TMDB_API_KEY) {
    console.warn('TMDB API key not configured')
    return []
  }

  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
    query: query.trim(),
    include_adult: 'false',
  })

  const response = await fetch(`${TMDB_API_BASE}/search/movie?${params}`)

  if (!response.ok) {
    throw new Error(`TMDB search failed: ${response.statusText}`)
  }

  const data = await response.json()
  return data.results || []
}

/**
 * Get detailed movie information including credits
 */
export async function getMovieDetails(tmdbId: number): Promise<TMDBMovieDetails | null> {
  if (!TMDB_API_KEY) {
    console.warn('TMDB API key not configured')
    return null
  }

  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
    append_to_response: 'credits',
  })

  const response = await fetch(`${TMDB_API_BASE}/movie/${tmdbId}?${params}`)

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error(`TMDB fetch failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Convert TMDB movie details to our Movie type
 */
export function tmdbToMovie(details: TMDBMovieDetails): Movie {
  const director = details.credits?.crew.find((c) => c.job === 'Director')?.name ?? null
  const cast = details.credits?.cast
    .slice(0, 5)
    .map((c) => c.name) ?? []

  return {
    tmdbId: String(details.id),
    imdbId: details.imdb_id,
    title: details.title,
    year: details.release_date ? new Date(details.release_date).getFullYear() : 0,
    posterPath: details.poster_path,
    overview: details.overview,
    runtime: details.runtime,
    genres: details.genres.map((g) => g.name),
    director,
    cast,
    rating: details.vote_average || null,
    fetchedAt: new Date(),
  }
}

/**
 * Get the full URL for a poster image
 */
export function getPosterUrl(posterPath: string | null, size: 'w200' | 'w500' | 'original' = 'w500'): string | null {
  if (!posterPath) return null
  return `https://image.tmdb.org/t/p/${size}${posterPath}`
}

interface TMDBListResult {
  page: number
  results: TMDBSearchResult[]
  total_pages: number
  total_results: number
}

interface TMDBFindResult {
  movie_results: Array<{
    id: number
    title: string
    release_date: string
    poster_path: string | null
    overview: string
    vote_average: number
  }>
}

/**
 * Find a movie by its IMDB ID
 * Returns the TMDB ID if found, null otherwise
 */
export async function findByIMDBId(imdbId: string): Promise<number | null> {
  if (!TMDB_API_KEY) {
    console.warn('TMDB API key not configured')
    return null
  }

  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
    external_source: 'imdb_id',
  })

  const response = await fetch(`${TMDB_API_BASE}/find/${imdbId}?${params}`)

  if (!response.ok) {
    throw new Error(`TMDB find failed: ${response.statusText}`)
  }

  const data: TMDBFindResult = await response.json()

  if (data.movie_results && data.movie_results.length > 0) {
    return data.movie_results[0].id
  }

  return null
}

/**
 * Get top rated movies from TMDB (similar to IMDB Top 250)
 * @param pages Number of pages to fetch (20 movies per page)
 */
export async function getTopRatedMovies(pages: number = 5): Promise<TMDBSearchResult[]> {
  if (!TMDB_API_KEY) {
    console.warn('TMDB API key not configured')
    return []
  }

  const allMovies: TMDBSearchResult[] = []

  for (let page = 1; page <= pages; page++) {
    const params = new URLSearchParams({
      api_key: TMDB_API_KEY,
      page: page.toString(),
      language: 'en-US',
    })

    const response = await fetch(`${TMDB_API_BASE}/movie/top_rated?${params}`)

    if (!response.ok) {
      throw new Error(`TMDB fetch failed: ${response.statusText}`)
    }

    const data: TMDBListResult = await response.json()
    allMovies.push(...data.results)

    // Small delay to avoid rate limiting
    if (page < pages) {
      await new Promise((r) => setTimeout(r, 100))
    }
  }

  return allMovies
}
