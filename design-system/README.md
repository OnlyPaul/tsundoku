# Tsundoku Design System

> **Tsundoku — the most interesting way to learn Japanese.**

Tsundoku ( 積ん読 — "books bought but not yet read" ) is a tablet- and
phone-first Progressive Web App for reading native Japanese novels with
inline learning support. It sits somewhere between a Kindle, an electronic
dictionary, and a JLPT textbook: you open a book, every meaningful word is
tappable, kanji come with on/kun readings, sentences expand into a
hand-written-feeling translation card, and grammar patterns the author used
get pulled out as compact reference cards.

The product is one app — a reader — across two viewports (phone and
tablet). There is no marketing site, no admin console, no docs site;
the design system serves the reader and nothing else.

## Sources

This system was reverse-engineered from the Tsundoku codebase
(`tsundoku/`, mounted via the user's local filesystem):

- `tsundoku/src/index.css` — canonical CSS-var color tokens (HSL form)
- `tsundoku/tailwind.config.ts` — font families, radius, animations
- `tsundoku/index.html` — Google Fonts manifest
- `tsundoku/src/routes/Home.tsx`, `Reader.tsx` — production screens
- `tsundoku/src/components/{BookCover,SentenceTranslationPanel,
  TappableToken,VocabPopup,SettingsSheet}.tsx` — production components
- `tsundoku/design/Tsundoku.html` + sibling jsx files — internal hi-fi
  prototype that established the paper aesthetic
- `tsundoku/public/books/nageki-no-bourei-1/` — sample book content
  (real Japanese novel, real vocabulary/kanji/grammar JSONL sidecars)
- `tsundoku/CONTEXT.md` — domain glossary

No Figma was attached; the production source is the source of truth.

## Index

```
README.md                  — this file (start here)
colors_and_type.css        — drop-in CSS vars + element styles
SKILL.md                   — Agent-Skills entry point
assets/                    — logos, app icons, sample book cover
preview/                   — Design System tab cards (one per concept)
ui_kits/reader/            — React/JSX recreations of the reader app
  index.html                  — interactive click-thru: library → reader → vocab
  Library.jsx                 — home / library grid + continue card
  Reader.jsx                  — reader screen (tappable tokens, translate, settings)
  VocabPopup.jsx              — popover/sheet contents
  SentenceTranslationPanel.jsx — translation + grammar cards
  SettingsSheet.jsx           — reading prefs (furigana, font size, JP font)
  primitives.jsx              — Button, MetaLabel, JlptBadge, Sheet, Popover, BookCover
  data.js                     — sample book + vocab + grammar
reference/                 — verbatim copies of the production sources we mined
```

## CONTENT FUNDAMENTALS

Tsundoku's voice is **quietly literate**. It reads like it was written by
someone who actually likes books — a librarian, not a marketer. The product
sells itself by being good, not by shouting.

### Tone

- **Restrained, never breathless.** No "🚀 Level up your Japanese!" There is
  almost no exclamation point in the entire app, and zero emoji.
- **Bilingual eyebrow labels.** The library greets you with
  `つんどく ・ tsundoku` above the heading 本棚 ("bookshelf"). Both scripts
  are present, separated by `・` (katakana middle dot), and treated as
  equally legible. Romaji is lowercase.
- **Japanese for content, English for chrome.** Section heads, screen titles
  and primary headings often use Japanese characters (本棚, 設定, 文); the
  controls labelling them — buttons, microcopy, settings labels — are in
  English. The user is here to read Japanese, so the *content* should be
  Japanese; the *interface* gets out of the way in their native UI language.

### Casing & punctuation

- **Body copy: sentence case.** Always.
- **Eyebrow labels & meta strip: UPPERCASE, tracked, monospace.**
  `LIBRARY ・ 12 BOOKS` · `CHAPTER 4 / 28` · `TRANSLATION` · `GRAMMAR`.
  These are the navigational/meta tier and are unmistakably set apart by
  font + casing + tracking.
- **The middle-dot `・` (U+30FB)** is Tsundoku's preferred separator
  *between Japanese and English*, where it doubles as a small culturally
  appropriate gesture. Use ` ・ ` (with thin spaces around). Use a regular
  `/` for fractions ("Ch. 4 / 28"), and an em-dash `—` for prose pauses.
- **No periods on labels.** "Library", not "Library."

### Pronouns

- **Address the user as you implicitly,** never "the user". When the app
  needs to talk to the reader directly it talks plainly: "Reading
  preferences", "Failed to load library — {error}", "Patterns appearing
  in this paragraph". No "we", no "your" unless necessary ("your library"
  is fine; "we recommend…" is not.)
