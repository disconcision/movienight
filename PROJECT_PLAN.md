# Movie Night Coordinator — Project Specification

## Implementation Status

### Completed Features

- [x] **Phase 1: Foundation** — Project scaffolding, Firebase config, TypeScript types, user identity flow
- [x] **Phase 2: Core Movie Features** — Movie grid display, hover/tap details, IMDB links
- [x] **Phase 3: Selection & Prioritization** — Toggle unseen status, personal list, drag-drop reorder, Firestore sync
- [x] **Phase 4: Group Features** — Group view, intersection calculation, priority scoring algorithm
- [x] **Phase 5: Movie Management** — TMDB search, add/remove movies from master list
- [x] **Phase 6: Scheduling** — Availability grid (5 weeks), event creation

### Additional Features (Beyond Original Spec)

- [x] **Movie Night Summary** — Prominent UI showing best upcoming slot + top movie pick with runner-ups
- [x] **Search & Filter** — Search movies by title/year/director/genre, filter by seen/unseen
- [x] **TMDB Top Rated Seeding** — Seed database with top-rated movies (50/100/150/250)
- [x] **Settings Panel** — Manage users, movies, and data cleanup
- [x] **Default Sort by Rating** — Movie grid sorted by TMDB rating (highest first)
- [x] **Week Navigation** — Schedule view spans 5 weeks with navigation arrows
- [x] **GitHub Actions Deployment** — Automated CI/CD to GitHub Pages

### Remaining / Future Work

- [ ] **Animations** — Framer Motion animations for state changes (deferred for simplicity)
- [ ] **Error handling** — More robust error boundaries and user feedback
- [ ] **Accessibility** — ARIA labels, keyboard navigation improvements
- [ ] **Mobile refinements** — Bottom sheet details, gesture improvements
- [ ] **Mark as watched cascade** — When event marked watched, remove from all users' lists
- [ ] **Event confirmation** — RSVP/confirm attendance for scheduled events

---

## Overview

A collaborative web app for a friend group to coordinate movie watching. Users select movies they haven't seen from a shared list, prioritize their selections, view the group's collective "unseen intersection," and schedule movie nights based on availability.

**No authentication required** — users identify by name (stored locally). Single group, link-shareable.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18+ with TypeScript (strict mode) |
| Styling | Tailwind CSS |
| State/Data | Firebase Firestore (real-time sync) |
| Drag-and-drop | dnd-kit |
| Animations | Framer Motion |
| Movie data | TMDB API |
| Hosting | GitHub Pages (frontend), Firebase (database) |
| Testing | Vitest + React Testing Library |

## Architecture Principles

- Functional style: prefer pure functions, avoid classes, minimize mutation
- TypeScript strict mode with no `any` types
- Components should be small and composable
- Business logic separated from UI components (custom hooks, utility functions)
- All Firestore operations through a dedicated `src/db/` module

---

## Data Model

### Firestore Collections

```
/config (single document)
  movieList: string[]              // TMDB movie IDs in the master list

/movies/{tmdbId}
  tmdbId: string
  imdbId: string | null
  title: string
  year: number
  posterPath: string | null
  overview: string
  runtime: number | null
  genres: string[]
  director: string | null
  cast: string[]                   // Top 5 cast members
  rating: number | null            // TMDB rating
  fetchedAt: timestamp

/users/{userName}
  name: string                     // Display name (also the doc ID)
  unseenMovies: string[]           // Ordered TMDB IDs (first = highest priority)
  createdAt: timestamp
  updatedAt: timestamp

/availability/{userName}
  name: string
  slots: {                         // Keyed by ISO date string
    "2025-01-15": string[]         // e.g., ["afternoon", "evening"]
  }
  updatedAt: timestamp

/scheduledEvents/{eventId}
  movieId: string | null           // TMDB ID, null if just a placeholder
  date: string                     // ISO date
  timeSlot: string                 // "afternoon" | "evening" | custom
  createdBy: string
  createdAt: timestamp
  watched: boolean                 // Set true after the movie is watched
```

### Local Storage

```typescript
interface LocalUser {
  name: string;
}
// Stored in localStorage under key "movieNightUser"
```

---

## Core Features

### 1. User Identification

**Flow:**
- On first visit, prompt for name (simple text input modal)
- Validate uniqueness against existing `/users` documents
- Store in localStorage; auto-identify on return visits
- Small UI element showing current identity with option to switch

**Constraints:**
- Names must be 2-30 characters, alphanumeric + spaces
- Case-insensitive uniqueness check
- No passwords, no email, no OAuth

---

### 2. Movie List Display

**Master list view:**
- Grid of movie posters (responsive: 2 cols mobile, 4-6 cols desktop)
- Each poster card shows:
  - Poster image (from TMDB CDN)
  - Title + year overlay (bottom of card, semi-transparent background)
  - Visual indicator if user has NOT seen it (accent border/glow)
  - Badge showing how many group members haven't seen it

