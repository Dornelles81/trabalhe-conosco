import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { generateWordBuffer, safeName } from '@/lib/generateWord'
import JSZip from 'jszip'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''

    const sql = getDb()

    // Excluir campos base64 (foto/currículo) para não estourar o limite de resposta do Neon
    const candidatos = status
      ? await sql`
          SELECT id, nome_completo, data_nascimento, sexo, estado_civil, nacionalidade,
            etnia, possui_deficiencia, tipo_deficiencia, naturalidade, nome_pai, nome_mae,
            cep, endereco, numero, complemento, bairro, cidade, estado, telefone, celular, email,
            cpf, rg, orgao_emissor, data_emissao_rg, ctps, serie_ctps, chave_pix, pix_nao_possui,
            possui_dependentes, escolaridade, curso, cargo_pretendido, disponibilidade,
            experiencia_eventos, experiencia_descricao, como_soube, experiencia_profissional,
            observacoes, doc_frente_nome, doc_verso_nome, curriculo_nome, status
          FROM candidatos WHERE status = ${status} ORDER BY nome_completo`
      : await sql`
          SELECT id, nome_completo, data_nascimento, sexo, estado_civil, nacionalidade,
            etnia, possui_deficiencia, tipo_deficiencia, naturalidade, nome_pai, nome_mae,
            cep, endereco, numero, complemento, bairro, cidade, estado, telefone, celular, email,
            cpf, rg, orgao_emissor, data_emissao_rg, ctps, serie_ctps, chave_pix, pix_nao_possui,
            possui_dependentes, escolaridade, curso, cargo_pretendido, disponibilidade,
            experiencia_eventos, experiencia_descricao, como_soube, experiencia_profissional,
            observacoes, doc_frente_nome, doc_verso_nome, curriculo_nome, status
          FROM candidatos ORDER BY nome_completo`

    if (!candidatos.length) {
      return NextResponse.json({ error: 'Nenhum candidato encontrado' }, { status: 404 })
    }

    const zip = new JSZip()

    for (const c of candidatos) {
      const dependentes = await sql`SELECT * FROM dependentes WHERE candidato_id = ${c.id} ORDER BY id`
      const buffer = await generateWordBuffer(c, dependentes)
      const fileName = `Ficha_${safeName(c.nome_completo)}.docx`
      zip.file(fileName, buffer)
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

    const label = status ? `_${status}` : '_todos'
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Fichas_Word${label}.zip"`,
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Erro ao exportar todos os Word:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
