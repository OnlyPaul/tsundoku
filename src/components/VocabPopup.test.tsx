import type { KanjiEntry, Token, VocabEntry } from '@/lib/types'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VocabPopup } from './VocabPopup'

const KYOU: VocabEntry = {
  id: 'kyou',
  lemma: '今日',
  reading: 'きょう',
  pos: 'noun',
  jlpt: 'N5',
  meanings: ['today'],
  frequency: 1,
  first_seen: '00-test-chapter-1:p1',
}

const YOMU: VocabEntry = {
  id: 'yomu',
  lemma: '読む',
  reading: 'よむ',
  pos: 'verb',
  jlpt: 'N5',
  meanings: ['to read', 'to peruse'],
  frequency: 2,
  first_seen: '00-test-chapter-1:p2',
}

describe('VocabPopup', () => {
  it('renders reading and first meaning from VocabEntry', () => {
    const token: Token = { s: '今日', r: 'きょう', v: 'kyou' }
    render(<VocabPopup token={token} entry={KYOU} />)
    expect(screen.getByText('きょう')).toBeInTheDocument()
    expect(screen.getByText('today')).toBeInTheDocument()
  })

  it('returns nothing when token has no v field', () => {
    const token: Token = { s: 'は' }
    const { container } = render(<VocabPopup token={token} entry={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders JLPT badge and part of speech', () => {
    const token: Token = { s: '今日', r: 'きょう', v: 'kyou' }
    render(<VocabPopup token={token} entry={KYOU} />)
    expect(screen.getByText('N5')).toBeInTheDocument()
    expect(screen.getByText('noun')).toBeInTheDocument()
  })

  it('shows the lemma in the header when token has a lemma field', () => {
    const token: Token = { s: '読みました', r: 'よみました', v: 'yomu', lemma: '読む' }
    render(<VocabPopup token={token} entry={YOMU} />)
    expect(screen.getByRole('heading')).toHaveTextContent('読む')
  })

  it('shows the surface in the header when token has no lemma', () => {
    const token: Token = { s: '今日', r: 'きょう', v: 'kyou' }
    render(<VocabPopup token={token} entry={KYOU} />)
    expect(screen.getByRole('heading')).toHaveTextContent('今日')
  })

  it('shows a Kanji tab when the lemma contains kanji', () => {
    const token: Token = { s: '今日', r: 'きょう', v: 'kyou' }
    render(<VocabPopup token={token} entry={KYOU} />)
    expect(screen.getByRole('tab', { name: /kanji/i })).toBeInTheDocument()
  })

  it('does not show tabs for a kana-only lemma', () => {
    const KANA: VocabEntry = {
      id: 'wa',
      lemma: 'は',
      reading: 'わ',
      pos: 'particle',
      jlpt: 'N5',
      meanings: ['topic marker'],
      frequency: 1,
      first_seen: '00:p1',
    }
    const token: Token = { s: 'は', v: 'wa' }
    render(<VocabPopup token={token} entry={KANA} />)
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('renders a kanji card per kanji char with onyomi/kunyomi/meanings when Kanji tab is opened', async () => {
    const user = userEvent.setup()
    const kanjiMap = new Map<string, KanjiEntry>([
      [
        '今',
        {
          kanji: '今',
          onyomi: ['コン', 'キン'],
          kunyomi: ['いま'],
          meanings: ['now'],
          jlpt: 'N5',
          stroke_count: 4,
          frequency: 49,
          example_words_in_book: [],
        },
      ],
      [
        '日',
        {
          kanji: '日',
          onyomi: ['ニチ', 'ジツ'],
          kunyomi: ['ひ', 'か'],
          meanings: ['day', 'sun'],
          jlpt: 'N5',
          stroke_count: 4,
          frequency: 1,
          example_words_in_book: [],
        },
      ],
    ])
    const token: Token = { s: '今日', r: 'きょう', v: 'kyou' }
    render(<VocabPopup token={token} entry={KYOU} kanjiMap={kanjiMap} />)
    await user.click(screen.getByRole('tab', { name: /kanji/i }))

    expect(screen.getByText('コン、キン')).toBeInTheDocument()
    expect(screen.getByText('いま')).toBeInTheDocument()
    expect(screen.getByText('ニチ、ジツ')).toBeInTheDocument()
    expect(screen.getByText('ひ、か')).toBeInTheDocument()
    expect(screen.getByText('day, sun')).toBeInTheDocument()
  })

  it('calls onOpenKanjiTab the first time the Kanji tab is selected', async () => {
    const user = userEvent.setup()
    const onOpenKanjiTab = vi.fn()
    const token: Token = { s: '今日', r: 'きょう', v: 'kyou' }
    render(
      <VocabPopup token={token} entry={KYOU} kanjiMap={null} onOpenKanjiTab={onOpenKanjiTab} />,
    )
    await user.click(screen.getByRole('tab', { name: /kanji/i }))
    await user.click(screen.getByRole('tab', { name: /meanings/i }))
    await user.click(screen.getByRole('tab', { name: /kanji/i }))
    expect(onOpenKanjiTab).toHaveBeenCalled()
  })
})
