import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMediaQuery } from './use-media-query'

interface MQL {
  matches: boolean
  media: string
  onchange: ((e: MediaQueryListEvent) => void) | null
  addEventListener: (type: 'change', listener: (e: MediaQueryListEvent) => void) => void
  removeEventListener: (type: 'change', listener: (e: MediaQueryListEvent) => void) => void
  addListener: (listener: (e: MediaQueryListEvent) => void) => void
  removeListener: (listener: (e: MediaQueryListEvent) => void) => void
  dispatchEvent: (e: Event) => boolean
}

function makeMatchMedia(initial: boolean) {
  const lists: MQL[] = []
  const fn = (query: string): MQL => {
    let listeners: Array<(e: MediaQueryListEvent) => void> = []
    const list: MQL = {
      matches: initial,
      media: query,
      onchange: null,
      addEventListener: (_t, l) => {
        listeners.push(l)
      },
      removeEventListener: (_t, l) => {
        listeners = listeners.filter((x) => x !== l)
      },
      addListener: (l) => {
        listeners.push(l)
      },
      removeListener: (l) => {
        listeners = listeners.filter((x) => x !== l)
      },
      dispatchEvent: () => true,
    }
    ;(list as unknown as { _emit: (matches: boolean) => void })._emit = (matches: boolean) => {
      list.matches = matches
      const event = { matches, media: query } as MediaQueryListEvent
      for (const l of listeners) l(event)
    }
    ;(list as unknown as { _listenerCount: () => number })._listenerCount = () => listeners.length
    lists.push(list)
    return list
  }
  return { fn, lists }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useMediaQuery', () => {
  it('returns the initial match value from matchMedia', () => {
    const { fn } = makeMatchMedia(true)
    vi.stubGlobal('matchMedia', fn)
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(true)
  })

  it('returns false when matchMedia reports no match', () => {
    const { fn } = makeMatchMedia(false)
    vi.stubGlobal('matchMedia', fn)
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)
  })

  it('updates when the media query change event fires', () => {
    const { fn, lists } = makeMatchMedia(false)
    vi.stubGlobal('matchMedia', fn)
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)
    act(() => {
      const live = lists[lists.length - 1] as unknown as { _emit: (m: boolean) => void }
      live._emit(true)
    })
    expect(result.current).toBe(true)
  })

  it('removes its listener on unmount', () => {
    const { fn, lists } = makeMatchMedia(true)
    vi.stubGlobal('matchMedia', fn)
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    const live = lists[lists.length - 1] as unknown as { _listenerCount: () => number }
    expect(live._listenerCount()).toBe(1)
    unmount()
    expect(live._listenerCount()).toBe(0)
  })
})
