import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetBookStoreCache,
  fetchChapter,
  fetchGrammar,
  fetchKanji,
  fetchMetadata,
  fetchVocab,
} from './book-store'

const METADATA = {
  id: 'tsundoku-test',
  title: 'Tsundoku テスト本',
  author: 'Test Author',
  cover: 'cover.jpg',
  chapters: [{ id: '00-test-chapter-1', title: 'Ch 1' }],
}

const CHAPTER_JSONL =
  '{"id":"p0","tokens":[{"s":"私","r":"わたし","v":"v0001"},{"s":"。"}]}\n' +
  '{"id":"p1","tokens":[{"s":"猫","r":"ねこ","v":"v0004"}]}\n'

const VOCAB_JSONL =
  '{"id":"v0001","lemma":"私","reading":"わたし","pos":"pronoun","jlpt":"N5","meanings":["I"],"frequency":1,"first_seen":"00:p0"}\n' +
  '{"id":"v0004","lemma":"猫","reading":"ねこ","pos":"noun","jlpt":"N5","meanings":["cat"],"frequency":1,"first_seen":"00:p1"}\n'

const KANJI_JSONL =
  '{"kanji":"猫","onyomi":["ビョウ"],"kunyomi":["ねこ"],"meanings":["cat"],"jlpt":"N4","stroke_count":11,"frequency":1,"example_words_in_book":["v0004"]}\n'

const GRAMMAR_JSONL =
  '{"id":"g0001","pattern":"〜ながら","title":"ながら","jlpt":"N4","formation":"Vます-stem + ながら","explanation":"while doing","examples_in_book":[],"see_also":[]}\n'

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  __resetBookStoreCache()
  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url.endsWith('metadata.json')) {
      return new Response(JSON.stringify(METADATA), { status: 200 })
    }
    if (url.endsWith('00-test-chapter-1.jsonl')) {
      return new Response(CHAPTER_JSONL, { status: 200 })
    }
    if (url.endsWith('vocabulary.jsonl')) {
      return new Response(VOCAB_JSONL, { status: 200 })
    }
    if (url.endsWith('kanji.jsonl')) {
      return new Response(KANJI_JSONL, { status: 200 })
    }
    if (url.endsWith('grammar.jsonl')) {
      return new Response(GRAMMAR_JSONL, { status: 200 })
    }
    return new Response('not found', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('book-store', () => {
  it('fetchMetadata returns typed metadata and caches subsequent calls', async () => {
    const meta = await fetchMetadata('tsundoku-test')
    expect(meta.title).toBe('Tsundoku テスト本')
    expect(meta.chapters[0].id).toBe('00-test-chapter-1')

    await fetchMetadata('tsundoku-test')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('fetchChapter decodes chapter content via the chapter-decoder seam and caches', async () => {
    const chapter = await fetchChapter('tsundoku-test', '00-test-chapter-1')
    expect(chapter.format).toBe('v1')
    expect(chapter.paragraphs).toHaveLength(2)
    expect(chapter.paragraphs[0].id).toBe('p0')
    expect(chapter.paragraphs[0].sentences).toHaveLength(1)
    expect(chapter.paragraphs[0].sentences[0].tokens[0].r).toBe('わたし')

    await fetchChapter('tsundoku-test', '00-test-chapter-1')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('fetchVocab returns a Map keyed by id and caches', async () => {
    const vocab = await fetchVocab('tsundoku-test')
    expect(vocab).toBeInstanceOf(Map)
    expect(vocab.get('v0001')?.lemma).toBe('私')
    expect(vocab.get('v0004')?.meanings).toEqual(['cat'])

    await fetchVocab('tsundoku-test')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('fetchKanji returns a Map keyed by kanji and caches', async () => {
    const kanji = await fetchKanji('tsundoku-test')
    expect(kanji.get('猫')?.stroke_count).toBe(11)

    await fetchKanji('tsundoku-test')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('fetchGrammar returns a Map keyed by id and caches', async () => {
    const grammar = await fetchGrammar('tsundoku-test')
    expect(grammar.get('g0001')?.title).toBe('ながら')

    await fetchGrammar('tsundoku-test')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
