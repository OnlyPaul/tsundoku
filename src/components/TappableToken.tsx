import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Token, VocabEntry } from '@/lib/types'
import { VocabPopup } from './VocabPopup'

interface TappableTokenProps {
  token: Token
  vocab: Map<string, VocabEntry> | null
  showFurigana?: boolean
}

export function TappableToken({ token, vocab, showFurigana = false }: TappableTokenProps) {
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
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={token.s}
          className="rounded px-0.5 font-bold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {inner}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <VocabPopup token={token} entry={entry} />
      </PopoverContent>
    </Popover>
  )
}
