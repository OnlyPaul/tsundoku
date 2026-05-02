import { coverUrl, fetchBookIndex, fetchMetadata } from '@/lib/book-store'
import { getBookmark } from '@/lib/bookmarks'
import type { BookMetadata } from '@/lib/types'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface BookCard {
  slug: string
  metadata: BookMetadata
}

export default function Home() {
  const navigate = useNavigate()
  const [books, setBooks] = useState<BookCard[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchBookIndex()
      .then((slugs) =>
        Promise.all(slugs.map(async (slug) => ({ slug, metadata: await fetchMetadata(slug) }))),
      )
      .then((cards) => {
        if (!cancelled) setBooks(cards)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [])

  function openBook(slug: string, metadata: BookMetadata) {
    const bookmark = getBookmark(slug)
    const chapter = bookmark?.chapterId ?? metadata.chapters[0]?.id
    const paragraph = bookmark?.paragraphId ?? 'p0'
    navigate(`/reader/${slug}?chapter=${chapter}&paragraph=${paragraph}`)
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-destructive">Failed to load library: {error}</p>
      </main>
    )
  }

  if (!books) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-muted-foreground">Loading library…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Library</h1>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {books.map(({ slug, metadata }) => (
          <li key={slug}>
            <button
              type="button"
              onClick={() => openBook(slug, metadata)}
              className="group flex w-full flex-col items-start gap-2 rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary"
            >
              <img
                src={coverUrl(slug, metadata.cover)}
                alt={`Cover of ${metadata.title}`}
                className="aspect-[2/3] w-full rounded object-cover"
              />
              <div className="w-full">
                <p className="line-clamp-2 font-semibold">{metadata.title}</p>
                <p className="text-sm text-muted-foreground">{metadata.author}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
