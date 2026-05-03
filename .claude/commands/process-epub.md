---
description: Ingest an EPUB into books/{slug}/ as a tappable book bundle
argument-hint: epub=<path> slug=<slug> title="<title>" author="<name>"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# /process-epub

You are processing a Japanese EPUB into the project's book bundle format. The pipeline runs end-to-end inside this Claude Code turn — you tokenize, you mint IDs, you write files. No external API calls, no external tokenizer (mecab/kuromoji are not available; do all morphological analysis yourself using your built-in Japanese knowledge).

The raw arguments are in `$ARGUMENTS` as space-separated `key=value` pairs (values containing spaces are quoted). Repo root is the current working directory.

---

## 0. Parse arguments

Extract from `$ARGUMENTS`:

- `epub=<path>` → `EPUB`
- `slug=<book-slug>` → `SLUG`
- `title="<display title>"` → `TITLE`
- `author="<author name>"` → `AUTHOR`

Validate:

- `EPUB` file exists (`test -f "$EPUB"`).
- `SLUG` matches `^[a-z0-9-]+$`.
- `TITLE` and `AUTHOR` are non-empty (fall back to `<dc:title>` / `<dc:creator>` from the OPF only if the user omitted them entirely).

If any check fails, print a one-line error explaining what's missing and stop. Do not proceed with garbage inputs.

---

## 1. Workspace

```bash
TMP=$(mktemp -d)
mkdir -p "books/$SLUG/chapters"
touch "books/$SLUG/vocabulary.jsonl"   # idempotent; preserves prior runs
```

`books/$SLUG/vocabulary.jsonl` is the **append-only ledger**. Never rewrite it from scratch — that would break vocab IDs across resumed runs.

---

## 2. Unpack EPUB

```bash
unzip -q "$EPUB" -d "$TMP"
```

Then:

1. Read `$TMP/META-INF/container.xml`. Find the `<rootfile full-path="…">` attribute — that's the OPF path (relative to `$TMP`).
2. Read the OPF file. Extract:
   - **Manifest map**: every `<item id="…" href="…" media-type="…"/>` → `{id: {href, media_type}}`. Hrefs are relative to the OPF's directory.
   - **Spine order**: every `<itemref idref="…"/>` in document order. Skip ones with `linear="no"` unless they are the only chapters.
   - **Cover id**: `<meta name="cover" content="<id>"/>` if present, else look for a manifest item with `properties="cover-image"`.
   - **Fallback metadata**: `<dc:title>`, `<dc:creator>` — use only if `TITLE` / `AUTHOR` were omitted from arguments.

Build absolute paths to each chapter XHTML by joining the OPF's directory with the manifest `href`.

---

## 3. Cover

If a cover manifest entry exists, copy the source file to `books/$SLUG/cover.jpg` regardless of original extension (the consumer only cares about the path). Set `COVER="cover.jpg"`. Otherwise `COVER=null`.

---

## 4. Per-chapter loop

Iterate the spine in order. For each entry, with index `nn` starting at `00`:

### 4a. Reload the vocab ledger from disk

Re-read `books/$SLUG/vocabulary.jsonl` at the start of every chapter. Build:

- `vocab_by_key`: map `"{lemma}|{reading}"` → `id`
- `next_id`: `max(numeric suffix of existing ids) + 1`, or `1` if the ledger is empty
- `freq_by_id`: existing `frequency` per id

This must happen at the start of *every* chapter — do not cache across the loop. Disk is the source of truth so a resumed run picks up correctly.

### 4b. Read and split the chapter

Read the XHTML file. Extract:

- **Chapter title**: the text content of the first `<h1>` or `<h2>` element. If neither exists, use `Chapter {nn+1}`.
- **Paragraphs**: the text content of each `<p>` element, in document order. Skip paragraphs that are empty or whitespace-only after stripping. Decode HTML entities (`&amp;`, `&#xNNNN;`, etc.) and collapse internal whitespace runs to a single space.

### 4c. Tokenize each paragraph

You — Claude — segment each paragraph into tokens using your knowledge of Japanese morphology. For each token decide:

