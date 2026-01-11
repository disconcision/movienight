# Movie Night Coordinator

A collaborative web app for coordinating movie nights with friends. Users select movies they haven't seen from a shared list, prioritize their selections, and view the group's collective "unseen intersection."

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

## Features

- **Movie Grid**: Browse movies with poster images and details
- **User Identity**: Simple name-based identification (no auth required)
- **Mark Unseen**: Track which movies you haven't seen yet
- **Priority Queue**: Drag-and-drop to rank your unseen movies
- **Group View**: See what movies everyone in the group hasn't seen
- **Scheduling**: Coordinate availability and schedule movie nights

## Tech Stack

- React 18 + TypeScript
- Tailwind CSS
- Firebase Firestore (real-time sync)
- dnd-kit (drag-and-drop)
- Framer Motion (animations)
- TMDB API (movie data)
- Vitest (testing)

## Development

The app runs in **demo mode** with mock data until Firebase is configured.

See `claude.md` for:
- Full setup instructions
- Firebase configuration guide
- Development workflow
- Agent handoff notes

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

## License

MIT
