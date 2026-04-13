# CLAUDE.md — Classi (Capstone Project)

## Project Overview

**Classi** is a cross-platform mobile app that helps users build curated image datasets for machine learning. Users search for a topic, swipe right to approve or left to reject images, and export the approved set as a CSV. Images are sourced from Wikimedia Commons (CC-licensed).

**Team:** Eli Holm (Deployment), Keehin McCann (Frontend/Backend), Wyatt Allinger (UI/UX), Xavier Hampton (Backend & API Integration)

---

## Repository Structure

```
/Capstone
├── mobile/DatasetBuilderApp/   React Native (Expo SDK 54) mobile app
│   ├── App.js                  Root navigator: AuthStack | AppStack (bottom tabs)
│   └── app/
│       ├── components/         SwipeCard, StatsBar, BufferStrip, AppHeader
│       ├── screens/            LoginScreen, RegisterScreen, DatasetsScreen,
│       │                       SwipeScreen, SettingsScreen
│       ├── context/            AuthContext (JWT), DatasetContext (datasets + active)
│       └── config.js           API_BASE_URL
├── server/                     Express.js REST API
│   ├── routes/                 register, login, datasets, images, export
│   ├── middleware/auth.js       JWT verification
│   ├── services/wikimedia.js   Wikimedia Commons image fetching
│   ├── __tests__/              Jest unit tests
│   ├── app.js                  Express setup + routes
│   ├── server.js               Entry point, DB check, port listen
│   └── db.js                   PostgreSQL connection pool
├── web/src/                    React + Vite export panel
│   ├── components/AuthForm.jsx
│   └── components/ExportDashboard.jsx
├── database/create_schema.sql  PostgreSQL schema
├── Dockerfile
├── docker-compose.yml          dev, db, test services
└── docs: README.md, TODO.md, project-doc.md, docker.md, android.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.81.5, Expo SDK 54, React Navigation, Reanimated |
| Backend | Node.js, Express.js 5.x, JWT (jsonwebtoken), bcrypt |
| Database | PostgreSQL 16 (Docker locally, AWS RDS in production) |
| Web panel | React 19, Vite 7, Tailwind CSS 4 |
| Image source | Wikimedia Commons API |
| Testing | Jest |
| Infrastructure | Docker, docker-compose, AWS EC2 + RDS |

---

## Running the Project

### Local Development (Docker)
```bash
docker compose build
docker compose up
```
- API server: `http://localhost:3000`
- Expo Metro bundler: `http://localhost:8081`
- PostgreSQL: internal only (port 5432)

### Tests
```bash
# From /server
npm test

# Via Docker
docker compose --profile test run --rm test
```

### Android Physical Device (USB)
See `android.md` for ADB reverse tunneling setup with Expo Go SDK 54.

---

## Environment Variables

Copy `.env.example` to `.env` in `/server`:

```
DB_HOST=db
DB_PASSWORD=postgres
DB_SSL=false
PORT=3000
JWT_SECRET=dev-secret-change-me
```

---

## Database Schema

**users** — `user_id`, `username` (UNIQUE), `email` (UNIQUE), `password_hash`, `created_at`

**datasets** — `dataset_id`, `user_id` (FK), `name`, `search_term`, `total_images`, `provider_offsets` (JSONB for Wikimedia pagination state), `created_at`

**images** — `image_id`, `dataset_id` (FK), `url`, `title`, `license`, `status` (ENUM: `pending`/`approved`/`rejected`), `added_at`

---

## API Endpoints

All protected routes require `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| POST | `/api/user/register` | Register new user |
| POST | `/api/user/login` | Login → returns JWT |
| POST | `/api/datasets` | Create dataset |
| GET | `/api/datasets` | List user's datasets |
| GET | `/api/datasets/:id` | Get dataset details |
| DELETE | `/api/datasets/:id` | Delete dataset |
| GET | `/api/datasets/:id/images?limit=10&after=0` | Fetch pending images |
| PATCH | `/api/datasets/:id/images/:imgId` | Update image status |
| GET | `/api/datasets/summary` | List datasets with counts + recent image thumbnail |
| GET | `/api/export/images?dataset_id=123` | Export approved images as CSV |
| POST | `/api/export/login` | Web panel login |

---

## Core App Flow

1. User logs in (mobile) → JWT stored in SecureStore via `AuthContext`
2. App lands on **Datasets tab** — lists existing datasets with thumbnail + counts via `/api/datasets/summary`
3. User creates a dataset (inline form) or taps an existing one → navigates to **Swipe tab**
4. Backend fetches images from Wikimedia Commons (CC0/CC-BY/CC-BY-SA, JPG/PNG only)
5. Mobile app displays images in a swipeable card stack
6. Swipe right = approve, swipe left = reject → PATCH sent to backend
7. Buffer auto-refills when <5 images remain locally; background fetch triggers when <30 pending in DB
8. User exports dataset via web panel → CSV of approved images (url, title, license)
9. **Settings tab** shows username and Sign Out button

---

## Key Implementation Notes

- **Wikimedia deduplication:** Images are deduplicated by URL and title before insert
- **Pagination state:** `provider_offsets` JSONB column tracks Wikimedia API offset per dataset so fetches resume correctly
- **Undo stack:** SwipeScreen keeps a stack to support undo of swipe decisions
- **Separate export auth:** The web export panel uses `/api/export/login` rather than the main `/api/user/login`
- **CSV escaping:** Export route produces RFC 4180 compliant CSV
- **Bottom tab navigation:** Authenticated flow uses a 3-tab layout (Datasets / Swipe / Settings) with a persistent `AppHeader` above the tab bar
- **Shared dataset state:** `DatasetContext` owns `datasets`, `activeDataset`, and CRUD operations; both `DatasetsScreen` and `SwipeScreen` consume it
- **Buffer reset on dataset change:** `SwipeScreen` watches `activeDataset?.dataset_id` via `useEffect` and resets all image/index state when the active dataset changes
- **Dataset thumbnails:** `DatasetsScreen` uses `/api/datasets/summary` which returns a `recent_image` URL per dataset for card thumbnails

---

## Known Issues / TODO

See `TODO.md` for the full list. Key items:

- Session persistence (kept/discarded counts reset on reload)
- Image flash during swipe transitions
- Pagination improvements for large datasets
- Dataset counts on Datasets tab go stale during a swipe session (requires navigating away and back to refresh)

---

## Documentation Files

| File | Contents |
|---|---|
| `README.md` | Project intro and team |
| `project-doc.md` | Full design doc: problem statement, research, architecture decisions, ER diagram, API flowcharts, deployment plan |
| `TODO.md` | Remaining tasks |
| `docker.md` | Local Docker development guide |
| `android.md` | Android + ADB + USB tunnel setup for Expo Go |
| `server/README.md` | API endpoint docs with curl examples |
