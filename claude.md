# Claude Agent Instructions — Movie Night Coordinator

## Project Overview

This is a collaborative web app for coordinating movie nights with friends. Users select movies they haven't seen, prioritize them, view the group's collective "unseen intersection," and schedule movie nights.

**Key Documents:**
- `PROJECT_PLAN.md` — Full specification with data models, features, and architecture
- This file (`claude.md`) — Agent workflow instructions

## Current Status

**Phase:** Foundation & MVP
**Next Milestone:** Get basic app running with mock data

## Development Workflow

### Before Starting Work

1. Read `PROJECT_PLAN.md` to understand the full specification
2. Check the TODO sections below for current priorities
3. Run `npm run dev` to verify the app builds/runs
4. Run `npm test` to verify tests pass

### Git Practices

- **Commit incrementally** after each logical unit of work
- **Commit messages** should be descriptive (e.g., "Add user identification modal with localStorage persistence")
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

### Phase 1: Foundation (MVP)
- [x] Project scaffolding (Vite + React + TypeScript + Tailwind)
- [x] Firebase configuration module (placeholder until user sets up Firebase)
- [x] TypeScript types defined
- [x] User identification flow (name entry modal, localStorage)
- [x] Basic movie grid with mock data
- [ ] Connect to Firebase when credentials available

### Phase 2: Core Movie Features
- [ ] Seed script for IMDB Top 250
- [ ] Movie grid with real Firestore data
- [ ] Hover cards with movie details
- [ ] Click to open IMDB link
- [ ] TMDB API integration

### Phase 3: Selection & Prioritization
- [ ] Toggle "unseen" status on movies
- [ ] Personal unseen list sidebar
- [ ] Drag-and-drop reordering (dnd-kit)
- [ ] Firestore sync for user selections

### Phase 4: Group Features
- [ ] Group view showing all users
- [ ] Intersection list calculation
- [ ] Aggregate priority scoring

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
- [ ] Mobile responsiveness refinements
- [ ] Animation polish (Framer Motion)
- [ ] Error handling and loading states
- [ ] Accessibility pass

## Firebase Setup (For Human)

When ready to connect to Firebase, the human should:

1. **Create Firebase Project:**
   - Go to https://console.firebase.google.com
   - Create new project (e.g., "movie-night-coordinator")
   - Disable Google Analytics (not needed)

2. **Enable Firestore:**
   - In Firebase Console → Build → Firestore Database
   - Click "Create database"
   - Start in **test mode** (allows all reads/writes for 30 days)
   - Choose a region close to your users

3. **Get Web App Config:**
   - Project Settings (gear icon) → General → Your apps
   - Click web icon (`</>`) to add a web app
   - Register app (any nickname)
   - Copy the `firebaseConfig` object values

4. **Create `.env.local`:**
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

5. **Get TMDB API Key:**
   - Create account at https://www.themoviedb.org
   - Go to Settings → API → Create → Developer
   - Copy API Key (v3 auth)
   - Add to `.env.local`: `VITE_TMDB_API_KEY=your-tmdb-key`

6. **Deploy Firestore Rules (later):**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore  # Select existing project
   firebase deploy --only firestore:rules
   ```

## Notes for Handoff

- The MVP uses mock data and works without Firebase credentials
- Once `.env.local` is configured, the app will connect to real Firestore
- The seed script (`scripts/seed-movies.ts`) requires both Firebase and TMDB credentials
- Check `package.json` scripts for available commands
