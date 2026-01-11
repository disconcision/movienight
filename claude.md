# Claude Agent Instructions — Movie Night Coordinator

## Project Overview

This is a collaborative web app for coordinating movie nights with friends. Users select movies they haven't seen, prioritize them, view the group's collective "unseen intersection," and schedule movie nights.

**Key Documents:**
- `PROJECT_PLAN.md` — Full specification with data models, features, and architecture
- This file (`claude.md`) — Agent workflow instructions

## Current Status

**Phase:** Core Features Complete
**Last Updated:** Initial development session
**Live Preview:** https://disconcision.github.io/movienight/ (after GitHub Pages is enabled)
**Next Milestone:** Firebase integration and TMDB API

### What's Working
- User identification with localStorage persistence
- Movie grid with poster images and hover details
- Toggle unseen status on movies
- Priority list with drag-and-drop reordering (dnd-kit)
- Group view showing all users and their lists
- Intersection list with aggregate priority scoring
- Mobile-responsive with tab navigation
- Demo mode with mock movie data
- GitHub Actions workflow for auto-deploy

### What Needs Setup (By Human)
- GitHub Pages enabled in repo settings
- Firebase project created + secrets added to GitHub
- TMDB API key added to GitHub secrets

## GitHub Pages Deployment

The app auto-deploys to GitHub Pages on every push. To enable:

### Enable GitHub Pages (One-time, via GitHub UI)
1. Go to your repo: https://github.com/disconcision/movienight
2. Click **Settings** (tab at top)
3. In sidebar, click **Pages**
4. Under "Build and deployment":
   - Source: **GitHub Actions**
5. That's it! The workflow will deploy on next push.

**Live URL will be:** https://disconcision.github.io/movienight/

The app works in demo mode without any secrets configured. Add secrets later to enable Firebase sync.

## Adding GitHub Secrets (Via GitHub UI)

All secrets are added through the GitHub web interface. No local commands needed.

### How to Add a Secret
1. Go to: https://github.com/disconcision/movienight/settings/secrets/actions
2. Click **New repository secret**
3. Enter the name and value
4. Click **Add secret**

### Required Secrets (Optional - app works without them)

After setting up Firebase and TMDB, add these secrets:

| Secret Name | Where to Get It |
|-------------|-----------------|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your apps → Config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same location (format: `project-id.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Same location |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same location (format: `project-id.appspot.com`) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same location |
| `VITE_FIREBASE_APP_ID` | Same location |
| `VITE_TMDB_API_KEY` | TMDB website → Settings → API |

## Firebase Setup (All Via Web UI)

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click **"Create a project"**
3. Enter project name: `movienight` (or any name)
4. **Disable** Google Analytics (not needed)
5. Click **"Create project"**
6. Wait for it to complete, then click **"Continue"**

### 2. Enable Firestore Database
1. In the left sidebar, click **Build → Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** (allows reads/writes for 30 days)
4. Choose a location close to you (e.g., `us-central1` or `us-east1`)
5. Click **"Enable"**

### 3. Register Web App & Get Config
1. Click the **gear icon** (top left) → **Project settings**
2. Scroll down to **"Your apps"** section
3. Click the **web icon** (`</>`)
4. Enter nickname: `movienight-web`
5. **Skip** Firebase Hosting checkbox
6. Click **"Register app"**
7. You'll see a config object like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "movienight-abc123.firebaseapp.com",
     projectId: "movienight-abc123",
     storageBucket: "movienight-abc123.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123def456"
   };
   ```
8. Copy each value and add as GitHub secrets (see table above)

### 4. Get TMDB API Key
1. Go to https://www.themoviedb.org and create an account
2. Click your profile icon → **Settings**
3. In sidebar, click **API**
4. Click **"Create"** or **"Request an API Key"**
5. Select **"Developer"**
6. Fill out the form:
   - Type of use: Personal
   - Application name: Movie Night Coordinator
   - Application URL: `https://disconcision.github.io/movienight/`
   - Application summary: Personal movie coordination app
7. Accept terms and submit
8. Copy the **"API Key (v3 auth)"**
9. Add as GitHub secret: `VITE_TMDB_API_KEY`

### 5. Trigger Rebuild
After adding secrets, trigger a new deployment:
- Push any commit, OR
- Go to Actions tab → select workflow → click "Re-run all jobs"

## Development Workflow

### For Agents

1. Read this file and `PROJECT_PLAN.md` for context
2. Check TODO list below for priorities
3. Make changes, run `npm test`, commit incrementally
4. Push to trigger deployment

### Git Practices
- Commit incrementally after each logical unit
- Descriptive commit messages
- Push regularly to feature branch
- Don't push to main without permission

### Code Standards
- TypeScript strict mode — no `any` types
- Functional style — pure functions, minimal mutation
- Small, composable components
- Business logic in hooks/lib, not components
- Firestore ops through `src/db/` module

## TODO — Current Priorities

### Phase 1: Foundation ✅
- [x] Project scaffolding (Vite + React + TypeScript + Tailwind)
- [x] Firebase configuration module (works offline with mock data)
- [x] TypeScript types defined
- [x] User identification flow
- [x] Basic movie grid with mock data
- [x] GitHub Actions deployment

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
- [x] Aggregate priority scoring
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
- [x] Mobile responsiveness
- [x] Basic animations (Framer Motion)
- [ ] Error handling and loading states
- [ ] Accessibility pass

## Architecture Notes

### Key Directories
```
src/
├── components/     # UI components by feature
│   ├── movies/     # MovieGrid, MovieCard, UnseenList
│   ├── group/      # GroupView
│   ├── user/       # UserBadge, UserIdentityModal
│   └── ui/         # Generic Button, Modal, Input
├── hooks/          # Custom React hooks
├── db/             # Firebase/Firestore operations
├── lib/            # Pure utility functions (tested)
└── types/          # TypeScript interfaces
```

### State Flow
- **User identity:** localStorage → Firestore (when connected)
- **Unseen movies:** useUnseenMovies hook (localStorage or Firestore)
- **Movie data:** useMovies hook (mock data or Firestore)
- **Users list:** useUsers hook (Firestore subscription)

### Testing
- `npm test` — runs Vitest
- Tests in `src/lib/*.test.ts`
- Focus on pure functions, not Firebase/UI
