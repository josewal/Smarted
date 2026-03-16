# Smarted Architecture

## Vision

Smarted is an AI-powered spaced repetition learning companion. It goes beyond "Anki + ChatGPT" by making the AI a true learning partner that understands the delta between what you already know and what you need to know.

The core thesis: **the AI operates on the gap between your natural learning and what's important in your source material.**

### What Makes This Different

| Traditional (Anki + ChatGPT) | Smarted |
|---|---|
| AI generates cards in isolation | AI reads your notes, source material, AND review history |
| Leeches get suspended; user fixes manually | AI diagnoses WHY you're failing and auto-remediates |
| User tunes intervals/ease factors | System auto-tunes FSRS parameters from your data |
| Cards are either user-made or AI-made | Cards are co-created through conversation |
| No awareness of what you already know | Infers natural learning from your notes, focuses on gaps |

### Three Feedback Loops

1. **Scheduling loop** (FSRS) — determines when to show what, based on memory model
2. **Comprehension loop** (AI) — evaluates whether the user truly understands or is pattern-matching
3. **Coverage loop** (AI + sources) — identifies what's important but untouched in the source material

---

## Tech Stack

**Philosophy:** Simple, proven components. Use the platform. No unnecessary abstractions.

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React 19 + Vite** | Fast, simple, no framework magic |
| Styling | **Native CSS** (CSS Modules) | Browser-native, no build-time CSS tooling |
| Animation | **Framer Motion** | Card flips, page transitions, micro-interactions |
| State | **React built-ins** (useState, useReducer, useContext) | React already has state management |
| Backend | **Express.js** | Battle-tested, minimal, universally understood |
| Database | **PostgreSQL** via `pg` | Direct SQL, no ORM |
| Migrations | **node-pg-migrate** | Plain SQL migration files |
| AI | **@anthropic-ai/sdk** | Claude first, pluggable provider abstraction |
| Language | **TypeScript** | End-to-end type safety |
| Auth | **express-session + bcrypt** | Simple session-based auth |
| Deployment | **Fly.io / Railway** | Ethical, open-source friendly, Docker-based |

### Why No ORM?

The queries are well-defined and the schema is stable. Raw SQL with `pg` gives:

- Full control over scheduling queries (FSRS needs precise SQL)
- No abstraction leak debugging
- pgvector works naturally (`SELECT ... ORDER BY embedding <=> $1`)
- Type safety via TypeScript interfaces that mirror the tables

We use a thin `db/queries/` layer with typed functions — not an ORM, just convenience.

### Why No State Management Library?

React 19 provides `useState`, `useReducer`, and `useContext`. For this app:

- Server state is fetched via `fetch()` in viewmodel hooks
- Local UI state lives in component state
- Shared state (current user, workspace) uses Context
- No global store needed

---

## Architecture: Model-ViewModel-View

```
┌─────────────────────────────────────────────────────────┐
│  VIEW (React Components)                                 │
│                                                          │
│  Pure presentation. Receives props, emits events.        │
│  No business logic. No fetch calls. No side effects.     │
│                                                          │
│  Examples: StudySession.tsx, CardEditor.tsx, Dashboard.tsx│
├──────────────────────────────────────────────────────────┤
│  VIEWMODEL (React Hooks)                                 │
│                                                          │
│  Orchestrates state + API calls. Contains business logic │
│  that the UI needs. Exposes data + actions to views.     │
│                                                          │
│  Examples: useStudySession(), useCards(), useDashboard()  │
├──────────────────────────────────────────────────────────┤
│  MODEL (Express Backend + PostgreSQL)                    │
│                                                          │
│  Domain logic: FSRS scheduling, leech detection, AI      │
│  orchestration, gap analysis. Exposes REST API.          │
│  The single source of truth for all data.                │
└──────────────────────────────────────────────────────────┘
```

Frontend and backend are **separate projects** in a monorepo. They communicate via REST. Shared TypeScript types live in `shared/`.

### Data Flow Example: Study Session