- `s` — surface form as it appears in the text (always present)
- `r` — reading in hiragana, **only if** the surface contains ≥1 kanji character
- `v` — vocab id, **only if** the token is dictionary-worthy (see sparse-field rules below)
- `lemma` — dictionary form, **only if** it differs from `s` (i.e. the token is conjugated)

Punctuation and symbols (`「」`, `。`, `、`, `…`, `—`, fullwidth Latin) are their own tokens with only `s`.

### 4d. Mint or reuse vocab IDs

For each token that gets a `v`:

1. Compute its `lemma` (dictionary form) and `reading` (full hiragana reading of the lemma — even if the surface was kana-only, the lemma still has a canonical reading).
2. Lookup key `"{lemma}|{reading}"` in `vocab_by_key`.
3. **Hit** → reuse that id; increment `freq_by_id[id]`.
4. **Miss** → mint `next_id` formatted as `v` + 4-digit zero-padded (`v0001`, `v0002`, … `v9999`; expand to 5 digits at `v10000`). Append a new `VocabEntry` line to `books/$SLUG/vocabulary.jsonl` **immediately**, then bump `next_id` and add to the maps. The append-on-mint discipline is what guarantees IDs stay consistent across chapters and resumed runs — do not batch.

Set the token's `v` field to the resolved id.

### 4e. Build paragraphs and write the chapter

Each paragraph becomes a `Paragraph` object:

- `id`: `p` + 3-digit zero-padded, reset per chapter (`p001`, `p002`, …)
- `tokens`: the token list from 4c (with `v` filled in from 4d)
- `grammar`: omit for now (this command does not tag grammar)

Write `books/$SLUG/chapters/{nn}-{SLUG}.jsonl` — one `Paragraph` JSON object per line, no trailing comma, UTF-8.

### 4f. Persist updated frequencies

After all paragraphs in the chapter are written, rewrite `books/$SLUG/vocabulary.jsonl` with the updated `frequency` values from `freq_by_id` (preserving line order — existing entries keep their order, newly-minted ones are appended at the end). This is the only time you rewrite the file in bulk; mints during the chapter were appended directly.

Record this chapter's `{ id: "{nn}-{SLUG}", title }` for the metadata manifest.

---

## 5. After all chapters

### 5a. `kanji.jsonl`

Scan every `lemma` in `vocabulary.jsonl`. Collect the set of unique kanji characters (anything in U+4E00–U+9FFF, plus U+3400–U+4DBF extension A). For each, write one `KanjiEntry` line to `books/$SLUG/kanji.jsonl`:

```
{ kanji, onyomi: string[], kunyomi: string[], meanings: string[], jlpt, stroke_count, frequency, example_words_in_book: string[] }
```

- `onyomi` / `kunyomi`: katakana / hiragana readings respectively
- `meanings`: 1–4 short English glosses
- `jlpt`: `"N5"` … `"N1"`, or `null` if outside JLPT
- `stroke_count`: integer
- `frequency`: number of vocab entries whose lemma contains this kanji
- `example_words_in_book`: up to 5 vocab `id`s whose lemma contains this kanji

You fill these fields from your own knowledge.

### 5b. `grammar.jsonl`

```bash
: > "books/$SLUG/grammar.jsonl"
```

Empty file. Grammar tagging is a separate future pass.

### 5c. `metadata.json`

Write `books/$SLUG/metadata.json`:

```json
{
  "id": "<SLUG>",
  "title": "<TITLE>",
  "author": "<AUTHOR>",
  "cover": "cover.jpg" | null,
  "chapters": [
    { "id": "00-<SLUG>", "title": "..." },
    { "id": "01-<SLUG>", "title": "..." }
  ]
}
```

Chapter list is in spine reading order.

### 5d. `books/index.json`

Read the existing array (or treat as `[]` if missing/empty). Add `SLUG` if not already present. Sort alphabetically. Write back.

---

## 6. Self-check

Run a final verification block. For each check, print PASS/FAIL with a brief detail:

1. `books/$SLUG/metadata.json` parses as JSON; `chapters.length` matches the number of files in `books/$SLUG/chapters/`.
2. Every `v` id referenced in any chapter JSONL line exists in `vocabulary.jsonl`.
3. `vocabulary.jsonl` ids are unique, sequential, no gaps, `v0001`-style.
4. No token with `r` is pure kana; no token with `v` is a particle/inflectional ending/punctuation; no conjugated token is missing `lemma`.
5. Every kanji in any `example_words_in_book` is present in some vocab `lemma`.
6. `books/index.json` contains `SLUG`.

