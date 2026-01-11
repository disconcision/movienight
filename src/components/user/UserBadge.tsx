import { useState } from 'react'
import { Button } from '../ui'

interface UserBadgeProps {
  name: string
  onLogout: () => void
  isFirebaseConnected: boolean
}

export function UserBadge({ name, onLogout, isFirebaseConnected }: UserBadgeProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
          {name.charAt(0).toUpperCase()}
        </div>
        <span className="text-gray-200">{name}</span>
        {!isFirebaseConnected && (
          <span className="text-xs px-1.5 py-0.5 bg-yellow-600/20 text-yellow-400 rounded">
            Offline
          </span>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl z-20 py-1">
            <div className="px-4 py-2 border-b border-gray-700">
              <p className="text-sm text-gray-400">Signed in as</p>
              <p className="text-gray-200 font-medium truncate">{name}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
              onClick={() => {
                setShowMenu(false)
                onLogout()
              }}
            >
              Switch User
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
