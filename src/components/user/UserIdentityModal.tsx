import { useState, type FormEvent } from 'react'
import { Modal, Button, Input } from '../ui'
import { validateUsername } from '../../lib/utils'

interface UserIdentityModalProps {
  isOpen: boolean
  onLogin: (name: string) => Promise<{ success: boolean; error?: string }>
}

export function UserIdentityModal({ isOpen, onLogin }: UserIdentityModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(undefined)

    const validation = validateUsername(name)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setIsSubmitting(true)
    const result = await onLogin(name.trim())
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error || 'Failed to login')
    }
  }

  return (
    <Modal isOpen={isOpen} title="Welcome to Movie Night!" showCloseButton={false}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-gray-400">
          Enter your name to join the group. Your friends will see this name.
        </p>

        <Input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          autoFocus
          disabled={isSubmitting}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Joining...' : 'Join'}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          2-30 characters, letters, numbers, and spaces only
        </p>
      </form>
    </Modal>
  )
}
