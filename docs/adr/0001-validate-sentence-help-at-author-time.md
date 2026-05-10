# 0001 — Validate sentence-help coverage at author time, not at runtime

**Status:** Accepted

## Context

After the corpus migration to the v2 chapter format, the project needs to
guarantee that every v2 sentence carries a non-empty `translation`. There are
two natural places that contract could be enforced:

1. **The runtime chapter decoder** (`src/lib/chapter-decoder.ts`), which runs
   inside the user's browser when a chapter is opened.
2. **A dedicated content-validation step** (`npm run validate:books`) that runs
   on a developer machine and in CI before content can merge.

The decoder already throws on structural problems (missing format header,
duplicate sentence ids, malformed help shape, etc.), so extending it to
require `help.translation` would have been mechanically simple.

## Decision

Enforce the translation rule (and the related vocab-id and grammar-id
cross-validation) **only** in the new `validate:books` script, wired into CI
between Lint and Unit tests. The runtime decoder is left unchanged: a v2
sentence with no `help` continues to decode successfully and the reader
simply renders no sentence-help affordance for it.

The author-time check is the contract gate; the reader is forgiving.

## Consequences

- A bad sentence is caught at the moment a maintainer can fix it (PR review),
  not at the moment a learner is reading.
- A single missing translation that somehow slipped past CI does not crash
  the whole book in the user's browser — the affected sentence simply shows
  no panel, which is the same graceful degradation we already use for
  legacy v1 content.
- The validator and the decoder share their structural rules through the
  decoder itself: the validator invokes `decodeChapter` and then layers the
  translation / vocab-id / grammar-id checks on top, so structural rules
  stay defined in exactly one place.
- Future runtime code can rely on the *shape* of a v2 sentence (id, tokens,
  optional help) without having to assume help is always present. This keeps
  the reader's resilience to data drift even if the content contract evolves.
- Removing v1 support entirely is a separate, future decision; until then the
  validator emits a deprecation warning when it encounters a v1 chapter
  rather than failing.
