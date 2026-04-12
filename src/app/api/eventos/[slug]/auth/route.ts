import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// POST /api/eventos/[slug]/auth — login do cliente do evento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'Senha obrigatória' }, { status: 400 })
    }

    const sql = getDb()
    const [evento] = await sql`
      SELECT id, slug, client_password FROM eventos WHERE slug = ${slug} AND ativo = TRUE
    `

    if (!evento) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
    }

    if (!evento.client_password || evento.client_password !== password) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
    }

    const session = JSON.stringify({ slug: evento.slug, eventoId: evento.id })
    const response = NextResponse.json({ message: 'Login realizado com sucesso' })
    response.cookies.set('evento_client_session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Erro no login do cliente:', error)
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 })
  }
}

// DELETE /api/eventos/[slug]/auth — logout do cliente
export async function DELETE() {
  const response = NextResponse.json({ message: 'Logout realizado' })
  response.cookies.set('evento_client_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
