import Link from 'next/link'
import { getDb } from '@/lib/db'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface Evento {
  slug: string
  nome: string
  cidade: string | null
  descricao: string | null
}

export default async function TrabalheConosco() {
  const sql = getDb()
  let eventos: Evento[] = []

  try {
    const rows = await sql`
      SELECT slug, nome, cidade, descricao
      FROM eventos
      WHERE ativo = TRUE
      ORDER BY created_at ASC
    `
    eventos = rows as Evento[]
  } catch {
    // Se banco não estiver configurado, mostra lista vazia
  }

  return (
    <div className="min-h-screen flex flex-col bg-mega-bg">
      <Header />
      <main className="flex-1 py-12 px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-mega-navy mb-3">
            Trabalhe <span className="text-mega-teal">Conosco</span>
          </h1>
          <p className="text-mega-text-secondary text-lg max-w-xl mx-auto">
            Selecione o evento para o qual deseja se candidatar e preencha seu cadastro.
          </p>
        </div>

        {eventos.length === 0 ? (
          <div className="text-center text-mega-text-muted py-16">
            <p className="text-lg">Nenhum evento com inscrições abertas no momento.</p>
            <p className="text-sm mt-2">Volte em breve!</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto grid gap-4 sm:grid-cols-2">
            {eventos.map((evento) => (
              <Link
                key={evento.slug}
                href={`/trabalhe-conosco/${evento.slug}`}
                className="bg-white border border-mega-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-mega-teal transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-mega-navy group-hover:text-mega-teal transition-colors">
                      {evento.nome}
                    </h2>
                    {evento.cidade && (
                      <p className="text-sm text-mega-text-muted mt-0.5">{evento.cidade}</p>
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
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
