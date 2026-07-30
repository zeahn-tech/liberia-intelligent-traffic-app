# 🛡️ TrafficWatch AI — PWA Testing Checklist

Run through this checklist manually in a browser (Chrome DevTools recommended for offline/responsive testing).

---

## 1. Installation

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 1.1 | Open app in Chrome desktop | Install icon appears in address bar | ☐ |
| 1.2 | Tap "Install App" prompt in-app | Native install dialog appears | ☐ |
| 1.3 | Click "Not now" on install prompt | Prompt dismisses, doesn't reappear for 30 days | ☐ |
| 1.4 | Install the app | App installs, launches in standalone window (no address bar) | ☐ |
| 1.5 | Open app from home screen (Android) | App opens with splash screen, then dashboard | ☐ |
| 1.6 | Check app title in standalone window | Shows "TrafficWatch AI" | ☐ |
| 1.7 | Check app icon on home screen/desktop | Icon renders correctly (SVG shield icon) | ☐ |

## 2. Manifest

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 2.1 | Check `manifest.webmanifest` via DevTools → Application → Manifest | All fields valid (name, short_name, icons, start_url, display) | ☐ |
| 2.2 | Check `short_name` ≤ 12 characters | "TrafficWatch AI" fits | ☐ |
| 2.3 | Verify `start_url` is `/` | Opens dashboard after auth | ☐ |
| 2.4 | Verify `display` is `standalone` | No browser chrome in installed mode | ☐ |
| 2.5 | Verify theme color `#1a1a2e` matches status bar | Status bar is dark | ☐ |
| 2.6 | Verify shortcuts work (Dashboard, New Incident) | Long-press icon shows shortcuts | ☐ |
| 2.7 | Verify `manifest.webmanifest` Content-Type | Server returns `application/manifest+json` | ☐ |

## 3. Service Worker

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 3.1 | Check SW registration in DevTools → Application → Service Workers | SW registered, status "activated and is running" | ☐ |
| 3.2 | SW precaches app shell | All JS/CSS/HTML/SVG assets listed in Cache Storage | ☐ |
| 3.3 | Deploy new version → check update prompt | "Update Available" banner appears within 30s | ☐ |
| 3.4 | Click "Update Now" | Page reloads with new SW controlling | ☐ |
| 3.5 | Click "Later" | Banner dismisses for the session | ☐ |
| 3.6 | Check runtime caches in DevTools → Application → Cache Storage | api-v3, map-tiles-v3, images-v3, static-v3, google-fonts-v3 listed | ☐ |

## 4. Offline

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 4.1 | **Enable offline mode** (DevTools → Network → Offline) | App does NOT show blank screen | ☐ |
| 4.2 | Navigate to a previously visited page | Page loads from service worker cache | ☐ |
| 4.3 | Navigate to a never-visited route | Offline fallback page appears (styled card with "No Connection") | ☐ |
| 4.4 | Click "Try Again" on offline page | Tries to reload when online | ☐ |
| 4.5 | Create an incident while offline | Form works, data saved to IndexedDB | ☐ |
| 4.6 | Upload evidence while offline | File queued for upload, "Queued Offline" badge shown | ☐ |
| 4.7 | Save a draft while offline | Draft saved to IndexedDB drafts store | ☐ |
| 4.8 | View previously loaded map tiles | Map tiles render from cache | ☐ |

## 5. Reconnection & Sync

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 5.1 | **Re-enable network** while offline data exists | Sync triggers automatically within 2-5 seconds | ☐ |
| 5.2 | Check online/offline status indicator | Shows "Online" (green) when connected, "Offline" (red) when disconnected | ☐ |
| 5.3 | Create incident offline → go online | Incident syncs to Supabase | ☐ |
| 5.4 | Upload evidence while offline → go online | Evidence uploads to Supabase Storage | ☐ |
| 5.5 | Create draft while offline → go online | Draft available for submission | ☐ |
| 5.6 | Rapid offline/online toggle | No data loss, sync queue processes correctly | ☐ |

