import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { generateWordBuffer, safeName } from '@/lib/generateWord'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sql = getDb()

    const candidatos = await sql`SELECT * FROM candidatos WHERE id = ${id}`
    if (!candidatos.length) {
      return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 })
    }

    const c = candidatos[0]
    const dependentes = await sql`SELECT * FROM dependentes WHERE candidato_id = ${id} ORDER BY id`

    const buffer = await generateWordBuffer(c, dependentes)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Ficha_${safeName(c.nome_completo)}.docx"`,
      },
    })
  } catch (error) {
    console.error('Erro ao exportar Word:', error)
    return NextResponse.json({ error: 'Erro ao exportar Word' }, { status: 500 })
  }
}
