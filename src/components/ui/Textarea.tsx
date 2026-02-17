'use client'

import { forwardRef, TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  required?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, required, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-mega-text">
          {label}
          {required && <span className="text-mega-teal ml-1">*</span>}
        </label>
        <textarea
          ref={ref}
          className={`w-full bg-white border ${
            error ? 'border-red-400' : 'border-mega-border'
          } rounded-lg px-4 py-2.5 text-mega-text placeholder-mega-text-muted focus:outline-none focus:ring-2 focus:ring-mega-teal/30 focus:border-mega-teal transition-colors resize-y min-h-[80px] ${className}`}
          {...props}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
export default Textarea
