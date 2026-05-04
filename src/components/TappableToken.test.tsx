import type { Token, VocabEntry } from '@/lib/types'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TappableToken } from './TappableToken'

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
  meanings: ['to read'],
  frequency: 1,
  first_seen: '00-test-chapter-1:p2',
}

const vocab = new Map<string, VocabEntry>([
  ['kyou', KYOU],
  ['yomu', YOMU],
])

describe('TappableToken', () => {
  it('renders surface text', () => {
    const t: Token = { s: '今日', v: 'kyou' }
    render(<TappableToken token={t} vocab={vocab} />)
    expect(screen.getByText('今日')).toBeInTheDocument()
  })

  it('opens popover with reading and meaning when a vocab token is tapped', async () => {
    const user = userEvent.setup()
    const t: Token = { s: '今日', v: 'kyou' }
    render(<TappableToken token={t} vocab={vocab} />)
    await user.click(screen.getByRole('button', { name: '今日' }))
    expect(await screen.findByText('きょう')).toBeInTheDocument()
    expect(screen.getByText('today')).toBeInTheDocument()
    expect(screen.getByText('N5')).toBeInTheDocument()
    expect(screen.getByText('noun')).toBeInTheDocument()
  })

  it('shows the lemma in the header for a conjugated token', async () => {
    const user = userEvent.setup()
    const t: Token = { s: '読みました', v: 'yomu', lemma: '読む' }
    render(<TappableToken token={t} vocab={vocab} />)
    await user.click(screen.getByRole('button', { name: '読みました' }))
    const heading = await screen.findByRole('heading')
    expect(heading).toHaveTextContent('読む')
  })

  it('does not render a button when token has no v field', () => {
    const t: Token = { s: 'は' }
    render(<TappableToken token={t} vocab={vocab} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('は')).toBeInTheDocument()
  })

  it('closes the popover when Escape is pressed', async () => {
    const user = userEvent.setup()
    const t: Token = { s: '今日', v: 'kyou' }
    render(<TappableToken token={t} vocab={vocab} />)
    await user.click(screen.getByRole('button', { name: '今日' }))
    expect(await screen.findByText('today')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByText('today')).not.toBeInTheDocument()
  })
})
