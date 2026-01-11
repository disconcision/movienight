import { describe, it, expect } from 'vitest'
import {
  computeAggregateScore,
  getUnseenIntersection,
  countUnseenBy,
} from './priority'
import type { User } from '../types'

const createUser = (name: string, unseenMovies: string[]): User => ({
  name,
  unseenMovies,
  createdAt: new Date(),
  updatedAt: new Date(),
})

describe('computeAggregateScore', () => {
  it('returns 0 for empty users', () => {
    expect(computeAggregateScore('movie1', [])).toBe(0)
  })

  it('returns 0 if no users have the movie', () => {
    const users = [
      createUser('Alice', ['movie2', 'movie3']),
      createUser('Bob', ['movie4']),
    ]
    expect(computeAggregateScore('movie1', users)).toBe(0)
  })

  it('computes score correctly for single user', () => {
    const users = [createUser('Alice', ['movie1', 'movie2', 'movie3'])]
    // movie1 is at index 0, list length is 3
    // score = 3 - 0 = 3
    expect(computeAggregateScore('movie1', users)).toBe(3)
    // movie3 is at index 2, list length is 3
    // score = 3 - 2 = 1
    expect(computeAggregateScore('movie3', users)).toBe(1)
  })

  it('sums scores across multiple users', () => {
    const users = [
      createUser('Alice', ['movie1', 'movie2']), // movie1: 2-0=2
      createUser('Bob', ['movie2', 'movie1', 'movie3']), // movie1: 3-1=2
    ]
    expect(computeAggregateScore('movie1', users)).toBe(4)
  })
})

describe('getUnseenIntersection', () => {
  it('returns empty array for no users', () => {
    expect(getUnseenIntersection([])).toEqual([])
  })

  it('returns all movies for single user', () => {
    const users = [createUser('Alice', ['movie1', 'movie2'])]
    expect(getUnseenIntersection(users)).toEqual(['movie1', 'movie2'])
  })

  it('returns intersection of multiple users', () => {
    const users = [
      createUser('Alice', ['movie1', 'movie2', 'movie3']),
      createUser('Bob', ['movie2', 'movie3', 'movie4']),
    ]
    const result = getUnseenIntersection(users)
    expect(result).toContain('movie2')
    expect(result).toContain('movie3')
    expect(result).not.toContain('movie1')
    expect(result).not.toContain('movie4')
  })

  it('returns empty when no common movies', () => {
    const users = [
      createUser('Alice', ['movie1', 'movie2']),
      createUser('Bob', ['movie3', 'movie4']),
    ]
    expect(getUnseenIntersection(users)).toEqual([])
  })
})

describe('countUnseenBy', () => {
  it('returns 0 for empty users', () => {
    expect(countUnseenBy('movie1', [])).toBe(0)
  })

  it('counts users who have the movie in their list', () => {
    const users = [
      createUser('Alice', ['movie1', 'movie2']),
      createUser('Bob', ['movie2', 'movie3']),
      createUser('Carol', ['movie1', 'movie3']),
    ]
    expect(countUnseenBy('movie1', users)).toBe(2)
    expect(countUnseenBy('movie2', users)).toBe(2)
    expect(countUnseenBy('movie3', users)).toBe(2)
    expect(countUnseenBy('movie4', users)).toBe(0)
  })
})
