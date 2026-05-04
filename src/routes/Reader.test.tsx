import { __resetBookStoreCache } from '@/lib/book-store'
import { getBookmark, setBookmark } from '@/lib/bookmarks'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Reader from './Reader'

type IOEntry = { target: Element; isIntersecting: boolean; intersectionRatio: number }
let observerCallbacks: Array<(entries: IOEntry[]) => void> = []

function fireIntersection(entries: IOEntry[]) {
  for (const cb of observerCallbacks) cb(entries)
}

const METADATA = {
  id: 'tsundoku-test',
  title: 'Tsundoku テスト本',
  author: 'Test Author',
  cover: 'cover.jpg',
  chapters: [{ id: '00-test-chapter-1', title: 'Ch 1' }],
}

const CHAPTER_JSONL =
  '{"id":"p1","tokens":[{"s":"今日","r":"きょう"}]}\n' +
  '{"id":"p2","tokens":[{"s":"本"}]}\n' +
  '{"id":"p3","tokens":[{"s":"学生"}]}\n'

beforeEach(() => {
  __resetBookStoreCache()
  observerCallbacks = []

  class MockIntersectionObserver {
    observe = vi.fn()
    disconnect = vi.fn()
    unobserve = vi.fn()
    takeRecords = vi.fn(() => [])
    root = null
    rootMargin = ''
    thresholds: number[] = []
    constructor(cb: (entries: IOEntry[]) => void) {
      observerCallbacks.push(cb)
    }
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url.endsWith('/books/tsundoku-test/metadata.json')) {
      return new Response(JSON.stringify(METADATA), { status: 200 })
    }
    if (url.endsWith('/00-test-chapter-1.jsonl')) {
      return new Response(CHAPTER_JSONL, { status: 200 })
    }
    return new Response('not found', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)

  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

function renderReader(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/reader/:slug" element={<Reader />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Reader', () => {
  it('renders paragraphs from the requested chapter', async () => {
    renderReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p1')
    expect(await screen.findByTestId('paragraph-p1')).toHaveTextContent('今日')
    expect(screen.getByTestId('paragraph-p2')).toHaveTextContent('本')
    expect(screen.getByTestId('paragraph-p3')).toHaveTextContent('学生')
  })

  it('writes the current paragraph to localStorage when it becomes 50%+ visible', async () => {
    renderReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p1')
    const p2 = await screen.findByTestId('paragraph-p2')

    fireIntersection([{ target: p2, isIntersecting: true, intersectionRatio: 0.6 }])

    await waitFor(() => {
      expect(getBookmark('tsundoku-test')).toEqual({
        chapterId: '00-test-chapter-1',
        paragraphId: 'p2',
      })
    })
  })

  it('does not update the bookmark for sub-50% visibility', async () => {
    renderReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p1')
    const p3 = await screen.findByTestId('paragraph-p3')

    fireIntersection([{ target: p3, isIntersecting: true, intersectionRatio: 0.2 }])

    await new Promise((r) => setTimeout(r, 0))
    expect(getBookmark('tsundoku-test')).toBeNull()
  })

  it('scrolls to the saved paragraph on mount when a bookmark exists', async () => {
    setBookmark('tsundoku-test', { chapterId: '00-test-chapter-1', paragraphId: 'p3' })

    renderReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p1')
    const p3 = await screen.findByTestId('paragraph-p3')

    await waitFor(() => {
      expect(p3.scrollIntoView).toHaveBeenCalled()
    })
  })

  it("does not overwrite another book's bookmark", async () => {
    setBookmark('other-book', { chapterId: 'ch-x', paragraphId: 'p-x' })

    renderReader('/reader/tsundoku-test?chapter=00-test-chapter-1&paragraph=p1')
    const p2 = await screen.findByTestId('paragraph-p2')
    fireIntersection([{ target: p2, isIntersecting: true, intersectionRatio: 0.9 }])

    await waitFor(() => {
      expect(getBookmark('tsundoku-test')).toEqual({
        chapterId: '00-test-chapter-1',
        paragraphId: 'p2',
      })
    })
    expect(getBookmark('other-book')).toEqual({ chapterId: 'ch-x', paragraphId: 'p-x' })
  })
})
