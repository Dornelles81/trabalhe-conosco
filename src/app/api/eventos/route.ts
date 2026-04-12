import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/eventos — lista todos os eventos (ativos por padrão; ?todos=1 para incluir inativos)
export async function GET(request: NextRequest) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const todos = searchParams.get('todos') === '1'

    const eventos = todos
      ? await sql`SELECT id, slug, nome, cidade, descricao, ativo, dias_total, valor_diaria, premiacao, nome_evento, data_evento, local_evento, cargo_padrao, data_pagamento, created_at FROM eventos ORDER BY created_at DESC`
      : await sql`SELECT id, slug, nome, cidade, descricao, ativo, dias_total, valor_diaria, premiacao, nome_evento, data_evento, local_evento, cargo_padrao, data_pagamento, created_at FROM eventos WHERE ativo = TRUE ORDER BY created_at DESC`

    return NextResponse.json(eventos)
  } catch (error) {
    console.error('Erro ao listar eventos:', error)
    return NextResponse.json({ error: 'Erro ao listar eventos' }, { status: 500 })
  }
}

// POST /api/eventos — cria novo evento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, cidade, descricao, slug, dias_total, valor_diaria, premiacao } = body

    if (!nome || !slug) {
      return NextResponse.json({ error: 'nome e slug são obrigatórios' }, { status: 400 })
    }

    // Valida slug: apenas letras minúsculas, números e hífens
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'slug deve conter apenas letras minúsculas, números e hífens' }, { status: 400 })
    }

    const sql = getDb()

    const {
      nome_evento, data_evento, local_evento,
      cargo_padrao, data_pagamento, client_password,
    } = body

    const [evento] = await sql`
      INSERT INTO eventos (
        slug, nome, cidade, descricao, ativo,
        dias_total, valor_diaria, premiacao,
        nome_evento, data_evento, local_evento, cargo_padrao, data_pagamento, client_password
      )
      VALUES (
        ${slug}, ${nome}, ${cidade || null}, ${descricao || null}, TRUE,
        ${parseInt(dias_total) || 6},
        ${parseFloat(valor_diaria) || 180.00},
        ${parseFloat(premiacao) || 0.00},
        ${nome_evento || null}, ${data_evento || null}, ${local_evento || null},
        ${cargo_padrao || 'Operador de Estacionamento'},
        ${data_pagamento || null},
        ${client_password || null}
      )
      RETURNING id, slug, nome, cidade, descricao, ativo,
                dias_total, valor_diaria, premiacao,
                nome_evento, data_evento, local_evento, cargo_padrao, data_pagamento,
                created_at
    `

    return NextResponse.json(evento, { status: 201 })
  } catch (error: unknown) {
    console.error('Erro ao criar evento:', error)
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json({ error: 'Já existe um evento com este slug' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 })
  }
}
