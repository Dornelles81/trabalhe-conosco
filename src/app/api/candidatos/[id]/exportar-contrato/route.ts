import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx'

const BLANK = '_________________________'

// ─── Helpers de célula ────────────────────────────────────────────────────────
function makeCell(text: string, bold = false, width?: number, shade?: string): TableCell {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: shade ? { fill: shade } : undefined,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
    children: [
      new Paragraph({
        children: [new TextRun({ text: text || BLANK, bold, size: 17, font: 'Arial' })],
        spacing: { before: 55, after: 55 },
        indent: { left: 70, right: 70 },
      }),
    ],
  })
}

function labelCell(text: string, width?: number): TableCell {
  return makeCell(text, true, width, 'F2F2F2')
}

function valueCell(text: string, width?: number): TableCell {
  return makeCell(text, false, width)
}

function row2(label: string, value: string): TableRow {
  return new TableRow({ children: [labelCell(label, 30), valueCell(value, 70)] })
}

function infoTable(rows: TableRow[]): Table {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })
}

// ─── Helpers de parágrafo ─────────────────────────────────────────────────────
function companyHeader(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 40 },
    children: [new TextRun({ text, bold: true, size: 21, font: 'Arial', color: '1A3C5E' })],
  })
}

function title(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 50 },
    children: [new TextRun({ text, bold: true, size: 23, font: 'Arial' })],
  })
}

function subtitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 180 },
    children: [new TextRun({ text, bold: false, size: 18, font: 'Arial', color: '2E4057' })],
  })
}

function sectionHeader(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [
      new TextRun({ text, bold: true, size: 19, font: 'Arial', color: '1A3C5E', underline: {} }),
    ],
  })
}

function partyLabel(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 80, after: 50 },
    children: [new TextRun({ text, bold: true, size: 18, font: 'Arial', color: '1A3C5E' })],
  })
}

function clauseTitle(num: string, text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 140, after: 30 },
    children: [
      new TextRun({ text: `${num}. ${text}`, bold: true, size: 18, font: 'Arial' }),
    ],
  })
}

function clauseText(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 30, after: 30 },
    indent: { left: 340 },
    children: [new TextRun({ text, size: 17, font: 'Arial' })],
  })
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 22, after: 22 },
    indent: { left: 660, hanging: 190 },
    children: [
      new TextRun({ text: '\u25A0  ', bold: true, size: 17, font: 'Arial' }),
      new TextRun({ text, size: 17, font: 'Arial' }),
    ],
  })
}

function spacer(): Paragraph {
  return new Paragraph({ text: '', spacing: { before: 0, after: 60 } })
}

function normalParagraph(text: string, bold = false): Paragraph {
  return new Paragraph({
    spacing: { before: 50, after: 50 },
    children: [new TextRun({ text, bold, size: 17, font: 'Arial' })],
  })
}

// ─── Linha de assinatura ──────────────────────────────────────────────────────
function signLine(label: string, value?: string): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 280, after: 50 },
      children: [new TextRun({ text: '________________________________________', size: 18, font: 'Arial' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 25 },
      children: [new TextRun({ text: value || label, bold: !!value, size: 17, font: 'Arial' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: label, size: 16, font: 'Arial', color: '666666' })],
    }),
  ]
}

