import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import FormWizard from '@/components/form/FormWizard'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function TrabalheConoscoEvento({ params }: Props) {
  const { slug } = await params

  // Busca o evento diretamente no banco (Server Component)
  const sql = getDb()
  const rows = await sql`
    SELECT id, slug, nome, cidade, local_evento, descricao, ativo
    FROM eventos WHERE slug = ${slug}
  `

  if (!rows.length || !rows[0].ativo) {
    notFound()
  }

  const evento = rows[0]

  return (
    <div className="min-h-screen flex flex-col bg-mega-bg">
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-mega-navy">
            Cadastro de <span className="text-mega-teal">Candidato</span>
          </h1>
          <p className="text-mega-text-secondary mt-2 font-medium">
            {evento.nome}{(evento.local_evento || evento.cidade) ? ` — ${evento.local_evento || evento.cidade}` : ''}
          </p>
          {evento.descricao && (
            <p className="text-mega-text-secondary mt-1 text-sm max-w-xl mx-auto">
              {evento.descricao}
            </p>
          )}
          <p className="text-mega-text-muted text-sm mt-2">
            Preencha todas as etapas para completar seu cadastro
          </p>
        </div>
        <FormWizard eventoSlug={slug} />
      </main>
      <Footer />
    </div>
  )
}
