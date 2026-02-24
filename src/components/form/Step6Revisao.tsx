'use client'

import Button from '@/components/ui/Button'
import type { FormData } from '@/lib/validations'

function formatDate(iso: string | undefined): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

interface Props {
  data: FormData
  onPrev: () => void
  onSubmit: () => void
  onReset: () => void
  isSubmitting: boolean
  goToStep: (step: number) => void
}

function Section({
  title,
  step,
  goToStep,
  children,
}: {
  title: string
  step: number
  goToStep: (step: number) => void
  children: React.ReactNode
}) {
  return (
    <div className="border border-mega-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-mega-teal">{title}</h3>
        <button
          type="button"
          onClick={() => goToStep(step)}
          className="text-xs text-mega-text-muted hover:text-mega-teal transition-colors"
        >
          Editar
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
        {children}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | boolean }) {
  const display = typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : (value || '—')
  return (
    <div className="py-1">
      <span className="text-mega-text-muted">{label}: </span>
      <span className="text-mega-text">{display}</span>
    </div>
  )
}

export default function Step6Revisao({ data, onPrev, onSubmit, onReset, isSubmitting, goToStep }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-mega-navy mb-6">Revisão do Cadastro</h2>
      <p className="text-sm text-mega-text-secondary mb-4">
        Confira seus dados antes de enviar. Clique em &quot;Editar&quot; para corrigir qualquer informação.
      </p>

      <Section title="Dados Pessoais" step={1} goToStep={goToStep}>
        <Field label="Nome" value={data.nome_completo} />
        <Field label="Nascimento" value={formatDate(data.data_nascimento)} />
        <Field label="Sexo" value={data.sexo} />
        <Field label="Estado Civil" value={data.estado_civil} />
        <Field label="Nacionalidade" value={data.nacionalidade} />
        <Field label="Etnia" value={data.etnia} />
        <Field label="Possui Deficiência" value={data.possui_deficiencia} />
        {data.possui_deficiencia && (
          <Field label="Tipo de Deficiência" value={data.tipo_deficiencia} />
        )}
        <Field label="Naturalidade" value={data.naturalidade} />
        <Field label="Nome do Pai" value={data.nome_pai} />
        <Field label="Nome da Mãe" value={data.nome_mae} />
      </Section>

      <Section title="Endereço e Contato" step={2} goToStep={goToStep}>
        <Field label="CEP" value={data.cep} />
        <Field label="Endereço" value={`${data.endereco}, ${data.numero}`} />
        <Field label="Complemento" value={data.complemento} />
        <Field label="Bairro" value={data.bairro} />
        <Field label="Cidade" value={`${data.cidade}/${data.estado}`} />
        <Field label="Celular" value={data.celular} />
        <Field label="Telefone" value={data.telefone} />
        <Field label="E-mail" value={data.email} />
      </Section>

      <Section title="Documentos" step={3} goToStep={goToStep}>
        <Field label="CPF" value={data.cpf} />
        <Field label="RG" value={data.rg} />
        <Field label="Órgão Emissor" value={data.orgao_emissor} />
        <Field label="Data Emissão RG" value={formatDate(data.data_emissao_rg)} />
        <Field label="PIS/PASEP" value={data.pis} />
      </Section>

      <Section title="Informações Adicionais" step={4} goToStep={goToStep}>
        <Field label="Escolaridade" value={data.escolaridade} />
        <Field label="Curso" value={data.curso} />
        <Field label="Experiência em Eventos" value={data.experiencia_eventos} />
        {data.experiencia_eventos && (
          <Field label="Descrição" value={data.experiencia_descricao} />
        )}
        <Field label="Como soube" value={data.como_soube} />
        <Field label="Documento (CNH/RG)" value={data.documento_foto_nome || '—'} />
      </Section>

      <div className="flex justify-between pt-4">
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onPrev}>Anterior</Button>
          <Button type="button" variant="secondary" onClick={onReset}>Limpar</Button>
        </div>
        <Button onClick={onSubmit} loading={isSubmitting}>
          Enviar Cadastro
        </Button>
      </div>
    </div>
  )
}
