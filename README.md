# Movie Night Coordinator

A collaborative web app for coordinating movie nights with friends. No accounts needed — just share the link!

## How It Works

1. **Enter your name** — No sign-up required, just pick a unique name
2. **Browse movies** — Sorted by rating, searchable by title/year/director/genre
3. **Mark what you haven't seen** — Click the eye icon on any movie poster
4. **Prioritize your list** — Drag and drop to rank your unseen movies
5. **Mark your availability** — Check the Schedule tab to mark afternoons/evenings you're free
6. **See the group consensus** — The app shows movies everyone wants to see, ranked by priority
7. **Plan your movie night** — The summary shows the best time slot and top pick

The app automatically syncs in real-time across all devices — perfect for coordinating with friends!

## Features

- **Movie Grid** — Browse movies with posters, ratings, and details (sorted by rating)
- **Search & Filter** — Find movies by title, year, director, or genre
- **Priority Queue** — Drag-and-drop to rank your unseen movies
- **Group Intersection** — See movies that everyone in the group wants to watch
- **Priority Scoring** — Movies ranked higher by more people get higher scores
- **Availability Scheduling** — Mark when you're free (afternoon/evening slots)
- **Movie Night Summary** — See the best upcoming time slot and top movie pick
- **TMDB Integration** — Search and add any movie from The Movie Database
- **Seed from Top Rated** — Quickly populate with TMDB's top-rated movies
- **Real-time Sync** — Changes sync instantly across all devices via Firebase
- **No Authentication** — Simple name-based identity, no passwords

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode (uses mock data)
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Tech Stack

- **Frontend**: React 18 + TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore (real-time sync)
- **Drag & Drop**: dnd-kit
- **Movie Data**: TMDB API
- **Build**: Vite
- **Testing**: Vitest

## Development

The app runs in **demo mode** with mock data until Firebase is configured.

See `claude.md` for:
- Firebase configuration guide
- TMDB API setup
- Development workflow
- Deployment instructions

See `PROJECT_PLAN.md` for the complete specification.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_TMDB_API_KEY=
```

## Contributing

Issues and pull requests are welcome! This project is actively maintained.

- Found a bug? [Open an issue](https://github.com/disconcision/movienight/issues)
- Have a feature idea? [Start a discussion](https://github.com/disconcision/movienight/issues)
- Want to contribute? Fork, make changes, and submit a PR

## License

MIT

