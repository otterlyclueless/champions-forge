# App Module Map

Scripts are plain browser globals loaded by `index.html`; there is no build step.
Keep the order in `index.html` unless you have checked dependencies.

## Core Shell

- `core/core.js` - Supabase config, auth/session helpers, shared API helpers, global state, type data, base loaders.
- `core/dashboard.js` - Home dashboard, activity feed, notification/search sheets, onboarding.
- `core/pokedex.js` - Pokedex filters, grid, obtained/shiny toggles, dex detail panel.
- `core/init.js` - Startup, saved theme, initial loaders, service worker registration.

## Builds

- `builds/stats.js` - Build editor stat calculator, SP controls, bars/hex preview.
- `builds/main.js` - Build list state, editor state, editor rendering, Pokemon picker step.
- `builds/sharing.js` - Build public toggle, customise panel, copy/share URL controls.
- `builds/detail.js` - Build detail view, matchup helpers, save/delete/login modal helpers.
- `builds/utils.js` - Duplicate, favourite, Showdown export.
- `app-builds.js` - Navigation note only; not loaded at runtime.

## Teams

- `teams/main.js` - Team state, identity controls, entry points, roster loading.
- `teams/sharing.js` - Team public toggle, customise panel, copy/share URL controls.
- `teams/views.js` - Team list, member cards, editor layout.
- `teams/detail.js` - Team detail layout, save/delete helpers.
- `teams/coverage.js` - Type coverage analyser.
- `teams/battle-log.js` - Battle logging and team records.
- `teams/build-picker.js` - Slot-aware build picker used by the team editor.
- `teams/teams.js` - Navigation note only; not loaded at runtime.

## Items, Reference, Profile

- `items/items.js` - Item collection list and item detail panel.
- `reference/reference.js` - Abilities, natures, archetype reference views.
- `profile/profile.js` - Trainer profile, achievements, friends, account actions, username modal.
- `app-profile.js` - Navigation note only; not loaded at runtime.

## Pickers

- `pickers/editor-panel.js` - Desktop third-panel picker shell.
- `pickers/ability-nature.js` - Ability and nature pickers.
- `pickers/item-picker.js` - Held-item picker.
- `pickers/move-picker.js` - Legal move picker.
- `pickers/archetype-picker.js` - Build archetype picker.
- `app-pickers.js` - Navigation note only; not loaded at runtime.

## Public Routes And Sharing

- `public/router-core.js` - Hash parsing, public route shell, share-code generation.
- `public/renderers.js` - Public build/team/profile page renderers and HTML builders.
- `public/social.js` - Likes and copy-to-my-build/team actions.
- `share/share.js` - Share URLs, Web Share helpers, image-card generation.
- `public/router-boot.js` - Hashchange listener and `_championsRouter` global export.
- `app-router.js` - Navigation note only; not loaded at runtime.
