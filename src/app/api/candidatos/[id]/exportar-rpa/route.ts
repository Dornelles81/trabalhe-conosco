import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'

// Valor base do contrato (R$1.080 líquido + R$200 prêmio assiduidade = R$1.280)
const VALOR_LIQUIDO = 1280

function valorPorExtenso(valor: number): string {
  const valores: Record<number, string> = {
    450: 'Quatrocentos e cinquenta reais',
    900: 'Novecentos reais',
    1080: 'Um mil e oitenta reais',
    1280: 'Um mil, duzentos e oitenta reais',
  }
  return valores[valor] ?? `${valor.toFixed(2).replace('.', ',')} reais`
}

export async function GET(
  _request: NextRequest,
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

    // ── Dados formatados ──────────────────────────────────────────────────────
    const cpfFormatado = c.cpf ? `CPF: ${c.cpf}` : 'CPF: ___.___.___-__'
    const rgNumero = c.rg ? `número: ${c.rg}` : 'número: ___________'
    const orgaoEmissor = c.orgao_emissor ? String(c.orgao_emissor).toUpperCase() : 'SSP RS'
    const endereco = c.endereco
      ? `Endereço: ${c.endereco}, ${c.numero || 's/n'}${c.complemento ? ', ' + c.complemento : ''}`
      : 'Endereço: ___________________________'
    const cidadeBairro = [c.bairro, c.cidade ? `${c.cidade} - ${c.estado || 'RS'}` : '']
      .filter(Boolean)
      .join('  ') || 'Cidade - RS'

    const reciboNum = String(id).padStart(3, '0')
    const descricao = `Recebi da empresa acima identificada, pela prestação de serviço de Operador de Estacionamento a importância de R$ ${VALOR_LIQUIDO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${valorPorExtenso(VALOR_LIQUIDO)}) conforme discriminado abaixo.`

    // ── Carregar template ─────────────────────────────────────────────────────
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'RPA_.xlsx')
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 500 })
    }

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)

    const sheet = workbook.worksheets[0]

    // ── Calcular valores derivados (para atualizar caches de fórmulas) ──────────
    const bruto = VALOR_LIQUIDO * 1.1236          // E8  = E18 * 1.1236
    const inss  = bruto * 0.11                    // E12 = E8  * 0.11
    const totalDescontos = inss                   // E17 = SUM(E12:E16), outros=0
    const liquido = bruto - inss                  // F16 = E8  - E12

    // ── Preencher as duas vias (Via 1: linhas 1-19, Via 2: linhas 21-39) ──────
    // base=0 → Via 1; base=20 → Via 2
    for (const base of [0, 20]) {
      setCellValue(sheet, base + 3, 4, `Recibo número ${reciboNum}`)
      setCellValue(sheet, base + 5, 1, descricao)
      setCellValue(sheet, base + 8, 1, cpfFormatado)
      setCellValue(sheet, base + 11, 1, rgNumero)
      setCellValue(sheet, base + 11, 3, orgaoEmissor)
      setCellValue(sheet, base + 12, 1, endereco)
      setCellValue(sheet, base + 13, 1, cidadeBairro)

      // Data (C15 / C35)
      sheet.getCell(base + 15, 3).value = new Date(2026, 2, 13)

      // Valor Líquido (E18 / E38) — valor raiz; fórmulas dependem dele
      sheet.getCell(base + 18, 5).value = VALOR_LIQUIDO

      // Atualizar caches das fórmulas dependentes de E18
      // Via 1: E8, E12, F16, E17 | Via 2: E28, E32, E37 (F36 não existe)
      sheet.getCell(base + 8,  5).value = { formula: base === 0 ? 'E18*1.1236' : 'E38*1.1236', result: bruto }
      sheet.getCell(base + 12, 5).value = { formula: base === 0 ? 'E8*0.11'    : 'E28*0.11',   result: inss  }
      sheet.getCell(base + 17, 5).value = { formula: base === 0 ? 'SUM(E12:E16)' : 'SUM(E32:E36)', result: totalDescontos }
      if (base === 0) {
        sheet.getCell(16, 6).value = { formula: 'E8-E12', result: liquido }
      }

      // Nome (B19 / B39)
      setCellValue(sheet, base + 19, 2, c.nome_completo || '___________________________')
    }

    // ── Configurar área de impressão: ambas as vias na mesma folha ───────────
    sheet.pageSetup.printArea = 'A1:H39'
    sheet.pageSetup.fitToPage = true
    sheet.pageSetup.fitToHeight = 1
    sheet.pageSetup.fitToWidth = 1
    sheet.pageSetup.orientation = 'portrait'
    sheet.pageSetup.paperSize = 9 // A4

    // ── Gerar buffer e retornar ───────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer()
    const safeName = (c.nome_completo as string).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="RPA_${safeName}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Erro ao exportar RPA:', error)
    return NextResponse.json({ error: 'Erro ao exportar RPA' }, { status: 500 })
  }
}

function setCellValue(sheet: ExcelJS.Worksheet, row: number, col: number, value: string) {
  const cell = sheet.getCell(row, col)
  // Preservar estilo, apenas substituir valor
  cell.value = value
}
