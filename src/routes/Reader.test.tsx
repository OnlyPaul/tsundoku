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
  ],
}

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

  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url.endsWith('/books/index.json')) return jsonResponse(['tsundoku-test'])
    if (url.endsWith('/books/tsundoku-test/metadata.json')) return jsonResponse(METADATA)
    if (url.endsWith('/00-test-chapter-1.jsonl')) return chapterResponse(CHAPTER_1_JSONL)
    if (url.endsWith('/01-test-chapter-2.jsonl')) return chapterResponse(CHAPTER_2_JSONL)
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
    await user.click(screen.getByRole('button', { name: /furigana/i }))
    await waitFor(() => {
      expect(document.querySelector('ruby')).toBeNull()
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
    await user.click(screen.getByRole('button', { name: /furigana/i }))
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
    const heading = await screen.findByRole('heading')
    expect(heading).toHaveTextContent('読む')
  })

  it('does not open a popover for tokens without a v field', async () => {
    gotoReader('/reader/tsundoku-test?chapter=01-test-chapter-2&paragraph=p0')
    render(<App />)
    await findParagraphByText('今日はいい天気です。')
    expect(screen.queryByRole('button', { name: '今日' })).not.toBeInTheDocument()
  })

  it('disables Next on the last chapter', async () => {
    gotoReader('/reader/tsundoku-test?chapter=01-test-chapter-2&paragraph=p0')
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
