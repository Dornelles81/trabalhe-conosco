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
        children: [new TextRun({ text: text || BLANK, bold, size: 18, font: 'Arial' })],
        spacing: { before: 60, after: 60 },
        indent: { left: 80, right: 80 },
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

function row4(l1: string, v1: string, l2: string, v2: string): TableRow {
  return new TableRow({
    children: [labelCell(l1, 20), valueCell(v1, 30), labelCell(l2, 20), valueCell(v2, 30)],
  })
}

function infoTable(rows: TableRow[]): Table {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })
}

// ─── Helpers de parágrafo ─────────────────────────────────────────────────────
function title(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, font: 'Arial' })],
  })
}

function subtitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 300 },
    children: [new TextRun({ text, bold: true, size: 22, font: 'Arial', color: '2E4057' })],
  })
}

function sectionHeader(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 20,
        font: 'Arial',
        color: '1A3C5E',
        underline: {},
      }),
    ],
  })
}

function clauseTitle(num: string, text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 60 },
    children: [
      new TextRun({ text: `${num} - ${text}`, bold: true, size: 19, font: 'Arial' }),
    ],
  })
}

function clauseText(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    indent: { left: 360 },
    children: [new TextRun({ text, size: 18, font: 'Arial' })],
  })
}

function subparagraph(num: string, text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: `${num} `, bold: true, size: 18, font: 'Arial' }),
      new TextRun({ text, size: 18, font: 'Arial' }),
    ],
  })
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 30, after: 30 },
    indent: { left: 720, hanging: 200 },
    children: [
      new TextRun({ text: '\u25CF  ', bold: true, size: 18, font: 'Arial' }),
      new TextRun({ text, size: 18, font: 'Arial' }),
    ],
  })
}

function spacer(): Paragraph {
  return new Paragraph({ text: '', spacing: { before: 0, after: 80 } })
}

// ─── Tabela de datas/horários (em branco para preenchimento) ──────────────────
function scheduleTable(): Table {
  const headerRow = new TableRow({
    children: [
      labelCell('Data', 34),
      labelCell('Horário de Início', 33),
      labelCell('Horário de Término', 33),
    ],
  })
  const blankRows = Array.from({ length: 3 }, () =>
    new TableRow({
      children: [valueCell(''), valueCell(''), valueCell('')],
    })
  )
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...blankRows] })
}

// ─── Tabela de remuneração (em branco) ───────────────────────────────────────
function paymentTable(): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [labelCell('Descrição', 70), labelCell('Valor (R$)', 30)] }),
      new TableRow({ children: [valueCell('Diária(s): _____ x R$ _______', 70), valueCell('', 30)] }),
      new TableRow({ children: [valueCell('Adicional por hora extra (se houver)', 70), valueCell('', 30)] }),
      new TableRow({ children: [labelCell('Total Bruto', 70), valueCell('', 30)] }),
    ],
  })
}

