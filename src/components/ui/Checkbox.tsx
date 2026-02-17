'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            className={`w-5 h-5 rounded border-mega-border bg-white text-mega-teal focus:ring-mega-teal/30 focus:ring-2 cursor-pointer ${className}`}
            {...props}
          />
          <span className="text-sm text-mega-text">{label}</span>
        </label>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
export default Checkbox
