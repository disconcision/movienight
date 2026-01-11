import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Movie } from '../../types'
import { getPosterUrl, getImdbUrl } from '../../lib/mockData'
import { formatRuntime, truncateText, cn } from '../../lib/utils'

interface MovieCardProps {
  movie: Movie
  isUnseen?: boolean
  unseenCount?: number
  onToggleUnseen?: () => void
}

export function MovieCard({
  movie,
  isUnseen = false,
  unseenCount = 0,
  onToggleUnseen,
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const imdbUrl = getImdbUrl(movie.imdbId)

  const handleCardClick = () => {
    if (onToggleUnseen) {
      onToggleUnseen()
    }
  }

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (imdbUrl) {
      window.open(imdbUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <motion.div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Card */}
      <div
        className={cn(
          'relative aspect-[2/3] rounded-xl overflow-hidden transition-all duration-300',
          'shadow-lg hover:shadow-2xl hover:scale-105',
          onToggleUnseen && 'cursor-pointer',
          isUnseen ? 'ring-2 ring-primary-500' : 'opacity-75 hover:opacity-100'
        )}
        onClick={handleCardClick}
      >
        {/* Poster Image */}
        <img
          src={getPosterUrl(movie.posterPath)}
          alt={movie.title}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-700 animate-pulse" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
            {movie.title}
          </h3>
          <p className="text-gray-300 text-xs mt-1">{movie.year}</p>
        </div>

        {/* Unseen count badge */}
        {unseenCount > 0 && (
          <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            {unseenCount}
          </div>
        )}

        {/* Unseen checkmark indicator */}
        {isUnseen && (
          <div className="absolute top-2 left-2">
            <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Info button - shows on hover */}
        {imdbUrl && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0.7 }}
            whileHover={{ scale: 1.1 }}
            className="absolute bottom-12 right-2 w-8 h-8 bg-gray-900/80 hover:bg-gray-800 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            onClick={handleInfoClick}
            title="View on IMDB"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Hover details card - desktop only */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:block absolute z-50 left-full top-0 ml-4 w-72 bg-gray-800 rounded-xl shadow-2xl p-4 pointer-events-none"
        >
          <h4 className="text-lg font-semibold text-white">{movie.title}</h4>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
            <span>{movie.year}</span>
            <span>•</span>
            <span>{formatRuntime(movie.runtime)}</span>
            {movie.rating && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {movie.rating.toFixed(1)}
                </span>
              </>
            )}
          </div>

          {movie.director && (
            <p className="mt-2 text-sm text-gray-400">
              <span className="text-gray-500">Director:</span> {movie.director}
            </p>
          )}

          {movie.cast.length > 0 && (
            <p className="mt-1 text-sm text-gray-400">
              <span className="text-gray-500">Cast:</span> {movie.cast.slice(0, 3).join(', ')}
            </p>
          )}

          {movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          <p className="mt-3 text-sm text-gray-400 leading-relaxed">
            {truncateText(movie.overview, 150)}
          </p>

          <p className="mt-3 text-xs text-primary-400">
            Click card to {isUnseen ? 'remove from' : 'add to'} your list
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
