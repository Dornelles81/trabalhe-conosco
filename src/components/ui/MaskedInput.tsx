'use client'

import { forwardRef, InputHTMLAttributes, ChangeEvent } from 'react'

interface MaskedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  required?: boolean
  maskFn: (value: string) => string
  onValueChange?: (value: string) => void
}

const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ label, error, required, maskFn, onValueChange, onChange, className = '', ...props }, ref) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const masked = maskFn(e.target.value)
      e.target.value = masked
      onValueChange?.(masked)
      onChange?.(e)
    }

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-mega-text">
          {label}
          {required && <span className="text-mega-teal ml-1">*</span>}
        </label>
        <input
          ref={ref}
          onChange={handleChange}
          className={`w-full bg-white border ${
            error ? 'border-red-400' : 'border-mega-border'
          } rounded-lg px-4 py-2.5 text-mega-text placeholder-mega-text-muted focus:outline-none focus:ring-2 focus:ring-mega-teal/30 focus:border-mega-teal transition-colors ${className}`}
          {...props}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    )
  }
)

MaskedInput.displayName = 'MaskedInput'
export default MaskedInput
