import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import type { KanjiEntry, Token, VocabEntry } from '@/lib/types'
import { useMediaQuery } from '@/lib/use-media-query'
import { useState } from 'react'
import { VocabPopup } from './VocabPopup'

interface TappableTokenProps {
  token: Token
  vocab: Map<string, VocabEntry> | null
  kanjiMap?: Map<string, KanjiEntry> | null
  onOpenKanjiTab?: () => void
  showFurigana?: boolean
}

export function TappableToken({
  token,
  vocab,
  kanjiMap,
  onOpenKanjiTab,
  showFurigana = false,
}: TappableTokenProps) {
  const isWide = useMediaQuery('(min-width: 768px)')
  const [open, setOpen] = useState(false)

  const inner =
    token.r && showFurigana ? (
      <ruby>
        <rb>{token.s}</rb>
        <rt>{token.r}</rt>
      </ruby>
    ) : (
      token.s
    )

  if (!token.v) {
    return <span className="opacity-50">{inner}</span>
  }
  const entry = vocab?.get(token.v)
  const triggerClass =
    'rounded px-0.5 font-bold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-primary/10 data-[state=open]:text-primary'

  if (isWide) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" aria-label={token.s} className={triggerClass}>
            {inner}
          </button>
        </PopoverTrigger>
        <PopoverContent className="bg-card">
          <VocabPopup
            token={token}
            entry={entry}
            kanjiMap={kanjiMap}
            onOpenKanjiTab={onOpenKanjiTab}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <>
      <button
        type="button"
        aria-label={token.s}
        data-state={open ? 'open' : 'closed'}
        onClick={() => setOpen(true)}
        className={triggerClass}
      >
        {inner}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="bg-card">
          <SheetTitle className="sr-only">{token.s}</SheetTitle>
          <SheetDescription className="sr-only">Vocabulary entry</SheetDescription>
          <VocabPopup
            token={token}
            entry={entry}
            kanjiMap={kanjiMap}
            onOpenKanjiTab={onOpenKanjiTab}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
