import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { __resetBookStoreCache } from './lib/book-store'

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  __resetBookStoreCache()
  window.history.pushState({}, '', '/')
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url.endsWith('/books/index.json')) return jsonResponse(['tsundoku-test'])
    if (url.endsWith('/books/tsundoku-test/metadata.json')) {
      return jsonResponse({
        id: 'tsundoku-test',
        title: 'Tsundoku テスト本',
        author: 'Test Author',
        cover: 'cover.jpg',
        chapters: [{ id: '00-test-chapter-1', title: 'Ch 1' }],
      })
    }
    if (url.endsWith('/00-test-chapter-1.jsonl')) {
      return new Response('{"id":"p0","tokens":[{"s":"私"}]}\n', { status: 200 })
    }
    return new Response('not found', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  try {
    localStorage.clear()
  } catch {
    // localStorage may be unavailable in some test envs
  }
})

describe('App', () => {
  it('renders a card for the fixture book and navigates to the reader', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Library' })).toBeInTheDocument()
    const card = await screen.findByRole('button', { name: /Tsundoku テスト本/ })
    await user.click(card)
    await waitFor(() => expect(window.location.pathname).toBe('/reader/tsundoku-test'))
    expect(window.location.search).toContain('chapter=00-test-chapter-1')
    expect(window.location.search).toContain('paragraph=p0')
  })
})
