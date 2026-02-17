'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  required?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-mega-text">
          {label}
          {required && <span className="text-mega-teal ml-1">*</span>}
        </label>
        <input
          ref={ref}
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

Input.displayName = 'Input'
export default Input
