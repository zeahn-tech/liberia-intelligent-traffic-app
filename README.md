# 🛡️ TrafficWatch AI — Liberia Intelligent Traffic App

**AI-powered traffic monitoring, incident reporting, evidence management, and analytics platform for national police operations.**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![PWA](https://img.shields.io/badge/PWA-ready-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [PWA Features](#pwa-features)
- [Authentication](#authentication)
- [Authorization & RBAC](#authorization--rbac)
- [Deployment](#deployment)
- [GitHub Actions](#github-actions)

---

## Overview

TrafficWatch AI is a centralized, progressive web application (PWA) designed for the Liberia National Police to monitor, investigate, document, analyze, and manage traffic violations from anywhere in the country.

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **Incident Management** | Create, track, assign, escalate, and resolve traffic incidents |
| **Digital Evidence Center** | Secure upload, storage, and chain-of-custody for photos, videos, audio, and documents |
| **AI Analysis Pipeline** | Modular AI engine for computer vision, object detection, and traffic violation analysis |
| **ANPR System** | Automatic Number Plate Recognition with OCR, normalization, and confidence scoring |
| **Interactive Map** | Real-time incident map with clustering, filters, and county-level boundaries |
| **Command Dashboard** | Executive overview with KPIs, charts, and live incident feed |
| **Citizen Portal** | Public reporting portal with anonymous submission option |
| **Officer Portal** | Dedicated workspace for patrol officers with offline support |
| **Predictive Analytics** | Trend analysis, hotspot prediction, and incident volume forecasting |
| **Audit & Security** | Comprehensive audit logging, RBAC, and data privacy controls |
| **Reports** | Professional PDF/CSV report generation with evidence references |

---

## Tech Stack

### Frontend
- **React 19** — UI framework
- **TypeScript** — Type safety
- **Vite 7** — Build tooling
- **Tailwind CSS v4** — Utility-first styling
- **shadcn/ui** — Accessible UI primitives
- **Framer Motion** — Animations
- **Recharts** — Interactive charts
- **Leaflet** — Map visualization
- **Lucide React** — Icons

### Backend & Data
- **Supabase** — PostgreSQL database, authentication, storage, realtime
- **Supabase Auth** — Authentication with email OTP and role management

### PWA
- **vite-plugin-pwa** — PWA manifest, service worker, offline support
- **Workbox** — Service worker strategies (precaching, runtime caching)
- **IndexedDB** — Offline data queue

---

## Architecture

### AI Analysis Pipeline
```
Evidence Upload → Secure Storage → Media Validation → AI Processing Queue
→ Computer Vision Analysis → Object Detection → Traffic Violation Analysis
→ License Plate Detection → OCR → Confidence Evaluation → Officer Review
→ Confirmed Violation → Case Record
```

### Camera System (Future)
```
Camera → Stream Gateway → Video Processing → AI Computer Vision Engine
→ Detection Events → TrafficWatch AI → Alerts / Incidents / Evidence
```

### Data Flow
```
Offline-first: IndexedDB → Sync Queue → Supabase (when online)
Real-time: Supabase Realtime → WebSocket → Live UI updates
```

---

## Getting Started

### Prerequisites

- **Bun** (recommended) or **Node.js 20+**
- A **Supabase** project (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/trafficwatch-ai.git
cd trafficwatch-ai
bun install
```

### 2. Configure Environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp env-example.txt .env
```

Required environment variables:
| Variable | Description | Where to find it |
|----------|-------------|------------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase Dashboard → Settings → API → anon public key |

### 3. Database Setup

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Run the migration files in order:
   - `supabase-migration-v2.sql` through `supabase-migration-v21-performance.sql`
3. Create storage buckets (from SQL Editor storage setup):
   - `evidence-images` — JPEG, PNG, WebP, TIFF (50 MB max)
   - `evidence-videos` — MP4, WebM, AVI, MKV (50 MB max)
   - `evidence-audio` — MP3, WAV, OGG, AAC (50 MB max)
   - `evidence-documents` — PDF, DOC, XLS, TXT, CSV (25 MB max)
   - `evidence-other` — Any (50 MB max)

### 4. Start Development

```bash
bun run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

The app uses Vite's `import.meta.env` pattern. All variables are prefixed with `VITE_`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_SUPABASE_URL` | ✅ Yes | — | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | — | Supabase anon/public key |

*Note: Only variables actually used by the implementation are listed. If the app does not find these variables, it gracefully falls back to a mock client so the landing page still renders.*

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server with HMR |
| `bun run build` | TypeScript typecheck + production build |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | Run ESLint across the codebase |
| `bun run format` | Format code with Prettier |
| `bun run pwa:build` | Build + preview with PWA optimizations |
| `bun tsc -b --noEmit` | TypeScript typecheck only |

---

## Project Structure

```
trafficwatch-ai/
├── .github/workflows/     # GitHub Actions CI
├── public/                 # Static assets, manifest, icons
├── src/
│   ├── ai/                 # AI analysis pipeline modules
│   │   ├── anpr/           # Automatic Number Plate Recognition
│   │   ├── camera/         # Camera stream processing
│   │   ├── components/     # AI analysis UI components
│   │   ├── predictive/     # Predictive analytics engine
│   │   └── providers/      # AI provider abstraction
│   ├── components/
│   │   ├── ui/             # shadcn/ui primitives
│   │   └── ...             # App-specific components
│   ├── convex/             # Convex backend (auth)
│   ├── hooks/              # React hooks
│   ├── lib/                # Utilities, services, helpers
│   ├── pages/              # Route page components
│   ├── pwa/                # Service worker & offline fallback
│   ├── services/           # API service layer
│   ├── supabase/           # Supabase client, auth, types
│   └── main.tsx            # App entry point & routing
├── .env.example            # Environment variable template
├── .gitignore
├── index.html
├── package.json
├── vite.config.ts          # Vite config with PWA plugin
└── env-example.txt         # Environment variable template
```

---

## PWA Features

TrafficWatch AI is a fully installable Progressive Web App:

| Feature | Status |
|---------|--------|
| App manifest | ✅ Configurable via `vite.config.ts` |
| Service worker | ✅ Workbox precaching + runtime caching |
| Offline fallback | ✅ Custom offline page |
| iOS support | ✅ apple-mobile-web-app meta tags |
| Install prompt | ✅ Elegant in-app prompt (respects dismissals) |
| Update detection | ✅ Banner when new version available |
| Push notifications | ✅ Service worker notification handlers |
| Map tile caching | ✅ 30-day CacheFirst for OSM tiles |
| API caching | ✅ NetworkFirst with 5s timeout |
| Offline queue | ✅ IndexedDB sync queue |
| Auto-sync | ✅ Sync queued data when back online |

### Installing the PWA

1. Open TrafficWatch AI in Chrome/Edge on desktop or Android
2. Click the install icon in the address bar, or
3. Tap the "Install App" button in the in-app prompt
4. The app will launch in standalone mode with offline support

---

## Authentication

### Auth is already set up

All authentication is handled through **Supabase Auth** with email OTP.

### Using Auth on the Frontend

```typescript
import { useAuth } from "@/hooks/use-auth";

const { isLoading, isAuthenticated, user, signIn, signOut } = useAuth();
```

### Protected Routes

Use the `RequireAuth` wrapper in `src/main.tsx`:

```tsx
<Route
  path="/dashboard"
  element={
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  }
/>
```

### Role-Based Access Control

Routes can require specific permissions or minimum roles:

```tsx
<Route
  path="/admin"
  element={
    <RequireAuth
      requirePermission="configure_system"
      fallbackPath="/dashboard"
      showForbidden
    >
      <AdminPanel />
    </RequireAuth>
  }
/>
```

---

## Authorization & RBAC

### Roles

| Role | Level |
|------|-------|
| System Administrator | 100 |
| National Police Commissioner | 90 |
| Regional Commander | 70 |
| Traffic Commander | 60 |
| Police Supervisor | 50 |
| Traffic Officer | 40 |
| Investigator | 30 |
| Evidence Officer | 20 |
| System Auditor | 15 |
| Citizen | 10 |

### Permissions

Permissions control access to specific actions:
`view_dashboard`, `create_incident`, `edit_incident`, `delete_incident`,
`access_evidence`, `run_ai_analysis`, `view_reports`, `view_analytics`,
`manage_users`, `configure_system`, `view_audit_logs`, etc.

Authorization is enforced both on the **frontend** (UI guards) and **backend** (Supabase RLS policies).

---

## Deployment

### Build for Production

```bash
bun run build
```

The production build outputs to the `dist/` directory.

### Hosting Options

#### Option 1: Vercel (Recommended)
1. Push to GitHub
2. Import repo in Vercel
3. Set Build Command: `bun run build`
4. Set Output Directory: `dist`
5. Add environment variables in Vercel dashboard
6. Deploy

#### Option 2: Netlify
1. Push to GitHub
2. Import repo in Netlify
3. Set Build Command: `bun run build`
4. Set Publish Directory: `dist`
5. Add `_redirects` file: `/* /index.html 200`
6. Deploy

#### Option 3: Docker
```dockerfile
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
RUN bun run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Supabase Production Checklist

- [ ] Enable Row Level Security on all tables
- [ ] Set up appropriate RLS policies (run migration SQL)
- [ ] Configure authentication settings (disable email confirmation if desired)
- [ ] Create storage buckets with correct MIME restrictions
- [ ] Set up signed URL expiration for evidence access
- [ ] Enable pg_cron (Pro plan) for automated dashboard refreshes

---

## GitHub Actions

The project includes a CI workflow (`.github/workflows/ci.yml`) that runs on every push and pull request:

- ✅ TypeScript typecheck
- ✅ Lint with ESLint
- ✅ Production build

---

## Migrations

Database migration SQL files are numbered sequentially:

| File | Description |
|------|-------------|
| `supabase-migration-v2.sql` | Core schema: profiles, incidents, evidence, vehicles |
| `supabase-migration-v4.sql` | Storage buckets and RLS policies |
| `supabase-migration-v5.sql` | Liberia geography data (counties, districts) |
| `supabase-migration-v6.sql` | Predictive analytics tables |
| `supabase-migration-v7.sql` | User roles and permissions |
| `supabase-migration-v8.sql` | Auth functions and triggers |
| `supabase-migration-v10.sql` | Citizen reports schema |
| `supabase-migration-v11.sql` | Officer portal enhancements |
| `supabase-migration-v12.sql` | Command center views |
| `supabase-migration-v13.sql` | Notification system |
| `supabase-migration-v14.sql` | Global search indexes |
| `supabase-migration-v15.sql` | Report generation |
| `supabase-migration-v16.sql` | Audit logging |
| `supabase-migration-v17.sql` | Security policies |
| `supabase-migration-v18.sql` | Data privacy |
| `supabase-migration-v20.sql` | RLS policies |
| `supabase-migration-v21-performance.sql` | Performance indexes |

---

## License

This project is proprietary software. All rights reserved.

---

## Support

For technical support, contact the Liberia National Police IT Division.
