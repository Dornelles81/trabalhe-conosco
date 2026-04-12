import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const maxDuration = 60

// POST /api/candidatos/migrar
// Body: {
//   origem_slug: string,
//   destino_slugs: string[],
//   modo: 'copiar' | 'mover',
//   status_filtro: 'todos' | 'aprovado' | 'contratado' | 'aprovado_contratado'
// }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origem_slug, destino_slugs, modo, status_filtro = 'todos' } = body

    if (!origem_slug || !destino_slugs?.length || !modo) {
      return NextResponse.json({ error: 'origem_slug, destino_slugs e modo são obrigatórios' }, { status: 400 })
    }

    if (modo !== 'copiar' && modo !== 'mover') {
      return NextResponse.json({ error: 'modo deve ser "copiar" ou "mover"' }, { status: 400 })
    }

    if (modo === 'mover' && destino_slugs.length > 1) {
      return NextResponse.json({ error: 'Modo "mover" aceita apenas um destino' }, { status: 400 })
    }

    const sql = getDb()

    // Resolve origem
    const [fonteEvento] = await sql`SELECT id, nome FROM eventos WHERE slug = ${origem_slug}`
    if (!fonteEvento) {
      return NextResponse.json({ error: 'Evento de origem não encontrado' }, { status: 404 })
    }

    // Resolve destinos
    const destEventos = await sql`SELECT id, slug, nome FROM eventos WHERE slug = ANY(${destino_slugs})`
    if (!destEventos.length) {
      return NextResponse.json({ error: 'Nenhum evento de destino encontrado' }, { status: 404 })
    }

    // Busca candidatos da origem com filtro de status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let candidatosFonte: any[]
    if (status_filtro === 'todos') {
      candidatosFonte = await sql`
        SELECT id, cpf FROM candidatos WHERE evento_id = ${fonteEvento.id}
      `
    } else if (status_filtro === 'aprovado_contratado') {
      candidatosFonte = await sql`
        SELECT id, cpf FROM candidatos
        WHERE evento_id = ${fonteEvento.id} AND status IN ('aprovado', 'contratado')
      `
    } else {
      candidatosFonte = await sql`
        SELECT id, cpf FROM candidatos
        WHERE evento_id = ${fonteEvento.id} AND status = ${status_filtro}
      `
    }

    if (!candidatosFonte.length) {
      return NextResponse.json({ resultado: [], total_fonte: 0 })
    }

    const sourceIds = candidatosFonte.map(c => c.id)

    // Carrega dependentes de todos os candidatos de uma vez
    const todosDepend = await sql`
      SELECT * FROM dependentes WHERE candidato_id = ANY(${sourceIds})
    `
    // Mapa: candidato_id → dependentes
    const dependMap = new Map<number, typeof todosDepend>()
    for (const dep of todosDepend) {
      if (!dependMap.has(dep.candidato_id)) dependMap.set(dep.candidato_id, [])
      dependMap.get(dep.candidato_id)!.push(dep)
    }
    // Mapa: cpf → candidato_id (para associar após INSERT)
    const cpfToOrigId = new Map<string, number>()
    for (const c of candidatosFonte) cpfToOrigId.set(c.cpf, c.id)

    const resultado = []

    if (modo === 'copiar') {
      for (const destEvento of destEventos) {
        // INSERT ... SELECT com todos os campos, novo evento_id, status 'novo'
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
          WHERE id = ANY(${sourceIds})
          ON CONFLICT (cpf, evento_id) DO NOTHING
          RETURNING id, cpf
        `

        // Copia dependentes para cada novo candidato
        for (const newCand of inserted) {
          const origId = cpfToOrigId.get(newCand.cpf)
          if (origId === undefined) continue
          const deps = dependMap.get(origId) || []
          for (const dep of deps) {
            await sql`
              INSERT INTO dependentes (candidato_id, nome, data_nascimento, parentesco, cpf)
              VALUES (${newCand.id}, ${dep.nome}, ${dep.data_nascimento}, ${dep.parentesco}, ${dep.cpf || null})
            `
          }
        }

        resultado.push({
          destino_slug: destEvento.slug,
          destino_nome: destEvento.nome,
          migrados: inserted.length,
          duplicados: sourceIds.length - inserted.length,
        })
      }
    } else {
      // modo === 'mover': atualiza evento_id diretamente (apenas 1 destino)
      const destEvento = destEventos[0]

      // Move apenas os que não têm CPF duplicado no destino
      const movidos = await sql`
        UPDATE candidatos c
        SET evento_id = ${destEvento.id}, updated_at = NOW()
        WHERE c.id = ANY(${sourceIds})
          AND NOT EXISTS (
            SELECT 1 FROM candidatos c2
            WHERE c2.cpf = c.cpf AND c2.evento_id = ${destEvento.id} AND c2.id != c.id
          )
        RETURNING id, cpf
      `

      resultado.push({
        destino_slug: destEvento.slug,
        destino_nome: destEvento.nome,
        migrados: movidos.length,
        duplicados: sourceIds.length - movidos.length,
      })
    }

    return NextResponse.json({
      total_fonte: candidatosFonte.length,
      resultado,
    })
  } catch (error) {
    console.error('Erro ao migrar candidatos:', error)
    return NextResponse.json({ error: 'Erro ao migrar candidatos' }, { status: 500 })
  }
}
