import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDb } from '@/lib/db'
import { empresaConfig } from '@/lib/feira.config'

interface Evento {
  id: number
  slug: string
  nome: string
  nome_evento: string | null
  data_evento: string | null
  local_evento: string | null
  cargo_padrao: string | null
}

async function getEvento(slug: string): Promise<Evento | null> {
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT id, slug, nome, nome_evento, data_evento, local_evento, cargo_padrao
      FROM eventos WHERE slug = ${slug} AND ativo = TRUE
    `
    return rows.length ? rows[0] as Evento : null
  } catch {
    return null
  }
}

export default async function EventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const evento = await getEvento(slug)

  if (!evento) notFound()

  const nomeEvento = evento.nome_evento || evento.nome
  const infoEvento = [evento.data_evento, evento.local_evento].filter(Boolean).join('  ·  ')

  return (
    <div className="min-h-screen flex flex-col bg-mega-bg">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-mega-teal">{empresaConfig.nomeDisplay.split(' ')[0]}</span>{' '}
              <span className="text-mega-navy">{empresaConfig.nomeDisplay.split(' ').slice(1).join(' ')}</span>
            </span>
            <span className="text-xs text-mega-text-secondary font-medium">{empresaConfig.tagline}</span>
          </div>
          <Link
            href={`/${slug}/admin`}
            className="text-xs text-mega-text-muted hover:text-mega-navy transition-colors"
          >
            Acesso Cliente
          </Link>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-mega-teal to-mega-teal" />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          <p className="text-mega-teal font-semibold text-sm uppercase tracking-widest mb-2">
            {nomeEvento}
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-mega-navy leading-tight">
            Faça Parte da Nossa Equipe
          </h1>
          {infoEvento && (
            <p className="text-mega-text-secondary text-base mb-4">{infoEvento}</p>
          )}
          <p className="text-mega-text-secondary text-lg mb-10 leading-relaxed">
            Estamos em busca de profissionais dedicados para este evento.
            Preencha seu cadastro e venha trabalhar conosco!
          </p>
          <LGPDButton slug={slug} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-mega-border py-4 text-center text-sm text-mega-text-muted">
        © {new Date().getFullYear()} {empresaConfig.razaoSocial}
      </footer>
    </div>
  )
}

// Componente inline do botão LGPD (server component com navegação via Link)
function LGPDButton({ slug }: { slug: string }) {
  return (
    <Link
      href={`/${slug}/cadastro`}
      className="inline-block bg-mega-teal hover:bg-mega-teal-hover text-white font-semibold px-10 py-4 rounded-full text-lg transition-colors shadow-md hover:shadow-lg"
    >
      Cadastre-se Agora
    </Link>
  )
}
