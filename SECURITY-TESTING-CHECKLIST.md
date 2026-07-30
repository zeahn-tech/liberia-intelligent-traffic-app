# 🛡️ TrafficWatch AI — Security Testing Checklist

Manual and automated security verification for production readiness.

---

## 1. Unauthorized Access

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 1.1 | Access `/dashboard` while signed out | Redirected to `/auth?returnTo=/dashboard` | ☐ |
| 1.2 | Access `/evidence` while signed out | Redirected to `/auth?returnTo=/evidence` | ☐ |
| 1.3 | Access `/admin/*` while signed out | Redirected to auth | ☐ |
| 1.4 | Access API directly via browser while signed out | Returns 401/403 | ☐ |
| 1.5 | Try to access `/command-center` as `traffic_officer` | Redirected to `/dashboard` or forbidden page | ☐ |
| 1.6 | Try to access `/users` as `traffic_officer` | Redirected to `/dashboard` or forbidden page | ☐ |
| 1.7 | Try to access `/audit` as `traffic_officer` | Redirected to `/dashboard` or forbidden page | ☐ |
| 1.8 | Try to access `/citizen` as `traffic_officer` | Redirected to `/dashboard` (citizen only route) | ☐ |

## 2. Broken Role Permissions

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 2.1 | `citizen` has only `create_incidents` permission | No other permissions granted | ☐ |
| 2.2 | `evidence_officer` cannot view dashboard | Only evidence permissions | ☐ |
| 2.3 | `system_auditor` is read-only (no edit/delete/configure) | Cannot modify data | ☐ |
| 2.4 | `traffic_officer` cannot assign incidents to others | `assign_incidents` permission not granted | ☐ |
| 2.5 | `traffic_officer` cannot delete incidents | `delete_incidents` permission not granted | ☐ |
| 2.6 | `police_supervisor` cannot manage users | `manage_users` permission not granted | ☐ |
| 2.7 | `trainee` role (mock) gets zero permissions | Returns false for all permission checks | ☐ |
| 2.8 | Role level hierarchy is strictly enforced | No role can access higher-level functions | ☐ |

## 3. RLS Bypass Attempts

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 3.1 | Modify Supabase RPC parameters to access other users' data | RLS blocks, returns empty or error | ☐ |
| 3.2 | Direct Supabase REST API call with anon key | RLS enforced — only permitted rows returned | ☐ |
| 3.3 | Try to update a record owned by another officer | RLS update policy blocks | ☐ |
| 3.4 | Try to delete a record from different jurisdiction | RLS delete policy blocks | ☐ |
| 3.5 | Use SQL injection in search/filter parameters | Parameterized queries prevent injection | ☐ |
| 3.6 | Access storage bucket files via direct URL (not signed) | Returns 404 or 403 (private bucket) | ☐ |

## 4. Invalid File Uploads

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 4.1 | Upload `.exe` file | Rejected — "not allowed for security reasons" | ☐ |
| 4.2 | Upload `.bat` file | Rejected | ☐ |
| 4.3 | Upload `.sh` file | Rejected | ☐ |
| 4.4 | Upload `.php` file | Rejected | ☐ |
| 4.5 | Upload `.js` file via renamed extension | Rejected (MIME mismatch) | ☐ |
| 4.6 | Upload HTML pretending to be JPEG | Rejected (MIME validation) | ☐ |
| 4.7 | Upload file with no extension | Rejected or handled gracefully | ☐ |
| 4.8 | Upload file with special characters in name | Name sanitized or rejected | ☐ |
| 4.9 | Upload file with 256+ character name | Rejected — name too long | ☐ |

## 5. Oversized Uploads

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 5.1 | Upload image > 50 MB | Rejected — exceeds limit | ☐ |
| 5.2 | Upload video > 200 MB | Rejected — exceeds limit | ☐ |
| 5.3 | Upload PDF > 25 MB | Rejected — exceeds limit | ☐ |
| 5.4 | Upload audio > 50 MB | Rejected — exceeds limit | ☐ |
| 5.5 | Upload 0-byte file | Handled (may be rejected or allowed with note) | ☐ |

## 6. Injection Attacks

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 6.1 | `<script>alert(1)</script>` in incident title | Stripped/sanitized | ☐ |
| 6.2 | `<img src=x onerror=alert(1)>` in description | onerror handler stripped | ☐ |
| 6.3 | `<iframe src=malware.html>` in officer notes | iframe stripped | ☐ |
| 6.4 | `javascript:alert(1)` in URL field | URL rejected or sanitized | ☐ |
| 6.5 | `data:text/html,<script>` in URL field | URL rejected | ☐ |
| 6.6 | SQL comment `--` in search field | Parameterized query — no injection | ☐ |
| 6.7 | `' OR '1'='1` in text fields | Parameterized query — safe | ☐ |
| 6.8 | `1; DROP TABLE incidents` in ID field | Parameterized query — safe | ☐ |
| 6.9 | Very long text (100k+ chars) in textarea | Truncated or rejected with size limit | ☐ |
| 6.10 | Unicode/emoji injection in forms | Properly handled (no crash) | ☐ |

