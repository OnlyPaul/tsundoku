import { describe, expect, it } from 'vitest'
import { type BookFixture, validateBooks } from './validate-books'

const cleanV2Book = (): BookFixture => ({
  bookId: 'demo',
  vocabulary: new Map(),
  grammar: new Map(),
  chapters: [
    {
      chapterId: 'ch00',
      text:
        '{"format":"v2"}\n' +
        '{"id":"p001","sentences":[' +
        '{"id":"ch00-p001-s01","tokens":[{"s":"私"}],"help":{"translation":"I."}}' +
        ']}\n',
    },
  ],
})

describe('validateBooks', () => {
  it('passes a clean v2 corpus with no failures or warnings', () => {
    const result = validateBooks([cleanV2Book()])
    expect(result.failures).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('fails when a v2 sentence has no help, naming book/chapter/sentence', () => {
    const book: BookFixture = {
      bookId: 'demo',
      vocabulary: new Map(),
      grammar: new Map(),
      chapters: [
        {
          chapterId: 'ch00',
          text:
            '{"format":"v2"}\n' +
            '{"id":"p001","sentences":[' +
            '{"id":"ch00-p001-s01","tokens":[{"s":"私"}],"help":{"translation":"I."}},' +
            '{"id":"ch00-p001-s02","tokens":[{"s":"。"}]}' +
            ']}\n',
        },
      ],
    }

    const result = validateBooks([book])

    expect(result.failures).toHaveLength(1)
    expect(result.failures[0]).toMatch(/demo\/ch00\/ch00-p001-s02/)
    expect(result.failures[0]).toMatch(/translation/i)
  })

  it('fails when a token v id does not resolve to the book vocabulary', () => {
    const book: BookFixture = {
      bookId: 'demo',
      vocabulary: new Map([['v0001', { id: 'v0001' }]]),
      grammar: new Map(),
      chapters: [
        {
          chapterId: 'ch00',
          text:
            '{"format":"v2"}\n' +
            '{"id":"p001","sentences":[' +
            '{"id":"ch00-p001-s01","tokens":[{"s":"私","v":"v0001"},{"s":"猫","v":"v9999"}],' +
            '"help":{"translation":"I."}}' +
            ']}\n',
        },
      ],
    }

    const result = validateBooks([book])

    expect(result.failures).toHaveLength(1)
    expect(result.failures[0]).toMatch(/demo\/ch00\/ch00-p001-s01/)
    expect(result.failures[0]).toMatch(/v9999/)
  })

  it('fails when a sentence-help grammar ref does not resolve to the book grammar', () => {
    const book: BookFixture = {
      bookId: 'demo',
      vocabulary: new Map(),
      grammar: new Map([['g-known', { id: 'g-known' }]]),
      chapters: [
        {
          chapterId: 'ch00',
          text:
            '{"format":"v2"}\n' +
            '{"id":"p001","sentences":[' +
            '{"id":"ch00-p001-s01","tokens":[{"s":"私"}],' +
            '"help":{"translation":"I.","grammar":["g-known","g-missing"]}}' +
            ']}\n',
        },
      ],
    }

    const result = validateBooks([book])

    expect(result.failures).toHaveLength(1)
    expect(result.failures[0]).toMatch(/demo\/ch00\/ch00-p001-s01/)
    expect(result.failures[0]).toMatch(/g-missing/)
  })

  it('warns (does not fail) on legacy v1 chapters', () => {
    const book: BookFixture = {
      bookId: 'demo',
      vocabulary: new Map(),
      grammar: new Map(),
      chapters: [
        {
          chapterId: 'ch00',
          text: '{"id":"p001","tokens":[{"s":"私"}]}\n',
        },
      ],
    }

    const result = validateBooks([book])

    expect(result.failures).toEqual([])
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toMatch(/demo\/ch00/)
    expect(result.warnings[0]).toMatch(/v1/)
    expect(result.warnings[0]).toMatch(/deprecated/i)
  })
})
