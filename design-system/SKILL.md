---
name: tsundoku-design
description: Use this skill to generate well-branded interfaces and assets for Tsundoku, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick start

- **Drop-in CSS:** `<link rel="stylesheet" href="colors_and_type.css">` gives you fonts, color tokens, and base type at production sizes.
- **Hard rules:** warm cream paper (`#F5EFE4`) + black ink (`#1F1B16`); single vermillion brand accent (`#BC5A2C`); indigo (`#4A59A8`) reserved exclusively for English translation surfaces; mono uppercase tracked labels are the connective tissue.
- **Never:** emoji, gradients on UI, AI-marketing copy, multiple-icon toolbars, drop shadows on regular cards, dark-first design.
- **Always:** Japanese for content, English for chrome; sentence case body; UPPERCASE TRACKED mono for labels; 1px hairline borders for separation.

## Files

- `README.md` — full system: company context, content fundamentals, visual foundations, iconography
- `colors_and_type.css` — tokens + base styles
- `assets/` — logo, mark, app icons, sample cover
- `ui_kits/reader/` — interactive React/JSX recreation of the production reader
- `preview/` — small per-concept demonstration cards
