import { getDb } from '@/lib/db'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import EventosComLGPD from '@/components/EventosComLGPD'

export const dynamic = 'force-dynamic'

interface Evento {
  slug: string
  nome: string
  cidade: string | null
  local_evento: string | null
  descricao: string | null
}

export default async function TrabalheConosco() {
  const sql = getDb()
  let eventos: Evento[] = []

  try {
    const rows = await sql`
      SELECT slug, nome, cidade, local_evento, descricao
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
          <EventosComLGPD eventos={eventos} variante="completo" />
        )}
      </main>
      <Footer />
    </div>
  )
}
