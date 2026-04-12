'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { empresaConfig } from '@/lib/feira.config'

export default function ClientLogin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/eventos/${slug}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push(`/${slug}/admin`)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Senha incorreta')
      }
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mega-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold">
            <span className="text-mega-teal">{empresaConfig.nomeDisplay.split(' ')[0]}</span>{' '}
            <span className="text-mega-navy">{empresaConfig.nomeDisplay.split(' ').slice(1).join(' ')}</span>
          </span>
          <p className="text-mega-text-muted text-sm mt-1">Acesso do Cliente — {slug.toUpperCase()}</p>
        </div>

        <div className="bg-white border border-mega-border rounded-2xl shadow-sm p-8">
          <h1 className="text-xl font-bold text-mega-navy mb-6">Entrar</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-mega-text mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Senha do cliente"
                required
                className="w-full border border-mega-border rounded-lg px-4 py-2.5 text-mega-text
                           focus:outline-none focus:ring-2 focus:ring-mega-teal/30"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mega-teal hover:bg-mega-teal-hover text-white font-semibold py-2.5 rounded-lg
                         transition-colors disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
