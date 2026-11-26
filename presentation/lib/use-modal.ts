'use client'

import { useEffect, useRef } from 'react'

// Behavior shared by modal dialogs: focuses the given element, closes on Escape and locks the page scroll while open.
export function useModal<T extends HTMLElement>(onClose: () => void) {
  const initialFocus = useRef<T>(null)

  useEffect(() => {
    initialFocus.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  return initialFocus
}
