import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sql = getDb()

    const [candidato] = await sql`
      INSERT INTO candidatos (
        nome_completo, data_nascimento, sexo, estado_civil, nacionalidade,
        etnia, possui_deficiencia, tipo_deficiencia,
        naturalidade, nome_pai, nome_mae, cep, endereco, numero, complemento,
        bairro, cidade, estado, telefone, celular, email, cpf, rg,
        orgao_emissor, data_emissao_rg, ctps, serie_ctps, pis,
        titulo_eleitor, zona_eleitoral, secao_eleitoral, possui_dependentes,
        escolaridade, curso, experiencia_eventos, experiencia_descricao,
        cargo_pretendido, disponibilidade, como_soube, observacoes,
        documento_foto, documento_foto_nome, documento_foto_tipo
      ) VALUES (
        ${body.nome_completo}, ${body.data_nascimento || null}, ${body.sexo},
        ${body.estado_civil}, ${body.nacionalidade},
        ${body.etnia || ''}, ${body.possui_deficiencia || false},
        ${body.tipo_deficiencia || null}, ${body.naturalidade || null},
        ${body.nome_pai || null}, ${body.nome_mae || null}, ${body.cep},
        ${body.endereco}, ${body.numero}, ${body.complemento || null},
        ${body.bairro}, ${body.cidade}, ${body.estado},
        ${body.telefone || null}, ${body.celular}, ${body.email || null},
        ${body.cpf}, ${body.rg}, ${body.orgao_emissor || null},
        ${body.data_emissao_rg || null}, ${body.ctps || null},
        ${body.serie_ctps || null}, ${body.pis || null},
        ${body.titulo_eleitor || null}, ${body.zona_eleitoral || null},
        ${body.secao_eleitoral || null}, ${body.possui_dependentes || false},
        ${body.escolaridade || null}, ${body.curso || null},
        ${body.experiencia_eventos || false}, ${body.experiencia_descricao || null},
        ${body.cargo_pretendido || null}, ${body.disponibilidade || null},
        ${body.como_soube || null}, ${body.observacoes || null},
        ${body.documento_foto || null}, ${body.documento_foto_nome || null},
        ${body.documento_foto_tipo || null}
      )
      RETURNING id
    `

    // Insert dependentes
    if (body.possui_dependentes && body.dependentes?.length) {
      for (const dep of body.dependentes) {
        await sql`
          INSERT INTO dependentes (candidato_id, nome, data_nascimento, parentesco, cpf)
          VALUES (${candidato.id}, ${dep.nome}, ${dep.data_nascimento}, ${dep.parentesco}, ${dep.cpf || null})
        `
      }
    }

    return NextResponse.json({ id: candidato.id, message: 'Cadastro realizado com sucesso' }, { status: 201 })
  } catch (error: unknown) {
    console.error('Erro ao criar candidato:', error)
    let message = 'Erro ao salvar cadastro'
    if (error instanceof Error) {
      console.error('Detalhes do erro:', error.message)
      if (error.message.includes('unique')) {
        message = 'CPF já cadastrado no sistema'
      } else if (error.message.includes('password authentication')) {
        message = 'Erro de conexão com o banco de dados. Verifique as credenciais.'
      } else if (error.message.includes('connect') || error.message.includes('ENOTFOUND')) {
        message = 'Não foi possível conectar ao banco de dados. Verifique a configuração.'
      } else if (error.message.includes('too large') || error.message.includes('body size') || error.message.includes('PAYLOAD')) {
        message = 'Arquivo muito grande. Reduza o tamanho da foto do documento.'
      } else {
        message = `Erro ao salvar cadastro: ${error.message}`
      }
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let candidatos
    let countResult

    if (status && search) {
      candidatos = await sql`
        SELECT id, nome_completo, data_nascimento, sexo, estado_civil, nacionalidade, etnia,
        possui_deficiencia, tipo_deficiencia, naturalidade, nome_pai, nome_mae,
        cep, endereco, numero, complemento, bairro, cidade, estado, telefone, celular, email,
        cpf, rg, orgao_emissor, data_emissao_rg, ctps, serie_ctps, pis,
        titulo_eleitor, zona_eleitoral, secao_eleitoral, possui_dependentes,
        escolaridade, curso, experiencia_eventos, experiencia_descricao,
        cargo_pretendido, disponibilidade, como_soube, observacoes,
        documento_foto_nome, documento_foto_tipo,
        status, created_at, updated_at
      FROM candidatos
        WHERE status = ${status}
        AND (nome_completo ILIKE ${'%' + search + '%'} OR cpf LIKE ${'%' + search + '%'})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM candidatos
        WHERE status = ${status}
        AND (nome_completo ILIKE ${'%' + search + '%'} OR cpf LIKE ${'%' + search + '%'})
      `
    } else if (status) {
      candidatos = await sql`
        SELECT id, nome_completo, data_nascimento, sexo, estado_civil, nacionalidade, etnia,
        possui_deficiencia, tipo_deficiencia, naturalidade, nome_pai, nome_mae,
        cep, endereco, numero, complemento, bairro, cidade, estado, telefone, celular, email,
        cpf, rg, orgao_emissor, data_emissao_rg, ctps, serie_ctps, pis,
        titulo_eleitor, zona_eleitoral, secao_eleitoral, possui_dependentes,
        escolaridade, curso, experiencia_eventos, experiencia_descricao,
        cargo_pretendido, disponibilidade, como_soube, observacoes,
        documento_foto_nome, documento_foto_tipo,
        status, created_at, updated_at
      FROM candidatos WHERE status = ${status}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`SELECT COUNT(*) as total FROM candidatos WHERE status = ${status}`
    } else if (search) {
      candidatos = await sql`
        SELECT id, nome_completo, data_nascimento, sexo, estado_civil, nacionalidade, etnia,
        possui_deficiencia, tipo_deficiencia, naturalidade, nome_pai, nome_mae,
        cep, endereco, numero, complemento, bairro, cidade, estado, telefone, celular, email,
        cpf, rg, orgao_emissor, data_emissao_rg, ctps, serie_ctps, pis,
        titulo_eleitor, zona_eleitoral, secao_eleitoral, possui_dependentes,
        escolaridade, curso, experiencia_eventos, experiencia_descricao,
        cargo_pretendido, disponibilidade, como_soube, observacoes,
        documento_foto_nome, documento_foto_tipo,
        status, created_at, updated_at
      FROM candidatos
        WHERE nome_completo ILIKE ${'%' + search + '%'} OR cpf LIKE ${'%' + search + '%'}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM candidatos
        WHERE nome_completo ILIKE ${'%' + search + '%'} OR cpf LIKE ${'%' + search + '%'}
      `
    } else {
      candidatos = await sql`
        SELECT id, nome_completo, data_nascimento, sexo, estado_civil, nacionalidade, etnia,
        possui_deficiencia, tipo_deficiencia, naturalidade, nome_pai, nome_mae,
        cep, endereco, numero, complemento, bairro, cidade, estado, telefone, celular, email,
        cpf, rg, orgao_emissor, data_emissao_rg, ctps, serie_ctps, pis,
        titulo_eleitor, zona_eleitoral, secao_eleitoral, possui_dependentes,
        escolaridade, curso, experiencia_eventos, experiencia_descricao,
        cargo_pretendido, disponibilidade, como_soube, observacoes,
        documento_foto_nome, documento_foto_tipo,
        status, created_at, updated_at
      FROM candidatos ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`SELECT COUNT(*) as total FROM candidatos`
    }

    return NextResponse.json({
      candidatos,
      total: parseInt(countResult[0].total),
      page,
      totalPages: Math.ceil(parseInt(countResult[0].total) / limit),
    })
  } catch (error) {
    console.error('Erro ao buscar candidatos:', error)
    return NextResponse.json({ error: 'Erro ao buscar candidatos' }, { status: 500 })
  }
}
