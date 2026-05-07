import { BookCover } from '@/components/BookCover'
import { coverUrl, fetchBookIndex, fetchMetadata } from '@/lib/book-store'
import { getBookmark } from '@/lib/bookmarks'
import type { BookMetadata } from '@/lib/types'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface BookCard {
  slug: string
  metadata: BookMetadata
  bookmarkChapterId: string | null
}

export default function Home() {
  const navigate = useNavigate()
  const [books, setBooks] = useState<BookCard[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchBookIndex()
      .then((slugs) =>
        Promise.all(
          slugs.map(async (slug) => ({
            slug,
            metadata: await fetchMetadata(slug),
            bookmarkChapterId: getBookmark(slug)?.chapterId ?? null,
          })),
        ),
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

  return (
    <main className="min-h-screen bg-background pb-16">
      <header className="px-6 pt-10 pb-6 md:px-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          つんどく ・ tsundoku
        </p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <h1 aria-label="Library" className="font-jp text-5xl font-medium md:text-6xl">
            本棚
          </h1>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="rounded-full border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground"
          >
            + Import
          </button>
        </div>
      </header>

      {error ? (
        <p className="px-6 font-mono text-xs uppercase tracking-wider text-muted-foreground md:px-10">
          Failed to load library — {error}
        </p>
      ) : !books ? (
        <SkeletonGrid />
      ) : (
        <Loaded books={books} onOpen={openBook} />
      )}
    </main>
  )
}

function SkeletonGrid() {
  return (
    <section className="px-6 md:px-10">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Library
      </p>
      <ul className="grid grid-cols-3 gap-4 md:grid-cols-5 md:gap-6">
        {['a', 'b', 'c', 'd', 'e', 'f'].map((k) => (
          <li key={k} className="space-y-2">
            <div className="aspect-[2/3] w-full rounded-sm bg-muted/60" />
            <div className="h-3 w-3/4 rounded bg-muted/60" />
            <div className="h-2 w-1/2 rounded bg-muted/40" />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Loaded({
  books,
  onOpen,
}: {
  books: BookCard[]
  onOpen: (slug: string, metadata: BookMetadata) => void
}) {
  const continueCard = books.find((b) => b.bookmarkChapterId)

  return (
    <>
      {continueCard ? (
        <ContinueCard
          card={continueCard}
          onOpen={() => onOpen(continueCard.slug, continueCard.metadata)}
        />
      ) : null}

      <section className="px-6 md:px-10">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Library ・ {books.length} {books.length === 1 ? 'book' : 'books'}
        </p>
        <ul className="grid grid-cols-3 gap-4 md:grid-cols-5 md:gap-6">
          {books.map(({ slug, metadata }) => (
            <li key={slug}>
              <button
                type="button"
                onClick={() => onOpen(slug, metadata)}
                className="group flex w-full flex-col items-start gap-2 text-left"
              >
                <BookCover
                  bookId={slug}
                  title={metadata.title}
                  coverUrl={metadata.cover ? coverUrl(slug, metadata.cover) : null}
                  alt={`Cover of ${metadata.title}`}
                />
                <div className="w-full">
                  <p className="line-clamp-2 font-jp text-sm leading-snug">{metadata.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs italic text-muted-foreground">
                    {metadata.author}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function ContinueCard({ card, onOpen }: { card: BookCard; onOpen: () => void }) {
  const chapterIdx = card.metadata.chapters.findIndex((c) => c.id === card.bookmarkChapterId)
  const chapterNumber = chapterIdx >= 0 ? chapterIdx + 1 : 1
  return (
    <section className="mx-6 mb-8 md:mx-10">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Continue Reading
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-4 rounded-md border border-border bg-card p-4 text-left hover:border-primary/50"
      >
        <div className="w-20 shrink-0 md:w-24">
          <BookCover
            bookId={card.slug}
            title={card.metadata.title}
            coverUrl={card.metadata.cover ? coverUrl(card.slug, card.metadata.cover) : null}
            alt={`Cover of ${card.metadata.title}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-jp text-base leading-snug">{card.metadata.title}</p>
          <p className="mt-1 text-sm italic text-muted-foreground">{card.metadata.author}</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Ch. {chapterNumber}
          </p>
        </div>
      </button>
    </section>
  )
}
