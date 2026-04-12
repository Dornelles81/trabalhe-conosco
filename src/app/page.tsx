import { getDb } from '@/lib/db'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import LGPDConsentButton from '@/components/LGPDConsentButton'
import EventosComLGPD from '@/components/EventosComLGPD'

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
            <EventosComLGPD eventos={eventos} variante="simples" />
          ) : (
            <LGPDConsentButton />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
