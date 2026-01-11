import { describe, it, expect } from 'vitest'
import {
  validateUsername,
  normalizeUsername,
  formatRuntime,
  truncateText,
  cn,
} from './utils'

describe('validateUsername', () => {
  it('rejects names shorter than 2 characters', () => {
    expect(validateUsername('A')).toEqual({
      valid: false,
      error: 'Name must be at least 2 characters',
    })
    expect(validateUsername(' ')).toEqual({
      valid: false,
      error: 'Name must be at least 2 characters',
    })
  })

  it('rejects names longer than 30 characters', () => {
    const longName = 'A'.repeat(31)
    expect(validateUsername(longName)).toEqual({
      valid: false,
      error: 'Name must be 30 characters or less',
    })
  })

  it('rejects names with special characters', () => {
    expect(validateUsername('John@Doe')).toEqual({
      valid: false,
      error: 'Name can only contain letters, numbers, and spaces',
    })
    expect(validateUsername('John-Doe')).toEqual({
      valid: false,
      error: 'Name can only contain letters, numbers, and spaces',
    })
  })

  it('accepts valid names', () => {
    expect(validateUsername('John')).toEqual({ valid: true })
    expect(validateUsername('John Doe')).toEqual({ valid: true })
    expect(validateUsername('John123')).toEqual({ valid: true })
    expect(validateUsername('AB')).toEqual({ valid: true })
  })

  it('trims whitespace before validation', () => {
    expect(validateUsername('  John  ')).toEqual({ valid: true })
  })
})

describe('normalizeUsername', () => {
  it('lowercases the name', () => {
    expect(normalizeUsername('John')).toBe('john')
    expect(normalizeUsername('JOHN')).toBe('john')
  })

  it('trims whitespace', () => {
    expect(normalizeUsername('  john  ')).toBe('john')
  })
})

describe('formatRuntime', () => {
  it('returns N/A for null', () => {
    expect(formatRuntime(null)).toBe('N/A')
  })

  it('formats minutes only', () => {
    expect(formatRuntime(45)).toBe('45m')
  })

  it('formats hours only', () => {
    expect(formatRuntime(120)).toBe('2h')
  })

  it('formats hours and minutes', () => {
    expect(formatRuntime(90)).toBe('1h 30m')
    expect(formatRuntime(142)).toBe('2h 22m')
  })
})

describe('truncateText', () => {
  it('returns text as-is if under limit', () => {
    expect(truncateText('Hello', 10)).toBe('Hello')
  })

  it('truncates with ellipsis', () => {
    expect(truncateText('Hello World', 8)).toBe('Hello...')
  })

  it('handles edge case at exact limit', () => {
    expect(truncateText('Hello', 5)).toBe('Hello')
  })
})

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('filters falsy values', () => {
    expect(cn('foo', false, null, undefined, 'bar')).toBe('foo bar')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })
})