Print a final summary: chapter count, paragraph count, vocab count, kanji count.

If any check fails, leave the files in place but flag the failures clearly — do not delete partial output.

---

## Output schema reference (authoritative)

```
Token       = { s: string, r?: string, v?: string, lemma?: string }
Paragraph   = { id: string, tokens: Token[], grammar?: string[] }
VocabEntry  = { id: string,            // "v0001"
                lemma: string,
                reading: string,        // hiragana
                pos: string,            // "noun" | "verb-godan" | "verb-ichidan" | "verb-suru" |
                                        // "verb-kuru" | "i-adj" | "na-adj" | "adverb" |
                                        // "expression" | ...
                jlpt: "N5"|"N4"|"N3"|"N2"|"N1"|null,
                meanings: string[],     // 1-4 short English glosses
                frequency: number,      // count of token occurrences across all chapters
                first_seen: string }    // chapter id, e.g. "00-mybook"
KanjiEntry  = { kanji: string, onyomi: string[], kunyomi: string[],
                meanings: string[], jlpt: "N5"|...|"N1"|null,
                stroke_count: number, frequency: number,
                example_words_in_book: string[] }   // vocab ids
GrammarEntry= { id: string, pattern: string, title: string,
                jlpt: "N5"|...|"N1"|null,
                formation: string, explanation: string,
                examples_in_book: string[],         // "{chapter-id}/{paragraph-id}"
                see_also: string[] }
ChapterMeta = { id: string, title: string }
BookMeta    = { id: string, title: string, author: string,
                cover: string | null,
                chapters: ChapterMeta[] }
```

### Sparse-field rules (must follow exactly)

- **`r`** is present **iff** `s` contains ≥1 kanji character (CJK Unified Ideographs). Pure-kana tokens (はい, です, それ) and punctuation **omit** `r`.
- **`v`** is present **iff** the token is dictionary-worthy. Content words get `v`: nouns, verbs, i-adjectives, na-adjective stems, adverbs, common set expressions. The following **omit** `v`:
  - Particles: は, が, を, に, へ, で, と, から, まで, より, の, も, や, か, ね, よ, わ, ぞ, ぜ, さ, …
  - Inflectional endings split out as their own tokens: て, た, ます, ました, ない, なかった, う, よう, …
  - Copulae standing alone: だ, です, である
  - Punctuation and symbols
- **`lemma`** is present **iff** `s` ≠ dictionary form. For uninflected tokens, **omit** `lemma`; consumers infer `lemma = s`. Examples:
  - 食べた → `{ s:"食べた", r:"たべた", v:"v0042", lemma:"食べる" }`
  - 食べる → `{ s:"食べる", r:"たべる", v:"v0042" }` (no `lemma`)
  - 本 → `{ s:"本", r:"ほん", v:"v0007" }`
  - を → `{ s:"を" }`
  - 「 → `{ s:"「" }`

### ID format (must follow exactly)

- Vocab id: `v` + 4-digit zero-padded sequential, scoped per book. Expand to 5 digits beyond `v9999`.
- Paragraph id: `p` + 3-digit zero-padded, reset per chapter.
- Chapter file: `{nn}-{slug}.jsonl` with `nn` 2-digit zero-padded starting at `00`.
- Chapter id (in metadata): the chapter file basename without `.jsonl` (e.g. `"00-mybook"`).

---

## Final directory shape

```
books/
├── index.json                        # ["mybook", ...]
└── <SLUG>/
    ├── metadata.json
    ├── cover.jpg                     # only if EPUB had a cover
    ├── vocabulary.jsonl              # append-only ledger
    ├── kanji.jsonl
    ├── grammar.jsonl                 # empty for now
    └── chapters/
        ├── 00-<SLUG>.jsonl
        ├── 01-<SLUG>.jsonl
        └── ...
```

Begin by parsing `$ARGUMENTS` and reporting back the four parsed values before doing any work, so the user can confirm.