```
1. View: StudySession.tsx renders current card, rating buttons
2. ViewModel: useStudySession() manages session state, calls API
3. Model (API): POST /api/study/review → FSRS service computes next schedule
4. Model (DB): UPDATE card_schedules SET stability=..., due_date=...
5. ViewModel: receives updated schedule, advances to next card
6. View: re-renders with new card
```

---

## Domain Model

```
User
 └── Workspace ("Deep Scrum Master Course")
      │
      ├── SourceMaterial[]
      │    Documents the user is learning from.
      │    Types: PDF, markdown, URL.
      │    └── SemanticChunk[] (chunked + embedded text, Phase 2)
      │
      ├── Card[]
      │    The atomic unit of learning.
      │    ├── front: string (question / prompt)
      │    ├── back: string (answer / explanation)
      │    ├── cardType: "basic" | "cloze"
      │    ├── origin: "user" | "ai" | "co_created"
      │    ├── sourceRef → SourceMaterial (provenance)
      │    └── schedule → CardSchedule (FSRS state)
      │
      ├── CardSchedule (one per card per user)
      │    FSRS memory model state.
      │    ├── stability: float (how long memory lasts)
      │    ├── difficulty: float (intrinsic difficulty)
      │    ├── state: "new" | "learning" | "review" | "relearning"
      │    ├── dueDate: timestamp
      │    ├── lapses: int (count of "Again" ratings)
      │    └── reps: int (total review count)
      │
      ├── ReviewLog[]
      │    Every review attempt, immutable history.
      │    ├── cardId, rating (1-4), responseTimeMs
      │    └── scheduledDays, actualDays, reviewedAt
      │
      ├── Concept[] (Phase 2)
      │    Extracted knowledge graph nodes.
      │    ├── prerequisites[] → Concept
      │    ├── masteryEstimate (derived from card performance)
      │    └── gapScore (importance × neglect)
      │
      ├── KnowledgeSignal[] (Phase 2)
      │    Evidence of what the user is naturally learning.
      │    Inferred from notes, highlights, questions.
      │
      └── GapAnalysis[] (Phase 2)
           Periodic comparison: source coverage vs user attention vs mastery.
```

### FSRS: Why Not SM-2?

SM-2 (SuperMemo 2) is the algorithm Anki uses. It has known problems:

- **Ease hell**: ease factor only goes down on failures, rarely recovers, leading to over-reviewing
- **Fixed model**: uses ad-hoc multipliers, not a mathematical memory model
- **No per-user optimization**: same parameters for everyone

FSRS (Free Spaced Repetition Scheduler) improves on this:

- Models memory with **stability** (how long until 90% recall probability) and **difficulty**
- Uses a proper mathematical model (DSR model) instead of multipliers
- **Parameters are optimizable per-user** from review history (enables auto-tuning)
- Empirically validated: ~20-30% fewer reviews for same retention

### Leech Detection

A "leech" is a card that repeatedly fails despite re-study. In Anki, leeches are just suspended. In Smarted:

- **Detection**: card reaches N lapses (default: 5 "Again" ratings)
- **Diagnosis** (Phase 2): AI analyzes why — too broad, missing prerequisite, ambiguous framing, interference with another card
- **Remediation** (Phase 2): AI generates replacement cards — splits, prerequisites, reframes

---

## Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE source_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL,              -- 'pdf', 'markdown', 'url'
  raw_text TEXT,
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  card_type TEXT DEFAULT 'basic',  -- 'basic', 'cloze'
  origin TEXT DEFAULT 'user',      -- 'user', 'ai', 'co_created'
  source_material_id UUID REFERENCES source_materials(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE card_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  stability REAL DEFAULT 0,
  difficulty REAL DEFAULT 0,
  state TEXT DEFAULT 'new',        -- 'new', 'learning', 'review', 'relearning'
  due_date TIMESTAMPTZ DEFAULT now(),
  lapses INTEGER DEFAULT 0,
  reps INTEGER DEFAULT 0,
  last_review TIMESTAMPTZ,
  UNIQUE(card_id, user_id)
);

