<div align="center">

# ⚔️ Champions Forge

**A mobile-first competitive team-building PWA for Pokémon Champions.**

[Live app](https://otterlyclueless.github.io/champions-proto/) · [Admin](https://otterlyclueless.github.io/champions-proto/admindb.html) · [v1.0.0 release](https://github.com/otterlyclueless/champions-proto/releases)

![PWA](https://img.shields.io/badge/PWA-installable-4c51bf?style=flat-square)
![Stack](https://img.shields.io/badge/stack-vanilla_HTML_JS_CSS-f59e0b?style=flat-square)
![Backend](https://img.shields.io/badge/backend-Supabase-3ecf8e?style=flat-square)
![Mobile](https://img.shields.io/badge/designed_for-iPhone_14-ef4444?style=flat-square)

</div>

---

## What is Champions Forge?

Champions Forge helps competitive trainers **plan their squad before battle**. Every calculation uses the exact **Pokémon Champions** ruleset — Lv50 fixed, IVs maxed at 31, 66 SP total (32 per stat), with proper nature modifiers. Numbers you see in the app are the numbers you'll see in-game.

It's a Progressive Web App — installable on your phone home screen, works offline for cached content, and syncs competitive builds + team rosters to Supabase when you're online.

## ✨ Features

- **Pokédex** — 258 Pokémon with search, type/form/obtained filters, shiny toggle, bottom-sheet detail panel, and holographic shiny variants
- **Builds** — Full CRUD on competitive sets with a 2-step mobile editor, live Lv50 stat calculator (bars + hex view), species-locked item picker, and Showdown plaintext export
- **Teams** — 6-slot roster builder with type coverage analyser and battle-log tracking
- **Items (117)** — Hold items, berries, and Mega Stones with sprites, renders, descriptions, VP costs, and category+status filtering
- **Natures** — All 25 with colour-coded stat modifiers
- **Profile & Achievements** — Trainer card with avatar upload and 16 unlockable achievements
- **Mobile-first** — Designed at iPhone 14 viewport (390×844); desktop expands up via media queries
- **Dark + light themes** with smooth transitions
- **Offline-capable** via Service Worker
- **PWA** — add to home screen, runs in standalone mode

## 🎮 Competitive ruleset (matches Pokémon Champions)

```
Level 50        fixed for all battles
IVs             maxed at 31 (no breeding/grinding system)
1 SP            = +1 stat at Lv50 (no EV/4 conversion)
66 SP total     32 max per stat
HP              floor((2 × base + 31) × 50/100) + 60 + SP
Other stats     floor((floor((2 × base + 31) × 50/100) + 5) × nature_mod) + SP
Nature mods     1.1 increased / 0.9 decreased / 1.0 neutral
```

Species-locked items are enforced: Light Ball only shows for Pikachu, each Mega Stone only for its base species, Mega forms can't equip a stone. Z-A transfer Megas are tagged so you know they need deposit-from-Legends: Z-A.

## 📐 Design system

| | |
|---|---|
| **Font** | Plus Jakarta Sans 400–900 (Google Fonts) |
| **Icon system** | [Phosphor Icons](https://phosphoricons.com) v2.1.1 (regular + bold + duotone + fill) |
| **Stat palette** | HP violet · Atk orange / SpA peach · Def blue / SpD sky · Spe rose |
| **Nature indicators** | Green ▲ / Red ▼ (deliberately avoids stat palette collision) |
| **BST tiers** | <400 red · 400-499 gold · 500-599 green · 600+ teal |
| **Touch targets** | 44×44pt minimum, `env(safe-area-inset-*)` aware |

## 🛠 Stack

- **Frontend** — Vanilla HTML/JS/CSS PWA, **no framework, no build step**
- **Modular JS** — `app/app-core.js` (shared utils + auth) · `-dashboard` · `-pokedex` · `-builds` · `-teams` · `-profile` · `-init` (bootstrap)
- **Backend** — [Supabase](https://supabase.com) (PostgreSQL + Row-Level Security + Auth)
- **Auth** — email/password with refresh-token flow via `authFetch()` wrapper
- **Image sources** — [PokéAPI](https://pokeapi.co) sprites, [Serebii](https://www.serebii.net) `/za/` renders (Legends: Z-A), `/itemdex/sprites/` for Mega Stones
- **Hosting** — GitHub Pages

## 📊 Database

15 tables in the `public` schema, all with Row-Level Security:

| Category | Tables |
|---|---|
| Core data _(public read, admin write)_ | `pokemon` (258) · `moves` (900) · `abilities` (191) · `items` (117) · `natures` (25) · `pokemon_moves` (16,450) |
| User-scoped _(scoped to `auth.uid()`)_ | `user_profiles` · `user_items` · `user_achievements` · `user_pokedex` |
| Build/team | `builds` · `team_builds` (junction) · `teams` |
| System | `achievements` (16) · `battle_log` |

All migrations and RLS policies are in the public repo — see the `sql/` directory (coming soon) or the [admin dashboard](https://otterlyclueless.github.io/champions-proto/admindb.html) for the live view.

## 🚀 Running locally

This is a static-file PWA. No build step, no package install.

```bash
# 1. Clone
git clone https://github.com/otterlyclueless/champions-proto.git
cd champions-proto

# 2. Open with any static server. VS Code's Live Server extension is easiest:
#    Right-click index.html → "Open with Live Server"

# Or a one-liner via Python:
python3 -m http.server 5500
# Then visit http://localhost:5500
```

If you want to fork this and run against your own Supabase project:

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL migrations in order (see `sql/` directory)
3. Replace the `API` + `ANON` constants at the top of `app/app-core.js` with your project URL + anon key
4. Import reference data (Pokémon/moves/abilities/items) via the admin panel or direct SQL

## 🗺 Roadmap

- **v1.1** — Drop E: Learnsets UI surfacing the 16k `pokemon_moves` entries
- **v1.2** — Drop F: Sharing builds & teams (public view-only URLs)
- **v1.3** — Drop G: Ability Dex (browse + per-Pokémon listing)
- **v1.4** — Drop H: Natures upgrade (inline in build editor, richer reference)
- **v2.0** — Profile + Friends + Feed epic; achievement expansion (16 → 50+)

## 🙏 Credits

- Sprite data: [PokéAPI](https://pokeapi.co)
- Render data: [Serebii.net](https://www.serebii.net)
- Icon system: [Phosphor Icons](https://phosphoricons.com)
- Font: [Plus Jakarta Sans](https://tokotype.github.io/plusjakarta-sans/)
- Backend: [Supabase](https://supabase.com)

## 📜 Disclaimer

This is a **personal fan-made tool** for the Pokémon Champions competitive community. It is not affiliated with, endorsed by, or sponsored by Nintendo, Creatures Inc., GAME FREAK inc., or The Pokémon Company.

Pokémon and all related marks are © Nintendo / Creatures Inc. / GAME FREAK inc.

## 🔒 License

Copyright © 2026 [otterlyclueless](https://github.com/otterlyclueless). All rights reserved.

Source is provided publicly for transparency and community inspection. You are welcome to study the code, submit issues, or discuss features. **Copying, redistribution, or commercial use of the source code without explicit written permission is not permitted.**

If you'd like to contribute, open an issue first to discuss scope.

---

<div align="center">

_Forge your competitive Pokémon squad._ 🔥

</div>
