import Link from 'next/link'
import { getDb } from '@/lib/db'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import LGPDConsentButton from '@/components/LGPDConsentButton'

export const dynamic = 'force-dynamic'

interface Evento {
  slug: string
  nome: string
  cidade: string | null
  local_evento: string | null
}

export default async function Home() {
  const sql = getDb()
  let eventos: Evento[] = []

  try {
    const rows = await sql`
      SELECT slug, nome, cidade, local_evento FROM eventos WHERE ativo = TRUE ORDER BY created_at ASC
    `
    eventos = rows as Evento[]
  } catch {
    // banco não configurado ainda
  }

  return (
    <div className="min-h-screen flex flex-col bg-mega-bg">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl w-full">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-mega-navy leading-tight">
            Faça Parte da Nossa Equipe
          </h1>
          <p className="text-mega-text-secondary text-lg mb-10 leading-relaxed">
            Estamos sempre em busca de profissionais dedicados para fazer parte dos nossos eventos.
            Preencha seu cadastro e venha trabalhar conosco!
          </p>

          {eventos.length === 1 ? (
            <LGPDConsentButton eventoSlug={eventos[0].slug} />
          ) : eventos.length > 1 ? (
            <div className="grid gap-3 sm:grid-cols-2 mb-6">
              {eventos.map((evento) => {
                const localizacao = evento.local_evento || evento.cidade
                return (
                  <Link
                    key={evento.slug}
                    href={`/trabalhe-conosco/${evento.slug}`}
                    className="bg-white border border-mega-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-mega-teal transition-all group text-left"
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
                  </Link>
                )
              })}
            </div>
          ) : (
            <LGPDConsentButton />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
