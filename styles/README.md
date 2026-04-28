# Stylesheet Map

`index.html` loads these files directly in this order. Keep the order stable unless
you are intentionally changing the cascade.

- `base/01-base.css` - Theme variables, reset, animations, sidebar, common UI, view headers, dashboard base.
- `views/02-pokedex.css` - Pokedex filters, cards, detail panel.
- `views/03-builds.css` - Build list, editor, stat controls.
- `views/04-teams.css` - Team list/editor/detail base styles.
- `views/05-items.css` - Items page and item detail panel.
- `views/06-reference.css` - Reference tabs, abilities, natures, archetypes.
- `views/07-profile.css` - Profile, achievements, friends, account sections.
- `responsive/08-mobile.css` - Mobile-first pass and responsive mobile shell.
- `public/09-public.css` - Public build/team/profile route layouts.
- `share/10-share.css` - Share buttons, loading spinner, generated image-card templates.
- `components/11-social-profile.css` - Username modal, public social row, profile support/friend styles, late dashboard additions.
- `components/12-team-build-picker.css` - Team build picker sheet.
- `responsive/13-desktop.css` - Desktop and widescreen responsive overrides.

`../styles.css` is a navigation manifest only.
