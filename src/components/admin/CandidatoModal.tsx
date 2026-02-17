'use client'

import { useEffect, useState } from 'react'
import StatusBadge from './StatusBadge'

interface Candidato {
  id: number
  nome_completo: string
  data_nascimento: string
  sexo: string
  estado_civil: string
  nacionalidade: string
  etnia: string
  possui_deficiencia: boolean
  tipo_deficiencia: string
  naturalidade: string
  nome_pai: string
  nome_mae: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  telefone: string
  celular: string
  email: string
  cpf: string
  rg: string
  orgao_emissor: string
  data_emissao_rg: string
  ctps: string
  serie_ctps: string
  pis: string
  titulo_eleitor: string
  zona_eleitoral: string
  secao_eleitoral: string
  possui_dependentes: boolean
  escolaridade: string
  curso: string
  experiencia_eventos: boolean
  experiencia_descricao: string
  cargo_pretendido: string
  disponibilidade: string
  como_soube: string
  observacoes: string
  status: string
  created_at: string
  dependentes: { id: number; nome: string; data_nascimento: string; parentesco: string; cpf: string }[]
}

interface Props {
  candidatoId: number | null
  onClose: () => void
  onStatusChange: () => void
}

export default function CandidatoModal({ candidatoId, onClose, onStatusChange }: Props) {
  const [candidato, setCandidato] = useState<Candidato | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!candidatoId) return
    setLoading(true)
    fetch(`/api/candidatos/${candidatoId}`)
      .then(res => res.json())
      .then(data => setCandidato(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [candidatoId])

  const changeStatus = async (newStatus: string) => {
    if (!candidatoId) return
    await fetch(`/api/candidatos/${candidatoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    onStatusChange()
    onClose()
  }

  const exportWord = () => {
    window.open(`/api/candidatos/${candidatoId}/exportar-word`, '_blank')
  }

  if (!candidatoId) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white border border-mega-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-8 text-center text-mega-text-muted">Carregando...</div>
        ) : candidato ? (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-mega-navy">{candidato.nome_completo}</h2>
                <p className="text-sm text-mega-text-secondary">CPF: {candidato.cpf} | Cadastrado em: {new Date(candidato.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={candidato.status} />
                <button onClick={onClose} className="text-mega-text-muted hover:text-mega-text text-xl">&times;</button>
              </div>
            </div>

            {/* Details sections */}
            <div className="space-y-4 text-sm">
              <Section title="Dados Pessoais">
                <Field label="Nascimento" value={candidato.data_nascimento ? new Date(candidato.data_nascimento).toLocaleDateString('pt-BR') : ''} />
                <Field label="Sexo" value={candidato.sexo} />
                <Field label="Estado Civil" value={candidato.estado_civil} />
                <Field label="Nacionalidade" value={candidato.nacionalidade} />
                <Field label="Etnia" value={candidato.etnia} />
                <Field label="Deficiência" value={candidato.possui_deficiencia ? `Sim - ${candidato.tipo_deficiencia}` : 'Não'} />
                <Field label="Naturalidade" value={candidato.naturalidade} />
                <Field label="Pai" value={candidato.nome_pai} />
                <Field label="Mãe" value={candidato.nome_mae} />
              </Section>

              <Section title="Endereço e Contato">
                <Field label="Endereço" value={`${candidato.endereco}, ${candidato.numero}${candidato.complemento ? ' - ' + candidato.complemento : ''}`} />
                <Field label="Bairro" value={candidato.bairro} />
                <Field label="Cidade/UF" value={`${candidato.cidade}/${candidato.estado}`} />
                <Field label="CEP" value={candidato.cep} />
                <WhatsAppField label="Celular" value={candidato.celular} />
                <Field label="Telefone" value={candidato.telefone} />
                <Field label="E-mail" value={candidato.email} />
              </Section>

              <Section title="Documentos">
                <Field label="CPF" value={candidato.cpf} />
                <Field label="RG" value={`${candidato.rg}${candidato.orgao_emissor ? ' - ' + candidato.orgao_emissor : ''}`} />
                <Field label="CTPS/Série" value={candidato.ctps ? `${candidato.ctps}/${candidato.serie_ctps}` : ''} />
                <Field label="PIS" value={candidato.pis} />
                <Field label="Título Eleitor" value={candidato.titulo_eleitor} />
              </Section>

              {candidato.possui_dependentes && candidato.dependentes?.length > 0 && (
                <Section title="Dependentes">
                  {candidato.dependentes.map((dep, i) => (
                    <Field key={i} label={dep.parentesco} value={`${dep.nome}${dep.cpf ? ' - CPF: ' + dep.cpf : ''}`} />
                  ))}
                </Section>
              )}

              <Section title="Informações Adicionais">
                <Field label="Escolaridade" value={candidato.escolaridade} />
                <Field label="Curso" value={candidato.curso} />
                <Field label="Cargo" value={candidato.cargo_pretendido} />
                <Field label="Disponibilidade" value={candidato.disponibilidade} />
                <Field label="Exp. Eventos" value={candidato.experiencia_eventos ? 'Sim' : 'Não'} />
                {candidato.experiencia_descricao && <Field label="Descrição" value={candidato.experiencia_descricao} />}
                <Field label="Como soube" value={candidato.como_soube} />
                {candidato.observacoes && <Field label="Observações" value={candidato.observacoes} />}
              </Section>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-mega-border flex flex-wrap gap-2">
              <span className="text-sm text-mega-text-secondary mr-2 self-center">Alterar status:</span>
              {['novo', 'em_analise', 'aprovado', 'reprovado', 'contratado'].map((s) => (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  disabled={candidato.status === s}
                  className="px-3 py-1.5 text-xs rounded-lg border border-mega-border hover:border-mega-teal text-mega-text-secondary hover:text-mega-navy transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {s === 'novo' ? 'Novo' : s === 'em_analise' ? 'Em Análise' : s === 'aprovado' ? 'Aprovado' : s === 'reprovado' ? 'Reprovado' : 'Contratado'}
                </button>
              ))}
              <button
                onClick={exportWord}
                className="ml-auto px-4 py-1.5 text-xs rounded-lg bg-mega-teal hover:bg-mega-teal-hover text-white font-medium transition-colors"
              >
                Exportar Word
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-red-500">Erro ao carregar candidato</div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-mega-border rounded-lg p-4">
      <h3 className="text-mega-teal font-semibold text-xs uppercase mb-2">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div>
      <span className="text-mega-text-muted">{label}: </span>
      <span className="text-mega-text">{value || '—'}</span>
    </div>
  )
}

function WhatsAppField({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) return <Field label={label} value={value} />
  const digits = value.replace(/\D/g, '')
  const phone = digits.startsWith('55') ? digits : `55${digits}`
  return (
    <div>
      <span className="text-mega-text-muted">{label}: </span>
      <a
        href={`https://wa.me/${phone}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-600 hover:text-green-700 font-medium underline"
      >
        {value}
      </a>
    </div>
  )
}
