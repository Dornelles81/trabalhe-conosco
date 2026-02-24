import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const PERIODOS_VALIDOS = ['Dia Inteiro', 'Manhã', 'Tarde', 'Noite']

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const candidatoId = parseInt(id)
  if (isNaN(candidatoId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`
      SELECT id, candidato_id, dia_numero, periodo, observacao, created_at
      FROM presencas
      WHERE candidato_id = ${candidatoId}
      ORDER BY dia_numero ASC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Erro ao buscar presenças:', error)
    return NextResponse.json({ error: 'Erro ao buscar presenças' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const candidatoId = parseInt(id)
  if (isNaN(candidatoId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const body = await req.json()
  const dia_numero = parseInt(body.dia_numero)
  const periodo = body.periodo ?? 'Dia Inteiro'
  const observacao = body.observacao ?? null

  if (!dia_numero || dia_numero < 1) {
    return NextResponse.json({ error: 'dia_numero inválido' }, { status: 400 })
  }
  if (!PERIODOS_VALIDOS.includes(periodo)) {
    return NextResponse.json({ error: 'Período inválido' }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    // UPSERT: se já existe registro para (candidato, dia), atualiza o periodo
    const [row] = await sql`
      INSERT INTO presencas (candidato_id, dia_numero, periodo, observacao)
      VALUES (${candidatoId}, ${dia_numero}, ${periodo}, ${observacao})
      ON CONFLICT (candidato_id, dia_numero) DO UPDATE SET
        periodo = EXCLUDED.periodo,
        observacao = COALESCE(EXCLUDED.observacao, presencas.observacao)
      RETURNING id, candidato_id, dia_numero, periodo, observacao, created_at
    `
    return NextResponse.json(row, { status: 200 })
  } catch (error) {
    console.error('Erro ao registrar presença:', error)
    return NextResponse.json({ error: 'Erro ao registrar presença' }, { status: 500 })
  }
}