**Interactions:**
- Click poster → opens IMDB page in new tab
- Hover (desktop) → floating card with details:
  - Full title, year, runtime
  - Director, top cast
  - Genre tags
  - Plot synopsis (truncated ~150 chars)
  - TMDB rating

**Mobile:**
- Tap opens bottom sheet/modal with details
- 2-column poster grid

---

### 3. Movie Selection (Marking Unseen)

**Interaction:**
- Toggle button/icon on each poster (eye-slash icon)
- Click toggles "I haven't seen this" status
- Optimistic UI update + Firestore write
- Framer Motion animation on state change

**Visual feedback:**
- Seen: slightly dimmed/desaturated poster
- Unseen: vibrant with accent border

---

### 4. Personal Unseen List (Priority Queue)

**Display:**
- Sidebar on desktop, separate tab on mobile
- Vertical list ordered by priority
- Each item: poster thumbnail, title, year, drag handle

**Interactions:**
- Drag-and-drop to reorder (dnd-kit)
- Debounced Firestore sync (~500ms after drag)
- Click item → highlight in main grid
- Remove button → marks as "seen"

---

### 5. Group View

**Displays:**
- List of all users with unseen counts
- Click user → see their prioritized list (read-only)
- **Intersection list:** Movies ALL users marked unseen
- **Aggregate priority score** for intersection movies

**Priority Algorithm:**
```typescript
function computeAggregateScore(
  movieId: string,
  users: User[]
): number {
  return users.reduce((score, user) => {
    const index = user.unseenMovies.indexOf(movieId);
    if (index === -1) return score;
    return score + (user.unseenMovies.length - index);
  }, 0);
}
```

---

### 6. Movie List Management

**Add movies:**
- Search TMDB API (debounced 300ms)
- Results dropdown with poster, title, year
- Click to add to master list
- Multi-select: results stay open, clicked items get checkmark

**Remove movies:**
- Long-press (mobile) or right-click context menu (desktop)
- Confirm dialog
- Cascades: removes from all users' unseen lists

---

### 7. Marking Movies as Watched

**Scheduled event completion:**
- "Mark as watched" button on event
- Sets `watched: true`
- Removes movie from ALL users' unseen lists
- Movie stays in master list

**Manual marking:**
- User can remove from own unseen list anytime
- Does NOT affect other users

---

### 8. Availability Scheduling

**Time model:**
- Slots: "afternoon" (12pm-5pm), "evening" (6pm-11pm)
- Date range: next 4 weeks, rolling

**UI:**
- Grid: rows = dates, columns = slots
- Click/tap to toggle availability
- Heatmap overlay: darker = more people available

**Display:**
- "Best times" summary sorted by participant count

---

### 9. Event Scheduling

**Create event:**
- Select date + time slot
- Optionally assign movie from intersection list
- Creates `/scheduledEvents` document

**Event display:**
- Upcoming events in dedicated section
- Shows: date, time, movie, creator
- "Mark as watched" triggers cascade removal

---

## Project Structure

```
movie-night/
├── .github/workflows/deploy.yml
├── scripts/
│   ├── seed-movies.ts
│   └── imdb-top-250.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── movies/
│   │   ├── group/
│   │   ├── schedule/
│   │   └── user/
│   ├── hooks/
│   ├── db/
│   ├── lib/
│   ├── types/
│   └── styles/
├── tests/
├── public/
├── firebase.json
├── firestore.rules
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## Firestore Rules

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
    }
    match /config/{doc} {
      allow write: if true;
    }
    match /movies/{movieId} {
      allow write: if true;
    }
    match /users/{userName} {
      allow write: if true;
    }
    match /availability/{userName} {
      allow write: if true;
    }
    match /scheduledEvents/{eventId} {
      allow write: if true;
    }
  }
}
```

---

## Environment Variables

**`.env.local` (gitignored):**
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_TMDB_API_KEY=
```

---

## Implementation Phases

### Phase 1: Foundation (MVP)
1. Project scaffolding
2. Firebase configuration module
3. TypeScript types
4. User identification flow

### Phase 2: Core Movie Features
5. Seed script + database population
6. Movie grid display
7. Hover cards with details
8. IMDB links

### Phase 3: Selection & Prioritization
9. Toggle unseen status
10. Personal unseen list
11. Drag-and-drop reordering
12. Firestore sync

### Phase 4: Group Features
13. Group view
14. Intersection calculation
15. Priority scoring

### Phase 5: Movie Management
16. TMDB search
17. Add/remove movies

### Phase 6: Scheduling
18. Availability grid
19. Event creation
20. Mark as watched

### Phase 7: Polish
21. Mobile refinements
22. Animations
23. Error handling
24. Accessibility
