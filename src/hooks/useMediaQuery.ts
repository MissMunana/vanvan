import { useState, useEffect } from 'react'

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const BREAKPOINTS = {
  tablet: '(min-width: 768px)',
  desktop: '(min-width: 1024px)',
} as const

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    setMatches(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

export function useBreakpoint(): Breakpoint {
  const isTablet = useMediaQuery(BREAKPOINTS.tablet)
  const isDesktop = useMediaQuery(BREAKPOINTS.desktop)
  if (isDesktop) return 'desktop'
  if (isTablet) return 'tablet'
  return 'mobile'
}

export function useIsDesktop(): boolean {
  return useMediaQuery(BREAKPOINTS.desktop)
}

export function useIsTablet(): boolean {
  return useMediaQuery(BREAKPOINTS.tablet)
}
