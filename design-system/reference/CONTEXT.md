# Tsundoku — Domain Glossary

This file captures terms with project-specific meaning. Use these names verbatim
in code, issues, briefs, and docs. Add a term only when it's meaningful to a
domain expert (i.e. distinguishing it from a synonym matters).

## Reading model

- **Book** — a tappable title in the library. Lives under `books/{book-id}/`
  with a `metadata.json`, sidecar lexica (`vocabulary.jsonl`, `grammar.jsonl`,
  `kanji.jsonl`), and a `chapters/` directory. The only real book in this repo
  is `nageki-no-bourei-1`.
- **Chapter** — one JSONL file under `books/{book-id}/chapters/`. The first
  line declares the format; remaining lines are paragraphs.
- **Paragraph** — layout/grouping container with a stable id (`pNNN`).
  Paragraphs are not the unit learners reason about, but they are the unit the
  reader visually groups.
- **Sentence** — the canonical reading unit in v2 chapters. Has a stable
  human-readable id (`{chapter-id}-pNNN-sN`), a token list, and optional
  authored sentence-help.
- **Token** — one chunk of surface text inside a sentence. May carry reading
  (`r`), vocabulary reference (`v`), and dictionary lemma (`lemma`).

## Chapter format

- **Legacy chapter format** — *deprecated*. Flat `paragraph → tokens` records
  with no format header, no sentence boundaries, no sentence-help. The reader
  still decodes legacy chapters so historical content keeps working, but no
  new content should be authored as v1. `npm run validate:books` emits a
  warning when it encounters one.
- **v2 chapter format** — current format. First line is `{"format":"v2"}`.
  Each remaining line is a paragraph wrapping a `sentences[]` array. Every
  sentence carries a stable id and authored `help` (see Sentence-help).
- **Migration** — the historical process of converting a legacy chapter to
  v2: segmentation, id assignment, and authoring of sentence-help. The
  corpus is fully migrated; new books are authored directly as v2 by the
  `process-epub` skill, and `npm run validate:books` enforces the contract
  in CI.

## Sentence-help

- **Sentence-help** — authored learning content attached inline to a sentence.
  Shape: `{ translation, note?, grammar? }`. The reader exposes it via the
  inline sentence-help affordance and panel.
- **Translation** — the literal-or-natural English rendering of a sentence.
  **Mandatory** on every sentence in a v2 chapter, enforced by
  `npm run validate:books` in CI. A v2 sentence with a missing or empty
  translation fails validation.
- **Note** — optional freeform teaching commentary that goes beyond a literal
  translation (nuance, register, untranslatable particles).
- **Grammar link** — optional reference (by id) to an entry in the book's
  `grammar.jsonl`. Rendered in the sentence-help panel as a lightweight
  expandable item.