- **Author voice (in pedagogical copy)** is a knowledgeable friend — see
  the grammar entry style in `vocabulary.jsonl`, e.g. *"なろう is the
  volitional of なる ("to become"); ぜ is a casual, assertive sentence-ending
  particle…"* Confident, dense, written for adults learning a language they
  respect.

### What we never write

- ❌ Emoji, anywhere. Not on cards, not in microcopy, not in errors.
- ❌ "AI", "smart", "intelligent", "powered by".
- ❌ Marketing intensifiers — "powerful", "seamless", "effortless".
- ❌ Title Case On Sentences. Use sentence case.
- ❌ Kaomoji, exclamation points in chrome, hand-drawn-ish typographic
  flourishes. The aesthetic is books, not stationery.

### Examples (verbatim from production)

```
つんどく ・ tsundoku
本棚

CONTINUE READING
{Book title in JP}            (line-clamp-1, font-jp)
{Author}                      (italic, muted)
CH. 4

LIBRARY ・ 12 BOOKS

CH. 4 / 28
← PREVIOUS    CHAPTER 4 / 28    NEXT →

設定                            (sheet title)
READING PREFERENCES             (sheet description)

Furigana            [On]
Font size      − 17 +
Japanese font  ▾ Noto Serif JP

ABOUT
VERSION                        0.1.0
BOOKS IN LIBRARY               12
```

## VISUAL FOUNDATIONS

The visual identity is a single sustained metaphor: **a quiet reading
room. Warm cream paper. Black ink. A single vermillion seal on the page
when grammar matters. An indigo annotation when the English translation
shows up.** Everything else stays out of the way.

### Color

The palette is intentionally tiny. There is one paper, one ink, one brand
hue, and one secondary hue — the indigo that is **reserved exclusively
for translation/annotation surfaces**. Neutrals are warm (slightly tan),
not cool grey.

| Token             | Hex        | Use                                                              |
|-------------------|------------|------------------------------------------------------------------|
| `--paper`         | `#F5EFE4`  | Page background. Theme-color of the manifest.                    |
| `--paper-card`    | `#FBF7EE`  | Card / popover / muted surface. A whisper warmer than paper.     |
| `--ink`           | `#1F1B16`  | Body text, all primary type.                                     |
| `--ink-soft`      | `#736D66`  | Muted text — labels, sub-titles, disabled states.                |
| `--rule`          | `#DDD3C2`  | Hairline borders, dividers. Always 1px.                          |
| `--vermillion`    | `#BC5A2C`  | Brand. Primary buttons, focus ring, chapter accents, 文 stamp.   |
| `--indigo`        | `#4A59A8`  | Translation panels, sentence-help button — *and only those*.     |
| `--danger`        | `#EF4444`  | Destructive only. Practically never appears.                     |

A dark-mode variant is defined in `src/index.css` but is not the default
canvas — the warm paper feel is the brand. Don't design dark-first.

### Type

| Family               | Role                                                  |
|----------------------|-------------------------------------------------------|
| **Source Serif 4**   | English prose, byline italics, body copy.             |
| **Noto Serif JP**    | Default Japanese. Headings and reader body.           |
| **Shippori Mincho**  | Alt JP serif (user-selectable in settings).           |
| **Klee One**         | "Hand-written" JP option. For decorative use.         |
| **Noto Sans JP**     | JP sans alternative. Rarely used by chrome.           |
| **JetBrains Mono**   | All meta labels, badges, version strings, counts.     |

