import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/presencas/dia/[dia]
// Retorna todos os candidatos contratados com status de presença no dia especificado
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dia: string }> }
) {
  const { dia } = await params
  const diaNum = parseInt(dia)
  if (isNaN(diaNum) || diaNum < 1) {
    return NextResponse.json({ error: 'Dia inválido' }, { status: 400 })
  }

  try {
    const sql = getDb()
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
      ORDER BY c.nome_completo ASC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Erro ao buscar presenças do dia:', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}
