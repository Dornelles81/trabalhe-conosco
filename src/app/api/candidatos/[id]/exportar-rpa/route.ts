import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'

function valorPorExtenso(n: number): string {
  const int = Math.round(n)
  if (int === 0) return 'zero reais'
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
    'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
    'seiscentos', 'setecentos', 'oitocentos', 'novecentos']
  function trecho(x: number): string {
    const p: string[] = []
    const c = Math.floor(x / 100), r = x % 100
    if (c > 0) p.push(x === 100 ? 'cem' : centenas[c])
    if (r > 0) {
      if (r < 20) p.push(unidades[r])
      else { const d2 = Math.floor(r / 10), u = r % 10; p.push(u > 0 ? `${dezenas[d2]} e ${unidades[u]}` : dezenas[d2]) }
    }
    return p.join(' e ')
  }
  const partes: string[] = []
  if (int >= 1000) { const mil = Math.floor(int / 1000); partes.push(mil === 1 ? 'um mil' : `${trecho(mil)} mil`) }
  const r = int % 1000
  if (r > 0) partes.push(trecho(r))
  return partes.join(', ') + ' reais'
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

    // ── Busca configurações do evento ─────────────────────────────────────────
    let diasTotal = 6, valorDiaria = 180, premiacaoBase = 0
    let dataPagamento: Date = new Date(2026, 2, 13) // fallback
    if (c.evento_id) {
      const evRows = await sql`
        SELECT dias_total, valor_diaria, premiacao, data_pagamento FROM eventos WHERE id = ${c.evento_id}
      `
      if (evRows.length) {
        diasTotal = Number(evRows[0].dias_total ?? 6)
        valorDiaria = Number(evRows[0].valor_diaria ?? 180)
        premiacaoBase = Number(evRows[0].premiacao ?? 0)
        if (evRows[0].data_pagamento) dataPagamento = new Date(evRows[0].data_pagamento)
      }
    }
    const premiacao = Number(c.premiacao_override ?? premiacaoBase)
    const VALOR_LIQUIDO = Math.round(valorDiaria * diasTotal + premiacao)

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
      sheet.getCell(base + 15, 3).value = dataPagamento

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
