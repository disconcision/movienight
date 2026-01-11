# Claude Agent Instructions — Movie Night Coordinator

## Project Overview

This is a collaborative web app for coordinating movie nights with friends. Users select movies they haven't seen, prioritize them, view the group's collective "unseen intersection," and schedule movie nights.

**Key Documents:**
- `PROJECT_PLAN.md` — Full specification with data models, features, and architecture
- This file (`claude.md`) — Agent workflow instructions

## Current Status

**Phase:** Core Features Complete
**Last Updated:** Initial development session
**Next Milestone:** TMDB API integration and movie search

### What's Working
- User identification with localStorage persistence
- Movie grid with poster images and hover details
- Toggle unseen status on movies
- Priority list with drag-and-drop reordering (dnd-kit)
- Group view showing all users and their lists
- Intersection list with aggregate priority scoring
- Mobile-responsive with tab navigation
- Demo mode with mock movie data

### What Needs Firebase
- Real-time sync between users
- Persistent storage across devices
- Seed script to populate IMDB Top 250

## Development Workflow

### Before Starting Work

1. Read `PROJECT_PLAN.md` to understand the full specification
2. Check the TODO sections below for current priorities
3. Run `npm run dev` to verify the app builds/runs
4. Run `npm test` to verify tests pass

### Git Practices

- **Commit incrementally** after each logical unit of work
- **Commit messages** should be descriptive
- **Push regularly** to the feature branch
- **Never push to main** without explicit permission

### Code Standards

- TypeScript strict mode — no `any` types
- Functional style — prefer pure functions, avoid classes, minimize mutation
- Components should be small and composable
- Business logic separated from UI (custom hooks, utility functions)
- All Firestore operations through the `src/db/` module
- Mobile-first responsive design

### Testing

- Run tests before committing: `npm test`
- Test pure functions (lib/), not Firebase internals
- Fix failing tests before moving on

## TODO — Current Priorities

### Phase 1: Foundation (MVP) ✅
- [x] Project scaffolding (Vite + React + TypeScript + Tailwind)
- [x] Firebase configuration module (works offline with mock data)
- [x] TypeScript types defined
- [x] User identification flow (name entry modal, localStorage)
- [x] Basic movie grid with mock data

### Phase 2: Core Movie Features (Partially Complete)
- [ ] Seed script for IMDB Top 250
- [x] Movie grid display
- [x] Hover cards with movie details
- [x] Click to open IMDB link
- [ ] TMDB API integration for search

### Phase 3: Selection & Prioritization ✅
- [x] Toggle "unseen" status on movies
- [x] Personal unseen list sidebar
- [x] Drag-and-drop reordering (dnd-kit)
- [x] localStorage persistence for demo mode
- [ ] Firestore sync (requires Firebase setup)

### Phase 4: Group Features ✅
- [x] Group view showing all users
- [x] User list expansion with movie previews
- [x] Intersection list calculation
- [x] Aggregate priority scoring with visual bars
- [x] Desktop floating panel and mobile tab

### Phase 5: Movie Management
- [ ] TMDB search integration
- [ ] Add movies to master list
- [ ] Remove movies from master list

### Phase 6: Scheduling
- [ ] Availability grid UI
- [ ] Availability Firestore sync
- [ ] "Best times" calculation
- [ ] Create/view scheduled events
- [ ] "Mark as watched" functionality

### Phase 7: Polish
- [x] Mobile responsiveness (tabs, layouts)
- [x] Basic animations (Framer Motion)
- [ ] Error handling and loading states
- [ ] Accessibility pass

## Firebase Setup (For Human)

When ready to connect to Firebase, follow these steps:

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Create a project"
3. Enter project name (e.g., "movie-night-app")
4. Disable Google Analytics (not needed)
5. Click "Create project"

### 2. Enable Firestore Database
1. In Firebase Console sidebar: **Build → Firestore Database**
2. Click "Create database"
3. Select "Start in **test mode**" (allows all reads/writes)
4. Choose a region close to your users (e.g., us-central1)
5. Click "Enable"

### 3. Register Web App
1. Go to **Project Settings** (gear icon in sidebar)
2. Scroll to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Enter a nickname (e.g., "movie-night-web")
5. Skip Firebase Hosting for now
6. Click "Register app"

### 4. Copy Config to .env.local
Create a file called `.env.local` in the project root (this file is gitignored):

```env
VITE_FIREBASE_API_KEY=AIza...your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 5. Get TMDB API Key (for movie search)
1. Create account at https://www.themoviedb.org
2. Go to **Settings → API** (in your profile)
3. Click "Create" under Request an API Key
4. Select "Developer"
5. Fill out the form (use personal/hobby for type)
6. Copy the "API Key (v3 auth)"
7. Add to `.env.local`:
   ```
   VITE_TMDB_API_KEY=your-tmdb-api-key
   ```

### 6. Restart Dev Server
After creating `.env.local`, restart the dev server:
```bash
npm run dev
```

The app will now connect to Firebase and show "Online" instead of "Demo mode".

### 7. (Optional) Deploy Firestore Rules
To deploy the security rules:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore  # Select your existing project
firebase deploy --only firestore:rules
```

## Notes for Handoff

- The app works fully in demo mode with mock data
- Selections are persisted to localStorage in demo mode
- Once `.env.local` is configured, it connects to real Firestore
- The seed script (`scripts/seed-movies.ts`) requires both Firebase and TMDB credentials
- Run `npm test` to verify nothing is broken
- Check `package.json` scripts for available commands

## Architecture Notes

### Key Directories
- `src/components/` — UI components organized by feature
- `src/hooks/` — Custom React hooks for state management
- `src/db/` — Firebase/Firestore operations
- `src/lib/` — Pure utility functions (tested)
- `src/types/` — TypeScript interfaces

### State Management
- User identity: localStorage + Firestore
- Unseen movies: useUnseenMovies hook (localStorage or Firestore)
- Movie data: useMovies hook (mock data or Firestore subscription)
- Users list: useUsers hook (Firestore subscription)

### Testing
- `src/lib/priority.test.ts` — Priority calculation tests
- `src/lib/utils.test.ts` — Utility function tests
