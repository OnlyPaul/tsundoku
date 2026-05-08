import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { decodeChapter } from '@/lib/chapter-decoder'
import type { BookMetadata, GrammarEntry, KanjiEntry, VocabEntry } from '@/types/book'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..', '..')
const BOOKS = join(ROOT, 'books')
const FIXTURE = join(BOOKS, 'tsundoku-test')

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as T)
}

function readChapter(chapterId: string) {
  return decodeChapter(readFileSync(join(FIXTURE, 'chapters', `${chapterId}.jsonl`), 'utf8'))
}

describe('books/index.json', () => {
  it('lists nageki-no-bourei-1', () => {
    const index = readJson<string[]>(join(BOOKS, 'index.json'))
    expect(index).toContain('nageki-no-bourei-1')
  })
})

describe('tsundoku-test fixture', () => {
  const metadata = readJson<BookMetadata>(join(FIXTURE, 'metadata.json'))
  const vocab = readJsonl<VocabEntry>(join(FIXTURE, 'vocabulary.jsonl'))
  const kanji = readJsonl<KanjiEntry>(join(FIXTURE, 'kanji.jsonl'))
  const grammar = readJsonl<GrammarEntry>(join(FIXTURE, 'grammar.jsonl'))
  const vocabIds = new Set(vocab.map((v) => v.id))
  const grammarIds = new Set(grammar.map((g) => g.id))

  it('metadata lists chapters whose files exist and parse through the decoder seam', () => {
    expect(metadata.id).toBe('tsundoku-test')
    expect(metadata.chapters).toHaveLength(3)
    for (const ch of metadata.chapters) {
      const chapter = readChapter(ch.id)
      expect(chapter.paragraphs.length).toBeGreaterThan(0)
      for (const p of chapter.paragraphs) {
        expect(typeof p.id).toBe('string')
        expect(p.sentences.length).toBeGreaterThan(0)
      }
    }
  })

  it('every token.v resolves to a vocab entry', () => {
    for (const ch of metadata.chapters) {
      const chapter = readChapter(ch.id)
      for (const p of chapter.paragraphs) {
        for (const s of p.sentences) {
          for (const t of s.tokens) {
            if (t.v !== undefined) {
              expect(vocabIds.has(t.v)).toBe(true)
            }
          }
        }
      }
    }
  })

  it('every paragraph.grammar id resolves to a grammar entry', () => {
    for (const ch of metadata.chapters) {
      const chapter = readChapter(ch.id)
      for (const p of chapter.paragraphs) {
        for (const g of p.grammar ?? []) {
          expect(grammarIds.has(g)).toBe(true)
        }
      }
    }
  })

  it('every kanji example_words_in_book id resolves to vocab', () => {
    expect(kanji.length).toBe(3)
    for (const k of kanji) {
      for (const id of k.example_words_in_book) {
        expect(vocabIds.has(id)).toBe(true)
      }
    }
  })

  it('migrated v2 chapter fixture decodes through the decoder seam end-to-end', () => {
    const chapterId = '99-test-chapter-migrated'
    const text = readFileSync(join(FIXTURE, 'chapters', `${chapterId}.jsonl`), 'utf8')

    const chapter = decodeChapter(text)

    expect(chapter.format).toBe('v2')
    expect(chapter.paragraphs.length).toBeGreaterThan(0)
    const ids = new Set<string>()
    for (const p of chapter.paragraphs) {
      expect(p.sentences.length).toBeGreaterThan(0)
      for (const s of p.sentences) {
        expect(typeof s.id).toBe('string')
        expect(s.id.length).toBeGreaterThan(0)
        expect(ids.has(s.id)).toBe(false)
        ids.add(s.id)
        expect(Array.isArray(s.tokens)).toBe(true)
        for (const t of s.tokens) {
          if (t.v !== undefined) expect(vocabIds.has(t.v)).toBe(true)
        }
      }
    }
  })
})
