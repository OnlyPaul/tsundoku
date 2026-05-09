import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { __resetBookStoreCache } from '../lib/book-store'
import * as bookmarks from '../lib/bookmarks'
import { getBookmark, setBookmark } from '../lib/bookmarks'

type RectStub = { id: string; top: number; height: number }

function setLayout(rects: RectStub[]) {
  for (const { id, top, height } of rects) {
    const el = document.querySelector(`[data-paragraph-id="${id}"]`)
    if (!el) continue
    ;(el as HTMLElement).getBoundingClientRect = () =>
      ({
        top,
        bottom: top + height,
        height,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: top,
        toJSON() {},
      }) as DOMRect
  }
}

function setSentenceLayout(rects: RectStub[]) {
  for (const { id, top, height } of rects) {
    const el = document.querySelector(`[data-sentence-id="${id}"]`)
    if (!el) continue
    ;(el as HTMLElement).getBoundingClientRect = () =>
      ({
        top,
        bottom: top + height,
        height,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: top,
        toJSON() {},
      }) as DOMRect
  }
}

function makeRect(top: number, height: number): DOMRect {
  return {
    top,
    bottom: top + height,
    height,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: top,
    toJSON() {},
  } as DOMRect
}

type RectMatcher = (el: Element) => DOMRect | null

function stubRects(matchers: RectMatcher[]) {
  const orig = Element.prototype.getBoundingClientRect
  Element.prototype.getBoundingClientRect = function () {
    for (const m of matchers) {
      const r = m(this)
      if (r) return r
    }
    return orig.call(this)
  }
  return () => {
    Element.prototype.getBoundingClientRect = orig
  }
}

const mockResizeObservers: Array<{
  callback: ResizeObserverCallback
  targets: Element[]
  observer: ResizeObserver
}> = []

class MockResizeObserver {
  private callback: ResizeObserverCallback
  private targets: Element[] = []
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    mockResizeObservers.push({
      callback,
      targets: this.targets,
      observer: this as unknown as ResizeObserver,
    })
  }
  observe(target: Element) {
    this.targets.push(target)
    // Mirror the spec: fire once on observe with the initial size.
    this.callback([] as unknown as ResizeObserverEntry[], this as unknown as ResizeObserver)
  }
  unobserve(target: Element) {
    const i = this.targets.indexOf(target)
    if (i >= 0) this.targets.splice(i, 1)
  }
  disconnect() {
    this.targets.length = 0
  }
}

function fireResize(target: Element) {
  for (const ro of mockResizeObservers) {
    if (ro.targets.includes(target)) {
      ro.callback([] as unknown as ResizeObserverEntry[], ro.observer)
    }
  }
}

function setInnerHeight(value: number) {
  const orig = window.innerHeight
  Object.defineProperty(window, 'innerHeight', { configurable: true, value })
  return () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: orig })
  }
}

async function fireScroll() {
  window.dispatchEvent(new Event('scroll'))
  // Flush rAF + microtasks.
  await new Promise((r) => setTimeout(r, 0))
}

const METADATA = {
  id: 'tsundoku-test',
  title: 'Tsundoku テスト本',
  author: 'Test Author',
  cover: 'cover.jpg',
  chapters: [
    { id: '00-test-chapter-1', title: '第一章: 始まり' },
    { id: '01-test-chapter-2', title: '第二章: 続き' },
    { id: '99-test-chapter-migrated', title: '第三章: 移行' },
  ],
}

const CHAPTER_MIGRATED_JSONL =
  '{"format":"v2"}\n' +
  '{"id":"p0","sentences":[' +
  '{"id":"p0-s0","tokens":[{"s":"私","r":"わたし","v":"watashi"},{"s":"は"},{"s":"本","r":"ほん","v":"hon"},{"s":"を"},{"s":"読","r":"よ","v":"yomu","lemma":"読む"},{"s":"みました"},{"s":"。"}],"help":{"translation":"I read a book."}},' +
  '{"id":"p0-s1","tokens":[{"s":"今日"},{"s":"は"},{"s":"いい"},{"s":"日"},{"s":"です"},{"s":"。"}]}' +
  ']}\n' +
  '{"id":"p1","sentences":[' +
  '{"id":"p1-s0","tokens":[{"s":"猫","r":"ねこ","v":"neko"},{"s":"が"},{"s":"好き","v":"suki"},{"s":"です"},{"s":"。"}],"help":{"translation":"I like cats."}},' +
  '{"id":"p1-s1","tokens":[{"s":"犬"},{"s":"も"},{"s":"好き"},{"s":"です"},{"s":"。"}]}' +
  ']}\n'

const CHAPTER_MIGRATED_WITH_HELP_JSONL =
  '{"format":"v2"}\n' +
  '{"id":"p0","sentences":[' +
  '{"id":"p0-s0","tokens":[{"s":"私","r":"わたし","v":"watashi"},{"s":"は"},{"s":"本","r":"ほん","v":"hon"},{"s":"を"},{"s":"読","r":"よ","v":"yomu","lemma":"読む"},{"s":"みました"},{"s":"。"}],"translation":"I tried reading a book.","note":"This reads like a personal trial or experiment, not a claim of finishing the whole book.","grammar":["g-dakara"]},' +
  '{"id":"p0-s1","tokens":[{"s":"今日"},{"s":"は"},{"s":"いい"},{"s":"日"},{"s":"です"},{"s":"。"}],"translation":"Today is a good day."}' +
  ']}\n'

const CHAPTER_1_JSONL =
  '{"id":"p0","tokens":[{"s":"私","r":"わたし","v":"watashi"},{"s":"は"},{"s":"本","r":"ほん","v":"hon"},{"s":"を"},{"s":"読","r":"よ","v":"yomu","lemma":"読む"},{"s":"みました"},{"s":"。"}],"grammar":["g-dakara"]}\n' +
  '{"id":"p1","tokens":[{"s":"猫","r":"ねこ","v":"neko"},{"s":"が"},{"s":"好き","v":"suki"},{"s":"です"},{"s":"。"}]}\n'

const CHAPTER_2_JSONL =
  '{"id":"p0","tokens":[{"s":"今日"},{"s":"は"},{"s":"いい"},{"s":"天気"},{"s":"です"},{"s":"。"}],"grammar":[]}\n' +
  '{"id":"p1","tokens":[{"s":"友達"},{"s":"と"},{"s":"会"},{"s":"いました"},{"s":"。"}],"grammar":["g-dakara"]}\n'

const GRAMMAR_JSONL =
  '{"id":"g-dakara","pattern":"〜だから","title":"Because (casual reason)","jlpt":"N5","formation":"[plain form] + だから","explanation":"Used to express a reason or cause in casual speech.","examples_in_book":[{"chapter":"00-test-chapter-1","paragraph":"p0"}],"see_also":[]}\n'

