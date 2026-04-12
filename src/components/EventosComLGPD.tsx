'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LGPDModal from './LGPDModal'

interface Evento {
  slug: string
  nome: string
  cidade?: string | null
  local_evento?: string | null
  descricao?: string | null
}

interface EventosComLGPDProps {
  eventos: Evento[]
  /** Estilo dos cards: 'completo' (página /trabalhe-conosco) | 'simples' (home) */
  variante?: 'completo' | 'simples'
}

export default function EventosComLGPD({ eventos, variante = 'completo' }: EventosComLGPDProps) {
  const [slugSelecionado, setSlugSelecionado] = useState<string | null>(null)
  const router = useRouter()

  const handleAccept = () => {
    if (!slugSelecionado) return
    setSlugSelecionado(null)
    router.push(`/trabalhe-conosco/${slugSelecionado}`)
  }

  if (variante === 'simples') {
    return (
      <>
        <div className="grid gap-3 sm:grid-cols-2 mb-6">
          {eventos.map((evento) => {
            const localizacao = evento.local_evento || evento.cidade
            return (
              <button
                key={evento.slug}
                onClick={() => setSlugSelecionado(evento.slug)}
                className="bg-white border border-mega-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-mega-teal transition-all group text-left w-full"
              >
                <p className="font-bold text-mega-navy group-hover:text-mega-teal transition-colors">
                  {evento.nome}
                </p>
                {localizacao && (
                  <p className="text-sm text-mega-text-muted mt-0.5">{localizacao}</p>
                )}
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-mega-teal mt-3 group-hover:gap-2 transition-all">
                  Inscrever-se
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            )
          })}
        </div>

        <LGPDModal
          open={!!slugSelecionado}
          onClose={() => setSlugSelecionado(null)}
          onAccept={handleAccept}
        />
      </>
    )
  }

  // variante === 'completo'
  return (
    <>
      <div className="max-w-3xl mx-auto grid gap-4 sm:grid-cols-2">
        {eventos.map((evento) => (
          <button
            key={evento.slug}
            onClick={() => setSlugSelecionado(evento.slug)}
            className="bg-white border border-mega-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-mega-teal transition-all group text-left w-full"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-mega-navy group-hover:text-mega-teal transition-colors">
                  {evento.nome}
                </h2>
                {(evento.local_evento || evento.cidade) && (
                  <p className="text-sm text-mega-text-muted mt-0.5">{evento.local_evento || evento.cidade}</p>
                )}
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 shrink-0 ml-2">
                Aberto
              </span>
            </div>
            {evento.descricao && (
              <p className="text-sm text-mega-text-secondary line-clamp-2 mb-4">{evento.descricao}</p>
            )}
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-mega-teal group-hover:gap-2 transition-all">
              Inscrever-se
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        ))}
      </div>

      <LGPDModal
        open={!!slugSelecionado}
        onClose={() => setSlugSelecionado(null)}
        onAccept={handleAccept}
      />
    </>
  )
}