// ─── Linha de assinatura ──────────────────────────────────────────────────────
function signLine(label: string, value?: string): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 60 },
      children: [new TextRun({ text: '________________________________________', size: 18, font: 'Arial' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [new TextRun({ text: value || label, bold: !!value, size: 18, font: 'Arial' })],
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

    const enderecoCompleto = [c.endereco, c.numero, c.complemento]
      .filter(Boolean)
      .join(', ') || BLANK
    const cidadeEstado = [c.cidade, c.estado].filter(Boolean).join(' - ') || BLANK
    const chavePix = c.pix_nao_possui ? 'Não possui' : (c.chave_pix || BLANK)

    const doc = new Document({
      sections: [
        {
          properties: {
            page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } },
          },
          children: [
            // ── Cabeçalho ──────────────────────────────────────────────────────
            title('CONTRATO DE PRESTAÇÃO DE SERVIÇOS AUTÔNOMOS'),
            title('(Recibo de Pagamento Autônomo - RPA)'),
            subtitle('EXPODIRETO 2026'),

            // ── IDENTIFICAÇÃO DAS PARTES ────────────────────────────────────────
            sectionHeader('IDENTIFICAÇÃO DAS PARTES'),

            new Paragraph({
              spacing: { before: 100, after: 80 },
              children: [new TextRun({ text: 'CONTRATANTE', bold: true, size: 20, font: 'Arial', color: '1A3C5E' })],
            }),
            infoTable([
              row2('Razão Social', 'MEGA FEIRA TECNOLOGIA PARA ACESSOS LTDA'),
              row2('CNPJ', BLANK),
              row2('Endereço', BLANK),
              row2('Cidade / Estado', 'Ijuí - Rio Grande do Sul'),
              row2('Representante Legal', BLANK),
              row2('CPF do Representante', BLANK),
            ]),

            spacer(),
            new Paragraph({
              spacing: { before: 100, after: 80 },
              children: [new TextRun({ text: 'CONTRATADO(A)', bold: true, size: 20, font: 'Arial', color: '1A3C5E' })],
            }),
            infoTable([
              row2('Nome Completo', c.nome_completo || BLANK),
              row4('CPF', c.cpf || BLANK, 'RG', c.rg || BLANK),
              row2('Endereço Completo', enderecoCompleto),
              row2('Cidade / Estado', cidadeEstado),
              row4('Telefone / WhatsApp', c.celular || c.telefone || BLANK, 'E-mail', c.email || BLANK),
              row2('Banco / Agência / Conta', BLANK),
              row2('Chave PIX', chavePix),
            ]),

            spacer(),

            // ── Cláusula 1 ──────────────────────────────────────────────────────
            clauseTitle('Cláusula 1ª', 'DO OBJETO DO CONTRATO'),
            clauseText(
              'O(A) CONTRATADO(A), na qualidade de profissional autônomo(a), obriga-se a prestar os serviços descritos abaixo para a CONTRATANTE, por ocasião do evento EXPODIRETO 2026, realizado na Cotrijal - Não-Me-Toque/RS, nas datas estabelecidas na Cláusula 2ª:'
            ),
            spacer(),
            infoTable([
              row2('Função / Cargo', BLANK),
              row2('Descrição das Atividades', BLANK),
            ]),

            spacer(),

            // ── Cláusula 2 ──────────────────────────────────────────────────────
            clauseTitle('Cláusula 2ª', 'DO PERÍODO E LOCAL DE PRESTAÇÃO'),
            clauseText(
              'Os serviços serão prestados nas seguintes datas e horários, na Cotrijal, município de Não-Me-Toque, RS:'
            ),
            spacer(),
            scheduleTable(),
            spacer(),
            subparagraph(
              'Parágrafo Único:',
              'A jornada diária e o calendário acima poderão ser ajustados mediante comum acordo entre as partes, desde que notificado com antecedência mínima de 24 (vinte e quatro) horas.'
            ),

            spacer(),

            // ── Cláusula 3 ──────────────────────────────────────────────────────
            clauseTitle('Cláusula 3ª', 'DA REMUNERAÇÃO E FORMA DE PAGAMENTO'),
            clauseText(
              `Pelos serviços prestados, a CONTRATANTE pagará ao(à) CONTRATADO(A) o valor total de R$ ${BLANK} (${BLANK}), conforme detalhamento abaixo:`
            ),
            spacer(),
            paymentTable(),
            spacer(),
            subparagraph(
              '§1º',
              `O pagamento será realizado em até _____ dias úteis após o encerramento do evento, mediante emissão de Recibo de Pagamento Autônomo (RPA) devidamente preenchido e assinado pelo(a) CONTRATADO(A), por PIX, TED ou DOC para os dados bancários informados neste instrumento.`
            ),
            subparagraph(
              '§2º',
              'Sobre o valor bruto incidirá desconto de INSS (alíquota: 11% ou conforme tabela vigente) e IRRF (conforme tabela progressiva do Imposto de Renda), cujos recolhimentos serão efetuados pela CONTRATANTE na condição de fonte pagadora, na forma da legislação vigente.'
            ),
            subparagraph(
              '§3º',
              'O(A) CONTRATADO(A) declara estar ciente que os descontos previdenciários e fiscais acima não descaracterizam a relação autônoma, nos termos da Lei nº 8.212/91 e do Regulamento da Previdência Social.'
            ),

            spacer(),

            // ── Cláusula 4 ──────────────────────────────────────────────────────
            clauseTitle('Cláusula 4ª', 'DA NATUREZA JURÍDICA DA RELAÇÃO - AUSÊNCIA DE VÍNCULO EMPREGATÍCIO'),
            clauseText(
              'A presente contratação tem natureza exclusivamente civil, caracterizando-se como prestação de serviços autônoma, de natureza eventual e por prazo determinado, NÃO gerando, em hipótese alguma, vínculo empregatício, relação de emprego, subordinação continuada ou quaisquer outros direitos decorrentes da Consolidação das Leis do Trabalho (CLT) entre as partes.'
            ),
            subparagraph(
              '§1º',
              'O(A) CONTRATADO(A) não fará jus a férias, 13º salário, FGTS, aviso prévio, horas extras além do acordado, adicional noturno ou qualquer outro benefício trabalhista.'
            ),
            subparagraph(
              '§2º',
              'O(A) CONTRATADO(A) poderá prestar serviços a outras empresas e pessoas físicas, durante ou após o período deste contrato, não existindo qualquer cláusula de exclusividade salvo se expressamente ajustado por escrito em aditivo contratual.'
            ),
            subparagraph(
              '§3º',
              'A CONTRATANTE não responderá por dívidas, obrigações ou atos praticados pelo(a) CONTRATADO(A) perante terceiros, sendo este(a) o(a) único(a) responsável por seus atos durante a prestação dos serviços.'
            ),

            spacer(),

            // ── Cláusula 5 ──────────────────────────────────────────────────────
            clauseTitle('Cláusula 5ª', 'DAS OBRIGAÇÕES DO(A) CONTRATADO(A)'),
            clauseText('O(A) CONTRATADO(A) obriga-se a:'),
            bullet('Prestar os serviços contratados com diligência, competência técnica e conduta ética;'),
            bullet('Comparecer nos dias, horários e local previstos na Cláusula 2ª, ou comunicar eventuais impedimentos com antecedência mínima de 24 (vinte e quatro) horas;'),
            bullet('Utilizar uniforme ou vestimenta padronizada fornecida ou indicada pela CONTRATANTE durante o período do evento;'),
            bullet('Zelar pelos equipamentos, instalações e materiais disponibilizados pela CONTRATANTE, sendo responsável por danos causados por dolo ou negligência;'),
            bullet('Manter sigilo sobre informações confidenciais, estratégias, dados de clientes e tecnologias da CONTRATANTE durante e após a vigência deste contrato;'),
            bullet('Apresentar-se sóbrio(a) e em condições de exercer suas funções, sendo vedado o consumo de bebidas alcoólicas ou substâncias ilícitas durante o serviço;'),
            bullet('Portar documento de identidade durante toda a prestação de serviços;'),
            bullet('Assinar o Recibo de Pagamento Autônomo (RPA) ao final do evento para viabilizar o pagamento.'),

            spacer(),

            // ── Cláusula 6 ──────────────────────────────────────────────────────
            clauseTitle('Cláusula 6ª', 'DAS OBRIGAÇÕES DA CONTRATANTE'),
            clauseText('A CONTRATANTE obriga-se a:'),
            bullet('Remunerar o(a) CONTRATADO(A) na forma e prazo estabelecidos na Cláusula 3ª;'),
            bullet('Fornecer as orientações técnicas e operacionais necessárias ao exercício das funções;'),
            bullet('Disponibilizar os equipamentos e materiais indispensáveis ao desempenho dos serviços, quando aplicável;'),
            bullet('Efetuar os recolhimentos de INSS e IRRF devidos, na condição de fonte pagadora;'),
            bullet('Garantir condições adequadas de trabalho durante o evento, em conformidade com as normas de segurança do trabalho aplicáveis;'),
            bullet('Notificar o(a) CONTRATADO(A) em caso de alteração de escala ou cancelamento de datas com a maior antecedência possível.'),

            spacer(),

            // ── Cláusula 7 ──────────────────────────────────────────────────────
            clauseTitle('Cláusula 7ª', 'DO SIGILO E CONFIDENCIALIDADE'),
            clauseText(
              'O(A) CONTRATADO(A) compromete-se a manter em absoluto sigilo todas as informações técnicas, operacionais, comerciais, financeiras e estratégicas da CONTRATANTE, de seus clientes e parceiros às quais tiver acesso em razão da prestação dos serviços, durante a vigência deste contrato e pelo prazo de 2 (dois) anos após seu término.'
            ),
            subparagraph(
              'Parágrafo Único:',
              'A violação desta cláusula implicará no pagamento, pelo(a) CONTRATADO(A), de indenização por perdas e danos, sem prejuízo das sanções penais cabíveis.'
            ),

            spacer(),

            // ── Cláusula 8 ──────────────────────────────────────────────────────
            clauseTitle('Cláusula 8ª', 'DA PROPRIEDADE INTELECTUAL'),
            clauseText(
              'Todo e qualquer produto, criação, desenvolvimento ou material produzido pelo(a) CONTRATADO(A) no exercício das atividades objeto deste contrato pertencerá exclusivamente à CONTRATANTE, nos termos da Lei de Propriedade Intelectual (Lei nº 9.279/96) e da Lei de Direitos Autorais (Lei nº 9.610/98), sendo vedada ao(à) CONTRATADO(A) qualquer divulgação, reprodução ou uso posterior sem autorização expressa e por escrito.'
            ),

            spacer(),

            // ── Cláusula 9 ──────────────────────────────────────────────────────
            clauseTitle('Cláusula 9ª', 'DA RESCISÃO E PENALIDADES'),
            clauseText('Este contrato poderá ser rescindido:'),
            bullet('Por qualquer das partes, mediante comunicação por escrito (WhatsApp ou e-mail) com antecedência mínima de 48 (quarenta e oito) horas, sem penalidades;'),
            bullet('Imediatamente, pela CONTRATANTE, em caso de descumprimento de qualquer obrigação prevista na Cláusula 5ª, sem direito à indenização pelo período não trabalhado;'),
            bullet('Imediatamente, pelo(a) CONTRATADO(A), em caso de descumprimento, pela CONTRATANTE, das obrigações previstas na Cláusula 6ª.'),
            subparagraph(
              '§1º',
              'Em caso de desistência pelo(a) CONTRATADO(A) após a confirmação da escala e sem justificativa, dentro do prazo de 48 horas do início da prestação, fica o(a) CONTRATADO(A) sujeito(a) ao pagamento de multa equivalente a 20% (vinte por cento) do valor total contratado a título de perdas e danos, a ser compensado em eventuais valores devidos.'
            ),
            subparagraph(
              '§2º',
              'Em caso de rescisão por parte da CONTRATANTE sem justa causa e após o início da prestação dos serviços, esta deverá pagar os serviços já realizados proporcionalmente ao período trabalhado.'
            ),

            spacer(),

            // ── Cláusula 10 ─────────────────────────────────────────────────────
            clauseTitle('Cláusula 10ª', 'DA SAÚDE, SEGURANÇA E CONDUTA'),
            clauseText(
              'O(A) CONTRATADO(A) declara estar em plenas condições de saúde para exercer as atividades contratadas. A CONTRATANTE não se responsabiliza por acidentes, doenças ou sinistros decorrentes de omissão de informações de saúde pelo(a) CONTRATADO(A).'
            ),
            subparagraph(
              'Parágrafo Único:',
              'O(A) CONTRATADO(A) deverá observar as normas internas da CONTRATANTE e do local do evento, incluindo regras de segurança, acesso e conduta, sob pena de rescisão imediata do presente contrato.'
            ),

            spacer(),

            // ── Cláusula 11 ─────────────────────────────────────────────────────
            clauseTitle('Cláusula 11ª', 'DAS DISPOSIÇÕES GERAIS'),
            subparagraph(
              '§1º',
              'Este contrato é celebrado em caráter pessoal e intransferível, não podendo o(a) CONTRATADO(A) substabelecer ou subcontratar as atividades para terceiros sem autorização prévia e por escrito da CONTRATANTE.'
            ),
            subparagraph(
              '§2º',
              'O(A) CONTRATADO(A) declara que leu, compreendeu e concorda integralmente com todas as cláusulas deste instrumento.'
            ),
            subparagraph(
              '§3º',
              'Este contrato poderá ser assinado eletronicamente, por meio de plataformas de assinatura digital reconhecidas, com plena validade jurídica, nos termos da Lei nº 14.063/2020 e do art. 10, §2º, da MP nº 2.200-2/2001.'
            ),
            subparagraph(
              '§4º',
              'As partes elegem o Foro da Comarca de Ijuí/RS para dirimir quaisquer controvérsias oriundas deste instrumento, renunciando a qualquer outro, por mais privilegiado que seja.'
            ),
            subparagraph(
              '§5º',
              'Na omissão deste contrato, aplicam-se as disposições do Código Civil Brasileiro (Lei nº 10.406/2002), especialmente os artigos 593 a 609.'
            ),

            spacer(),

            // ── Cláusula 12 ─────────────────────────────────────────────────────
            clauseTitle('Cláusula 12ª', 'DO FORO'),
            clauseText(
              'As partes elegem o Foro da Comarca de Ijuí, Estado do Rio Grande do Sul, para dirimir quaisquer controvérsias decorrentes deste instrumento, com renúncia expressa a qualquer outro foro, por mais privilegiado que seja.'
            ),

            spacer(),

            // ── Local e data ─────────────────────────────────────────────────────
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 0 },
              children: [
                new TextRun({
                  text: `Não-Me-Toque/RS, _______ de ________________ de 2026.`,
                  size: 18,
                  font: 'Arial',
                }),
              ],
            }),

            // ── Assinaturas ──────────────────────────────────────────────────────
            ...signLine('CONTRATANTE', 'MEGA FEIRA TECNOLOGIA PARA ACESSOS LTDA'),
            ...signLine('CONTRATADO(A)', c.nome_completo),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 0 },
              children: [new TextRun({ text: `CPF: ${c.cpf || BLANK}  |  RG: ${c.rg || BLANK}`, size: 16, font: 'Arial', color: '666666' })],
            }),

            spacer(),

            // ── Testemunhas ──────────────────────────────────────────────────────
            new Paragraph({
              spacing: { before: 200, after: 60 },
              children: [new TextRun({ text: 'TESTEMUNHAS', bold: true, size: 18, font: 'Arial', underline: {} })],
            }),
            infoTable([
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [
                      new Paragraph({
                        spacing: { before: 300, after: 40 },
                        children: [new TextRun({ text: '________________________________________', size: 18, font: 'Arial' })],
                      }),
                      new Paragraph({ children: [new TextRun({ text: '1ª Testemunha', size: 16, font: 'Arial', color: '666666' })] }),
                      new Paragraph({ children: [new TextRun({ text: `CPF: ${BLANK}`, size: 16, font: 'Arial', color: '999999' })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [
                      new Paragraph({
                        spacing: { before: 300, after: 40 },
                        children: [new TextRun({ text: '________________________________________', size: 18, font: 'Arial' })],
                      }),
                      new Paragraph({ children: [new TextRun({ text: '2ª Testemunha', size: 16, font: 'Arial', color: '666666' })] }),
                      new Paragraph({ children: [new TextRun({ text: `CPF: ${BLANK}`, size: 16, font: 'Arial', color: '999999' })] }),
                    ],
                  }),
                ],
              }),
            ]),

            spacer(),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 0 },
              children: [
                new TextRun({ text: 'Este documento possui validade jurídica. Guarde uma via assinada.', size: 16, font: 'Arial', color: '888888', italics: true }),
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
