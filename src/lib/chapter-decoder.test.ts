import { describe, expect, it } from 'vitest'
import { decodeChapter } from './chapter-decoder'

describe('decodeChapter', () => {
  it('decodes legacy chapter (no version header) into paragraphs with a single synthetic sentence each', () => {
    const text =
      '{"id":"p0","tokens":[{"s":"私","r":"わたし","v":"v0001"},{"s":"。"}]}\n' +
      '{"id":"p1","tokens":[{"s":"猫","r":"ねこ","v":"v0004"}]}\n'

    const chapter = decodeChapter(text)

    expect(chapter.format).toBe('v1')
    expect(chapter.paragraphs).toHaveLength(2)

    const [p0, p1] = chapter.paragraphs
    expect(p0.id).toBe('p0')
    expect(p0.sentences).toHaveLength(1)
    expect(p0.sentences[0].tokens).toEqual([{ s: '私', r: 'わたし', v: 'v0001' }, { s: '。' }])
    expect(p1.sentences[0].tokens).toEqual([{ s: '猫', r: 'ねこ', v: 'v0004' }])
  })

  it('decodes migrated v2 chapter with explicit format header, preserving paragraph grouping and sentence records', () => {
    const text =
      '{"format":"v2"}\n' +
      '{"id":"p0","sentences":[' +
      '{"id":"ch01-p0-s0","tokens":[{"s":"私","r":"わたし","v":"v0001"},{"s":"は"},{"s":"猫","v":"v0004"},{"s":"。"}]},' +
      '{"id":"ch01-p0-s1","tokens":[{"s":"はい","r":"はい"},{"s":"。"}]}' +
      ']}\n' +
      '{"id":"p1","sentences":[' +
      '{"id":"ch01-p1-s0","tokens":[{"s":"犬","r":"いぬ"}]}' +
      ']}\n'

    const chapter = decodeChapter(text)

    expect(chapter.format).toBe('v2')
    expect(chapter.paragraphs).toHaveLength(2)

    const [p0, p1] = chapter.paragraphs
    expect(p0.id).toBe('p0')
    expect(p0.sentences).toHaveLength(2)
    expect(p0.sentences[0].id).toBe('ch01-p0-s0')
    expect(p0.sentences[0].tokens[0]).toEqual({ s: '私', r: 'わたし', v: 'v0001' })
    expect(p0.sentences[1].id).toBe('ch01-p0-s1')
    expect(p1.sentences[0].id).toBe('ch01-p1-s0')
    expect(p1.sentences[0].tokens).toEqual([{ s: '犬', r: 'いぬ' }])
  })

  it('throws when migrated-shaped rows appear without a version header (no shape inference)', () => {
    const text = '{"id":"p0","sentences":[{"id":"ch01-p0-s0","tokens":[{"s":"私"}]}]}\n'

    expect(() => decodeChapter(text)).toThrow(/format/i)
  })

  it('throws on unsupported format version', () => {
    const text = '{"format":"v99"}\n{"id":"p0","sentences":[]}\n'

    expect(() => decodeChapter(text)).toThrow(/v99/)
  })

  it('throws on malformed migrated sentence record (missing id)', () => {
    const text = '{"format":"v2"}\n' + '{"id":"p0","sentences":[{"tokens":[{"s":"私"}]}]}\n'

    expect(() => decodeChapter(text)).toThrow(/sentence/i)
  })

  it('throws on malformed migrated paragraph (missing sentences array)', () => {
    const text = '{"format":"v2"}\n{"id":"p0","tokens":[{"s":"私"}]}\n'

    expect(() => decodeChapter(text)).toThrow(/sentences/i)
  })

  it('produces unique sentence IDs within a migrated chapter and is stable across repeated decodes', () => {
    const text =
      '{"format":"v2"}\n' +
      '{"id":"p0","sentences":[' +
      '{"id":"ch01-p0-s0","tokens":[{"s":"a"}]},' +
      '{"id":"ch01-p0-s1","tokens":[{"s":"b"}]}' +
      ']}\n' +
      '{"id":"p1","sentences":[{"id":"ch01-p1-s0","tokens":[{"s":"c"}]}]}\n'

    const a = decodeChapter(text)
    const b = decodeChapter(text)

    const idsA = a.paragraphs.flatMap((p) => p.sentences.map((s) => s.id))
    const idsB = b.paragraphs.flatMap((p) => p.sentences.map((s) => s.id))

    expect(idsA).toEqual(idsB)
    expect(new Set(idsA).size).toBe(idsA.length)
  })

  it('reports the row index when a JSONL row fails to parse', () => {
    const text =
      '{"format":"v2"}\n' +
      '{"id":"p0","sentences":[{"id":"ch01-p0-s0","tokens":[{"s":"a"}]}]}\n' +
      '{not json}\n'

    expect(() => decodeChapter(text)).toThrow(/row 2/)
  })

  it('throws on duplicate sentence IDs within a migrated chapter', () => {
    const text =
      '{"format":"v2"}\n' +
      '{"id":"p0","sentences":[' +
      '{"id":"dup","tokens":[{"s":"a"}]},' +
      '{"id":"dup","tokens":[{"s":"b"}]}' +
      ']}\n'

    expect(() => decodeChapter(text)).toThrow(/duplicate/i)
  })

  it('exposes sentence help.translation when the migrated sentence carries help', () => {
    const text =
      '{"format":"v2"}\n' +
      '{"id":"p0","sentences":[' +
      '{"id":"ch01-p0-s0","tokens":[{"s":"私"}],"help":{"translation":"  I am.  "}}' +
      ']}\n'

    const chapter = decodeChapter(text)

    expect(chapter.paragraphs[0].sentences[0].help).toEqual({ translation: 'I am.' })
  })

  it('leaves help undefined on migrated sentences without authored help', () => {
    const text =
      '{"format":"v2"}\n' + '{"id":"p0","sentences":[{"id":"ch01-p0-s0","tokens":[{"s":"私"}]}]}\n'

    const chapter = decodeChapter(text)

    expect(chapter.paragraphs[0].sentences[0].help).toBeUndefined()
  })

  it('throws when migrated sentence help is present but translation is missing or empty', () => {
    const missing =
      '{"format":"v2"}\n' +
      '{"id":"p0","sentences":[' +
      '{"id":"ch01-p0-s0","tokens":[{"s":"私"}],"help":{}}' +
      ']}\n'
    expect(() => decodeChapter(missing)).toThrow(/translation/i)

    const empty =
      '{"format":"v2"}\n' +
      '{"id":"p0","sentences":[' +
      '{"id":"ch01-p0-s0","tokens":[{"s":"私"}],"help":{"translation":"  "}}' +
      ']}\n'
    expect(() => decodeChapter(empty)).toThrow(/translation/i)
  })

  it('does not surface sentence help on legacy (v1) chapters', () => {
    const text = '{"id":"p0","tokens":[{"s":"私"}]}\n'
    const chapter = decodeChapter(text)
    expect(chapter.paragraphs[0].sentences[0].help).toBeUndefined()
  })

  it('throws on duplicate paragraph IDs within a migrated chapter', () => {
    const text =
      '{"format":"v2"}\n' +
      '{"id":"p0","sentences":[{"id":"ch01-p0-s0","tokens":[{"s":"a"}]}]}\n' +
      '{"id":"p0","sentences":[{"id":"ch01-p0-s1","tokens":[{"s":"b"}]}]}\n'

    expect(() => decodeChapter(text)).toThrow(/duplicate paragraph/i)
  })
})
