import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; presencaId: string }> }
) {
  const { id, presencaId } = await params
  const candidatoId = parseInt(id)
  const presId = parseInt(presencaId)

  if (isNaN(candidatoId) || isNaN(presId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const result = await sql`
      DELETE FROM presencas
      WHERE id = ${presId} AND candidato_id = ${candidatoId}
      RETURNING id
    `
    if (result.length === 0) {
      return NextResponse.json({ error: 'Presença não encontrada' }, { status: 404 })
    }
    return NextResponse.json({ message: 'Presença removida com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar presença:', error)
    return NextResponse.json({ error: 'Erro ao deletar presença' }, { status: 500 })
  }
}
