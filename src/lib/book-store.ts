import { type ChapterContent, decodeChapter } from './chapter-decoder'
import type { BookMetadata, GrammarEntry, KanjiEntry, VocabEntry } from './types'

const BOOKS_BASE = `${import.meta.env.BASE_URL}books`

const metadataCache = new Map<string, Promise<BookMetadata>>()
const chapterCache = new Map<string, Promise<ChapterContent>>()
const vocabCache = new Map<string, Promise<Map<string, VocabEntry>>>()
const kanjiCache = new Map<string, Promise<Map<string, KanjiEntry>>>()
const grammarCache = new Map<string, Promise<Map<string, GrammarEntry>>>()
let indexCache: Promise<string[]> | null = null

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json() as Promise<T>
}

async function fetchJsonl<T>(url: string): Promise<T[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const text = await res.text()
  const out: T[] = []
  let start = 0
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10 /* \n */) {
      const line = text.slice(start, i).trim()
      if (line) out.push(JSON.parse(line) as T)
      start = i + 1
    }
  }
  const tail = text.slice(start).trim()
  if (tail) out.push(JSON.parse(tail) as T)
  return out
}

export function fetchBookIndex(): Promise<string[]> {
  if (!indexCache) {
    indexCache = fetchJson<string[]>(`${BOOKS_BASE}/index.json`)
  }
  return indexCache
}

export function fetchMetadata(slug: string): Promise<BookMetadata> {
  const existing = metadataCache.get(slug)
  if (existing) return existing
  const promise = fetchJson<BookMetadata>(`${BOOKS_BASE}/${slug}/metadata.json`)
  metadataCache.set(slug, promise)
  return promise
}

export function fetchChapter(slug: string, chapterId: string): Promise<ChapterContent> {
  const key = `${slug}::${chapterId}`
  const existing = chapterCache.get(key)
  if (existing) return existing
  const promise = fetchText(`${BOOKS_BASE}/${slug}/chapters/${chapterId}.jsonl`).then((text) =>
    decodeChapter(text),
  )
  chapterCache.set(key, promise)
  return promise
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.text()
}

function indexBy<T, K extends string>(items: T[], key: (item: T) => K): Map<K, T> {
  const map = new Map<K, T>()
  for (const item of items) map.set(key(item), item)
  return map
}

export function fetchVocab(slug: string): Promise<Map<string, VocabEntry>> {
  const existing = vocabCache.get(slug)
  if (existing) return existing
  const promise = fetchJsonl<VocabEntry>(`${BOOKS_BASE}/${slug}/vocabulary.jsonl`).then((entries) =>
    indexBy(entries, (e) => e.id),
  )
  vocabCache.set(slug, promise)
  return promise
}

export function fetchKanji(slug: string): Promise<Map<string, KanjiEntry>> {
  const existing = kanjiCache.get(slug)
  if (existing) return existing
  const promise = fetchJsonl<KanjiEntry>(`${BOOKS_BASE}/${slug}/kanji.jsonl`).then((entries) =>
    indexBy(entries, (e) => e.kanji),
  )
  kanjiCache.set(slug, promise)
  return promise
}

export function fetchGrammar(slug: string): Promise<Map<string, GrammarEntry>> {
  const existing = grammarCache.get(slug)
  if (existing) return existing
  const promise = fetchJsonl<GrammarEntry>(`${BOOKS_BASE}/${slug}/grammar.jsonl`).then((entries) =>
    indexBy(entries, (e) => e.id),
  )
  grammarCache.set(slug, promise)
  return promise
}

export function coverUrl(slug: string, cover: string): string {
  return `${BOOKS_BASE}/${slug}/${cover}`
}

export function __resetBookStoreCache(): void {
  indexCache = null
  metadataCache.clear()
  chapterCache.clear()
  vocabCache.clear()
  kanjiCache.clear()
  grammarCache.clear()
}
