import type { User, Movie, AggregateMovieScore } from '../types'

/**
 * Compute the aggregate priority score for a movie across all users.
 * Higher score = higher aggregate priority.
 *
 * For each user who has the movie in their unseen list:
 * score += (listLength - positionIndex)
 *
 * This gives movies ranked higher (lower index) more weight.
 */
export function computeAggregateScore(movieId: string, users: User[]): number {
  return users.reduce((score, user) => {
    const index = user.unseenMovies.indexOf(movieId)
    if (index === -1) return score
    return score + (user.unseenMovies.length - index)
  }, 0)
}

/**
 * Get the intersection of unseen movies across all users.
 * Returns movie IDs that ALL users have in their unseen list.
 */
export function getUnseenIntersection(users: User[]): string[] {
  if (users.length === 0) return []

  // Start with the first user's unseen movies
  const firstUserUnseen = new Set(users[0].unseenMovies)

  // Intersect with each subsequent user
  for (let i = 1; i < users.length; i++) {
    const userUnseen = new Set(users[i].unseenMovies)
    for (const movieId of firstUserUnseen) {
      if (!userUnseen.has(movieId)) {
        firstUserUnseen.delete(movieId)
      }
    }
  }

  return Array.from(firstUserUnseen)
}

/**
 * Get the intersection of unseen movies sorted by aggregate priority score.
 */
export function getIntersectionWithScores(
  users: User[],
  movies: Movie[]
): AggregateMovieScore[] {
  const intersection = getUnseenIntersection(users)
  const movieMap = new Map(movies.map((m) => [m.tmdbId, m]))

  return intersection
    .map((movieId) => ({
      movieId,
      score: computeAggregateScore(movieId, users),
      movie: movieMap.get(movieId)!,
    }))
    .filter((item) => item.movie) // Filter out any movies not in the movies map
    .sort((a, b) => b.score - a.score) // Sort by score descending
}

/**
 * Count how many users have a movie in their unseen list.
 */
export function countUnseenBy(movieId: string, users: User[]): number {
  return users.filter((user) => user.unseenMovies.includes(movieId)).length
}
