import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { BookMetadata, GrammarEntry, KanjiEntry, Paragraph, VocabEntry } from '@/types/book'
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

describe('books/index.json', () => {
  it('lists tsundoku-test', () => {
    const index = readJson<string[]>(join(BOOKS, 'index.json'))
    expect(index).toContain('tsundoku-test')
  })
})

describe('tsundoku-test fixture', () => {
  const metadata = readJson<BookMetadata>(join(FIXTURE, 'metadata.json'))
  const vocab = readJsonl<VocabEntry>(join(FIXTURE, 'vocabulary.jsonl'))
  const kanji = readJsonl<KanjiEntry>(join(FIXTURE, 'kanji.jsonl'))
  const grammar = readJsonl<GrammarEntry>(join(FIXTURE, 'grammar.jsonl'))
  const vocabIds = new Set(vocab.map((v) => v.id))
  const grammarIds = new Set(grammar.map((g) => g.id))

  it('metadata lists 2 chapters whose files exist and parse', () => {
    expect(metadata.id).toBe('tsundoku-test')
    expect(metadata.chapters).toHaveLength(2)
    for (const ch of metadata.chapters) {
      const paragraphs = readJsonl<Paragraph>(join(FIXTURE, 'chapters', `${ch.id}.jsonl`))
      expect(paragraphs.length).toBeGreaterThan(0)
      for (const p of paragraphs) {
        expect(typeof p.id).toBe('string')
        expect(Array.isArray(p.tokens)).toBe(true)
      }
    }
  })

  it('every token.v resolves to a vocab entry', () => {
    for (const ch of metadata.chapters) {
      const paragraphs = readJsonl<Paragraph>(join(FIXTURE, 'chapters', `${ch.id}.jsonl`))
      for (const p of paragraphs) {
        for (const t of p.tokens) {
          if (t.v !== undefined) {
            expect(vocabIds.has(t.v)).toBe(true)
          }
        }
      }
    }
  })

  it('every paragraph.grammar id resolves to a grammar entry', () => {
    for (const ch of metadata.chapters) {
      const paragraphs = readJsonl<Paragraph>(join(FIXTURE, 'chapters', `${ch.id}.jsonl`))
      for (const p of paragraphs) {
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
})