CREATE TABLE review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  rating INTEGER NOT NULL,         -- 1=Again, 2=Hard, 3=Good, 4=Easy
  response_time_ms INTEGER,
  scheduled_days REAL,
  actual_days REAL,
  reviewed_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Project Structure

```
smarted/
├── client/                      # React frontend (Vite)
│   ├── src/
│   │   ├── views/               # VIEW — pure React components
│   │   │   ├── StudySession.tsx
│   │   │   ├── CardEditor.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SourceManager.tsx
│   │   │   └── App.tsx
│   │   ├── viewmodels/          # VIEWMODEL — hooks with logic
│   │   │   ├── useStudySession.ts
│   │   │   ├── useCards.ts
│   │   │   ├── useDashboard.ts
│   │   │   └── useSources.ts
│   │   ├── components/          # Reusable presentational pieces
│   │   │   ├── CardViewer.tsx
│   │   │   ├── RatingButtons.tsx
│   │   │   └── Layout.tsx
│   │   ├── api/                 # Typed fetch wrappers
│   │   │   └── client.ts
│   │   ├── styles/              # Native CSS (CSS Modules)
│   │   └── main.tsx
│   ├── index.html
│   └── vite.config.ts
│
├── server/                      # Express backend
│   ├── src/
│   │   ├── routes/              # HTTP route handlers
│   │   │   ├── study.ts
│   │   │   ├── cards.ts
│   │   │   ├── sources.ts
│   │   │   └── auth.ts
│   │   ├── services/            # MODEL — domain logic
│   │   │   ├── scheduler/
│   │   │   │   ├── fsrs.ts      # FSRS algorithm
│   │   │   │   └── leech.ts     # Leech detection
│   │   │   ├── ai/
│   │   │   │   ├── provider.ts  # AI provider abstraction
│   │   │   │   └── cards.ts     # Card generation prompts
│   │   │   └── ingest/
│   │   │       ├── pdf.ts
│   │   │       └── markdown.ts
│   │   ├── db/
│   │   │   ├── pool.ts          # pg Pool config
│   │   │   ├── queries/         # Typed SQL functions
│   │   │   └── migrations/      # Raw SQL files
│   │   └── index.ts
│   └── package.json
│
├── shared/                      # Shared TypeScript types
│   └── types.ts
│
├── ARCHITECTURE.md              # This file
├── LICENSE
└── package.json                 # Monorepo root
```

---

## Key User Workflows

### 1. Source Material Ingestion
User uploads a PDF or pastes markdown. System extracts text and stores it. In Phase 2, it also chunks semantically, generates embeddings, and extracts a concept graph.

### 2. Card Creation
User creates cards manually, or AI generates cards from source material. In Phase 2, this becomes a co-creation conversation where AI proposes and user refines.

### 3. Study Session (Core Loop)
FSRS selects due cards by priority. User sees card front, recalls, flips, self-rates (Again/Hard/Good/Easy). FSRS updates the schedule. If a card becomes a leech (5+ lapses), it's flagged. In Phase 2, AI diagnoses and remediates leeches.

### 4. Gap Detection (Phase 2)
User's Obsidian notes are ingested as knowledge signals. AI infers what the user is naturally learning and reduces gap scores for those concepts. AI focuses card generation energy on what the user ISN'T picking up on their own.

---

## Phasing

### Phase 1 (MVP): Core Learning Loop
- Card CRUD (basic + cloze)
- FSRS scheduling
- Study session with review flow
- Source material upload
- AI card generation (Claude)
- Leech detection (flagging only)
- Dashboard with stats

### Phase 2: Intelligence Layer
- Obsidian vault import
- Knowledge signal processing
- Gap analysis engine
- AI leech remediation
- Co-creation conversation UI
- FSRS auto-tuning

### Phase 3: Scale & Platform
- Concept knowledge graph visualization
- iOS native app (Swift)
- Multiple AI providers
- Anki import
