'use client'

import { centsFromText, formatCents, MAX_MONEY_DIGITS } from '@/presentation/lib/money-entry'

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'inputMode'> {
  cents: number
  onCentsChange: (cents: number) => void
}

// Keeps the caret after the last digit, where the next digit enters.
const moveCaretToEnd = (input: HTMLInputElement) => {
  requestAnimationFrame(() => {
    const end = input.value.length
    input.setSelectionRange(end, end)
  })
}

// Money field that fills from the right with two fixed decimals, like banking apps: digits never need to be erased to
// fix the decimal part, and backspace removes the last digit typed. Keys are handled wherever the caret is; pasted text
// and virtual keyboards that do not report keys go through the change event.
export function MoneyInput({ cents, onCentsChange, onFocus, onClick, onKeyDown, ...props }: MoneyInputProps) {
  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={formatCents(cents)}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.metaKey || event.ctrlKey || event.altKey) return
        const input = event.currentTarget
        const allSelected = input.selectionStart === 0 && input.selectionEnd === input.value.length && input.value.length > 0
        if (/^\d$/.test(event.key)) {
          event.preventDefault()
          const base = allSelected ? 0 : cents
          if (String(base).length < MAX_MONEY_DIGITS) onCentsChange(base * 10 + Number(event.key))
          moveCaretToEnd(input)
        } else if (event.key === 'Backspace' || event.key === 'Delete') {
          event.preventDefault()
          onCentsChange(allSelected ? 0 : Math.floor(cents / 10))
          moveCaretToEnd(input)
        }
      }}
      onChange={(event) => {
        onCentsChange(centsFromText(event.target.value))
        moveCaretToEnd(event.target)
      }}
      onFocus={(event) => {
        moveCaretToEnd(event.currentTarget)
        onFocus?.(event)
      }}
      onClick={(event) => {
        moveCaretToEnd(event.currentTarget)
        onClick?.(event)
      }}
    />
  )
}
