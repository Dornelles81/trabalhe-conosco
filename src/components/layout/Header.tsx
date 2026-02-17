'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex flex-col">
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-mega-teal">MEGA</span>{' '}
            <span className="text-mega-navy">FEIRA</span>
          </span>
          <span className="text-xs text-mega-text-secondary font-medium">
            acessando conexões
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/trabalhe-conosco"
            className="text-sm text-mega-text-secondary hover:text-mega-navy transition-colors font-medium"
          >
            Trabalhe Conosco
          </Link>
        </nav>
      </div>
      <div className="h-0.5 bg-gradient-to-r from-mega-teal to-mega-teal"></div>
    </header>
  )
}
