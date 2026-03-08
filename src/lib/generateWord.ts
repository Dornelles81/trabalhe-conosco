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
  HeadingLevel,
} from 'docx'

const COL_WIDTHS = [20, 30, 20, 30]

function makeCell(text: string, bold: boolean, width: number, span?: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    columnSpan: span,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
    },
    children: [
      new Paragraph({
        children: [new TextRun({ text: text || '—', bold, size: 18, font: 'Arial' })],
        spacing: { before: 40, after: 40 },
      }),
    ],
  })
}

function labelCell(text: string, width: number): TableCell {
  return makeCell(text, true, width)
}

function valueCell(text: string, width: number, span?: number): TableCell {
  return makeCell(text, false, width, span)
}

function row(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      labelCell(label, COL_WIDTHS[0]),
      valueCell(value, COL_WIDTHS[1] + COL_WIDTHS[2] + COL_WIDTHS[3], 3),
    ],
  })
}

function row4(l1: string, v1: string, l2: string, v2: string): TableRow {
  return new TableRow({
    children: [
      labelCell(l1, COL_WIDTHS[0]),
      valueCell(v1, COL_WIDTHS[1]),
      labelCell(l2, COL_WIDTHS[2]),
      valueCell(v2, COL_WIDTHS[3]),
    ],
  })
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const normalized = String(dateStr).includes('T') ? String(dateStr) : `${dateStr}T00:00:00`
    const d = new Date(normalized)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateWordBuffer(c: Record<string, any>, dependentes: Record<string, any>[]): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'MEGA FEIRA', bold: true, size: 28, font: 'Arial' })],
            spacing: { after: 60 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'FICHA DE CADASTRO DE CANDIDATO', bold: true, size: 22, font: 'Arial' })],
            spacing: { after: 200 },
          }),

          // Dados Pessoais
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'DADOS PESSOAIS', bold: true, size: 20, font: 'Arial' })],
            spacing: { before: 200, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              row('Nome Completo', c.nome_completo),
              row4('Data Nasc.', formatDate(c.data_nascimento), 'Sexo', c.sexo),
              row4('Estado Civil', c.estado_civil, 'Nacionalidade', c.nacionalidade),
              row4('Etnia', c.etnia || '—', 'Deficiência', c.possui_deficiencia ? `Sim - ${c.tipo_deficiencia}` : 'Não'),
              row('Naturalidade', c.naturalidade || '—'),
              row('Nome do Pai', c.nome_pai || '—'),
              row('Nome da Mãe', c.nome_mae || '—'),
            ],
          }),

          // Endereço
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'ENDEREÇO E CONTATO', bold: true, size: 20, font: 'Arial' })],
            spacing: { before: 200, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              row4('CEP', c.cep, 'Estado', c.estado),
              row('Endereço', `${c.endereco}, ${c.numero}${c.complemento ? ' - ' + c.complemento : ''}`),
              row4('Bairro', c.bairro, 'Cidade', c.cidade),
              row4('Celular', c.celular, 'Telefone', c.telefone || '—'),
              row('E-mail', c.email || '—'),
            ],
          }),

          // Documentos
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'DOCUMENTOS', bold: true, size: 20, font: 'Arial' })],
            spacing: { before: 200, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              row4('CPF', c.cpf, 'RG', c.rg),
              row4('Órgão Emissor', c.orgao_emissor || '—', 'Data Emissão', formatDate(c.data_emissao_rg)),
              row('Chave PIX', c.pix_nao_possui ? 'Não possui' : (c.chave_pix || '—')),
            ],
          }),

          // Dependentes
          ...(c.possui_dependentes && dependentes.length > 0
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_2,
                  children: [new TextRun({ text: 'DEPENDENTES', bold: true, size: 20, font: 'Arial' })],
                  spacing: { before: 200, after: 100 },
                }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        labelCell('Nome', 35),
                        labelCell('Nascimento', 20),
                        labelCell('Parentesco', 20),
                        labelCell('CPF', 25),
                      ],
                    }),
                    ...dependentes.map(
                      (dep) =>
                        new TableRow({
                          children: [
                            valueCell(String(dep.nome || ''), 35),
                            valueCell(formatDate(dep.data_nascimento as string), 20),
                            valueCell(String(dep.parentesco || ''), 20),
                            valueCell(String(dep.cpf || '—'), 25),
                          ],
                        })
                    ),
                  ],
                }),
              ]
            : []),

          // Informações Adicionais
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'INFORMAÇÕES ADICIONAIS', bold: true, size: 20, font: 'Arial' })],
            spacing: { before: 200, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              row4('Escolaridade', c.escolaridade || '—', 'Curso', c.curso || '—'),
              row4('Cargo Pretendido', c.cargo_pretendido || '—', 'Disponibilidade', c.disponibilidade || '—'),
              row4('Exp. Eventos', c.experiencia_eventos ? 'Sim' : 'Não', 'Como soube', c.como_soube || '—'),
              ...(c.experiencia_descricao ? [row('Exp. em Eventos (Detalhe)', c.experiencia_descricao)] : []),
              ...(c.experiencia_profissional ? [row('Experiência Profissional', c.experiencia_profissional)] : []),
              ...(c.observacoes ? [row('Observações', c.observacoes)] : []),
              row4('Doc. Frente (CNH/RG)', c.doc_frente_nome || 'Não anexado', 'Doc. Verso (CNH/RG)', c.doc_verso_nome || 'Não anexado'),
              row('Currículo', c.curriculo_nome || 'Não anexado'),
            ],
          }),

          // Declaração
          new Paragraph({
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: 'Declaro, para os devidos fins, que todas as informações fornecidas neste cadastro são verdadeiras e de minha inteira responsabilidade, estando ciente de que a prestação de informações falsas poderá implicar na desclassificação do processo seletivo.',
                size: 18,
                font: 'Arial',
                italics: true,
              }),
            ],
          }),

          // Recibo (2 vias)
          ...[1, 2].flatMap((via) => [
            new Paragraph({
              spacing: { before: 500, after: 100 },
              children: [new TextRun({ text: `Via ${via}`, bold: true, size: 18, font: 'Arial', color: '888888' })],
            }),
            new Paragraph({
              spacing: { before: 0, after: 100 },
              children: [
                new TextRun({ text: `Eu, ${c.nome_completo}, declaro que recebi a importância de R$ __________________ da empresa `, size: 18, font: 'Arial' }),
                new TextRun({ text: 'Mega Feira', bold: true, size: 18, font: 'Arial' }),
                new TextRun({ text: ' na data ____/____/________.', size: 18, font: 'Arial' }),
              ],
            }),
            new Paragraph({ text: '', spacing: { before: 300 } }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: '________________________________________', size: 18, font: 'Arial' })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: c.nome_completo, size: 18, font: 'Arial' })],
              spacing: { before: 60 },
            }),
          ]),
        ],
      },
    ],
  })

  return Packer.toBuffer(doc)
}

export function safeName(nome: string): string {
  return nome.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')
}
