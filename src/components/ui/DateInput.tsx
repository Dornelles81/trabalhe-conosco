'use client'

import { useRef, useState, useEffect, ChangeEvent } from 'react'
import { maskDate } from '@/lib/masks'

interface DateInputProps {
  label: string
  error?: string
  required?: boolean
  value?: string        // ISO format: YYYY-MM-DD
  onChange?: (iso: string) => void
  onBlur?: () => void
  className?: string
}

function isoToDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function displayToIso(display: string): string {
  const digits = display.replace(/\D/g, '')
  if (digits.length !== 8) return ''
  const d = digits.slice(0, 2)
  const m = digits.slice(2, 4)
  const y = digits.slice(4, 8)
  return `${y}-${m}-${d}`
}

export default function DateInput({ label, error, required, value = '', onChange, onBlur, className = '' }: DateInputProps) {
  const [display, setDisplay] = useState(() => isoToDisplay(value))
  const calendarRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDisplay(isoToDisplay(value))
  }, [value])

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const masked = maskDate(e.target.value)
    setDisplay(masked)
    const iso = displayToIso(masked)
    if (iso) {
      onChange?.(iso)
    } else if (masked === '') {
      onChange?.('')
    }
  }

  const handleCalendarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value
    setDisplay(isoToDisplay(iso))
    onChange?.(iso)
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-mega-text">
        {label}
        {required && <span className="text-mega-teal ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleTextChange}
          onBlur={onBlur}
          placeholder="DD/MM/AAAA"
          className={`w-full bg-white border ${
            error ? 'border-red-400' : 'border-mega-border'
          } rounded-lg px-4 py-2.5 pr-10 text-mega-text placeholder-mega-text-muted focus:outline-none focus:ring-2 focus:ring-mega-teal/30 focus:border-mega-teal transition-colors ${className}`}
        />
        <button
          type="button"
          onClick={() => calendarRef.current?.showPicker()}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-mega-text-muted hover:text-mega-teal transition-colors p-1"
          aria-label="Abrir calendário"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
        <input
          ref={calendarRef}
          type="date"
          value={displayToIso(display) || ''}
          onChange={handleCalendarChange}
          className="absolute inset-0 opacity-0 pointer-events-none"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
