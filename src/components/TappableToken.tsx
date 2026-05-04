import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Token, VocabEntry } from '@/lib/types'
import { VocabPopup } from './VocabPopup'

interface TappableTokenProps {
  token: Token
  vocab: Map<string, VocabEntry> | null
}

export function TappableToken({ token, vocab }: TappableTokenProps) {
  if (!token.v) {
    return <span className="text-muted-foreground/60">{token.s}</span>
  }
  const entry = vocab?.get(token.v)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="rounded px-0.5 text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {token.s}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <VocabPopup token={token} entry={entry} />
      </PopoverContent>
    </Popover>
  )
}
