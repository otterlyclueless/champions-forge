# Champions Forge — April 2026 Update

## Highlights

Team Identity, 22 standardised build archetypes, a rebuilt Profile page, smarter navigation, redesigned toasts, mobile theme toggle, Ko-fi support link, and a full set of bug fixes and PWA polish.

---

## New Features

### ⚔️ Build Archetypes
Builds now have 22 standardised competitive roles to choose from:

**Offense** — Physical Sweeper, Special Sweeper, Mixed Attacker, Wallbreaker, Revenge Killer  
**Setup** — Setup Sweeper, Trick Room Abuser  
**Defense** — Physical Wall, Special Wall, Tank, Cleric  
**Support** — Trick Room Setter, Hazard Setter, Hazard Remover, Pivot, Screens Support, Weather Setter, Terrain Setter, Support  
**VGC** — Speed Control, Redirection, Fake Out Lead

Each archetype has its own colour and Phosphor icon, threaded throughout the app via a CSS custom property (`--ac`). The archetype picker is a bottom sheet (matching the nature and item pickers), supports a custom free-text entry, and includes an **✨ Suggest** button that auto-detects the role from your build's moves and base stats.

A new **Archetypes** tab on the Reference page explains every role — useful for players new to the competitive scene.

### 🏆 Team Identity
Teams now have a visual identity layer. Set in the team editor:
- **Icon** — 12 emoji options
- **Theme** — 8 colour palettes (Crimson, Ocean, Storm, Forest, Gold, Shadow, Frost, Ember)
- **Archetype** — a label for your team's strategic style

Identity shows across team list cards (colour accent border, icon badge, archetype pill), the detail header, and the share image card.

### 👤 Profile — Trainer Hub
The Profile page has been rebuilt:
- **Social stats row** — Friends, Likes Received, Public Builds, Public Teams
- **Collapsible sections** — Achievements, Recent Activity, and Account all expand/collapse
- **Achievement filters** — All / Unlocked / Locked / Nearly There (≥50% progress)
- **Clickable activity** — tap a build or team from your recent activity to open it; back returns to Profile
- **Account section** — sign out and a clearly separated Danger Zone for account deletion

### 🧭 Navigation Context
The back button now remembers where you came from:
- Open a build from the Home activity feed → back goes to Home
- Open from your Profile activity → back goes to Profile  
- Open from the list → back goes to the list

Tapping the Builds or Teams nav while already in a detail view also correctly returns to the list rather than reloading awkwardly.

### ☕ Support This Project
A Ko-fi support link is now in the mobile More sheet and the Profile account section.

### ☀️/🌙 Mobile Theme Toggle
The light/dark theme toggle is now accessible on mobile via the More sheet. Your theme preference is saved across sessions.

---

## Design & Polish

### 🔔 Toast Redesign
Notifications have been rebuilt from scratch:
- **Position** — bottom-centre on mobile (above the nav bar), bottom-right on desktop
- **Icons** — Phosphor icons replace emoji (check-circle, warning-circle, info)
- **Info toasts** — now have their own blue style (previously unstyled)
- **Animation** — slide up on enter, slide down on dismiss
- All inline JS styles removed; CSS classes handle everything

### 📱 PWA Polish
- **Status bar** — content now correctly clears the iOS status bar in standalone mode (`env(safe-area-inset-top)`)
- **Nav bar** — slimmed down height on mobile for a more native feel
- **New icon set** — redesigned shield icon across all PWA surfaces (192px, 512px, maskable, Apple Touch)
- **Service worker** bumped to `champions-v5` — existing users update automatically on next visit

---

## Bug Fixes

| Bug | Fix |
|---|---|
| Team editor name/format/notes reset when adding or removing a Pokémon slot | Editor now snapshots live DOM values before re-rendering |
| Archetype missing from team share image cards | Added `archetype` to the `builds()` nested select in the team_builds query |
| Public trainer profiles returning "Trainer not found" even with a username | RLS policy updated: profiles with a username set are readable without public content |
| Signup button appearing to do nothing after email confirmation was disabled | Signup fallback now attempts a direct login if the account already exists |
| Friend request sending without a username prompt | `pubSendFriendRequest` now shows the username modal if no username is set |

---

## Infrastructure

- **Supabase Site URL** corrected from `localhost:3000` to the live app URL — confirmation email links now redirect correctly
- **Email confirmation disabled** — new accounts activate instantly, no confirmation step
- **New DB columns** — `teams.team_icon`, `teams.team_theme`, `teams.team_archetype` (nullable text, backwards-compatible)

---

## For Existing Users

The app updates automatically on your next visit — no manual refresh needed. If the new icon hasn't appeared on your home screen, remove and re-add the PWA shortcut.

---

*Thanks to everyone who's been testing and sharing feedback. More to come.* ⚔️