The type system isn't a generic 8-step web scale; it's tuned to one screen
(the reader). User-settable font size lives in **14–26px** with a default
of **17**; everything else (chapter titles, library hero, byline) sits in
fixed pixel values you can read in `colors_and_type.css`.

Mono labels are the connective tissue of the whole system — they appear
above every section, on every count, on every fraction. Always
`font-mono · 11px · uppercase · tracking-wider (0.12em) · ink-soft`.

### Spacing & layout

- Reader prose is centered in `max-w-prose` (~65ch). Library uses a
  3-column grid on phone, 5-column on tablet, with `gap-4 / md:gap-6`.
- Page padding: `px-6` mobile, `px-10` tablet. Top padding is generous
  (`pt-10` on the library) — the page wants to feel like it has air.
- Sticky reader header is **80% backdrop-blur with bg/90 paper** — not
  opaque. Content scrolls under it visibly.

### Backgrounds

- **Solid warm cream.** No gradients. No textures. No illustrations.
  No hero photos. The closest the app comes to "imagery" is the
  fallback book-cover (a 165° linear-gradient between two palette
  colors with a single CJK glyph centered on it).
- Full-bleed colour is rare — only sheets and popovers use the
  slightly lighter `--paper-card`.

### Borders, shadows & corners

- **Borders are 1px hairlines in `--rule`.** They appear *constantly* —
  between sections, around cards, under sticky headers, around buttons.
  They carry a lot of structural weight because shadows do almost none.
- **Shadows are nearly absent.** Cards do not float. The two places
  shadows do appear are: book covers (a tight `0 1px 2px / 0 4px 14px`
  + inner spine highlight, to read as a physical paperback) and the
  sticky header's `backdrop-blur`. Everything else uses borders.
- **Corner radii are conservative.** The system uses
  `--radius: 8px` (md), `4px` (sm), and `999px` for pill chips.
  Book covers are `rounded-sm` (2px) — a paperback's corner, not a card.

### Animation

- Single signature easing: `cubic-bezier(0.2, 0, 0, 1)`, ~180ms.
  See `--easing` and `--dur-base`.
- The named keyframe is `translation-in` — a 2px slide-down + fade-in
  used when the sentence translation panel appears. It's the **only**
  motion the app is opinionated about.
- Radix `accordion-down/up` is available but used minimally.
- **No bounces. No spring scales. No parallax.** Hover is `transition-colors`
  only. The book is the protagonist; the chrome holds still.

### Hover, press, focus

- **Hover (links, mono labels, back button):** `text-muted-foreground →
  text-primary`. Color shift only, no scale.
- **Hover (vermillion buttons):** `bg-primary → bg-primary/90`.
- **Press / active:** browser default — no custom shrink. The product is
  used while reading; the chrome shouldn't dance.
- **Focus:** `ring-2 ring-ring ring-offset-2` (vermillion ring on paper).
  All controls are keyboard-reachable.
- **Disabled:** `opacity: 0.4`, no pointer events, mono labels stay mono.

### Transparency & blur

- Used in exactly one place: the sticky reader header
  (`bg-background/90 backdrop-blur`) so prose can show through as it
  scrolls under. Don't add new translucent surfaces; doing so dilutes
  the place that one earns its meaning.
- Translation panel uses solid `--paper-card` with a 2px **left border
  in `--indigo`** — this is the brand's "annotation in the margin"
  affordance.

### Cards & containers

A "card" in Tsundoku is one of:
- **Book cover** — `aspect-[2/3]`, `rounded-sm`, `shadow-cover`,
  no border. Either an image or a fallback gradient + glyph.
- **Continue-reading row** — `border border-rule`, `rounded-md`,
  `bg-card`, hover `border-primary/50`. Inline, horizontal.