## 6. Deep-link Routes

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 6.1 | Open `/dashboard` directly in URL bar | Dashboard loads (redirect to auth if not signed in) | ☐ |
| 6.2 | Open `/incidents/new` directly | New incident form loads | ☐ |
| 6.3 | Open `/evidence` directly | Evidence center loads | ☐ |
| 6.4 | Open `/settings` directly | Settings page loads | ☐ |
| 6.5 | Open `/citizen/report` directly | Citizen report form loads | ☐ |
| 6.6 | Open `/command-center` directly | Command center loads (auth check) | ☐ |
| 6.7 | Open `/search?q=test` directly | Search results load with query | ☐ |
| 6.8 | Open `/auth` directly | Auth page loads, login works | ☐ |
| 6.9 | Open `/nonexistent-route` | 404 page loads (not blank screen) | ☐ |
| 6.10 | **Refresh on any deep-link route** (e.g., `/incidents/123`) | Route reloads correctly — NOT a 404 | ☐ |

## 7. Browser Refresh

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 7.1 | Press F5 / Cmd+R on dashboard | Dashboard reloads correctly | ☐ |
| 7.2 | Press F5 on incident detail page | Incident detail loads with same ID | ☐ |
| 7.3 | Navigate back after refresh | Browser history works correctly | ☐ |
| 7.4 | Use browser back/forward buttons | SPA navigation works | ☐ |

## 8. Mobile Responsiveness

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 8.1 | **320px width** (iPhone SE) | No horizontal scroll, layout stacks vertically | ☐ |
| 8.2 | **375px width** (iPhone) | Mobile bottom nav visible, sidebar hidden | ☐ |
| 8.3 | **414px width** (iPhone Plus) | Forms and cards use full width appropriately | ☐ |
| 8.4 | **768px width** (iPad portrait) | Sidebar collapsible, content well-spaced | ☐ |
| 8.5 | **1024px width** (iPad landscape) | Sidebar visible, 2+ column layouts work | ☐ |
| 8.6 | **1440px width** (desktop) | Max-width container centers content | ☐ |
| 8.7 | Rotate device | Layout adapts, no broken state | ☐ |
| 8.8 | Touch targets ≥ 44px on mobile | Buttons and links are tappable | ☐ |

## 9. Desktop Responsiveness

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 9.1 | Window at 1280px width | Sidebar expanded, full dashboard visible | ☐ |
| 9.2 | Window at 1920px width | Content centered at max-w-7xl, no stretching | ☐ |
| 9.3 | Resize window dynamically | Layout adjusts smoothly | ☐ |
| 9.4 | Sidebar collapse/expand toggle | Sidebar collapses to icon-only mode | ☐ |

## 10. iOS Specific

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 10.1 | Add to Home Screen via Safari Share Sheet | App icon appears on home screen | ☐ |
| 10.2 | Launch from home screen | Splash screen shows, app opens in fullscreen | ☐ |
| 10.3 | Status bar style | Black translucent, matches theme | ☐ |
| 10.4 | Safe area handling | Content not hidden behind notch/home indicator | ☐ |

## 11. Push Notifications

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 11.1 | Notification permission prompt | Browser asks for permission | ☐ |
| 11.2 | Receive push notification | Notification appears with title and body | ☐ |
| 11.3 | Click notification | Opens/focuses app, navigates to target URL | ☐ |
| 11.4 | Dismiss notification | Notification closes, no action taken | ☐ |

---

## Summary

| Category | Tests | Pass Rate |
|----------|-------|-----------|
| Installation | 7 | ☐ / 7 |
| Manifest | 7 | ☐ / 7 |
| Service Worker | 6 | ☐ / 6 |
| Offline | 8 | ☐ / 8 |
| Reconnection & Sync | 6 | ☐ / 6 |
| Deep-link Routes | 10 | ☐ / 10 |
| Browser Refresh | 4 | ☐ / 4 |
| Mobile Responsiveness | 8 | ☐ / 8 |
| Desktop Responsiveness | 4 | ☐ / 4 |
| iOS Specific | 4 | ☐ / 4 |
| Push Notifications | 4 | ☐ / 4 |
| **Total** | **68** | **☐ / 68** |
