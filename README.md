# TrafficWatch AI — Liberia Intelligent Traffic App

**AI-powered traffic monitoring, incident reporting, evidence management, and analytics platform for national police operations.**

> Built for the Liberia National Police — designed to scale from manual officer reports to full live-camera AI computer vision.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Supabase Configuration](#-supabase-configuration)
- [Authentication Setup](#-authentication-setup)
- [Database Setup](#-database-setup)
- [Storage Setup](#-storage-setup)
- [AI Provider Setup](#-ai-provider-setup)
- [Maps Setup](#-maps-setup)
- [Development](#-development)
- [Testing](#-testing)
- [Production Build](#-production-build)
- [PWA Installation](#-pwa-installation)
- [GitHub Deployment](#-github-deployment)
- [Vercel Deployment](#-vercel-deployment)
- [Security](#-security)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Future Camera Integration](#-future-camera-integration)

---

## 🚀 Overview

TrafficWatch AI is a centralized, AI-powered traffic monitoring, incident reporting, evidence management, analytics, and enforcement platform designed for national police traffic operations. 

Authorized police personnel can monitor, investigate, document, analyze, and manage traffic violations from anywhere in the country. Citizens can submit reports, track their submissions, and receive safety notices.

### Key Capabilities

- **Officer Reports** — Create, manage, and investigate traffic incidents
- **Evidence Management** — Secure upload, chain-of-custody, cryptographic hashing
- **AI Analysis** — Computer vision for violation detection and ANPR
- **Command Dashboard** — Real-time KPIs, charts, maps, and predictive analytics
- **Citizen Portal** — Report violations, upload evidence, track submissions
- **Offline-First** — Create reports and capture evidence without connectivity
- **PWA** — Installable on mobile and desktop devices

---

## ✨ Features

### Command Center
- National, regional, and county overview
- Live incident feed with real-time updates
- Critical alert notifications
- Heat maps and incident clustering
- Officer activity monitoring
- Violation trend analytics

### Incident Management
- Full lifecycle: Draft → Submitted → Review → Investigate → Resolve → Close
- Status transitions with audit trail
- Assignment and escalation workflows
- Involved persons and witness management
- GPS location capture

### Evidence Center
- Upload images, videos, audio, and documents
- SHA-256 cryptographic hash for integrity
- Chain-of-custody tracking (who viewed, downloaded, exported)
- Immutable original evidence with derived versions
- Signed URL access control
- Offline upload queue with sync

### AI Detection
- Upload photos/videos for automated violation detection
- Automatic Number Plate Recognition (ANPR)
- Violation type classification with confidence scores
- Officer review workflow (confirm/reject/correct)
- Results labeled as AI-assisted, not final legal determinations

### License Plate Recognition
- Plate text detection and OCR
- Normalized plate text
- Confidence scoring
- Officer correction and verification
- Historical plate search
- Repeat offender identification

### Citizen Portal
- Submit traffic violation, accident, and road hazard reports
- Anonymous reporting option
- Upload evidence
- Track report status
- Road safety notices

### Officer Portal
- Assigned case view
- Quick incident creation
- Evidence capture and upload
- AI result review
- Offline mode with sync

### Maps
- Interactive Leaflet map
- Incident markers with clustering
- County and district boundaries
- Police stations and checkpoints
- Road network overlay
- Geolocation support

### Global Search
- Full-text search across incidents, evidence, ANPR scans, and citizen reports
- Filter by type, status, severity, date range
- Relevance ranking

### Predictive Analytics
- High-risk road prediction
- Violation hotspot analysis
- Repeat offender risk
- Clearly labeled as estimates

### Notifications
- In-app notification panel
- Web push notification architecture
- Configurable notification preferences
- Priority-based alerting

### Reports
- Generate PDF and CSV case summaries
- Export evidence reports
- Distinguish original evidence from AI analysis

### Audit Logging
- Immutable audit trail
- All security-sensitive actions recorded
- Role-restricted audit access

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client Layer                      │
│  ┌──────────────────────────────────────────────┐   │
│  │        React PWA (Vite + TypeScript)         │   │
│  │  ┌─────┐ ┌──────┐ ┌──────┐ ┌───────────┐   │   │
│  │  │ UI  │ │Pages │ │Hooks │ │Components │   │   │
│  │  └─────┘ └──────┘ └──────┘ └───────────┘   │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS / REST / Realtime
┌──────────────────▼──────────────────────────────────┐
│                  Service Layer                        │
│  ┌──────────────────────────────────────────────┐   │
│  │  API Services (Supabase SDK)                 │   │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │Auth Svc│ │Incidents│ │Evidence Svc  │  │   │
│  │  └─────────┘ └──────────┘ └──────────────┘  │   │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │AI Svc  │ │Vehicles │ │Analytics Svc │  │   │
│  │  └─────────┘ └──────────┘ └──────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Backend Layer                            │
│  ┌──────────────────────────────────────────────┐   │
│  │           Supabase Platform                    │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │PostgreSQL│ │  Auth    │ │   Storage    │  │   │
│  │  │  + RLS   │ │(GoTrue) │ │ (S3-backed)  │  │   │
│  │  └──────────┘ └──────────┘ └──────────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │Realtime │ │  Edge   │ │  DB Functions │  │   │
│  │  │(WebSocket)│ │Functions│ │   (plpgsql)  │  │   │
│  │  └──────────┘ └──────────┘ └──────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│             AI Analysis Layer                         │
│  ┌──────────────────────────────────────────────┐   │
│  │  Provider Registry                            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │VlyAI     │ │Gemini   │ │  OpenAI      │  │   │
│  │  │Provider  │ │Provider │ │  Provider    │  │   │
│  │  └──────────┘ └──────────┘ └──────────────┘  │   │
│  │  ┌──────────────────────────────────────┐    │   │
│  │  │   Future Traffic Vision Provider     │    │   │
│  │  └──────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
Evidence Upload → Secure Storage → Media Validation → AI Queue
→ Computer Vision → Object Detection → Violation Analysis
→ ANPR/OCR → Confidence Scoring → Officer Review
→ Confirmed Violation → Case Record (with Chain of Custody)
```

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.9, Vite 7 |
| **Styling** | Tailwind CSS 4, Framer Motion, shadcn/ui |
| **Maps** | Leaflet, react-leaflet, leaflet.markercluster |
| **Charts** | Recharts |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| **Authentication** | Supabase Auth (GoTrue) |
| **Database** | PostgreSQL 15+ with Row Level Security |
| **AI Providers** | VlyAI, Google Gemini, OpenAI (pluggable) |
| **PWA** | vite-plugin-pwa, Workbox, Service Workers |
| **Offline Storage** | IndexedDB via idb |
| **Reports** | jsPDF, html2canvas |
| **Forms** | react-hook-form, zod |
| **Icons** | lucide-react |
| **Testing** | Vitest |
| **Linting** | ESLint, Prettier, TypeScript strict |
| **Deployment** | Vercel, Docker |

---

## 🚦 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- A [Supabase](https://supabase.com/) project (free tier works)
- API keys for AI providers (optional for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/trafficwatch-ai.git
cd trafficwatch-ai

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Start the development server
bun run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
# ─── Required ──────────────────────────────────────────
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# ─── Optional (for AI features) ────────────────────────
VITE_AI_PROVIDER=vly          # Options: vly, gemini, openai, custom
VITE_AI_API_KEY=your-ai-key

# ─── Optional (for map features) ───────────────────────
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

### Where to find these values

| Variable | Location |
|----------|----------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon/public key |
| `VITE_AI_API_KEY` | Your AI provider dashboard (VlyAI, Google AI Studio, OpenAI) |

---

## 🗄️ Supabase Configuration

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/) and create an account
2. Create a new project (free tier is sufficient)
3. Wait for the database to provision (~1-2 minutes)

### 2. Run Database Migrations

All migration files are in the `supabase/` directory:

```bash
supabase/
├── migrations/
│   ├── 00001_init.sql           ← Core schema (42+ tables, enums, RLS)
│   ├── 00002_functions.sql      ← Stored procedures & functions
│   └── 00003_camera_entities.sql ← Camera infrastructure tables
└── seed/
    ├── seed-part1-profiles.sql  ← Demo officer profiles
    ├── seed-part2-incidents.sql ← Demo incidents
    ├── seed-part3-evidence.sql  ← Demo evidence
    └── seed-part4-remaining.sql ← Demo geography & predictions
```

**Run order in Supabase SQL Editor:**

1. Open Supabase Dashboard → SQL Editor
2. Paste and run each migration file **in order**
3. (Optional) Run seed files for demo data

### 3. Row Level Security

All tables have RLS policies enforcing role-based access. The `get_current_user_role()` function determines the authenticated user's role. Key policies:

- **Officers** can read/create their own incidents
- **Supervisors** can read incidents in their jurisdiction
- **Citizens** can only see their own reports
- **Auditors** can read audit logs but not modify them

### 4. Auth Hooks

The migration automatically creates:
- A `handle_new_user()` trigger that creates a profile on signup
- A `handle_new_user_notification_prefs()` trigger that creates default notification preferences

---

## 📦 Storage Setup

### Create Storage Buckets

The application requires 5 Supabase Storage buckets:

| Bucket | Max Size | Allowed MIME Types |
|--------|----------|-------------------|
| `evidence-images` | 50 MB | `image/jpeg`, `image/png`, `image/webp`, `image/tiff` |
| `evidence-videos` | 50 MB | `video/mp4`, `video/quicktime`, `video/webm` |
| `evidence-audio` | 50 MB | `audio/mpeg`, `audio/wav`, `audio/ogg` |
| `evidence-documents` | 25 MB | `application/pdf`, `text/plain`, `text/csv` |
| `evidence-other` | 50 MB | `*/*` |

**Steps:**
1. Supabase Dashboard → Storage → New Bucket
2. Create each bucket with the settings above
3. Ensure buckets are set to **private** (not public)

---

## 🔑 Authentication Setup

### 1. Configure Auth Settings

Supabase Dashboard → Authentication → Settings:

- **Site URL**: `http://localhost:5173` (dev) / `https://your-app.vercel.app` (prod)
- **Redirect URLs**: `http://localhost:5173/**`, `https://your-app.vercel.app/**`
- **Email confirmation**: Disable for development (toggle off "Confirm email")

### 2. Available Demo Accounts

After running seed data:

| Email | Role | Badge |
|-------|------|-------|
| `admin@trafficwatch.gov.lr` | System Administrator | ADM-001 |
| `commissioner@trafficwatch.gov.lr` | National Commissioner | COM-001 |
| `supervisor@trafficwatch.gov.lr` | Police Supervisor | SUP-001 |
| `officer1@trafficwatch.gov.lr` | Traffic Officer | OFC-001 |
| `investigator@trafficwatch.gov.lr` | Investigator | INV-001 |
| `citizen1@example.com` | Citizen | CIT-001 |

### 3. Role Hierarchy

```
system_administrator (highest)
  → national_commissioner
    → regional_commander
      → traffic_commander
        → police_supervisor
          → traffic_officer
          → investigator
          → evidence_officer
          → system_auditor
            → citizen (lowest)
```

---

## 🤖 AI Provider Setup

TrafficWatch AI supports pluggable AI providers. Currently supported:

### VlyAI (Default)
No configuration needed — built into the platform.

### Google Gemini
```env
VITE_AI_PROVIDER=gemini
VITE_AI_API_KEY=your-gemini-api-key
```
1. Get an API key from [Google AI Studio](https://aistudio.google.com/)
2. Uses `gemini-2.0-flash` model

### OpenAI
```env
VITE_AI_PROVIDER=openai
VITE_AI_API_KEY=your-openai-api-key
```
1. Get an API key from [OpenAI Platform](https://platform.openai.com/)
2. Uses `gpt-4o` model

### Switching Providers at Runtime

```typescript
import { providerRegistry } from "@/ai/providers";

await providerRegistry.initialize({ id: "gemini", apiKey: "YOUR_KEY" });
providerRegistry.setActiveProvider("gemini");
```

No pipeline or UI changes needed — the `ProviderRegistry` handles the swap transparently.

---

## 🗺 Maps Setup

TrafficWatch AI uses [Leaflet](https://leafletjs.com/) with OpenStreetMap tiles by default — no API key required for basic functionality.

For custom map styles or higher rate limits, configure:

```env
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

### Map Features
- Traffic incidents with marker clustering
- Police stations and checkpoints
- Road networks
- County boundaries
- Geolocation
- Search and filtering
- Heat maps for violation hotspots

---

## 💻 Development

### Available Scripts

```bash
bun run dev            # Start development server (Vite hot-reload)
bun run test           # Run all tests once
bun run test:watch     # Watch mode for development
bun run test:coverage  # Run with V8 coverage report
bun run test:ui        # Open Vitest UI dashboard
bun run lint           # ESLint check
bun run format         # Prettier formatting
bun run build          # Production build (tsc + vite build)
bun run preview        # Preview production build
```

### Project Structure

```
src/
├── ai/                  # AI analysis pipeline & providers
│   ├── components/      # AI UI components (AIAnalysisPanel, ANPREditor)
│   ├── providers/       # Provider implementations (Vly, Gemini, OpenAI)
│   ├── camera/          # Camera stream architecture
│   ├── pipeline.ts      # AI processing pipeline
│   └── types.ts         # AI type definitions
├── components/          # Shared UI components
│   └── ui/              # shadcn/ui components
├── hooks/               # React hooks
├── lib/                 # Utilities & helpers
│   └── __tests__/       # Test files
├── pages/               # Route page components
├── services/            # API service layer
├── supabase/            # Supabase client & types
├── pwa/                 # PWA helpers (offline, service worker)
├── index.css            # Global styles
└── main.tsx             # Application entry point
```

### Key Conventions

- **TypeScript strict mode** enabled — no implicit `any`
- **React hooks** follow rules of hooks strictly
- **Framer Motion** for animations (respects `prefers-reduced-motion`)
- **Tailwind CSS** for styling with shadcn/ui components
- **Search params** for filter/sort state (not useState/useReducer)
- **Supabase Realtime** for live updates (not polling)

---

## 🧪 Testing

```bash
# Run all tests
bun run test

# Watch mode
bun run test:watch

# With coverage
bun run test:coverage

# Vitest UI dashboard
bun run test:ui
```

### Test Structure

Tests are colocated with source files in `src/lib/__tests__/`:

| Test File | Covers |
|-----------|--------|
| `geography.test.ts` | Geographic filter utilities |
| `offline.test.ts` | Offline IndexedDB storage |
| `security.test.ts` | XSS sanitization, input validation |
| `permissions.test.ts` | Role-based access logic |

### E2E Testing (Future)
The architecture supports end-to-end testing workflows:
- Login → Dashboard → Create Incident → Upload Evidence → AI Analysis → Review → Assign → Update Status → Generate Report → Close

---

## 📦 Production Build

```bash
# Full production build
bun run build

# Preview the build locally
bun run preview
```

The build:
- Runs `tsc -b` for TypeScript type-checking
- Runs `vite build` with code splitting
- Generates PWA service worker
- Outputs to `dist/` directory

### Build Optimizations

- **Code splitting**: React vendor, UI vendor, map vendor, PWA vendor chunks
- **Hash-based filenames**: Long-term caching
- **Tree-shaking**: Dead code elimination
- **esbuild minification**: Fast, efficient bundle
- **PWA precaching**: Static assets cached by service worker

---

## 📱 PWA Installation

TrafficWatch AI is a true Progressive Web App.

### Installation Steps

**Desktop (Chrome, Edge):**
1. Open the app in the browser
2. Click the install icon in the address bar (or ⋮ → Install TrafficWatch AI)
3. The app opens in standalone mode

**Android (Chrome):**
1. Open the app
2. Tap ⋮ → Add to Home screen
3. The app installs with its icon

**iOS (Safari):**
1. Open the app
2. Tap Share → Add to Home Screen
3. The app opens in standalone mode

### PWA Features

- ✅ Installable to home screen
- ✅ Offline support with service worker
- ✅ Offline incident creation and draft storage
- ✅ Background sync when connectivity returns
- ✅ cached map tiles (30-day cache)
- ✅ API response caching (NetworkFirst strategy)
- ✅ Update detection with user notification
- ✅ Responsive design (mobile, tablet, desktop)

### Testing PWA

```bash
# Build for production
bun run build

# Preview
bun run preview
```

Test with Chrome DevTools → Application → Manifest / Service Workers.

---

## 🐙 GitHub Deployment

### Prepare for GitHub

```bash
# The project includes:
# - .gitignore (node_modules, dist, .env)
# - .env.example (documentation, no secrets)
# - Complete migration files
# - README with setup instructions

git init
git add .
git commit -m "Initial commit: TrafficWatch AI"
git remote add origin https://github.com/your-org/trafficwatch-ai.git
git push -u origin main
```

### GitHub Actions (CI/CD)

A sample workflow is available for automated testing:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run build
      - run: bun run test
```

---

## ▲ Vercel Deployment

### Deploy from GitHub

1. Push the project to GitHub
2. Go to [vercel.com](https://vercel.com/) → Import GitHub repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `bun run build` |
| **Output Directory** | `dist` |
| **Install Command** | `bun install` |

4. Add environment variables (all `VITE_*` from `.env.example`)
5. Deploy

### Vercel Configuration

Create `vercel.json` in project root:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures SPA routing works on Vercel (no 404 on route refresh).

### Post-Deployment

- Verify PWA manifest loads: `https://your-app.vercel.app/manifest.webmanifest`
- Verify service worker registers: Chrome DevTools → Application → Service Workers
- Test offline capabilities
- Update Supabase Auth redirect URLs to your Vercel domain

---

## 🔒 Security

### Database Security

- **Row Level Security** on every table — enforced at database level
- **Role-based access** — never rely on frontend-only protection
- **Parameterized queries** — SQL injection prevented via Supabase SDK
- **Signed URLs** — evidence files accessed through time-limited signed URLs
- **Input validation** — all inputs validated server-side and client-side

### Authentication

- Supabase Auth with secure session management
- Password hashing handled by Supabase (bcrypt)
- MFA architecture ready
- Session expiration and refresh

### File Upload Security

- MIME type validation
- File size limits per bucket
- SHA-256 hash computed for integrity verification
- Private storage buckets (no public URLs)
- Virus scanning architecture ready

### Audit Trail

- All security-sensitive actions logged to `audit_logs`
- Chain-of-custody for every evidence interaction
- Immutable logs (no UPDATE/DELETE policies for auditors)
- Severity classification (info, warning, error, critical)

### Secrets Management

- **Never store secrets in frontend code**
- API keys managed via Supabase Edge Functions or environment variables
- Service-role keys never leave the backend
- AI provider keys passed through environment configuration

### XSS Prevention

- React's built-in escaping (JSX)
- Content Security Policy ready
- Input sanitization utilities in `src/lib/security.ts`

---

## 📁 Project Structure

```
trafficwatch-ai/
├── public/                    # Static assets
│   ├── logo.svg
│   ├── manifest.webmanifest
│   └── seed-part*.sql
├── supabase/                  # Database migrations & seed
│   ├── README.md
│   ├── migrations/            # Numbered SQL migrations
│   └── seed/                  # Demo/seed data
├── src/
│   ├── ai/                    # AI analysis engine
│   │   ├── camera/            # Camera stream types & processing
│   │   ├── components/        # AI UI components
│   │   ├── providers/         # Pluggable AI providers
│   │   ├── pipeline.ts        # AI processing pipeline
│   │   └── types.ts           # AI type definitions
│   ├── components/            # Reusable UI components
│   │   └── ui/                # shadcn/ui primitives
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities & helpers
│   │   └── __tests__/         # Test files
│   ├── pages/                 # Route page components
│   ├── services/              # API service layer
│   ├── supabase/              # Supabase client & types
│   ├── pwa/                   # PWA offline support
│   ├── index.css              # Global styles
│   └── main.tsx               # App entry point
├── .env.example               # Environment variable template
├── .gitignore
├── index.html                 # HTML entry point
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite & PWA configuration
└── README.md                  # This file
```

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **supabaseUrl is required** | Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in your environment |
| **Blank app / 404** | Ensure SPA rewrites are configured (Vercel: `vercel.json`) |
| **Login fails** | Check that Auth → Settings → Site URL matches your app URL |
| **Maps not loading** | OpenStreetMap tiles are used by default — check network connectivity |
| **AI analysis fails** | Verify your AI provider API key is correct |
| **PWA not installable** | Ensure the app is served over HTTPS (or localhost) |
| **Offline sync not working** | Check that IndexedDB is available and service worker is registered |
| **Build errors** | Run `bun install` to ensure all dependencies are installed |
| **TypeScript errors** | Run `bun tsc -b --noEmit` to check for type errors |

### Debug Mode

- Check the **browser console** for detailed error messages
- Supabase queries with errors are returned with user-friendly messages
- Hidden error details in `ApiResponse.error.original`

### Getting Help

- Check existing GitHub issues
- Review the Supabase dashboard logs
- Verify environment variables are correctly named

---

## 📹 Future Camera Integration

The architecture is designed for future integration with live camera systems without requiring a complete rebuild.

### Architecture

```
Camera Hardware (RTSP/HLS/WebRTC)
      ↓
  Stream Gateway (src/ai/camera/stream-gateway.ts)
      ↓
  Video Processing (src/ai/camera/video-processing.ts)
      ↓
  Camera Pipeline (src/ai/camera/pipeline.ts)
      ↓
  ┌──────────────┬──────────────┬──────────────┐
  ▼              ▼              ▼              ▼
camera_streams  camera_detections  camera_violations  camera_evidence
      ↓
  Incident & Evidence Systems
```

### Database Tables (Already Created)

| Table | Purpose |
|-------|---------|
| `traffic_cameras` | Camera registrations and metadata |
| `camera_events` | Raw event logs from cameras |
| `camera_streams` | Stream configurations (main/sub/backup) |
| `camera_detections` | Individual AI detection results |
| `camera_violations` | Violation records from detections |
| `camera_evidence` | Evidence artifacts from detections |

### Stream Gateways (Already Implemented)

- **RTSP Gateway** — Real-Time Streaming Protocol
- **HLS Gateway** — HTTP Live Streaming
- **WebRTC Gateway** — Peer-to-peer streaming
- **File Gateway** — Uploaded video files

### Supported Camera Types

- Traffic cameras (fixed)
- CCTV cameras
- Highway monitoring
- Speed enforcement cameras
- Red light cameras
- ANPR cameras
- Body-worn cameras
- Vehicle dashcams
- Drone feeds
- Mobile device cameras

### Adding a New Camera Source

```typescript
import { StreamGateway, StreamConfig, StreamConnection } from "@/ai/camera/types";

class CustomCameraGateway implements StreamGateway {
  readonly type = "rtsp"; // or your custom type
  
  async connect(config: StreamConfig): Promise<StreamConnection> {
    // Implement connection logic
  }
  
  async disconnect(connectionId: string): Promise<void> {
    // Implement disconnection
  }
  
  getStatus(connectionId: string) {
    // Return current status
  }
  
  async listAvailableStreams(): Promise<StreamConfig[]> {
    // Return available streams
  }
}
```

---

## 📄 License

This project is designed for government law enforcement use. All rights reserved.

---

## 🙏 Acknowledgments

- Built with React, TypeScript, and Vite
- Backend powered by Supabase (PostgreSQL)
- Maps by Leaflet and OpenStreetMap
- UI components from shadcn/ui
- AI providers: VlyAI, Google Gemini, OpenAI

---

*TrafficWatch AI — Making Liberian roads safer through technology.*
