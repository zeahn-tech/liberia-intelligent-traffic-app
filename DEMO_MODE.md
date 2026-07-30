# TrafficWatch AI — Demo Mode

## ⚠️ IMPORTANT: This is a DEMO/DEVELOPMENT environment

TrafficWatch AI includes a **Demo Mode** that pre-populates the system with sample data for development, testing, and demonstration purposes. This document explains how demo mode works and what safeguards are in place.

## How Demo Mode Is Detected

The application automatically detects demo mode by checking the authenticated user's email domain. If the email matches any of the following patterns, the user is considered to be operating in demo mode:

- `*@trafficwatch.gov.lr` — Official demo officer accounts
- `*@example.com` — Demo citizen accounts

## What Demo Mode Does

### Persistent Visual Indicators

When demo mode is active, a **"DEMO" badge** appears in the top navigation bar on every page. This badge is clearly visible to all users and indicates that the data being displayed may not be real.

### Data Labeling

All pre-populated seed data contains clear markers:

| Data Type | Label | Location |
|-----------|-------|----------|
| Incidents | "⚠️ SIMULATED INCIDENT" | Headers of seed SQL files |
| AI Analyses | "AI-Generated Analysis" | AI Detection page |
| ANPR Scans | "Simulated License Plate Detection" | License Plates page |
| Citizen Reports | "Demonstration Report" | Citizen Reports page |
| Predictive Analytics | "⚠️ ESTIMATE — Not a prediction of fact" | Predictive Analytics panel |

### Safety Guards

Demo mode ensures the following safety measures:

1. **No real emergency alerts** — The demo seed data includes sample notifications that are clearly marked as demonstration data
2. **No false claims of stolen/wanted vehicles** — The single demo stolen-vehicle record is explicitly marked as seed data and is only visible to authorized roles
3. **AI results labeled as AI-assisted** — All AI analysis results are clearly labeled as "AI-generated" and require manual officer confirmation before being treated as evidence
4. **Predictions labeled as estimates** — All predictive analytics results include a disclaimer stating they are "AI-generated estimates based on available historical data. Not a guarantee of future incidents."
5. **No real police information exposed** — Demo officer profiles use fictional names, badge numbers, and contact information

## Seed Data Files

The following files contain demo/seed data. They are safe to run multiple times (they use `WHERE NOT EXISTS` and `ON CONFLICT DO NOTHING`):

| File | Contents |
|------|----------|
| `public/seed-part1-profiles.sql` | 13 officer/citizen profiles + 10 vehicles |
| `public/seed-part2-incidents.sql` | 10 incidents + 24 logs + 4 persons + 4 witnesses |
| `public/seed-part3-evidence.sql` | 5 evidence items + AI analyses + ANPR scans + citizen reports |
| `public/seed-part4-remaining.sql` | Predictions + hotspots + notifications + tasks |

## Production Deployment Checklist

Before deploying to production:

1. **Do NOT run seed data files** in a production database
2. **Verify demo mode detection** works correctly by testing with production auth
3. **Ensure all demo indicators are removed** or replaced with real data
4. **Test that no seed data leaks** into production analytics or reports
5. **Verify production auth** does not match demo email patterns

## Technical Implementation

Demo mode is implemented via:

- **`src/hooks/use-demo-mode.ts`** — React hook that detects demo mode from user profile
- **`src/components/DemoBadge.tsx`** — Visual badge component shown in the app header
- **`src/components/AppLayout.tsx`** — Displays the demo badge when demo mode is active

The demo badge uses a distinct amber/yellow color scheme to ensure it is immediately noticeable without being alarmist.
