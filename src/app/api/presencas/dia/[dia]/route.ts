import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/presencas/dia/[dia]?evento=slug
// Retorna todos os candidatos contratados com status de presença no dia especificado
// Se evento fornecido: filtra pelo evento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dia: string }> }
) {
  const { dia } = await params
  const diaNum = parseInt(dia)
  if (isNaN(diaNum) || diaNum < 1) {
    return NextResponse.json({ error: 'Dia inválido' }, { status: 400 })
  }

  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const eventoSlug = searchParams.get('evento')

    // Resolve slug → id
    let eventoId: number | null = null
    if (eventoSlug) {
      const rows = await sql`SELECT id FROM eventos WHERE slug = ${eventoSlug}`
      if (rows.length) eventoId = rows[0].id
    }

    const rows = await sql`
      SELECT
        c.id         AS candidato_id,
        c.nome_completo,
        p.id         AS presenca_id,
        p.periodo,
        p.observacao
      FROM candidatos c
      LEFT JOIN presencas p
        ON p.candidato_id = c.id AND p.dia_numero = ${diaNum}
      WHERE c.status = 'contratado'
        AND (${eventoId}::int IS NULL OR c.evento_id = ${eventoId}::int)
      ORDER BY c.nome_completo ASC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Erro ao buscar presenças do dia:', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}
