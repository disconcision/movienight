/**
 * Validate a username
 * - 2-30 characters
 * - Alphanumeric + spaces only
 */
export function validateUsername(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim()

  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' }
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Name must be 30 characters or less' }
  }

  if (!/^[a-zA-Z0-9 ]+$/.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters, numbers, and spaces' }
  }

  return { valid: true }
}

/**
 * Normalize a username for storage/comparison
 */
export function normalizeUsername(name: string): string {
  return name.toLowerCase().trim()
}

/**
 * Format runtime in minutes to hours and minutes
 */
export function formatRuntime(minutes: number | null): string {
  if (!minutes) return 'N/A'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3).trim() + '...'
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

/**
 * Class name utility (simple version of clsx)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
