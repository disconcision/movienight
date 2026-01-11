import { useMemo, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

interface MovieItemContentProps {
  movie: Movie
  index: number
  isDragOverlay?: boolean
  onRemove?: () => void
}

function MovieItemContent({ movie, index, isDragOverlay = false, onRemove }: MovieItemContentProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg group',
        isDragOverlay
          ? 'bg-gray-700 shadow-2xl ring-2 ring-primary-500 scale-105'
          : 'bg-gray-800'
      )}
    >
      {/* Drag handle */}
      <div
        className={cn(
          'p-1 text-gray-500',
          isDragOverlay ? 'cursor-grabbing' : 'cursor-grab hover:text-gray-300'
        )}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </div>

      {/* Rank number */}
      <span className={cn(
        'text-sm font-bold w-6 text-center',
        isDragOverlay ? 'text-primary-300' : 'text-primary-400'
      )}>
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

      {/* Remove button - hidden in overlay */}
      {!isDragOverlay && onRemove && (
        <button
          onClick={onRemove}
          className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Mark as seen"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
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
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'touch-none transition-all duration-200',
        isDragging && 'opacity-40 scale-95'
      )}
    >
      <MovieItemContent
        movie={movie}
        index={index}
        onRemove={onRemove}
      />
    </div>
  )
}

export function UnseenList({
  movies,
  unseenMovieIds,
  onReorder,
  onRemove,
}: UnseenListProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts
      },
    }),
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

  // Find the active movie for the drag overlay
  const activeMovie = useMemo(() => {
    if (!activeId) return null
    return orderedMovies.find(m => m.tmdbId === activeId) ?? null
  }, [activeId, orderedMovies])

  const activeIndex = activeId ? unseenMovieIds.indexOf(activeId) : -1

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = unseenMovieIds.indexOf(active.id as string)
      const newIndex = unseenMovieIds.indexOf(over.id as string)
      const newOrder = arrayMove(unseenMovieIds, oldIndex, newIndex)
      onReorder(newOrder)
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
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
          Click movies to add them to your list
        </p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={unseenMovieIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {orderedMovies.map((movie, index) => (
            <SortableMovieItem
              key={movie.tmdbId}
              movie={movie}
              index={index}
              onRemove={() => onRemove(movie.tmdbId)}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag overlay - follows cursor */}
      <DragOverlay>
        {activeMovie && (
          <MovieItemContent
            movie={activeMovie}
            index={activeIndex}
            isDragOverlay
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
