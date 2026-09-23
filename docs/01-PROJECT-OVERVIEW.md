# ClaimIt — Project Overview

## What it is

ClaimIt is a mobile app (Android, built with Expo/React Native) that digitizes a school's Lost & Found process around one core guarantee: **an item can only be marked "Claimed" after a staff member scans its QR code.** Everything else in the app — reporting, browsing, matching, notifications — exists to get the right person to that scan.

## Problem statement

Traditional school lost & found systems are a physical list or a spreadsheet: no audit trail, no proof of who actually released an item to whom, and no way for a student to check status remotely. ClaimIt replaces that with a verifiable digital chain of custody, without turning the school into a full identity-verification system.

## Core feature

Every found item — whether logged directly by staff or reported by a student — gets a unique QR tag **only after a staff member has physically confirmed possession of it.** Release requires a staff-authenticated QR scan, enforced at the API level, not just hidden in the UI. This is what makes the audit trail trustworthy.

## Users

| Role        | Registration                                             | Key actions                                                                                                                           |
| ----------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Student** | Self-registered (school email domain restricted via SSO) | Report lost items, report found items, browse the shared Found Items feed, tap Mine/Not mine, submit claims, track status             |
| **Staff**   | Admin-provisioned / invite-only                          | Log found items directly, confirm receipt of student-reported items, generate QR tags, scan to release, review claims, view audit log |

## Core modules

1. **Staff Logging** — staff logs an item they already have in hand; QR generated immediately.
2. **Student Reporting** — students can report either a lost item or a found item. Found reports post to the shared feed marked "Pending drop-off" until staff confirms receipt.
3. **Matching** — system compares lost reports against the found-items pool (both sources) and notifies on probable matches; students can also browse and self-identify via Mine/Not mine.
4. **QR Release** — the single non-negotiable module: staff-authenticated scan is the only path to "Claimed."
5. **Audit & Reporting** — full chronological history per item (Found/Reported → Confirmed → Matched → Claim Requested → Released), filterable by status.

## Tech stack

- **Frontend:** Expo / React Native (Android target)
- **Auth:** Clerk (SSO, domain-restricted student self-registration, invite-only staff)
- **Backend/DB:** Supabase (Postgres + Storage + Edge Functions / API routes)
- **QR:** expo-camera / expo-barcode-scanner for scanning; QR generation server-side, tied to item ID
- **Notifications:** Expo Notifications (push)

## Out of scope (explicitly excluded)

AI photo matching, SMS messaging, emergency contacts, social/community features beyond Mine/Not mine, scoring/ranking/gamification, unattended self-service pickup, manual email/password login, complex analytics dashboards.

## Success criteria

- No item can reach "Claimed" status without a valid staff QR scan (verified at API level, not just UI).
- Every status change is recorded in the audit log with actor, timestamp, and action.
- A student can report, browse, and claim without staff involvement until the final release step.
- App builds and runs as an Android APK via EAS Build.
