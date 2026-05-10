# Tsundoku Reader — UI Kit

A high-fidelity recreation of the Tsundoku reader as click-thru React components. Mirrors the production app at `tsundoku/src/{routes,components}` with the visual language as source of truth.

## Files

- `index.html` — interactive demo: library → reader → vocab popup → translation panel → settings sheet
- `primitives.jsx` — `MetaLabel`, `JlptBadge`, `Pill`, `Sheet`, `BookCover`, `IconChevronLeft`, `IconSettings`, `IconX`
- `Library.jsx` — home screen (library grid + continue card)
- `Reader.jsx` — reader screen (header, prose, paragraph nav)
- `TappableToken.jsx` — single-token tap target with furigana
- `VocabPopup.jsx` — popover/sheet contents
- `SentenceTranslationPanel.jsx` — indigo left-rule translation card
- `SettingsSheet.jsx` — reading prefs (furigana toggle, font size, JP font)
- `data.js` — sample vocab + grammar data drawn from the production sample book

## Conventions

- All components use the design tokens from `../../colors_and_type.css`.
- No external icon library at runtime; the two icons used in production (Settings, ChevronLeft) ship as inline SVG components in `primitives.jsx`.
- Components are visual recreations; persistence (bookmarks, prefs) is in-memory only.
