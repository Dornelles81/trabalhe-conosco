import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import ClientDashboard from './ClientDashboard'

interface Evento {
  id: number
  slug: string
  nome: string
  nome_evento: string | null
  dias_total: number
  valor_diaria: number
  premiacao: number
}

async function getEvento(slug: string): Promise<Evento | null> {
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT id, slug, nome, nome_evento, dias_total, valor_diaria, premiacao
      FROM eventos WHERE slug = ${slug} AND ativo = TRUE
    `
    return rows.length ? rows[0] as Evento : null
  } catch {
    return null
  }
}

export default async function ClientAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Verifica autenticação do cliente
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('evento_client_session')?.value
  let isAuthenticated = false

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie)
      isAuthenticated = session.slug === slug
    } catch {
      // cookie inválido
    }
  }

  // Também permite acesso com a sessão de admin
  const adminSession = cookieStore.get('admin_session')?.value
  if (adminSession === 'authenticated') isAuthenticated = true

  if (!isAuthenticated) {
    redirect(`/${slug}/admin/login`)
  }

  const evento = await getEvento(slug)
  if (!evento) redirect('/admin')

  return <ClientDashboard evento={evento} />
}