const VOCAB_JSONL =
  '{"id":"watashi","lemma":"私","reading":"わたし","pos":"pronoun","jlpt":"N5","meanings":["I","me"],"frequency":1,"first_seen":"00-test-chapter-1:p0"}\n' +
  '{"id":"hon","lemma":"本","reading":"ほん","pos":"noun","jlpt":"N5","meanings":["book"],"frequency":1,"first_seen":"00-test-chapter-1:p0"}\n' +
  '{"id":"yomu","lemma":"読む","reading":"よむ","pos":"verb","jlpt":"N5","meanings":["to read"],"frequency":1,"first_seen":"00-test-chapter-1:p0"}\n'

const KANJI_JSONL =
  '{"kanji":"私","onyomi":["シ"],"kunyomi":["わたし","わたくし"],"meanings":["I","private"],"jlpt":"N5","stroke_count":7,"frequency":89,"example_words_in_book":["watashi"]}\n' +
  '{"kanji":"読","onyomi":["ドク"],"kunyomi":["よ.む"],"meanings":["read"],"jlpt":"N5","stroke_count":14,"frequency":315,"example_words_in_book":["yomu"]}\n' +
  '{"kanji":"本","onyomi":["ホン"],"kunyomi":["もと"],"meanings":["book","origin"],"jlpt":"N5","stroke_count":5,"frequency":10,"example_words_in_book":["hon"]}\n'

let fetchMock: ReturnType<typeof vi.fn>

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function chapterResponse(body: string) {
  return new Response(body, { status: 200 })
}

beforeEach(() => {
  __resetBookStoreCache()

  // Run rAF synchronously so save handlers flush within fireScroll().
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    return setTimeout(() => cb(performance.now()), 0) as unknown as number
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  window.scrollBy = vi.fn() as unknown as typeof window.scrollBy
  mockResizeObservers.length = 0
  vi.stubGlobal('ResizeObserver', MockResizeObserver)

  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url.endsWith('/books/index.json')) return jsonResponse(['tsundoku-test'])
    if (url.endsWith('/books/tsundoku-test/metadata.json')) return jsonResponse(METADATA)
    if (url.endsWith('/00-test-chapter-1.jsonl')) return chapterResponse(CHAPTER_1_JSONL)
    if (url.endsWith('/01-test-chapter-2.jsonl')) return chapterResponse(CHAPTER_2_JSONL)
    if (url.endsWith('/99-test-chapter-migrated.jsonl'))
      return chapterResponse(CHAPTER_MIGRATED_JSONL)
    if (url.endsWith('/98-test-chapter-sentence-help.jsonl'))
      return chapterResponse(CHAPTER_MIGRATED_WITH_HELP_JSONL)
    if (url.endsWith('/grammar.jsonl')) return chapterResponse(GRAMMAR_JSONL)
    if (url.endsWith('/vocabulary.jsonl')) return chapterResponse(VOCAB_JSONL)
    if (url.endsWith('/kanji.jsonl')) return chapterResponse(KANJI_JSONL)
    return new Response('not found', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.title = ''
  try {
    localStorage.clear()
  } catch {
    // ignore
  }
})

function gotoReader(path: string) {
  window.history.pushState({}, '', path)
}

function surfaceText(p: Element): string {
  const clone = p.cloneNode(true) as Element
  for (const rt of clone.querySelectorAll('rt')) rt.remove()
  // The vermillion grammar seal button lives inside the paragraph; its glyph
  // is decorative and shouldn't count as paragraph surface text.
  for (const seal of clone.querySelectorAll('button[aria-label^="Grammar notes"]')) seal.remove()
  return (clone.textContent ?? '').replace(/\s+/g, '')
}

async function findParagraphByText(text: string): Promise<HTMLElement> {
  return await waitFor(() => {
    const paragraphs = document.querySelectorAll('p[data-paragraph-id]')
    for (const p of paragraphs) {
      if (surfaceText(p) === text.replace(/\s+/g, '')) {
        return p as HTMLElement
      }
    }
    throw new Error(`No paragraph with combined text ${text}`)
  })
}

