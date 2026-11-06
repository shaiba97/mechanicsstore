import * as React from "react"

const MOBILE_BREAKPOINT = 768

const mediaQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

const mql = typeof window === "undefined" ? undefined : window.matchMedia(mediaQuery)

function subscribe(callback: () => void) {
  mql?.addEventListener("change", callback)
  return () => mql?.removeEventListener("change", callback)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => mql?.matches ?? false,
    () => false,
  )
}
