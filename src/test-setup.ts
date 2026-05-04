import '@testing-library/jest-dom'

// Node 25 ships a built-in `localStorage` global that requires
// `--localstorage-file=<path>` to function; without it, methods throw
// "is not a function". Replace with an in-memory shim for tests.
{
  const store = new Map<string, string>()
  const shim: Storage = {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key) {
      return store.has(key) ? (store.get(key) as string) : null
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key) {
      store.delete(key)
    },
    setItem(key, value) {
      store.set(String(key), String(value))
    },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: shim,
  })
}
