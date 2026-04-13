import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// POST /api/candidatos/[id]/copiar
// Body: { destino_slug: string, modo: 'copiar' | 'mover' }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const candidatoId = parseInt(id)
    if (isNaN(candidatoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const { destino_slug, modo = 'copiar' } = body

    if (!destino_slug) {
      return NextResponse.json({ error: 'destino_slug é obrigatório' }, { status: 400 })
    }
    if (modo !== 'copiar' && modo !== 'mover') {
      return NextResponse.json({ error: 'modo deve ser "copiar" ou "mover"' }, { status: 400 })
    }

    const sql = getDb()

    const [destEvento] = await sql`SELECT id, nome FROM eventos WHERE slug = ${destino_slug}`
    if (!destEvento) {
      return NextResponse.json({ error: 'Evento de destino não encontrado' }, { status: 404 })
    }

    if (modo === 'copiar') {
      const inserted = await sql`
        INSERT INTO candidatos (
          nome_completo, data_nascimento, sexo, estado_civil, nacionalidade,
          etnia, possui_deficiencia, tipo_deficiencia,
          naturalidade, nome_pai, nome_mae,
          cep, endereco, numero, complemento, bairro, cidade, estado,
          telefone, celular, email,
          cpf, rg, orgao_emissor, data_emissao_rg, ctps, serie_ctps, pis,
          possui_dependentes,
          escolaridade, curso, experiencia_eventos, experiencia_descricao,
          cargo_pretendido, disponibilidade, como_soube, observacoes,
          documento_foto, documento_foto_nome, documento_foto_tipo,
          chave_pix, pix_nao_possui,
          doc_frente, doc_frente_nome, doc_frente_tipo,
          doc_verso, doc_verso_nome, doc_verso_tipo,
          curriculo, curriculo_nome, curriculo_tipo,
          experiencia_profissional,
          evento_id, status, premiacao_override
        )
        SELECT
          nome_completo, data_nascimento, sexo, estado_civil, nacionalidade,
          etnia, possui_deficiencia, tipo_deficiencia,
          naturalidade, nome_pai, nome_mae,
          cep, endereco, numero, complemento, bairro, cidade, estado,
          telefone, celular, email,
          cpf, rg, orgao_emissor, data_emissao_rg, ctps, serie_ctps, pis,
          possui_dependentes,
          escolaridade, curso, experiencia_eventos, experiencia_descricao,
          cargo_pretendido, disponibilidade, como_soube, observacoes,
          documento_foto, documento_foto_nome, documento_foto_tipo,
          chave_pix, pix_nao_possui,
          doc_frente, doc_frente_nome, doc_frente_tipo,
          doc_verso, doc_verso_nome, doc_verso_tipo,
          curriculo, curriculo_nome, curriculo_tipo,
          experiencia_profissional,
          ${destEvento.id}, 'novo', NULL
        FROM candidatos
        WHERE id = ${candidatoId}
        ON CONFLICT (cpf, evento_id) DO NOTHING
        RETURNING id, cpf
      `

      if (inserted.length === 0) {
        return NextResponse.json({ ok: true, migrado: false, motivo: 'duplicado', destino_nome: destEvento.nome })
      }

      // Copia dependentes
      const deps = await sql`SELECT * FROM dependentes WHERE candidato_id = ${candidatoId}`
      for (const dep of deps) {
        await sql`
          INSERT INTO dependentes (candidato_id, nome, data_nascimento, parentesco, cpf)
          VALUES (${inserted[0].id}, ${dep.nome}, ${dep.data_nascimento}, ${dep.parentesco}, ${dep.cpf || null})
        `
      }

      return NextResponse.json({ ok: true, migrado: true, destino_nome: destEvento.nome })
    } else {
      // mover: atualiza evento_id se não houver CPF duplicado no destino
      const movido = await sql`
        UPDATE candidatos c
        SET evento_id = ${destEvento.id}, updated_at = NOW()
        WHERE c.id = ${candidatoId}
          AND NOT EXISTS (
            SELECT 1 FROM candidatos c2
            WHERE c2.cpf = c.cpf AND c2.evento_id = ${destEvento.id} AND c2.id != c.id
          )
        RETURNING id
      `

      if (movido.length === 0) {
        return NextResponse.json({ ok: true, migrado: false, motivo: 'duplicado', destino_nome: destEvento.nome })
      }

      return NextResponse.json({ ok: true, migrado: true, destino_nome: destEvento.nome })
    }
  } catch (error) {
    console.error('Erro ao copiar candidato:', error)
    return NextResponse.json({ error: 'Erro interno ao copiar candidato' }, { status: 500 })
  }
}
