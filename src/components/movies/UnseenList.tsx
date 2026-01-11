import { useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import type { Movie } from '../../types'
import { getPosterUrl } from '../../lib/mockData'
import { cn } from '../../lib/utils'

interface UnseenListProps {
  movies: Movie[]
  unseenMovieIds: string[]
  onReorder: (newOrder: string[]) => void
  onRemove: (movieId: string) => void
}

interface SortableMovieItemProps {
  movie: Movie
  index: number
  onRemove: () => void
}

function SortableMovieItem({ movie, index, onRemove }: SortableMovieItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: movie.tmdbId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center gap-3 p-2 bg-gray-800 rounded-lg group',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </button>

      {/* Rank number */}
      <span className="text-sm font-bold text-primary-400 w-6 text-center">
        {index + 1}
      </span>

      {/* Poster thumbnail */}
      <img
        src={getPosterUrl(movie.posterPath, 'w185')}
        alt=""
        className="w-10 h-14 object-cover rounded"
      />

      {/* Title and year */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">
          {movie.title}
        </p>
        <p className="text-xs text-gray-500">{movie.year}</p>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Mark as seen"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  )
}

export function UnseenList({
  movies,
  unseenMovieIds,
  onReorder,
  onRemove,
}: UnseenListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Get the movie objects in the order of unseenMovieIds
  const orderedMovies = useMemo(() => {
    const movieMap = new Map(movies.map((m) => [m.tmdbId, m]))
    return unseenMovieIds
      .map((id) => movieMap.get(id))
      .filter((m): m is Movie => m !== undefined)
  }, [movies, unseenMovieIds])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = unseenMovieIds.indexOf(active.id as string)
      const newIndex = unseenMovieIds.indexOf(over.id as string)
      const newOrder = arrayMove(unseenMovieIds, oldIndex, newIndex)
      onReorder(newOrder)
    }
  }

  if (orderedMovies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <p className="text-sm font-medium">No movies selected</p>
        <p className="text-xs text-gray-600 mt-1">
          Click movies to mark them as unseen
        </p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={unseenMovieIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {orderedMovies.map((movie, index) => (
              <SortableMovieItem
                key={movie.tmdbId}
                movie={movie}
                index={index}
                onRemove={() => onRemove(movie.tmdbId)}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  )
}