- **Translation card** — left-border-only (`border-l-2 border-indigo`)
  on `bg-card` — the *only* place a left-border-only treatment lives.
  This is sacred; do not generalize the pattern.
- **Vocab popover (tablet) / sheet (phone)** — `bg-card`, no border,
  Radix Popover/Sheet defaults.
- **Grammar / kanji card** — `border border-rule`, `rounded-sm`,
  `p-2`, body-text size; understated.

### Layout rules (fixed elements)

- The reader's top header is sticky. Nothing else is.
- On tablet, sheets slide in from the right; on phone, they rise from
  the bottom. Decided by `useMediaQuery('(min-width: 768px)')`.
- The library's `+ Import` button exists in the corner but is currently
  disabled — preserve its presence as future-affordance.

## ICONOGRAPHY

Tsundoku's icon language is **lucide-react** — a thin (1.5–2 stroke),
geometric, open-source icon set. It is used **sparingly**: the production
reader uses exactly two icons total (`ChevronLeft`, `Settings`). The
library uses zero icons.

When in doubt, **don't add an icon.** Tsundoku's chrome is type-and-rule
driven; an icon should appear only when there is no good non-icon
affordance.

### Rules

- **Stroke icons only.** No filled icons. lucide's default 2px stroke,
  18–20px size, color = `currentColor`.
- **Inline with text-color.** Icons inherit `text-muted-foreground` when
  next to a label, and shift to `text-primary` on hover. They are never
  vermillion at rest.
- **One icon per row, max.** Lining up multiple icons (a toolbar full of
  tiny glyphs) is anti-Tsundoku.
- **Exception: ASCII arrows in nav.** `← Previous` / `Next →` use
  literal arrow characters, set in `font-mono`, never lucide arrows.
  This is a deliberate stylistic choice — they belong to the meta tier.
- **Exception: 文 stamp.** Grammar paragraphs in legacy v1 chapters get
  a 20px round vermillion seal with the kanji `文` (bun, "writing")
  inside, set in `font-jp`. This is more *symbol* than icon and is the
  only literal Japanese-character icon in the system.
- **Logo glyph: 積 (tsumu, "to pile up").** Used in this design system's
  brand mark — see `assets/logo.svg`. Not present in the production app's
  chrome (the wordmark is just text "tsundoku").
- **Emoji: never.** Including in errors, empty states, or tooltips.

### Available icons (lucide-react, currently used)

Loaded via the `lucide` CDN script (`assets/iconography.html` enumerates
the recommended subset). The production-confirmed set is:

- `ChevronLeft`, `ChevronRight` — back / forward navigation
- `Settings` — opens the reading-preferences sheet
- (recommended for future use: `Bookmark`, `Search`, `Plus`, `X`,
  `Check`, `BookOpen`, `Languages`, `Type`, `Minus`, `Info`)

CDN: `<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>`

### Logos & app icons

- `assets/logo.svg` — primary lockup (積 seal + tsundoku wordmark).
- `assets/logo-mark.svg` — seal alone, square.
- `assets/icon-192.svg`, `assets/icon-512.svg` — PWA app icons. These
  are the same vermillion-on-cream 積 seal as `logo-mark.svg`, sized for
  the manifest. Replaces the flat-purple placeholders that shipped in
  `tsundoku/public/icons/`.
- `assets/sample-cover-nageki.jpg` — sample book cover used in mocks
  and the UI kit.

## Caveats / known substitutions

- **No font files bundled.** All six families load from Google Fonts
  via `<link>` (the production app does the same). If a download package
  for offline use is needed, fetch the WOFF2s from Google Fonts and drop
  them into `assets/fonts/`.
- **Logos drawn from scratch.** The codebase ships only the flat-purple
  PNG icons; there is no SVG mark in production. The 積-seal lockup in
  `assets/logo.svg` was constructed for this design system from the
  brand metaphor (vermillion seal on cream paper). Flag for the team.
- **No Figma source available** — the design context was extracted from
  code only.
