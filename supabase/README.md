# 🗄️ TrafficWatch AI — Database Setup Guide

This directory contains the complete PostgreSQL database schema, functions, and seed data required to run TrafficWatch AI.

## 📁 Structure

```
supabase/
├── README.md                    ← This file: setup instructions
├── migrations/                  ← Numbered migration files (run in order)
│   ├── 00001_init.sql           ← Core schema: enums, tables, indexes, RLS
│   ├── 00002_functions.sql      ← Stored procedures & helper functions
│   └── 00003_camera_entities.sql ← Camera streams, detections, violations, evidence
└── seed/                        ← Development/seed data (run after migrations)
    ├── seed-part1-profiles.sql  ← Officer profiles, vehicles, citizens
    ├── seed-part2-incidents.sql ← Sample incidents, involved persons, witnesses
    ├── seed-part3-evidence.sql  ← Evidence records, AI analyses, ANPR scans
    └── seed-part4-remaining.sql ← Geography data, predictions, notifications
```

## 🚀 Quick Start

### Option 1: Fresh Database (From Scratch)

Run migrations in order followed by seed data:

1. **Open Supabase SQL Editor** → Dashboard → SQL Editor
2. **Run `supabase/migrations/00001_init.sql`** — Creates all core tables, enums, RLS policies
3. **Run `supabase/migrations/00002_functions.sql`** — Creates stored procedures and triggers
4. **Run `supabase/migrations/00003_camera_entities.sql`** — Creates camera infrastructure tables
5. **Run `supabase/seed/seed-part1-profiles.sql`** — Inserts demo profiles and vehicles
6. **Run `supabase/seed/seed-part2-incidents.sql`** — Inserts demo incidents
7. **Run `supabase/seed/seed-part3-evidence.sql`** — Inserts demo evidence
8. **Run `supabase/seed/seed-part4-remaining.sql`** — Inserts geography, predictions, settings

### Option 2: Update Existing Database

Run only the migration files you haven't applied yet. Each migration uses `IF NOT EXISTS` and safe checks to avoid conflicts.

## 🛠️ What Gets Created

### Enums
- `user_role` — 10 roles from `system_administrator` to `citizen`
- `incident_status` — 11 statuses from `draft` to `archived`
- `violation_severity` — 4 levels: minor, moderate, serious, critical
- `evidence_type` — 5 types: photo, video, document, audio, other
- `analysis_status` — 5 states: pending, queued, processing, completed, failed
- `ai_provider` — 4 providers: vly, gemini, openai, custom
- `stolen_status` — 3 states: active, recovered, closed

### Core Tables (45+)
- **Personnel & Auth**: `profiles`, `roles`
- **Law Enforcement**: `incidents`, `incident_logs`, `incident_violations`, `incident_assignments`
- **Traffic Data**: `violation_types`, `traffic_violations`
- **Vehicles**: `vehicles`, `drivers`, `vehicle_owners`, `stolen_vehicles`
- **People**: `involved_persons`, `witnesses`
- **Evidence**: `evidence`, `evidence_custody`, `evidence_versions`, `storage_files`
- **AI/ML**: `ai_analyses`, `ai_analysis_jobs`, `anpr_scans`
- **Predictive**: `prediction_models`, `prediction_results`, `violation_hotspots`, `high_risk_roads`
- **Citizen**: `citizen_reports`
- **Notifications**: `officer_notifications`, `notification_preferences`, `push_subscriptions`
- **Cameras**: `traffic_cameras`, `camera_events`, `camera_streams`, `camera_detections`, `camera_violations`, `camera_evidence`
- **Geography**: `counties`, `districts`, `police_regions`, `police_stations`, `roads`, `checkpoints`
- **System**: `system_settings`, `report_history`, `sync_queue`, `audit_logs`, `road_conditions`, `patrol_units`, `officer_assignments`

### Key Functions & Stored Procedures
- `get_current_user_role()` — Returns the authenticated user's role
- `get_incident_counts()` — Incident counts grouped by status
- `get_daily_trends()` / `get_weekly_trends()` — Trend data for charts
- `get_county_stats()` — Per-county incident statistics
- `get_officer_activity()` — Officer performance metrics
- `get_dangerous_roads()` — Highest-incident roads
- `get_repeat_offenders()` — Repeat vehicle plates
- `get_predicted_hotspots()` — High-risk location predictions
- `global_search()` — Full-text search across all entities
- `create_audit_log()` — Convenience helper for audit logging
- `set_system_setting()` — Upsert system configuration

### Row Level Security
Every table has RLS policies enforcing role-based access. Key principles:
- Officers can read/create their own incidents
- Supervisors can read incidents in their jurisdiction
- Regional/national commanders see wider scope
- Citizens can only see their own reports
- Auditors can read audit logs but not modify them

## 🔐 Storage Buckets

The application requires these Supabase Storage buckets:

| Bucket | Max Size | Allowed Types |
|--------|----------|---------------|
| `evidence-images` | 50 MB | JPEG, PNG, WebP, TIFF, HEIC |
| `evidence-videos` | 50 MB | MP4, MOV, AVI, WebM, MKV |
| `evidence-audio` | 50 MB | MP3, WAV, OGG, AAC, FLAC |
| `evidence-documents` | 25 MB | PDF, DOCX, XLSX, TXT, CSV |
| `evidence-other` | 50 MB | Any |

## 🔄 Auth Trigger

The `on_auth_user_created` trigger on `auth.users` automatically:
1. Creates a `profiles` record for every new user
2. Creates default notification preferences

This eliminates the need for manual profile initialization.

## ⚠️ Important Notes

- **Seed data is DEMO data only** — Clearly labeled as non-production
- **Migrations are idempotent** — Safe to run multiple times (`IF NOT EXISTS`)
- **All predictions include disclaimers** — Never presented as facts
- **No secrets** in migrations — API keys and credentials are managed via environment variables
