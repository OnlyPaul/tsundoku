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

- **Legacy chapter format** — flat `paragraph → tokens` records. No format
  header, no sentence boundaries, no sentence-help.
- **v2 chapter format** — first line is `{"format":"v2"}`. Each remaining line
  is a paragraph wrapping a `sentences[]` array. Sentences carry stable ids
  and may carry `help`.
- **Migration** — the process of converting a legacy chapter to v2,
  including segmentation, id assignment, and authoring of sentence-help.

## Sentence-help

- **Sentence-help** — authored learning content attached inline to a sentence.
  Shape: `{ translation, note?, grammar? }`. The reader exposes it via the
  inline sentence-help affordance and panel.
- **Translation** — the literal-or-natural English rendering of a sentence.
  Required on every sentence with help. After full migration, every sentence
  in a v2 chapter carries a translation.
- **Note** — optional freeform teaching commentary that goes beyond a literal
  translation (nuance, register, untranslatable particles).
- **Grammar link** — optional reference (by id) to an entry in the book's
  `grammar.jsonl`. Rendered in the sentence-help panel as a lightweight
  expandable item.
