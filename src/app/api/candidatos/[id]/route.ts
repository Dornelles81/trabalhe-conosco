import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sql = getDb()

    const candidatos = await sql`SELECT * FROM candidatos WHERE id = ${id}`
    if (!candidatos.length) {
      return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 })
    }

    const dependentes = await sql`SELECT * FROM dependentes WHERE candidato_id = ${id} ORDER BY id`

    return NextResponse.json({ ...candidatos[0], dependentes })
  } catch (error) {
    console.error('Erro ao buscar candidato:', error)
    return NextResponse.json({ error: 'Erro ao buscar candidato' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const sql = getDb()

    if (body.status) {
      await sql`UPDATE candidatos SET status = ${body.status}, updated_at = NOW() WHERE id = ${id}`
    }

    if ('premiacao_override' in body) {
      const val = body.premiacao_override === null ? null : parseFloat(body.premiacao_override)
      await sql`UPDATE candidatos SET premiacao_override = ${val}, updated_at = NOW() WHERE id = ${id}`
    }

    return NextResponse.json({ message: 'Candidato atualizado' })
  } catch (error) {
    console.error('Erro ao atualizar candidato:', error)
    return NextResponse.json({ error: 'Erro ao atualizar candidato' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sql = getDb()

    await sql`DELETE FROM candidatos WHERE id = ${id}`

    return NextResponse.json({ message: 'Candidato excluído' })
  } catch (error) {
    console.error('Erro ao excluir candidato:', error)
    return NextResponse.json({ error: 'Erro ao excluir candidato' }, { status: 500 })
  }
}
