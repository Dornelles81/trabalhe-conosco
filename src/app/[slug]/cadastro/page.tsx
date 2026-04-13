import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import FormWizard from '@/components/form/FormWizard'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const dynamic = 'force-dynamic'

async function getEvento(slug: string) {
  try {
    const sql = getDb()
    const rows = await sql`SELECT id, slug, nome, nome_evento FROM eventos WHERE slug = ${slug} AND ativo = TRUE`
    return rows.length ? rows[0] : null
  } catch {
    return null
  }
}

export default async function CadastroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const evento = await getEvento(slug)
  if (!evento) notFound()

  const nomeEvento = evento.nome_evento || evento.nome

  return (
    <div className="min-h-screen flex flex-col bg-mega-bg">
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="text-center mb-8">
          <p className="text-mega-teal text-sm font-semibold uppercase tracking-widest mb-1">
            {nomeEvento}
          </p>
          <h1 className="text-3xl font-bold text-mega-navy">
            Cadastro de <span className="text-mega-teal">Candidato</span>
          </h1>
          <p className="text-mega-text-secondary mt-2">
            Preencha todas as etapas para completar seu cadastro
          </p>
        </div>
        <FormWizard eventoSlug={slug} key={slug} />
      </main>
      <Footer />
    </div>
  )
}
