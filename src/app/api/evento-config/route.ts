import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`SELECT id, dias_total, valor_diaria, premiacao FROM evento_config WHERE id = 1`
    const config = rows[0] ?? { id: 1, dias_total: 6, valor_diaria: 180.00, premiacao: 0 }
    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao buscar config:', error)
    return NextResponse.json({ id: 1, dias_total: 6, valor_diaria: 180.00, premiacao: 0 })
  }
}

export async function PUT(req: Request) {
  const body = await req.json()
  const dias_total = parseInt(body.dias_total)
  const valor_diaria = parseFloat(body.valor_diaria)
  const premiacao = parseFloat(body.premiacao ?? 0)

  if (!dias_total || dias_total < 1 || isNaN(valor_diaria) || valor_diaria < 0) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const [config] = await sql`
      INSERT INTO evento_config (id, dias_total, valor_diaria, premiacao, updated_at)
      VALUES (1, ${dias_total}, ${valor_diaria}, ${isNaN(premiacao) ? 0 : premiacao}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        dias_total = EXCLUDED.dias_total,
        valor_diaria = EXCLUDED.valor_diaria,
        premiacao = EXCLUDED.premiacao,
        updated_at = NOW()
      RETURNING id, dias_total, valor_diaria, premiacao
    `
    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao salvar config:', error)
    return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 })
  }
}