describe('Reader', () => {
  it('renders all paragraphs of the chapter specified in the URL', async () => {
    gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
    render(<App />)
    expect(await findParagraphByText('私は本を読みました。')).toBeInTheDocument()
    expect(await findParagraphByText('猫が好きです。')).toBeInTheDocument()
  })

  it('updates document.title to the chapter title', async () => {
    gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
    render(<App />)
    await waitFor(() => expect(document.title).toBe('第一章: 始まり'))
  })

  it('navigates to next chapter and fetches it on demand', async () => {
    const user = userEvent.setup()
    gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
    render(<App />)
    await findParagraphByText('私は本を読みました。')

    expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/01-test-chapter-2.jsonl'))).toBe(
      false,
    )

    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(await findParagraphByText('今日はいい天気です。')).toBeInTheDocument()
    expect(await findParagraphByText('友達と会いました。')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/01-test-chapter-2.jsonl'))).toBe(
      true,
    )
    await waitFor(() => expect(document.title).toBe('第二章: 続き'))
  })

  it('disables Previous on the first chapter', async () => {
    gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
    render(<App />)
    const prev = await screen.findByRole('button', { name: /previous/i })
    expect(prev).toBeDisabled()
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
  })

  it('falls back to the bookmarked chapter when none is in the URL', async () => {
    vi.spyOn(bookmarks, 'getBookmark').mockReturnValue({
      chapterId: '01-test-chapter-2',
      paragraphId: 'p0',
    })
    gotoReader('/reader/tsundoku-test')
    render(<App />)
    expect(await findParagraphByText('今日はいい天気です。')).toBeInTheDocument()
  })

  it('renders tappable tokens (with v) as buttons with the surface text', async () => {
    gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
    render(<App />)
    expect(await screen.findByRole('button', { name: '私' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '本' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '読' })).toBeInTheDocument()
    // dimmed tokens (no v) are not buttons
    expect(screen.queryByRole('button', { name: 'は' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'みました' })).not.toBeInTheDocument()
  })

  it('renders <ruby> for tokens with r when furigana is enabled (default)', async () => {
    gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
    render(<App />)
    const watashi = await screen.findByRole('button', { name: '私' })
    const ruby = watashi.querySelector('ruby')
    expect(ruby).not.toBeNull()
    expect(ruby?.querySelector('rt')?.textContent).toBe('わたし')
    expect(ruby?.querySelector('rb')?.textContent).toBe('私')
  })

  it('hides <ruby> for all tokens when furigana toggle is off', async () => {
    const user = userEvent.setup()
    gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
    render(<App />)
    await screen.findByRole('button', { name: '私' })
    await user.click(screen.getByRole('button', { name: /reading settings/i }))
    await user.click(await screen.findByRole('switch', { name: /furigana/i }))
    await waitFor(() => {
      // The Settings preview block contains its own <ruby>; only the chapter
      // prose should be checked.
      const article = document.querySelector('article')
      expect(article?.querySelector('ruby')).toBeNull()
    })
  })

  it('restores furigana toggle preference from localStorage on load', async () => {
    localStorage.setItem('tsundoku.furigana', 'off')
    gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
    render(<App />)
    await screen.findByRole('button', { name: '私' })
    expect(document.querySelector('ruby')).toBeNull()
  })

  it('persists furigana toggle to localStorage when changed', async () => {
    const user = userEvent.setup()
    gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
    render(<App />)
    await screen.findByRole('button', { name: '私' })
    await user.click(screen.getByRole('button', { name: /reading settings/i }))
    await user.click(await screen.findByRole('switch', { name: /furigana/i }))
    await waitFor(() => {
      expect(localStorage.getItem('tsundoku.furigana')).toBe('off')
    })
  })

  it('opens a vocab popover with reading, meaning, JLPT, and POS when a vocab token is tapped', async () => {
    const user = userEvent.setup()
    gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
    render(<App />)
    const watashi = await screen.findByRole('button', { name: '私' })
    await user.click(watashi)
    expect(await screen.findByText('I')).toBeInTheDocument()
    expect(screen.getByText('N5')).toBeInTheDocument()
    expect(screen.getByText('pronoun')).toBeInTheDocument()
  })

  it('shows the lemma in the popover header for a conjugated token', async () => {
    const user = userEvent.setup()
    gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
    render(<App />)
    const conjugated = await screen.findByRole('button', { name: '読' })
    await user.click(conjugated)
    const heading = await screen.findByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('読む')
  })

  it('does not open a popover for tokens without a v field', async () => {
    gotoReader('/reader/tsundoku-test?chapter=01-test-chapter-2&paragraph=p0')
    render(<App />)
    await findParagraphByText('今日はいい天気です。')
    expect(screen.queryByRole('button', { name: '今日' })).not.toBeInTheDocument()
  })

  it('disables Next on the last chapter', async () => {
    gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
    render(<App />)
    const next = await screen.findByRole('button', { name: /next/i })
    expect(next).toBeDisabled()
    expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled()
  })

  describe('grammar badge', () => {
    it('renders a grammar badge for paragraphs with non-empty grammar', async () => {
      gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
      render(<App />)
      await findParagraphByText('私は本を読みました。')
      expect(
        screen.getByRole('button', { name: /grammar notes for paragraph p0/i }),
      ).toBeInTheDocument()
    })

    it('does not render a grammar badge when paragraph grammar is undefined', async () => {
      gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
      render(<App />)
      await findParagraphByText('猫が好きです。')
      expect(
        screen.queryByRole('button', { name: /grammar notes for paragraph p1/i }),
      ).not.toBeInTheDocument()
    })

    it('does not render a grammar badge when paragraph grammar is an empty array', async () => {
      gotoReader('/reader/tsundoku-test?chapter=01-test-chapter-2&paragraph=p0')
      render(<App />)
      await findParagraphByText('今日はいい天気です。')
      expect(
        screen.queryByRole('button', { name: /grammar notes for paragraph p0/i }),
      ).not.toBeInTheDocument()
    })

    it('opens a sheet with the pattern title and explanation when the badge is tapped', async () => {
      const user = userEvent.setup()
      gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
      render(<App />)
      const badge = await screen.findByRole('button', { name: /grammar notes for paragraph p0/i })
      await user.click(badge)
      expect(await screen.findByText('Because (casual reason)')).toBeInTheDocument()
      expect(
        screen.getByText('Used to express a reason or cause in casual speech.'),
      ).toBeInTheDocument()
    })

    it('fetches grammar at most once per book session even when multiple badges are tapped', async () => {
      const user = userEvent.setup()
      gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
      render(<App />)
      await user.click(
        await screen.findByRole('button', { name: /grammar notes for paragraph p0/i }),
      )
      await screen.findByText('Because (casual reason)')

      await user.click(screen.getByRole('button', { name: /close/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))
      await findParagraphByText('友達と会いました。')
      await user.click(
        await screen.findByRole('button', { name: /grammar notes for paragraph p1/i }),
      )
      await screen.findAllByText('Because (casual reason)')

      const grammarFetchCount = fetchMock.mock.calls.filter(([u]) =>
        String(u).endsWith('/grammar.jsonl'),
      ).length
      expect(grammarFetchCount).toBe(1)
    })
  })

  describe('reading position bookmark', () => {
    it('saves the current paragraph and the fractional offset within it on scroll', async () => {
      gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
      render(<App />)
      await findParagraphByText('私は本を読みました。')
      await findParagraphByText('猫が好きです。')

      // Anchor (viewport top) sits 100px into a 400px-tall p1: offset = 0.25.
      setLayout([
        { id: 'p0', top: -500, height: 400 },
        { id: 'p1', top: -100, height: 400 },
      ])
      await fireScroll()

      expect(getBookmark('tsundoku-test')).toEqual({
        chapterId: '00-test-chapter-1',
        paragraphId: 'p1',
        offset: 0.25,
      })
    })

    it('updates only the offset when scrolling within the same paragraph', async () => {
      gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
      render(<App />)
      await findParagraphByText('私は本を読みました。')
      await findParagraphByText('猫が好きです。')

      setLayout([
        { id: 'p0', top: -500, height: 400 },
        { id: 'p1', top: -100, height: 400 },
      ])
      await fireScroll()
      expect(getBookmark('tsundoku-test')?.offset).toBeCloseTo(0.25, 5)

      setLayout([
        { id: 'p0', top: -800, height: 400 },
        { id: 'p1', top: -300, height: 400 },
      ])
      await fireScroll()
      const bm = getBookmark('tsundoku-test')
      expect(bm?.paragraphId).toBe('p1')
      expect(bm?.offset).toBeCloseTo(0.75, 5)
    })

    it('restores the saved fractional offset on mount', async () => {
      setBookmark('tsundoku-test', {
        chapterId: '00-test-chapter-1',
        paragraphId: 'p1',
        offset: 0.5,
      })
      // Pre-stub layout so the restore effect reads predictable rects.
      Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
      const origGetRect = Element.prototype.getBoundingClientRect
      Element.prototype.getBoundingClientRect = function () {
        const id = (this as HTMLElement).dataset?.paragraphId
        if (id === 'p1') {
          return {
            top: 1000,
            bottom: 1400,
            height: 400,
            left: 0,
            right: 0,
            width: 0,
            x: 0,
            y: 1000,
            toJSON() {},
          } as DOMRect
        }
        return origGetRect.call(this)
      }

      gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
      render(<App />)
      await findParagraphByText('猫が好きです。')

      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalled()
      })
      // 1000 (paragraph top in document) + 0.5 * 400 (offset) = 1200.
      const calls = (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mock.calls
      const lastArg = calls[calls.length - 1][0] as { top: number }
      expect(lastArg.top).toBeCloseTo(1200, 0)

      Element.prototype.getBoundingClientRect = origGetRect
    })

    it('treats legacy bookmarks (no offset) as offset=0 on restore', async () => {
      localStorage.setItem(
        'tsundoku:bookmark:tsundoku-test',
        JSON.stringify({ chapterId: '00-test-chapter-1', paragraphId: 'p1' }),
      )
      Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
      const origGetRect = Element.prototype.getBoundingClientRect
      Element.prototype.getBoundingClientRect = function () {
        const id = (this as HTMLElement).dataset?.paragraphId
        if (id === 'p1') {
          return {
            top: 800,
            bottom: 1200,
            height: 400,
            left: 0,
            right: 0,
            width: 0,
            x: 0,
            y: 800,
            toJSON() {},
          } as DOMRect
        }
        return origGetRect.call(this)
      }

      gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
      render(<App />)
      await findParagraphByText('猫が好きです。')

      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalled()
      })
      const calls = (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mock.calls
      const lastArg = calls[calls.length - 1][0] as { top: number }
      expect(lastArg.top).toBeCloseTo(800, 0)

      Element.prototype.getBoundingClientRect = origGetRect
    })

    it('does not include a sentenceId when scrolling a legacy (v1) chapter', async () => {
      gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
      render(<App />)
      await findParagraphByText('私は本を読みました。')
      await findParagraphByText('猫が好きです。')

      setLayout([
        { id: 'p0', top: -500, height: 400 },
        { id: 'p1', top: -100, height: 400 },
      ])
      await fireScroll()

      const bm = getBookmark('tsundoku-test')
      expect(bm?.paragraphId).toBe('p1')
      expect(bm?.sentenceId).toBeUndefined()
    })

    it("does not overwrite another book's bookmark", async () => {
      setBookmark('other-book', { chapterId: 'ch-x', paragraphId: 'p-x' })

      gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
      render(<App />)
      await findParagraphByText('猫が好きです。')

      setLayout([
        { id: 'p0', top: -500, height: 400 },
        { id: 'p1', top: -100, height: 400 },
      ])
      await fireScroll()

      expect(getBookmark('tsundoku-test')?.paragraphId).toBe('p1')
      expect(getBookmark('other-book')).toEqual({ chapterId: 'ch-x', paragraphId: 'p-x' })
    })
  })

  describe('migrated (v2) chapters', () => {
    it('wraps each sentence in a span with data-sentence-id while keeping tokens tappable', async () => {
      gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
      render(<App />)

      // Tokens still render and remain tappable in v2 prose.
      expect(await screen.findByRole('button', { name: '私' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '猫' })).toBeInTheDocument()

      // Each authored sentence ID has a wrapping element exposing it for
      // sentence-anchored Reading Position.
      for (const id of ['p0-s0', 'p0-s1', 'p1-s0', 'p1-s1']) {
        expect(document.querySelector(`[data-sentence-id="${id}"]`)).not.toBeNull()
      }

      // Sentence wrappers live inside their paragraph (preserving prose grouping).
      const p0 = document.querySelector('[data-paragraph-id="p0"]') as HTMLElement
      expect(p0.querySelector('[data-sentence-id="p0-s0"]')).not.toBeNull()
      expect(p0.querySelector('[data-sentence-id="p0-s1"]')).not.toBeNull()
    })

    it('saves the sentence containing the viewport anchor on scroll', async () => {
      gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
      render(<App />)
      await screen.findByRole('button', { name: '私' })

      // Anchor (y=0) sits inside p1-s0: above is p0-s0/p0-s1, below is p1-s1.
      setSentenceLayout([
        { id: 'p0-s0', top: -800, height: 200 },
        { id: 'p0-s1', top: -600, height: 200 },
        { id: 'p1-s0', top: -50, height: 200 },
        { id: 'p1-s1', top: 150, height: 200 },
      ])
      await fireScroll()

      const bm = getBookmark('tsundoku-test')
      expect(bm?.chapterId).toBe('99-test-chapter-migrated')
      expect(bm?.sentenceId).toBe('p1-s0')
      expect(bm?.paragraphId).toBe('p1')
    })

    it('saves the fractional offset within the sentence rect', async () => {
      gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
      render(<App />)
      await screen.findByRole('button', { name: '私' })

      // Anchor (y=0) sits 50px into a 200px-tall p1-s0: offset = 0.25.
      setSentenceLayout([
        { id: 'p0-s0', top: -800, height: 200 },
        { id: 'p0-s1', top: -600, height: 200 },
        { id: 'p1-s0', top: -50, height: 200 },
        { id: 'p1-s1', top: 150, height: 200 },
      ])
      await fireScroll()

      expect(getBookmark('tsundoku-test')?.offset).toBeCloseTo(0.25, 5)
    })

    it('restores a sentence-anchored bookmark to the saved sentence rect', async () => {
      setBookmark('tsundoku-test', {
        chapterId: '99-test-chapter-migrated',
        paragraphId: 'p1',
        sentenceId: 'p1-s0',
        offset: 0.5,
      })
      Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
      const origGetRect = Element.prototype.getBoundingClientRect
      Element.prototype.getBoundingClientRect = function () {
        const sid = (this as HTMLElement).dataset?.sentenceId
        if (sid === 'p1-s0') {
          return {
            top: 1500,
            bottom: 1700,
            height: 200,
            left: 0,
            right: 0,
            width: 0,
            x: 0,
            y: 1500,
            toJSON() {},
          } as DOMRect
        }
        return origGetRect.call(this)
      }

      gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
      render(<App />)
      await screen.findByRole('button', { name: '猫' })

      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalled()
      })
      // 1500 (sentence top) + 0.5 * 200 (offset) = 1600.
      const calls = (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mock.calls
      const lastArg = calls[calls.length - 1][0] as { top: number }
      expect(lastArg.top).toBeCloseTo(1600, 0)

      Element.prototype.getBoundingClientRect = origGetRect
    })

    it('falls back to the paragraph rect when restoring a legacy bookmark on a v2 chapter', async () => {
      // No sentenceId — pre-migration bookmark shape on a now-migrated chapter.
      setBookmark('tsundoku-test', {
        chapterId: '99-test-chapter-migrated',
        paragraphId: 'p1',
        offset: 0.25,
      })
      Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
      const origGetRect = Element.prototype.getBoundingClientRect
      Element.prototype.getBoundingClientRect = function () {
        const pid = (this as HTMLElement).dataset?.paragraphId
        if (pid === 'p1') {
          return {
            top: 2000,
            bottom: 2400,
            height: 400,
            left: 0,
            right: 0,
            width: 0,
            x: 0,
            y: 2000,
            toJSON() {},
          } as DOMRect
        }
        return origGetRect.call(this)
      }

      gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
      render(<App />)
      await screen.findByRole('button', { name: '猫' })

      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalled()
      })
      // 2000 (paragraph top) + 0.25 * 400 = 2100.
      const calls = (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mock.calls
      const lastArg = calls[calls.length - 1][0] as { top: number }
      expect(lastArg.top).toBeCloseTo(2100, 0)

      Element.prototype.getBoundingClientRect = origGetRect
    })
  })

  describe('sentence help', () => {
    it('shows the sentence translation inline when the sentence-help affordance is activated', async () => {
      const user = userEvent.setup()
      const metadataWithSentenceHelp = {
        ...METADATA,
        chapters: [{ id: '98-test-chapter-sentence-help', title: '第四章: 文の助け' }],
      }

      fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.endsWith('/books/index.json')) return jsonResponse(['tsundoku-test'])
        if (url.endsWith('/books/tsundoku-test/metadata.json'))
          return jsonResponse(metadataWithSentenceHelp)
        if (url.endsWith('/98-test-chapter-sentence-help.jsonl'))
          return chapterResponse(CHAPTER_MIGRATED_WITH_HELP_JSONL)
        if (url.endsWith('/grammar.jsonl')) return chapterResponse(GRAMMAR_JSONL)
        if (url.endsWith('/vocabulary.jsonl')) return chapterResponse(VOCAB_JSONL)
        if (url.endsWith('/kanji.jsonl')) return chapterResponse(KANJI_JSONL)
        return new Response('not found', { status: 404 })
      })

      gotoReader('/reader/tsundoku-test?chapter=98-test-chapter-sentence-help&paragraph=p0')
      render(<App />)

      const affordance = await screen.findByRole('button', {
        name: /sentence help for p0-s0/i,
      })
      await user.click(affordance)

      expect(await screen.findByText('I tried reading a book.')).toBeInTheDocument()
    })

    it('shows the sentence note when one is authored', async () => {
      const user = userEvent.setup()
      const metadataWithSentenceHelp = {
        ...METADATA,
        chapters: [{ id: '98-test-chapter-sentence-help', title: '第四章: 文の助け' }],
      }

      fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.endsWith('/books/index.json')) return jsonResponse(['tsundoku-test'])
        if (url.endsWith('/books/tsundoku-test/metadata.json'))
          return jsonResponse(metadataWithSentenceHelp)
        if (url.endsWith('/98-test-chapter-sentence-help.jsonl'))
          return chapterResponse(CHAPTER_MIGRATED_WITH_HELP_JSONL)
        if (url.endsWith('/grammar.jsonl')) return chapterResponse(GRAMMAR_JSONL)
        if (url.endsWith('/vocabulary.jsonl')) return chapterResponse(VOCAB_JSONL)
        if (url.endsWith('/kanji.jsonl')) return chapterResponse(KANJI_JSONL)
        return new Response('not found', { status: 404 })
      })

      gotoReader('/reader/tsundoku-test?chapter=98-test-chapter-sentence-help&paragraph=p0')
      render(<App />)

      await user.click(await screen.findByRole('button', { name: /sentence help for p0-s0/i }))

      expect(
        await screen.findByText(
          'This reads like a personal trial or experiment, not a claim of finishing the whole book.',
        ),
      ).toBeInTheDocument()
    })

    it('shows a grammar expansion control only for sentences with linked grammar', async () => {
      const user = userEvent.setup()
      const metadataWithSentenceHelp = {
        ...METADATA,
        chapters: [{ id: '98-test-chapter-sentence-help', title: '第四章: 文の助け' }],
      }

      fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.endsWith('/books/index.json')) return jsonResponse(['tsundoku-test'])
        if (url.endsWith('/books/tsundoku-test/metadata.json'))
          return jsonResponse(metadataWithSentenceHelp)
        if (url.endsWith('/98-test-chapter-sentence-help.jsonl'))
          return chapterResponse(CHAPTER_MIGRATED_WITH_HELP_JSONL)
        if (url.endsWith('/grammar.jsonl')) return chapterResponse(GRAMMAR_JSONL)
        if (url.endsWith('/vocabulary.jsonl')) return chapterResponse(VOCAB_JSONL)
        if (url.endsWith('/kanji.jsonl')) return chapterResponse(KANJI_JSONL)
        return new Response('not found', { status: 404 })
      })

      gotoReader('/reader/tsundoku-test?chapter=98-test-chapter-sentence-help&paragraph=p0')
      render(<App />)

      await user.click(await screen.findByRole('button', { name: /sentence help for p0-s0/i }))
      expect(screen.getByRole('button', { name: /show linked grammar/i })).toBeInTheDocument()

      await user.click(await screen.findByRole('button', { name: /sentence help for p0-s1/i }))
      expect(screen.queryByRole('button', { name: /show linked grammar/i })).not.toBeInTheDocument()
    })

    it('keeps linked grammar collapsed until the learner expands it', async () => {
      const user = userEvent.setup()
      const metadataWithSentenceHelp = {
        ...METADATA,
        chapters: [{ id: '98-test-chapter-sentence-help', title: '第四章: 文の助け' }],
      }

      fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.endsWith('/books/index.json')) return jsonResponse(['tsundoku-test'])
        if (url.endsWith('/books/tsundoku-test/metadata.json'))
          return jsonResponse(metadataWithSentenceHelp)
        if (url.endsWith('/98-test-chapter-sentence-help.jsonl'))
          return chapterResponse(CHAPTER_MIGRATED_WITH_HELP_JSONL)
        if (url.endsWith('/grammar.jsonl')) return chapterResponse(GRAMMAR_JSONL)
        if (url.endsWith('/vocabulary.jsonl')) return chapterResponse(VOCAB_JSONL)
        if (url.endsWith('/kanji.jsonl')) return chapterResponse(KANJI_JSONL)
        return new Response('not found', { status: 404 })
      })

      gotoReader('/reader/tsundoku-test?chapter=98-test-chapter-sentence-help&paragraph=p0')
      render(<App />)

      await user.click(await screen.findByRole('button', { name: /sentence help for p0-s0/i }))
      expect(screen.queryByText('Because (casual reason)')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /show linked grammar/i }))

      expect(await screen.findByText('Because (casual reason)')).toBeInTheDocument()
    })

    it('does not show the legacy paragraph grammar badge for migrated sentence-help chapters', async () => {
      const metadataWithSentenceHelp = {
        ...METADATA,
        chapters: [{ id: '98-test-chapter-sentence-help', title: '第四章: 文の助け' }],
      }

      fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.endsWith('/books/index.json')) return jsonResponse(['tsundoku-test'])
        if (url.endsWith('/books/tsundoku-test/metadata.json'))
          return jsonResponse(metadataWithSentenceHelp)
        if (url.endsWith('/98-test-chapter-sentence-help.jsonl'))
          return chapterResponse(CHAPTER_MIGRATED_WITH_HELP_JSONL)
        if (url.endsWith('/grammar.jsonl')) return chapterResponse(GRAMMAR_JSONL)
        if (url.endsWith('/vocabulary.jsonl')) return chapterResponse(VOCAB_JSONL)
        if (url.endsWith('/kanji.jsonl')) return chapterResponse(KANJI_JSONL)
        return new Response('not found', { status: 404 })
      })

      gotoReader('/reader/tsundoku-test?chapter=98-test-chapter-sentence-help&paragraph=p0')
      render(<App />)

      await screen.findByRole('button', { name: /sentence help for p0-s0/i })
      expect(screen.queryByRole('button', { name: /grammar notes for paragraph p0/i })).toBeNull()
    })

    it('renders a sentence-help affordance only on migrated sentences with a translation', async () => {
      gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
      render(<App />)
      await screen.findByRole('button', { name: '私' })

      expect(screen.getByRole('button', { name: /sentence help for p0-s0/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sentence help for p1-s0/i })).toBeInTheDocument()
      // Sentences without authored help do not get the affordance.
      expect(
        screen.queryByRole('button', { name: /sentence help for p0-s1/i }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /sentence help for p1-s1/i }),
      ).not.toBeInTheDocument()
    })

    it('does not render any sentence-help affordance on legacy (v1) chapters', async () => {
      gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
      render(<App />)
      await findParagraphByText('私は本を読みました。')
      expect(screen.queryByRole('button', { name: /sentence help/i })).not.toBeInTheDocument()
    })

    it('opens an inline panel beneath the sentence with the translation when activated', async () => {
      const user = userEvent.setup()
      gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
      render(<App />)
      await user.click(await screen.findByRole('button', { name: /sentence help for p0-s0/i }))

      const panel = await screen.findByRole('region', { name: /sentence help for p0-s0/i })
      expect(panel).toHaveTextContent('I read a book.')
      // Panel sits inside the same paragraph as the sentence (rendered beneath it).
      const paragraph = document.querySelector('[data-paragraph-id="p0"]') as HTMLElement
      expect(paragraph.contains(panel)).toBe(true)
    })

    it('toggles the panel closed when the same affordance is activated again', async () => {
      const user = userEvent.setup()
      gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
      render(<App />)
      const button = await screen.findByRole('button', { name: /sentence help for p0-s0/i })
      await user.click(button)
      expect(
        await screen.findByRole('region', { name: /sentence help for p0-s0/i }),
      ).toBeInTheDocument()

      await user.click(button)

      await waitFor(() => {
        expect(
          screen.queryByRole('region', { name: /sentence help for p0-s0/i }),
        ).not.toBeInTheDocument()
      })
    })

    it('closes any open sentence-help panel when navigating to another chapter', async () => {
      const user = userEvent.setup()
      gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
      render(<App />)
      await user.click(await screen.findByRole('button', { name: /sentence help for p0-s0/i }))
      await screen.findByRole('region', { name: /sentence help for p0-s0/i })

      await user.click(screen.getByRole('button', { name: /previous/i }))
      await findParagraphByText('今日はいい天気です。')

      await user.click(screen.getByRole('button', { name: /next/i }))
      await screen.findByRole('button', { name: /sentence help for p0-s0/i })
      expect(
        screen.queryByRole('region', { name: /sentence help for p0-s0/i }),
      ).not.toBeInTheDocument()
    })

    it('closes the previously open panel when another sentence-help affordance is activated', async () => {
      const user = userEvent.setup()
      gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
      render(<App />)
      await user.click(await screen.findByRole('button', { name: /sentence help for p0-s0/i }))
      expect(
        await screen.findByRole('region', { name: /sentence help for p0-s0/i }),
      ).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /sentence help for p1-s0/i }))

      await waitFor(() => {
        expect(
          screen.queryByRole('region', { name: /sentence help for p0-s0/i }),
        ).not.toBeInTheDocument()
      })
      expect(screen.getByRole('region', { name: /sentence help for p1-s0/i })).toBeInTheDocument()
    })

    it('opens the vocabulary popup on a migrated-sentence token with no panel open', async () => {
      const user = userEvent.setup()
      gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
      render(<App />)
      const watashi = await screen.findByRole('button', { name: '私' })
      await user.click(watashi)
      expect(await screen.findByText('I')).toBeInTheDocument()
    })

    it('opens the vocabulary popup on a token while the same sentence has its panel open', async () => {
      const user = userEvent.setup()
      gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
      render(<App />)
      await user.click(await screen.findByRole('button', { name: /sentence help for p0-s0/i }))
      await screen.findByRole('region', { name: /sentence help for p0-s0/i })

      await user.click(screen.getByRole('button', { name: '私' }))

      expect(await screen.findByText('I')).toBeInTheDocument()
      // Sentence-help panel is unaffected.
      expect(screen.getByRole('region', { name: /sentence help for p0-s0/i })).toBeInTheDocument()
    })

    it('opens the vocabulary popup on a token while a different sentence has its panel open', async () => {
      const user = userEvent.setup()
      gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
      render(<App />)
      await user.click(await screen.findByRole('button', { name: /sentence help for p1-s0/i }))
      await screen.findByRole('region', { name: /sentence help for p1-s0/i })

      await user.click(screen.getByRole('button', { name: '私' }))

      expect(await screen.findByText('I')).toBeInTheDocument()
      expect(screen.getByRole('region', { name: /sentence help for p1-s0/i })).toBeInTheDocument()
    })

    it('scrolls minimally when expanding linked grammar pushes the panel off-screen', async () => {
      const user = userEvent.setup()
      const restoreVh = setInnerHeight(800)
      const metadataWithSentenceHelp = {
        ...METADATA,
        chapters: [{ id: '98-test-chapter-sentence-help', title: '第四章: 文の助け' }],
      }
      fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.endsWith('/books/index.json')) return jsonResponse(['tsundoku-test'])
        if (url.endsWith('/books/tsundoku-test/metadata.json'))
          return jsonResponse(metadataWithSentenceHelp)
        if (url.endsWith('/98-test-chapter-sentence-help.jsonl'))
          return chapterResponse(CHAPTER_MIGRATED_WITH_HELP_JSONL)
        if (url.endsWith('/grammar.jsonl')) return chapterResponse(GRAMMAR_JSONL)
        if (url.endsWith('/vocabulary.jsonl')) return chapterResponse(VOCAB_JSONL)
        return new Response('not found', { status: 404 })
      })

      let panelHeight = 80
      const restoreRects = stubRects([
        (el) => (el.tagName === 'HEADER' ? makeRect(0, 50) : null),
        (el) => (el.getAttribute('data-sentence-id') === 'p0-s0' ? makeRect(600, 30) : null),
        (el) =>
          el.getAttribute('role') === 'region' &&
          el.getAttribute('aria-label') === 'Sentence help for p0-s0'
            ? makeRect(640, panelHeight)
            : null,
      ])

      try {
        gotoReader('/reader/tsundoku-test?chapter=98-test-chapter-sentence-help&paragraph=p0')
        render(<App />)

        // Open the panel: 640..720 is fully visible in 0..800 viewport.
        await user.click(await screen.findByRole('button', { name: /sentence help for p0-s0/i }))
        await screen.findByRole('region', { name: /sentence help for p0-s0/i })
        await new Promise((r) => setTimeout(r, 10))
        expect(window.scrollBy).not.toHaveBeenCalled()

        // Expand grammar: panel grows to 640..960, overflowing the viewport.
        panelHeight = 320
        await user.click(screen.getByRole('button', { name: /show linked grammar/i }))
        const panel = await screen.findByRole('region', { name: /sentence help for p0-s0/i })
        fireResize(panel)

        await waitFor(() => {
          expect(window.scrollBy).toHaveBeenCalled()
        })
        const arg = (window.scrollBy as unknown as ReturnType<typeof vi.fn>).mock
          .calls[0][0] as ScrollToOptions
        expect(arg.behavior).toBe('smooth')
        expect(arg.top).toBeGreaterThan(0)
      } finally {
        restoreRects()
        restoreVh()
      }
    })

    it('does not scroll when collapsing linked grammar with the panel still fully visible', async () => {
      const user = userEvent.setup()
      const restoreVh = setInnerHeight(800)
      const metadataWithSentenceHelp = {
        ...METADATA,
        chapters: [{ id: '98-test-chapter-sentence-help', title: '第四章: 文の助け' }],
      }
      fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.endsWith('/books/index.json')) return jsonResponse(['tsundoku-test'])
        if (url.endsWith('/books/tsundoku-test/metadata.json'))
          return jsonResponse(metadataWithSentenceHelp)
        if (url.endsWith('/98-test-chapter-sentence-help.jsonl'))
          return chapterResponse(CHAPTER_MIGRATED_WITH_HELP_JSONL)
        if (url.endsWith('/grammar.jsonl')) return chapterResponse(GRAMMAR_JSONL)
        if (url.endsWith('/vocabulary.jsonl')) return chapterResponse(VOCAB_JSONL)
        return new Response('not found', { status: 404 })
      })

      // Both compact and expanded panel sizes fit comfortably in the viewport.
      let panelHeight = 80
      const restoreRects = stubRects([
        (el) => (el.tagName === 'HEADER' ? makeRect(0, 50) : null),
        (el) => (el.getAttribute('data-sentence-id') === 'p0-s0' ? makeRect(200, 30) : null),
        (el) =>
          el.getAttribute('role') === 'region' &&
          el.getAttribute('aria-label') === 'Sentence help for p0-s0'
            ? makeRect(240, panelHeight)
            : null,
      ])

      try {
        gotoReader('/reader/tsundoku-test?chapter=98-test-chapter-sentence-help&paragraph=p0')
        render(<App />)

        await user.click(await screen.findByRole('button', { name: /sentence help for p0-s0/i }))
        await screen.findByRole('region', { name: /sentence help for p0-s0/i })

        panelHeight = 300
        await user.click(screen.getByRole('button', { name: /show linked grammar/i }))
        const panel = await screen.findByRole('region', { name: /sentence help for p0-s0/i })
        await screen.findByText('Because (casual reason)')
        fireResize(panel)

        // Collapse — panel shrinks back; everything still fully visible.
        panelHeight = 80
        await user.click(screen.getByRole('button', { name: /show linked grammar/i }))
        fireResize(panel)

        await new Promise((r) => setTimeout(r, 10))
        expect(window.scrollBy).not.toHaveBeenCalled()
      } finally {
        restoreRects()
        restoreVh()
      }
    })

    it('renders the sentence-help affordance as a sibling of tokens, not as their ancestor', async () => {
      gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
      render(<App />)
      const affordance = await screen.findByRole('button', {
        name: /sentence help for p0-s0/i,
      })
      const tokens = ['私', '本', '読']
      for (const label of tokens) {
        const token = screen.getByRole('button', { name: label })
        expect(affordance.contains(token)).toBe(false)
      }
    })

    it('scrolls up to reveal the sentence when both sentence and panel are clipped', async () => {
      const user = userEvent.setup()
      const restoreVh = setInnerHeight(800)
      const restoreRects = stubRects([
        (el) => (el.tagName === 'HEADER' ? makeRect(0, 60) : null),
        // Sentence top (20) is under the header (bottom 60), AND panel bottom
        // (900) overflows the viewport (800). Pair can't both fit; algorithm
        // must still scroll, prioritising sentence visibility.
        (el) => (el.getAttribute('data-sentence-id') === 'p0-s0' ? makeRect(20, 30) : null),
        (el) =>
          el.getAttribute('role') === 'region' &&
          el.getAttribute('aria-label') === 'Sentence help for p0-s0'
            ? makeRect(60, 840)
            : null,
      ])

      try {
        gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
        render(<App />)
        await user.click(await screen.findByRole('button', { name: /sentence help for p0-s0/i }))
        await screen.findByRole('region', { name: /sentence help for p0-s0/i })

        await waitFor(() => {
          expect(window.scrollBy).toHaveBeenCalled()
        })
        const arg = (window.scrollBy as unknown as ReturnType<typeof vi.fn>).mock
          .calls[0][0] as ScrollToOptions
        expect(arg.behavior).toBe('smooth')
        // Anchor sentenceTop (20) below header (60) with margin 8 → delta -48.
        expect(arg.top).toBeLessThan(0)
        expect(arg.top).toBeGreaterThanOrEqual(-60)
      } finally {
        restoreRects()
        restoreVh()
      }
    })

    it('scrolls up when the opened sentence is hidden under the sticky header', async () => {
      const user = userEvent.setup()
      const restoreVh = setInnerHeight(800)
      const restoreRects = stubRects([
        (el) => (el.tagName === 'HEADER' ? makeRect(0, 60) : null),
        // Sentence top (20) is under the header (bottom 60).
        (el) => (el.getAttribute('data-sentence-id') === 'p0-s0' ? makeRect(20, 30) : null),
        (el) =>
          el.getAttribute('role') === 'region' &&
          el.getAttribute('aria-label') === 'Sentence help for p0-s0'
            ? makeRect(60, 80)
            : null,
      ])

      try {
        gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
        render(<App />)
        await user.click(await screen.findByRole('button', { name: /sentence help for p0-s0/i }))
        await screen.findByRole('region', { name: /sentence help for p0-s0/i })

        await waitFor(() => {
          expect(window.scrollBy).toHaveBeenCalled()
        })
        const arg = (window.scrollBy as unknown as ReturnType<typeof vi.fn>).mock
          .calls[0][0] as ScrollToOptions
        expect(arg.behavior).toBe('smooth')
        // Sentence top 20 - headerBottom 60 - margin 8 = -48
        expect(arg.top).toBeLessThan(0)
        expect(arg.top).toBeGreaterThanOrEqual(-60)
      } finally {
        restoreRects()
        restoreVh()
      }
    })

    it('re-evaluates and minimally scrolls when switching to another sentence-help panel', async () => {
      const user = userEvent.setup()
      const restoreVh = setInnerHeight(800)
      const restoreRects = stubRects([
        (el) => (el.tagName === 'HEADER' ? makeRect(0, 50) : null),
        (el) => (el.getAttribute('data-sentence-id') === 'p0-s0' ? makeRect(200, 30) : null),
        (el) =>
          el.getAttribute('role') === 'region' &&
          el.getAttribute('aria-label') === 'Sentence help for p0-s0'
            ? makeRect(240, 80)
            : null,
        (el) => (el.getAttribute('data-sentence-id') === 'p1-s0' ? makeRect(700, 30) : null),
        (el) =>
          el.getAttribute('role') === 'region' &&
          el.getAttribute('aria-label') === 'Sentence help for p1-s0'
            ? makeRect(740, 120)
            : null,
      ])

      try {
        gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
        render(<App />)
        await user.click(await screen.findByRole('button', { name: /sentence help for p0-s0/i }))
        await screen.findByRole('region', { name: /sentence help for p0-s0/i })
        await new Promise((r) => setTimeout(r, 10))
        expect(window.scrollBy).not.toHaveBeenCalled()

        await user.click(screen.getByRole('button', { name: /sentence help for p1-s0/i }))
        await screen.findByRole('region', { name: /sentence help for p1-s0/i })

        await waitFor(() => {
          expect(window.scrollBy).toHaveBeenCalledTimes(1)
        })
        const arg = (window.scrollBy as unknown as ReturnType<typeof vi.fn>).mock
          .calls[0][0] as ScrollToOptions
        expect(arg.behavior).toBe('smooth')
        expect(arg.top).toBeGreaterThanOrEqual(60)
      } finally {
        restoreRects()
        restoreVh()
      }
    })

    it('does not scroll when an opened panel is already fully visible', async () => {
      const user = userEvent.setup()
      const restoreVh = setInnerHeight(800)
      const restoreRects = stubRects([
        (el) => (el.tagName === 'HEADER' ? makeRect(0, 50) : null),
        (el) => (el.getAttribute('data-sentence-id') === 'p0-s0' ? makeRect(200, 30) : null),
        (el) =>
          el.getAttribute('role') === 'region' &&
          el.getAttribute('aria-label') === 'Sentence help for p0-s0'
            ? makeRect(240, 80)
            : null,
      ])

      try {
        gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
        render(<App />)
        const button = await screen.findByRole('button', { name: /sentence help for p0-s0/i })
        await user.click(button)
        await screen.findByRole('region', { name: /sentence help for p0-s0/i })

        // Give any latent effect a chance to fire.
        await new Promise((r) => setTimeout(r, 10))
        expect(window.scrollBy).not.toHaveBeenCalled()
      } finally {
        restoreRects()
        restoreVh()
      }
    })

    it('scrolls minimally to bring an opened panel into view when clipped at the bottom', async () => {
      const user = userEvent.setup()
      const restoreVh = setInnerHeight(800)
      const restoreRects = stubRects([
        (el) => (el.tagName === 'HEADER' ? makeRect(0, 50) : null),
        (el) => (el.getAttribute('data-sentence-id') === 'p0-s0' ? makeRect(700, 30) : null),
        (el) =>
          el.getAttribute('role') === 'region' &&
          el.getAttribute('aria-label') === 'Sentence help for p0-s0'
            ? makeRect(740, 120)
            : null,
      ])

      try {
        gotoReader('/reader/tsundoku-test?chapter=99-test-chapter-migrated&paragraph=p0')
        render(<App />)
        const button = await screen.findByRole('button', { name: /sentence help for p0-s0/i })
        await user.click(button)
        await screen.findByRole('region', { name: /sentence help for p0-s0/i })

        await waitFor(() => {
          expect(window.scrollBy).toHaveBeenCalled()
        })
        const calls = (window.scrollBy as unknown as ReturnType<typeof vi.fn>).mock.calls
        expect(calls).toHaveLength(1)
        const arg = calls[0][0] as ScrollToOptions
        expect(arg.behavior).toBe('smooth')
        // Panel bottom (740 + 120 = 860) overflows viewport (800) by 60.
        expect(arg.top).toBeGreaterThanOrEqual(60)
        // Sentence top (700) minus delta must remain >= header bottom (50);
        // so delta must be <= 650.
        expect(arg.top).toBeLessThanOrEqual(650)
      } finally {
        restoreRects()
        restoreVh()
      }
    })
  })

  describe('vocab popup kanji tab', () => {
    it('does not fetch kanji.jsonl until the user opens a Kanji tab', async () => {
      const user = userEvent.setup()
      gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
      render(<App />)
      await screen.findByRole('button', { name: '私' })

      expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/kanji.jsonl'))).toBe(false)

      await user.click(screen.getByRole('button', { name: '私' }))
      await user.click(await screen.findByRole('tab', { name: /kanji/i }))

      await waitFor(() => {
        expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/kanji.jsonl'))).toBe(true)
      })
    })

    it('fetches kanji.jsonl only once even when multiple Kanji tabs are opened', async () => {
      const user = userEvent.setup()
      gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
      render(<App />)
      await screen.findByRole('button', { name: '私' })

      await user.click(screen.getByRole('button', { name: '私' }))
      await user.click(await screen.findByRole('tab', { name: /kanji/i }))
      await waitFor(() => {
        expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/kanji.jsonl'))).toBe(true)
      })
      // close
      await user.keyboard('{Escape}')

      await user.click(screen.getByRole('button', { name: '本' }))
      await user.click(await screen.findByRole('tab', { name: /kanji/i }))

      const kanjiFetchCount = fetchMock.mock.calls.filter(([u]) =>
        String(u).endsWith('/kanji.jsonl'),
      ).length
      expect(kanjiFetchCount).toBe(1)
    })

    it('renders a kanji card with onyomi/kunyomi/meanings from the fixture', async () => {
      const user = userEvent.setup()
      gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
      render(<App />)
      await user.click(await screen.findByRole('button', { name: '本' }))
      await user.click(await screen.findByRole('tab', { name: /kanji/i }))

      expect(await screen.findByText('ホン')).toBeInTheDocument()
      expect(screen.getByText('もと')).toBeInTheDocument()
      expect(screen.getByText('book, origin')).toBeInTheDocument()
    })
  })
})
