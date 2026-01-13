import { useState, useMemo } from 'react'
import { cn } from '../../lib/utils'
import { START_HOURS, formatHour } from '../../types'

interface DateTimePickerProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (date: string, hour: number) => void
}

function getMonthDays(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const weeks: (number | null)[][] = []
  let currentWeek: (number | null)[] = []

  // Add empty cells for days before the first of the month
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null)
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Fill the last week with empty cells
  while (currentWeek.length < 7 && currentWeek.length > 0) {
    currentWeek.push(null)
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  return weeks
}

function formatDateDisplay(date: string, hour: number): string {
  const d = new Date(date + 'T12:00:00')
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return `${dayNames[d.getDay()]} ${monthNames[d.getMonth()]} ${d.getDate()} @ ${formatHour(hour)}`
}

export function DateTimePicker({ isOpen, onClose, onConfirm }: DateTimePickerProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)

  const todayStr = today.toISOString().split('T')[0]

  const weeks = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth])

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const handleDayClick = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
  }

  const handleConfirm = () => {
    if (selectedDate && selectedHour) {
      onConfirm(selectedDate, selectedHour)
      // Reset state
      setSelectedDate(null)
      setSelectedHour(null)
    }
  }

  const handleClose = () => {
    setSelectedDate(null)
    setSelectedHour(null)
    onClose()
  }

  // Check if we can go to previous month (don't go before current month)
  const canGoPrev = viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth())

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">Suggest a Time</h3>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {/* Calendar and Hours side by side on larger screens */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Calendar */}
            <div className="flex-1">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={handlePrevMonth}
                  disabled={!canGoPrev}
                  className={cn(
                    'p-1 rounded transition-colors',
                    canGoPrev
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                      : 'text-gray-700 cursor-not-allowed'
                  )}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-gray-200 font-medium">{monthLabel}</span>
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-xs text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="space-y-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1">
                    {week.map((day, dayIndex) => {
                      if (day === null) {
                        return <div key={dayIndex} className="h-8" />
                      }

                      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      const isPast = dateStr < todayStr
                      const isToday = dateStr === todayStr
                      const isSelected = dateStr === selectedDate

                      return (
                        <button
                          key={dayIndex}
                          onClick={() => !isPast && handleDayClick(day)}
                          disabled={isPast}
                          className={cn(
                            'h-8 rounded text-sm font-medium transition-colors',
                            isPast && 'text-gray-700 cursor-not-allowed',
                            !isPast && !isSelected && 'text-gray-300 hover:bg-gray-800',
                            isToday && !isSelected && 'ring-1 ring-primary-500',
                            isSelected && 'bg-primary-600 text-white'
                          )}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Hour buttons */}
            <div className="sm:w-32">
              <p className="text-xs text-gray-400 mb-2 text-center sm:text-left">Start time</p>
              <div className="grid grid-cols-5 sm:grid-cols-3 gap-1">
                {START_HOURS.map((hour) => (
                  <button
                    key={hour}
                    onClick={() => setSelectedHour(hour)}
                    className={cn(
                      'px-2 py-2 text-sm rounded transition-colors',
                      selectedHour === hour
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    )}
                  >
                    {formatHour(hour)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selection summary */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            {selectedDate && selectedHour ? (
              <p className="text-center text-gray-200 mb-4">
                <span className="text-primary-400">Selected:</span>{' '}
                {formatDateDisplay(selectedDate, selectedHour)}
              </p>
            ) : (
              <p className="text-center text-gray-500 mb-4">
                {!selectedDate ? 'Pick a date' : 'Pick a time'}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedDate || !selectedHour}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg font-medium transition-colors',
                  selectedDate && selectedHour
                    ? 'bg-primary-600 text-white hover:bg-primary-500'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                )}
              >
                Suggest This Time
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