// ─── Rota GET ─────────────────────────────────────────────────────────────────
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

    const enderecoCompleto = [c.endereco, c.numero, c.complemento, c.bairro]
      .filter(Boolean)
      .join(', ') || BLANK
    const cidadeEstado = c.cidade ? `${c.cidade} - ${c.estado || 'RS'}` : BLANK
    const endCidade = enderecoCompleto !== BLANK
      ? `${enderecoCompleto} - ${cidadeEstado}`
      : cidadeEstado
    const chavePix = c.pix_nao_possui ? 'Não possui' : (c.chave_pix || BLANK)
    const telefone = c.celular || c.telefone || BLANK
    const cpfRg = `${c.cpf || BLANK}  /  ${c.rg || BLANK}`

    const doc = new Document({
      sections: [
        {
          properties: {
            page: { margin: { top: 720, right: 800, bottom: 720, left: 800 } },
          },
          children: [
            // ── Cabeçalho ────────────────────────────────────────────────────
            companyHeader('Mega Feira Tecnologia Para Acessos LTDA'),
            title('CONTRATO DE PRESTAÇÃO DE SERVIÇOS AUTÔNOMOS - RPA'),
            subtitle('Operador de Estacionamento | EXPODIRETO 2026 | 08 a 13/03/2026 | Não-Me-Toque/RS'),

            // ── QUALIFICAÇÃO DAS PARTES ───────────────────────────────────────
            sectionHeader('QUALIFICAÇÃO DAS PARTES'),

            partyLabel('CONTRATANTE:'),
            infoTable([
              row2('Razão Social', 'MEGA FEIRA TECNOLOGIA PARA ACESSOS LTDA'),
              row2('CNPJ / Endereço', '32.311.191/0001-07  |  Rua São Joaquim, 1085 - São Leopoldo/RS'),
              row2('Representante', 'Luís Eduardo Dornelles'),
            ]),

            spacer(),
            partyLabel('CONTRATADO(A):'),
            infoTable([
              row2('Nome Completo', c.nome_completo || BLANK),
              row2('CPF / RG', cpfRg),
              row2('Endereço / Cidade', endCidade),
              row2('Telefone / WhatsApp', telefone),
              row2('Dados para Pagamento (Banco / Ag / CC ou PIX)', chavePix),
            ]),

            spacer(),
            normalParagraph(
              'As partes celebram o presente Contrato de Prestação de Serviços Autônomos, regido pela Lei nº 13.429/2017 e pelo art. 442-B da CLT, nas condições abaixo.'
            ),

            // ── CLÁUSULAS CONTRATUAIS ─────────────────────────────────────────
            sectionHeader('CLÁUSULAS CONTRATUAIS'),

            clauseTitle('1', 'DO OBJETO'),
            clauseText(
              'Prestação de serviços autônomos na função de Operador(a) de Estacionamento durante o EXPODIRETO 2026, no período de 08 a 13 de março de 2026, compreendendo: orientação e direcionamento de veículos; controle de acesso e fluxo; atendimento ao público; operação de máquinas de pagamento (débito, crédito e PIX); uso de sistemas e equipamentos da CONTRATANTE; e cumprimento das normas operacionais do evento.'
            ),

            clauseTitle('2', 'DO PRAZO'),
            clauseText(
              'O contrato vigorará de 08 a 13/03/2026, encerrando-se automaticamente ao término do evento, sem necessidade de aviso prévio, não gerando direito a indenização, multa rescisória ou verbas trabalhistas de qualquer natureza. Os dias e horários específicos serão definidos conforme escala operacional.'
            ),

            clauseTitle('3', 'DA REMUNERAÇÃO'),
            clauseText(
              'Remuneração de R$ 150,00 por dia trabalhado (total R$ 900,00 pelos 6 dias), acrescida de ajuda de custo de R$ 30,00/dia para alimentação e transporte (total R$ 180,00), de natureza indenizatória e não salarial. O CONTRATADO(A) sem faltas ou atrasos fará jus ao Prêmio Assiduidade de R$ 200,00.'
            ),
            clauseText(
              'Pagamento no dia 13/03/2026 via PIX/transferência, deduzido adiantamento de R$ 100,00 pago em 08/03/2026. Incidem descontos legais obrigatórios (INSS 11%, IRRF e ISSQN) sobre a remuneração, demonstrados no RPA. Ajuda de custo e prêmio assiduidade não integram a base de cálculo de encargos. Inexiste direito a 13º, férias, FGTS ou quaisquer verbas trabalhistas.'
            ),

            clauseTitle('4', 'DA NATUREZA AUTÔNOMA - INEXISTÊNCIA DE VÍNCULO EMPREGATÍCIO'),
            clauseText(
              'Este contrato é de natureza estritamente civil. Inexiste relação de emprego entre as partes, uma vez que a prestação de serviços é eventual, sem habitualidade, exclusividade, pessoalidade ou subordinação jurídica. O CONTRATADO(A) declara que: (a) exerce atividade por conta própria; (b) pode prestar serviços a outros contratantes; (c) não integra o quadro permanente da CONTRATANTE. A supervisão operacional constitui simples coordenação técnica. Caso qualquer ação trabalhista seja intentada, o CONTRATADO(A) responsabiliza-se por custas, honorários e eventuais perdas e danos causados à CONTRATANTE.'
            ),

            clauseTitle('5', 'DIREITO DE IMAGEM, VOZ E DADOS BIOMÉTRICOS'),
            clauseText(
              'O CONTRATADO(A) autoriza expressamente, de forma gratuita e irrevogável pelo prazo de 5 anos, o uso de sua imagem, nome, voz e atributos de personalidade captados durante o evento para divulgação institucional, redes sociais, marketing e registro histórico da MEGA FEIRA, em qualquer mídia. O valor da Cláusula 3 é contraprestação global pelos serviços e pela cessão de imagem. O CONTRATADO(A) autoriza ainda o tratamento de dados biométricos para controle de acesso, nos termos da LGPD (Lei nº 13.709/2018).'
            ),

            clauseTitle('6', 'OBRIGAÇÕES DO CONTRATADO(A)'),
            bullet('Comparecer nos dias e horários da escala operacional, devidamente uniformizado;'),
            bullet('Manter postura ética e profissional no trato com o público e colegas;'),
            bullet('Zelar pelos equipamentos fornecidos, respondendo por danos causados por uso indevido;'),
            bullet('Comunicar ausências com antecedência mínima de 24 horas;'),
            bullet('Manter sigilo sobre informações operacionais e comerciais da CONTRATANTE;'),
            bullet('Não portar ou consumir bebidas alcoólicas ou substâncias ilícitas durante o serviço.'),

            clauseTitle('7', 'DA RESCISÃO'),
            clauseText(
              'O contrato poderá ser rescindido imediatamente, sem ônus para a CONTRATANTE, em caso de: descumprimento de qualquer cláusula; conduta inadequada; ausência injustificada; uso de álcool ou substâncias ilícitas; ou cancelamento do evento por força maior. Em caso de desistência pelo CONTRATADO(A), será pago apenas o valor proporcional aos dias efetivamente trabalhados.'
            ),

            clauseTitle('8', 'DA SAÚDE, SEGURANÇA E CONFIDENCIALIDADE'),
            clauseText(
              'O CONTRATADO(A) declara estar em plenas condições físicas para execução das atividades (ambiente externo, condições climáticas variadas, esforço físico moderado), não sendo a CONTRATANTE responsável por acidentes decorrentes de negligência ou doenças preexistentes. O CONTRATADO(A) compromete-se a manter sigilo absoluto sobre informações estratégicas, comerciais e financeiras da CONTRATANTE e seus clientes, durante e após o período contratual, sob pena de indenização por perdas e danos.'
            ),

            clauseTitle('9', 'DISPOSIÇÕES GERAIS'),
            clauseText(
              'Este contrato representa o acordo integral entre as partes. Alterações somente terão validade se feitas por escrito e assinadas por ambas as partes. Se qualquer disposição for considerada inválida, as demais permanecerão em vigor. Fica eleito o Foro da Comarca de Não-Me-Toque/RS, renunciando-se a qualquer outro.'
            ),

            spacer(),

            // ── Declaração ───────────────────────────────────────────────────
            new Paragraph({
              spacing: { before: 120, after: 50 },
              children: [new TextRun({ text: 'DECLARAÇÃO:', bold: true, size: 17, font: 'Arial', underline: {} })],
            }),
            normalParagraph(
              'O(A) CONTRATADO(A) declara que leu e compreendeu integralmente este contrato, teve oportunidade de esclarecer suas dúvidas, assina de forma livre e voluntária, e está ciente da natureza autônoma dos serviços e da inexistência de vínculo empregatício.'
            ),

            // ── Local e data ─────────────────────────────────────────────────
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 220, after: 0 },
              children: [
                new TextRun({ text: 'Não-Me-Toque, 08 de Março de 2026.', size: 17, font: 'Arial' }),
              ],
            }),

            // ── Assinaturas ──────────────────────────────────────────────────
            ...signLine('CONTRATANTE', 'MEGA FEIRA TECNOLOGIA PARA ACESSOS LTDA'),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 25, after: 0 },
              children: [new TextRun({ text: 'Luís Eduardo Dornelles - Representante Legal', size: 16, font: 'Arial', color: '666666' })],
            }),
            ...signLine('CONTRATADO(A)', c.nome_completo),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 25, after: 0 },
              children: [new TextRun({ text: `CPF: ${c.cpf || BLANK}  |  RG: ${c.rg || BLANK}`, size: 16, font: 'Arial', color: '666666' })],
            }),

            spacer(),

            // ── Testemunhas ──────────────────────────────────────────────────
            new Paragraph({
              spacing: { before: 120, after: 50 },
              children: [new TextRun({ text: 'TESTEMUNHAS', bold: true, size: 17, font: 'Arial', underline: {} })],
            }),
            infoTable([
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [
                      new Paragraph({
                        spacing: { before: 220, after: 40 },
                        children: [new TextRun({ text: '________________________________________', size: 18, font: 'Arial' })],
                      }),
                      new Paragraph({ children: [new TextRun({ text: 'Testemunha 1', size: 16, font: 'Arial', color: '666666' })] }),
                      new Paragraph({ children: [new TextRun({ text: `Nome: ${BLANK}`, size: 16, font: 'Arial', color: '999999' })] }),
                      new Paragraph({ children: [new TextRun({ text: `CPF: ${BLANK}`, size: 16, font: 'Arial', color: '999999' })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [
                      new Paragraph({
                        spacing: { before: 220, after: 40 },
                        children: [new TextRun({ text: '________________________________________', size: 18, font: 'Arial' })],
                      }),
                      new Paragraph({ children: [new TextRun({ text: 'Testemunha 2', size: 16, font: 'Arial', color: '666666' })] }),
                      new Paragraph({ children: [new TextRun({ text: `Nome: ${BLANK}`, size: 16, font: 'Arial', color: '999999' })] }),
                      new Paragraph({ children: [new TextRun({ text: `CPF: ${BLANK}`, size: 16, font: 'Arial', color: '999999' })] }),
                    ],
                  }),
                ],
              }),
            ]),

            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 140, after: 0 },
              children: [
                new TextRun({ text: 'Mega Feira Tecnologia Para Acessos LTDA | megafeira.com | EXPODIRETO 2026', size: 16, font: 'Arial', color: '888888', italics: true }),
              ],
            }),
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    const safeName = (c.nome_completo as string).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Contrato_RPA_${safeName}.docx"`,
      },
    })
  } catch (error) {
    console.error('Erro ao exportar contrato:', error)
    return NextResponse.json({ error: 'Erro ao exportar contrato' }, { status: 500 })
  }
}
