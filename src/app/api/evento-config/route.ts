import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/evento-config?evento=slug
// Se slug fornecido: retorna config do evento específico
// Se não: retorna config do evento padrão (id=1, legado)
export async function GET(request: NextRequest) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const eventoSlug = searchParams.get('evento')

    if (eventoSlug) {
      const rows = await sql`
        SELECT id, slug, dias_total, valor_diaria, premiacao
        FROM eventos WHERE slug = ${eventoSlug}
      `
      if (rows.length) {
        return NextResponse.json(rows[0])
      }
    }

    // Fallback: evento padrão (id=1) ou config legada
    const rows = await sql`SELECT id, slug, dias_total, valor_diaria, premiacao FROM eventos WHERE id = 1`
    if (rows.length) return NextResponse.json(rows[0])

    // Último fallback: tabela legada
    const legado = await sql`SELECT id, dias_total, valor_diaria, premiacao FROM evento_config WHERE id = 1`
    return NextResponse.json(legado[0] ?? { id: 1, dias_total: 6, valor_diaria: 180.00, premiacao: 0 })
  } catch (error) {
    console.error('Erro ao buscar config:', error)
    return NextResponse.json({ id: 1, dias_total: 6, valor_diaria: 180.00, premiacao: 0 })
  }
}

// PUT /api/evento-config?evento=slug
// Se slug fornecido: atualiza config do evento específico
// Se não: atualiza evento padrão (id=1, legado)
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const eventoSlug = searchParams.get('evento')

  const body = await request.json()
  const dias_total   = parseInt(body.dias_total)
  const valor_diaria = parseFloat(body.valor_diaria)
  const premiacao    = parseFloat(body.premiacao ?? 0)

  if (!dias_total || dias_total < 1 || isNaN(valor_diaria) || valor_diaria < 0) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  try {
    const sql = getDb()

    if (eventoSlug) {
      const rows = await sql`SELECT id FROM eventos WHERE slug = ${eventoSlug}`
      if (!rows.length) {
        return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
      }

      const [config] = await sql`
        UPDATE eventos SET
          dias_total   = ${dias_total},
          valor_diaria = ${valor_diaria},
          premiacao    = ${isNaN(premiacao) ? 0 : premiacao},
          updated_at   = NOW()
        WHERE slug = ${eventoSlug}
        RETURNING id, slug, dias_total, valor_diaria, premiacao
      `
      return NextResponse.json(config)
    }

    // Legado: atualiza evento id=1
    const [config] = await sql`
      UPDATE eventos SET
        dias_total   = ${dias_total},
        valor_diaria = ${valor_diaria},
        premiacao    = ${isNaN(premiacao) ? 0 : premiacao},
        updated_at   = NOW()
      WHERE id = 1
      RETURNING id, slug, dias_total, valor_diaria, premiacao
    `
    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao salvar config:', error)
    return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 })
  }
}