## 7. XSS

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 7.1 | `escapeHtml` encodes `<>&\"'` | `&lt;&gt;&amp;&quot;&#x27;` | ☐ |
| 7.2 | `escapeHtmlAttribute` double-encodes for attribute context | No breakout possible | ☐ |
| 7.3 | `sanitizeUrl` blocks javascript: scheme | Returns null | ☐ |
| 7.4 | `sanitizeTextInput` removes all HTML tags | Strips to plain text | ☐ |
| 7.5 | React JSX auto-escapes variables (non-dangerouslySetInnerHTML) | All content rendered as text | ☐ |
| 7.6 | No `dangerouslySetInnerHTML` in evidence/file preview | Already using safe rendering | ☐ |
| 7.7 | No `eval()` or `new Function()` in codebase | Security review confirms none | ☐ |
| 7.8 | Content Security Policy header recommended | CSP documented in security.ts | ☐ |

## 8. Authentication Weaknesses

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 8.1 | Brute force login (10+ rapid attempts) | Rate limited or throttled | ☐ |
| 8.2 | Empty password submission | Rejected (8+ char min) | ☐ |
| 8.3 | Very weak password ("password") | Rejected (no uppercase, no number, no special) | ☐ |
| 8.4 | SQL injection in email field during login | Rejected (parameterized) | ☐ |
| 8.5 | Email enumeration (valid vs invalid responses) | Response should be consistent (don't reveal which field is wrong) | ☐ |

## 9. Session Issues

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 9.1 | Session expires → access protected route | Redirected to `/auth?returnTo=...` | ☐ |
| 9.2 | Open app in two tabs, sign out in one | Second tab detects session loss on next API call | ☐ |
| 9.3 | Modify/delete local auth token | Session invalidated, user redirected to sign-in | ☐ |
| 9.4 | Session persistence across browser restart | Token stored, user remains signed in | ☐ |
| 9.5 | Sign out → press browser back | Cannot access cached protected page | ☐ |
| 9.6 | Old session token after password change | Token invalidated, user must re-authenticate | ☐ |

## 10. Unauthorized Evidence Access

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 10.1 | Direct evidence file URL (non-signed) | Returns 403 — private bucket | ☐ |
| 10.2 | Expired signed URL | Returns 403 — URL expired | ☐ |
| 10.3 | View evidence as unauthorized role | RLS blocks access | ☐ |
| 10.4 | Download evidence as unauthorized role | RLS blocks download | ☐ |
| 10.5 | Access evidence from another officer's case | RLS returns empty (no cross-access) | ☐ |
| 10.6 | Access evidence without being assigned to case | RLS blocks | ☐ |

## 11. Insecure API Endpoints

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 11.1 | Supabase anon key in frontend code | Present (this is expected — RLS prevents misuse) | ☐ |
| 11.2 | Supabase service_role key in frontend code | NOT present (critical) | ☐ |
| 11.3 | AI provider API key in frontend code | NOT present (handled server-side) | ☐ |
| 11.4 | RPC functions use SECURITY DEFINER | Set search_path to prevent schema attacks | ☐ |
| 11.5 | Database functions SET search_path | Properly scoped | ☐ |
| 11.6 | API responses do not expose internal error details | Generic error messages returned | ☐ |

## 12. Exposed Secrets

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 12.1 | `.env` files in .gitignore | Yes — all `.env*` patterns ignored | ☐ |
| 12.2 | No hardcoded API keys in source | Check `src/` for any hardcoded keys | ☐ |
| 12.3 | No secrets in production build | `vite build` tree-shakes dev-only code | ☐ |
| 12.4 | Service worker does not expose sensitive data | API caching is NetworkFirst (no stale data served) | ☐ |
| 12.5 | Source maps disabled in production | `sourcemap: false` in vite.config.ts | ☐ |
| 12.6 | No real secrets in public/ directory | `public/` only has manifest, icons, offline page | ☐ |

---

## Summary

| Category | Tests | Pass Rate |
|----------|-------|-----------|
| Unauthorized Access | 8 | ☐ / 8 |
| Broken Role Permissions | 8 | ☐ / 8 |
| RLS Bypass Attempts | 6 | ☐ / 6 |
| Invalid File Uploads | 9 | ☐ / 9 |
| Oversized Uploads | 5 | ☐ / 5 |
| Injection Attacks | 10 | ☐ / 10 |
| XSS | 8 | ☐ / 8 |
| Authentication Weaknesses | 5 | ☐ / 5 |
| Session Issues | 6 | ☐ / 6 |
| Unauthorized Evidence Access | 6 | ☐ / 6 |
| Insecure API Endpoints | 6 | ☐ / 6 |
| Exposed Secrets | 6 | ☐ / 6 |
| **Total** | **83** | **☐ / 83** |
