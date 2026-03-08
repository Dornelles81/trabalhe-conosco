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

    const candidatos = status
      ? await sql`SELECT * FROM candidatos WHERE status = ${status} ORDER BY nome_completo`
      : await sql`SELECT * FROM candidatos ORDER BY nome_completo`

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
    console.error('Erro ao exportar todos os Word:', error)
    return NextResponse.json({ error: 'Erro ao exportar' }, { status: 500 })
  }
}
