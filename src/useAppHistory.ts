import { useLayoutEffect, useRef } from 'react'

// Only an opaque position goes into browser history. Screen state and drafts
// stay in memory and are discarded on reload or sign-out.
export function useAppHistory<T>(state: T, route: string, restore: (state: T) => void, canLeave: () => boolean, enabled: boolean) {
  const history = useRef<{ token: string; index: number; entries: { state: T; route: string; scroll: number; focus: Element | null }[] } | null>(null)
  const handlers = useRef({ restore, canLeave })
  const restoring = useRef(false)
  const skipping = useRef(false)
  const approved = useRef(false)

  useLayoutEffect(() => {
    handlers.current = { restore, canLeave }
    if (!enabled) { history.current = null; return }
    if (!history.current) {
      const token = crypto.randomUUID()
      history.current = { token, index: 0, entries: [{ state, route, scroll: window.scrollY, focus: document.activeElement }] }
      window.history.replaceState({ trenio: token, index: 0 }, '')
    } else {
      const current = history.current
      if (!restoring.current && current.entries[current.index].route !== route) {
        current.index++
        current.entries.splice(current.index)
        current.entries.push({ state, route, scroll: 0, focus: null })
        window.history.pushState({ trenio: current.token, index: current.index }, '')
      } else {
        current.entries[current.index].state = state
        current.entries[current.index].route = route
      }
      restoring.current = false
    }
  })

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    const pop = (event: PopStateEvent) => {
      const current = history.current
      if (skipping.current) { skipping.current = false; return }
      if (!current || event.state?.trenio !== current.token) return
      const index = event.state.index as number
      const entry = current.entries[index]
      if (!entry || index === current.index) return
      if (!approved.current && !handlers.current.canLeave()) {
        skipping.current = true
        window.history.go(current.index - index)
        return
      }
      const targetScroll = entry.scroll
      const targetFocus = entry.focus
      const restoreFocus = !approved.current
      approved.current = false
      current.index = index
      restoring.current = true
      handlers.current.restore(entry.state)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (restoreFocus && targetFocus instanceof HTMLElement && targetFocus.isConnected) targetFocus.focus({ preventScroll: true })
        window.scrollTo({ top: targetScroll, behavior: 'instant' })
      }))
    }
    // Capture before React replaces a long list; after commit the browser may
    // already have clamped scrollY to the height of the shorter destination.
    const remember = () => {
      const current = history.current
      if (!current) return
      current.entries[current.index].scroll = window.scrollY
      current.entries[current.index].focus = document.activeElement
    }
    window.addEventListener('scroll', remember, { passive: true })
    document.addEventListener('click', remember, true)
    document.addEventListener('keydown', remember, true)
    window.addEventListener('popstate', pop)
    return () => {
      window.removeEventListener('popstate', pop)
      window.removeEventListener('scroll', remember)
      document.removeEventListener('click', remember, true)
      document.removeEventListener('keydown', remember, true)
      window.history.scrollRestoration = previousScrollRestoration
    }
  }, [])

  return (alreadyApproved = false) => {
    if (!history.current || history.current.index === 0) return
    approved.current = alreadyApproved
    window.history.back()
  }
}
