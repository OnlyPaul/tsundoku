import { afterEach, describe, expect, it } from 'vitest'
import { getBookmark, setBookmark } from './bookmarks'

afterEach(() => {
  localStorage.clear()
})

describe('bookmarks', () => {
  it('saving a position and reading it back returns the same chapter and paragraph', () => {
    setBookmark('book-1', { chapterId: 'ch3', paragraphId: 'p7' })
    expect(getBookmark('book-1')).toEqual({ chapterId: 'ch3', paragraphId: 'p7' })
  })

  it('roundtrips an offset within the paragraph', () => {
    setBookmark('book-1', { chapterId: 'ch3', paragraphId: 'p7', offset: 0.42 })
    expect(getBookmark('book-1')).toEqual({
      chapterId: 'ch3',
      paragraphId: 'p7',
      offset: 0.42,
    })
  })

  it('reads back legacy bookmarks without offset (forward-compat)', () => {
    localStorage.setItem(
      'tsundoku:bookmark:legacy-book',
      JSON.stringify({ chapterId: 'ch1', paragraphId: 'p2' }),
    )
    const bm = getBookmark('legacy-book')
    expect(bm).toEqual({ chapterId: 'ch1', paragraphId: 'p2' })
    expect(bm?.offset).toBeUndefined()
  })

  it('returns null when no bookmark exists for a book', () => {
    expect(getBookmark('never-saved')).toBeNull()
  })

  it('stores bookmarks for different bookIds independently', () => {
    setBookmark('book-a', { chapterId: 'ch1', paragraphId: 'p1' })
    setBookmark('book-b', { chapterId: 'ch9', paragraphId: 'p99' })

    expect(getBookmark('book-a')).toEqual({ chapterId: 'ch1', paragraphId: 'p1' })
    expect(getBookmark('book-b')).toEqual({ chapterId: 'ch9', paragraphId: 'p99' })

    setBookmark('book-a', { chapterId: 'ch2', paragraphId: 'p2' })
    expect(getBookmark('book-a')).toEqual({ chapterId: 'ch2', paragraphId: 'p2' })
    expect(getBookmark('book-b')).toEqual({ chapterId: 'ch9', paragraphId: 'p99' })
  })
})
