import type { Token, VocabEntry } from '@/lib/types'

interface VocabPopupProps {
  token: Token
  entry: VocabEntry | undefined
}

export function VocabPopup({ token, entry }: VocabPopupProps) {
  if (!token.v || !entry) return null
  const headWord = token.lemma ?? token.s
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">{headWord}</h3>
        {entry.jlpt ? (
          <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {entry.jlpt}
          </span>
        ) : null}
      </div>
      <div className="text-muted-foreground">{entry.reading}</div>
      <div className="text-xs italic text-muted-foreground">{entry.pos}</div>
      <ul className="list-disc pl-5">
        {entry.meanings.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  )
}
