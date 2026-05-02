export interface Bookmark {
  chapterId: string
  paragraphId: string
}

const KEY_PREFIX = 'tsundoku:bookmark:'

export function getBookmark(slug: string): Bookmark | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + slug)
    if (!raw) return null
    return JSON.parse(raw) as Bookmark
  } catch {
    return null
  }
}

export function setBookmark(slug: string, bookmark: Bookmark): void {
  try {
    localStorage.setItem(KEY_PREFIX + slug, JSON.stringify(bookmark))
  } catch {
    // ignore quota / unavailable storage
  }
}
