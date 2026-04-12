import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { isAdminAuth } from '@/lib/auth'


// GET /api/eventos/[slug] — retorna dados públicos do evento (sem client_password)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const sql = getDb()

    const rows = await sql`
      SELECT id, slug, nome, cidade, descricao, ativo,
             dias_total, valor_diaria, premiacao,
             nome_evento, data_evento, local_evento, cargo_padrao, data_pagamento,
             created_at, updated_at
      FROM eventos WHERE slug = ${slug}
    `

    if (!rows.length) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Erro ao buscar evento:', error)
    return NextResponse.json({ error: 'Erro ao buscar evento' }, { status: 500 })
  }
}

// PATCH /api/eventos/[slug] — atualiza evento (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAdminAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { slug } = await params
    const body = await request.json()
    const sql = getDb()

    const rows = await sql`
      SELECT id, nome, cidade, descricao, ativo, dias_total, valor_diaria, premiacao,
             nome_evento, data_evento, local_evento, cargo_padrao, data_pagamento, client_password
      FROM eventos WHERE slug = ${slug}
    `
    if (!rows.length) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
    }

    const a = rows[0]

    const [updated] = await sql`
      UPDATE eventos SET
        nome            = ${body.nome            !== undefined ? body.nome                              : a.nome},
        cidade          = ${body.cidade          !== undefined ? (body.cidade || null)                  : a.cidade},
        descricao       = ${body.descricao       !== undefined ? (body.descricao || null)               : a.descricao},
        ativo           = ${body.ativo           !== undefined ? Boolean(body.ativo)                    : a.ativo},
        dias_total      = ${body.dias_total      !== undefined ? parseInt(body.dias_total)              : a.dias_total},
        valor_diaria    = ${body.valor_diaria    !== undefined ? parseFloat(body.valor_diaria)          : a.valor_diaria},
        premiacao       = ${body.premiacao       !== undefined ? (parseFloat(body.premiacao) || 0)      : a.premiacao},
        nome_evento     = ${body.nome_evento     !== undefined ? (body.nome_evento || null)             : a.nome_evento},
        data_evento     = ${body.data_evento     !== undefined ? (body.data_evento || null)             : a.data_evento},
        local_evento    = ${body.local_evento    !== undefined ? (body.local_evento || null)            : a.local_evento},
        cargo_padrao    = ${body.cargo_padrao    !== undefined ? (body.cargo_padrao || null)            : a.cargo_padrao},
        data_pagamento  = ${body.data_pagamento  !== undefined ? (body.data_pagamento || null)          : a.data_pagamento},
        client_password = ${body.client_password !== undefined ? (body.client_password || null)        : a.client_password},
        updated_at      = NOW()
      WHERE slug = ${slug}
      RETURNING id, slug, nome, cidade, descricao, ativo,
                dias_total, valor_diaria, premiacao,
                nome_evento, data_evento, local_evento, cargo_padrao, data_pagamento,
                updated_at
    `

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erro ao atualizar evento:', error)
    return NextResponse.json({ error: 'Erro ao atualizar evento' }, { status: 500 })
  }
}

// DELETE /api/eventos/[slug] — desativa evento (admin only; não apaga dados)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAdminAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { slug } = await params
    const sql = getDb()
    await sql`UPDATE eventos SET ativo = FALSE, updated_at = NOW() WHERE slug = ${slug}`
    return NextResponse.json({ message: 'Evento desativado' })
  } catch (error) {
    console.error('Erro ao desativar evento:', error)
    return NextResponse.json({ error: 'Erro ao desativar evento' }, { status: 500 })
  }
}

