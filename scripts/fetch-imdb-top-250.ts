/**
 * IMDB Top 250 to TMDB ID Translation Script
 *
 * This script fetches the IMDB Top 250 list and translates each movie
 * to its TMDB ID using TMDB's find endpoint.
 *
 * Usage:
 *   TMDB_API_KEY=your_key npx tsx scripts/fetch-imdb-top-250.ts
 *
 * Output:
 *   src/data/imdb-top-250.json
 */

import * as fs from 'fs'
import * as path from 'path'

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY

if (!TMDB_API_KEY) {
  console.error('Error: TMDB_API_KEY or VITE_TMDB_API_KEY environment variable required')
  console.error('Usage: TMDB_API_KEY=your_key npx tsx scripts/fetch-imdb-top-250.ts')
  process.exit(1)
}

interface IMDBMovie {
  imdbId: string
  title: string
  year: string
  rank: number
}

interface TMDBFindResult {
  movie_results: Array<{
    id: number
    title: string
    release_date: string
  }>
}

interface OutputMovie {
  rank: number
  imdbId: string
  tmdbId: number
  title: string
  year: number
}

async function fetchIMDBTop250(): Promise<IMDBMovie[]> {
  console.log('Fetching IMDB Top 250 page...')

  const response = await fetch('https://www.imdb.com/chart/top/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch IMDB: ${response.status}`)
  }

  const html = await response.text()

  // IMDB uses JSON-LD structured data which is more reliable than scraping HTML
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)

  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1])
      if (jsonLd.itemListElement) {
        return jsonLd.itemListElement.map((item: any, index: number) => {
          const url = item.item?.url || item.url || ''
          const imdbIdMatch = url.match(/\/title\/(tt\d+)/)
          return {
            imdbId: imdbIdMatch ? imdbIdMatch[1] : '',
            title: item.item?.name || item.name || '',
            year: '', // Will be filled from TMDB
            rank: index + 1
          }
        }).filter((m: IMDBMovie) => m.imdbId)
      }
    } catch (e) {
      console.log('JSON-LD parsing failed, falling back to regex')
    }
  }

  // Fallback: regex extraction of IMDB IDs from the page
  const imdbIdPattern = /\/title\/(tt\d+)\//g
  const matches = new Set<string>()
  let match

  while ((match = imdbIdPattern.exec(html)) !== null) {
    matches.add(match[1])
  }

  // Take first 250 unique IDs
  const ids = Array.from(matches).slice(0, 250)

  return ids.map((id, index) => ({
    imdbId: id,
    title: '',
    year: '',
    rank: index + 1
  }))
}

async function translateToTMDB(imdbId: string): Promise<{ tmdbId: number; title: string; year: number } | null> {
  const url = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`

  const response = await fetch(url)

  if (!response.ok) {
    console.error(`  TMDB API error for ${imdbId}: ${response.status}`)
    return null
  }

  const data: TMDBFindResult = await response.json()

  if (data.movie_results && data.movie_results.length > 0) {
    const movie = data.movie_results[0]
    return {
      tmdbId: movie.id,
      title: movie.title,
      year: parseInt(movie.release_date?.split('-')[0] || '0', 10)
    }
  }

  return null
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('IMDB Top 250 to TMDB Translation Script\n')

  // Fetch IMDB list
  const imdbMovies = await fetchIMDBTop250()
  console.log(`Found ${imdbMovies.length} movies from IMDB\n`)

  if (imdbMovies.length === 0) {
    console.error('No movies found. IMDB may have changed their page structure.')
    process.exit(1)
  }

  // Translate each to TMDB
  const results: OutputMovie[] = []
  const failed: string[] = []

  for (let i = 0; i < imdbMovies.length; i++) {
    const movie = imdbMovies[i]
    process.stdout.write(`[${i + 1}/${imdbMovies.length}] Translating ${movie.imdbId}...`)

    const tmdbResult = await translateToTMDB(movie.imdbId)

    if (tmdbResult) {
      results.push({
        rank: movie.rank,
        imdbId: movie.imdbId,
        tmdbId: tmdbResult.tmdbId,
        title: tmdbResult.title,
        year: tmdbResult.year
      })
      console.log(` ${tmdbResult.title} (${tmdbResult.year})`)
    } else {
      failed.push(movie.imdbId)
      console.log(' FAILED')
    }

    // Rate limiting: TMDB allows ~40 requests per 10 seconds
    if (i < imdbMovies.length - 1) {
      await sleep(250)
    }
  }

  // Write output
  const outputDir = path.join(process.cwd(), 'src', 'data')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const outputPath = path.join(outputDir, 'imdb-top-250.json')
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Successfully translated: ${results.length}`)
  console.log(`Failed: ${failed.length}`)
  if (failed.length > 0) {
    console.log(`Failed IDs: ${failed.join(', ')}`)
  }
  console.log(`\nOutput written to: ${outputPath}`)
}

main().catch(err => {
  console.error('Script failed:', err)
  process.exit(1)
})
