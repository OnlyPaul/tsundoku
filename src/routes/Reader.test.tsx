import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { __resetBookStoreCache } from '../lib/book-store'
import * as bookmarks from '../lib/bookmarks'

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
  '{"id":"p0","tokens":[{"s":"私","r":"わたし","v":"watashi"},{"s":"は"},{"s":"本"},{"s":"を"},{"s":"読みました","r":"よみました","v":"yomu","lemma":"読む"},{"s":"。"}]}\n' +
  '{"id":"p1","tokens":[{"s":"猫"},{"s":"が"},{"s":"好き"},{"s":"です"},{"s":"。"}]}\n'

const CHAPTER_2_JSONL =
  '{"id":"p0","tokens":[{"s":"今日"},{"s":"は"},{"s":"いい"},{"s":"天気"},{"s":"です"},{"s":"。"}]}\n' +
  '{"id":"p1","tokens":[{"s":"友達"},{"s":"と"},{"s":"会"},{"s":"いました"},{"s":"。"}]}\n'

const VOCAB_JSONL =
  '{"id":"watashi","lemma":"私","reading":"わたし","pos":"pronoun","jlpt":"N5","meanings":["I","me"],"frequency":1,"first_seen":"00-test-chapter-1:p0"}\n' +
  '{"id":"yomu","lemma":"読む","reading":"よむ","pos":"verb","jlpt":"N5","meanings":["to read"],"frequency":1,"first_seen":"00-test-chapter-1:p0"}\n'

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
  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url.endsWith('/books/index.json')) return jsonResponse(['tsundoku-test'])
    if (url.endsWith('/books/tsundoku-test/metadata.json')) return jsonResponse(METADATA)
    if (url.endsWith('/00-test-chapter-1.jsonl')) return chapterResponse(CHAPTER_1_JSONL)
    if (url.endsWith('/01-test-chapter-2.jsonl')) return chapterResponse(CHAPTER_2_JSONL)
    if (url.endsWith('/vocabulary.jsonl')) return chapterResponse(VOCAB_JSONL)
    return new Response('not found', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
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

function paragraphWithText(expected: string) {
  return (_content: string, element: Element | null) =>
    element?.tagName.toLowerCase() === 'p' && element.textContent === expected
}

describe('Reader', () => {
  it('renders all paragraphs of the chapter specified in the URL', async () => {
    gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
    render(<App />)
    expect(await screen.findByText(paragraphWithText('私は本を読みました。'))).toBeInTheDocument()
    expect(await screen.findByText(paragraphWithText('猫が好きです。'))).toBeInTheDocument()
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
    await screen.findByText(paragraphWithText('私は本を読みました。'))

    expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/01-test-chapter-2.jsonl'))).toBe(
      false,
    )

    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(await screen.findByText(paragraphWithText('今日はいい天気です。'))).toBeInTheDocument()
    expect(await screen.findByText(paragraphWithText('友達と会いました。'))).toBeInTheDocument()
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
    expect(await screen.findByText(paragraphWithText('今日はいい天気です。'))).toBeInTheDocument()
  })

  it('opens a vocab popover when a tappable token is tapped', async () => {
    const user = userEvent.setup()
    gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
    render(<App />)
    const watashi = await screen.findByRole('button', { name: '私' })
    await user.click(watashi)
    expect(await screen.findByText('わたし')).toBeInTheDocument()
    expect(screen.getByText('I')).toBeInTheDocument()
    expect(screen.getByText('N5')).toBeInTheDocument()
    expect(screen.getByText('pronoun')).toBeInTheDocument()
  })

  it('shows the lemma in the header for a conjugated token', async () => {
    const user = userEvent.setup()
    gotoReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p0')
    render(<App />)
    const conjugated = await screen.findByRole('button', { name: '読みました' })
    await user.click(conjugated)
    const heading = await screen.findByRole('heading')
    expect(heading).toHaveTextContent('読む')
  })

  it('does not render a button for tokens without a v field', async () => {
    gotoReader('/reader/tsundoku-test?chapter=01-test-chapter-2&paragraph=p0')
    render(<App />)
    await screen.findByText(paragraphWithText('今日はいい天気です。'))
    expect(screen.queryByRole('button', { name: '今日' })).not.toBeInTheDocument()
  })

  it('disables Next on the last chapter', async () => {
    gotoReader('/reader/tsundoku-test?chapter=01-test-chapter-2&paragraph=p0')
    render(<App />)
    const next = await screen.findByRole('button', { name: /next/i })
    expect(next).toBeDisabled()
    expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled()
  })
})
