import type { Token, VocabEntry } from '@/lib/types'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
})
