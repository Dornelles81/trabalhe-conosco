import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mega: {
          // Fundos
          bg: '#F8FAFC',
          'bg-mid': '#E2E8F0',
          card: '#ffffff',
          border: '#E2E8F0',
          // Primárias
          navy: '#1E3A5F',
          teal: '#2DD4BF',
          'teal-hover': '#22b8a5',
          // Secundárias
          blue: '#2563EB',
          'blue-hover': '#1d4ed8',
          green: '#10B981',
          gray: '#64748B',
          // Texto
          text: '#1E3A5F',
          'text-secondary': '#64748B',
          'text-muted': '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
