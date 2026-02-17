'use client'

import { forwardRef, SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  required?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, required, options, placeholder = 'Selecione...', className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-mega-text">
          {label}
          {required && <span className="text-mega-teal ml-1">*</span>}
        </label>
        <select
          ref={ref}
          className={`w-full bg-white border ${
            error ? 'border-red-400' : 'border-mega-border'
          } rounded-lg px-4 py-2.5 text-mega-text focus:outline-none focus:ring-2 focus:ring-mega-teal/30 focus:border-mega-teal transition-colors ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
