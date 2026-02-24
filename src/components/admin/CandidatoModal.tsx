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
  possui_dependentes: boolean
  escolaridade: string
  curso: string
  experiencia_eventos: boolean
  experiencia_descricao: string
  cargo_pretendido: string
  disponibilidade: string
  como_soube: string
  observacoes: string
  documento_foto: string
  documento_foto_nome: string
  documento_foto_tipo: string
  curriculo: string
  curriculo_nome: string
  curriculo_tipo: string
  experiencia_profissional: string
  status: string
  created_at: string
  premiacao_override: number | null
  dependentes: { id: number; nome: string; data_nascimento: string; parentesco: string; cpf: string }[]
}

interface Presenca {
  id: number
  candidato_id: number
  dia_numero: number
  periodo: string
  observacao: string | null
}

interface EventoConfig {
  dias_total: number
  valor_diaria: number
  premiacao: number
}

interface Props {
  candidatoId: number | null
  onClose: () => void
  onStatusChange: () => void
}

const PERIODOS = [
  { abrev: 'DI', full: 'Dia Inteiro', mult: 1 },
  { abrev: 'M',  full: 'Manhã',       mult: 0.5 },
  { abrev: 'T',  full: 'Tarde',       mult: 0.5 },
  { abrev: 'N',  full: 'Noite',       mult: 0.5 },
]

function fmtValor(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function calcMult(periodo: string) {
  return PERIODOS.find(p => p.full === periodo)?.mult ?? 1
}

export default function CandidatoModal({ candidatoId, onClose, onStatusChange }: Props) {
  const [candidato, setCandidato] = useState<Candidato | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dados' | 'presencas'>('dados')

  // Presenças state
  const [presencas, setPresencas] = useState<Presenca[]>([])
  const [loadingPresencas, setLoadingPresencas] = useState(false)
  const [eventoConfig, setEventoConfig] = useState<EventoConfig>({ dias_total: 6, valor_diaria: 180, premiacao: 0 })
  const [selectedDia, setSelectedDia] = useState<number | null>(null)
  const [diaObs, setDiaObs] = useState('')
  const [savingDia, setSavingDia] = useState(false)
  const [diaError, setDiaError] = useState('')

  // Premiação override
  const [editingPremiacao, setEditingPremiacao] = useState(false)
  const [premiacaoInput, setPremiacaoInput] = useState('')
  const [savingPremiacao, setSavingPremiacao] = useState(false)

  useEffect(() => {
    if (!candidatoId) return
    setLoading(true)
    setActiveTab('dados')
    setSelectedDia(null)
    fetch(`/api/candidatos/${candidatoId}`)
      .then(res => res.json())
      .then(data => setCandidato(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [candidatoId])

  const loadPresencas = () => {
    if (!candidatoId) return
    setLoadingPresencas(true)
    Promise.all([
      fetch(`/api/candidatos/${candidatoId}/presencas`).then(r => r.json()),
      fetch('/api/evento-config').then(r => r.json()),
    ])
      .then(([pres, config]) => {
        setPresencas(Array.isArray(pres) ? pres : [])
        setEventoConfig(config)
      })
      .catch(console.error)
      .finally(() => setLoadingPresencas(false))
  }

  const handleTabChange = (tab: 'dados' | 'presencas') => {
    setActiveTab(tab)
    setSelectedDia(null)
    setDiaError('')
    if (tab === 'presencas') loadPresencas()
  }

  // Mapa dia_numero → presença para O(1)
  const presencaMap = new Map(presencas.map(p => [p.dia_numero, p]))

  const handleDiaClick = (dia: number) => {
    setDiaError('')
    setSelectedDia(prev => {
      if (prev === dia) return null
      const pres = presencaMap.get(dia)
      setDiaObs(pres?.observacao ?? '')
      return dia
    })
  }

  const handlePeriodo = async (dia: number, periodoFull: string) => {
    if (!candidatoId || savingDia) return
    setSavingDia(true)
    setDiaError('')

    const pres = presencaMap.get(dia)

    if (pres?.periodo === periodoFull) {
      // Clicar no período ativo → remover
      const res = await fetch(`/api/candidatos/${candidatoId}/presencas/${pres.id}`, { method: 'DELETE' })
      if (res.ok) {
        setPresencas(prev => prev.filter(p => p.id !== pres.id))
        setSelectedDia(null)
        setDiaObs('')
      }
    } else {
      // Criar ou trocar período (upsert)
      const res = await fetch(`/api/candidatos/${candidatoId}/presencas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dia_numero: dia, periodo: periodoFull, observacao: diaObs || undefined }),
      })
      const body = await res.json()
      if (!res.ok) {
        setDiaError(body.error || 'Erro ao registrar')
      } else {
        setPresencas(prev => {
          const filtered = prev.filter(p => p.dia_numero !== dia)
          return [...filtered, body].sort((a, b) => a.dia_numero - b.dia_numero)
        })
        setDiaObs(body.observacao ?? '')
      }
    }
    setSavingDia(false)
  }

  const removerDia = async (dia: number) => {
    if (!candidatoId) return
    const pres = presencaMap.get(dia)
    if (!pres) return
    setSavingDia(true)
    const res = await fetch(`/api/candidatos/${candidatoId}/presencas/${pres.id}`, { method: 'DELETE' })
    if (res.ok) {
      setPresencas(prev => prev.filter(p => p.id !== pres.id))
      setSelectedDia(null)
      setDiaObs('')
    }
    setSavingDia(false)
  }

  const savePremiacao = async (valor: number | null) => {
    if (!candidatoId) return
    setSavingPremiacao(true)
    await fetch(`/api/candidatos/${candidatoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ premiacao_override: valor }),
    })
    setCandidato(prev => prev ? { ...prev, premiacao_override: valor } : prev)
    setEditingPremiacao(false)
    setSavingPremiacao(false)
  }

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

  // Totais e premiação
  const totalDiarias = presencas.reduce(
    (sum, p) => sum + calcMult(p.periodo) * Number(eventoConfig.valor_diaria),
    0
  )
  const diasInteiros = presencas.filter(p => p.periodo === 'Dia Inteiro').length
  const meias = presencas.length - diasInteiros

  // Critério automático: trabalhou TODOS os dias E todos como Dia Inteiro
  const atingiuCriterio =
    presencas.length === eventoConfig.dias_total &&
    presencas.every(p => p.periodo === 'Dia Inteiro')
  const premiacaoAuto  = atingiuCriterio ? Number(eventoConfig.premiacao) : 0
  const hasOverride    = candidato !== null && candidato.premiacao_override !== null
  const premiacaoFinal = hasOverride
    ? Number(candidato!.premiacao_override)
    : premiacaoAuto
  const totalPagamento = totalDiarias + premiacaoFinal

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
            {/* Cabeçalho */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-mega-navy">{candidato.nome_completo}</h2>
                <p className="text-sm text-mega-text-secondary">CPF: {candidato.cpf} | Cadastrado em: {new Date(candidato.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={candidato.status} />
                <button onClick={onClose} className="text-mega-text-muted hover:text-mega-text text-xl">&times;</button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-mega-border mb-4">
              <button
                onClick={() => handleTabChange('dados')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'dados'
                    ? 'border-mega-teal text-mega-teal'
                    : 'border-transparent text-mega-text-muted hover:text-mega-text'
                }`}
              >
                Dados
              </button>
              {candidato.status === 'contratado' && (
                <button
                  onClick={() => handleTabChange('presencas')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'presencas'
                      ? 'border-mega-teal text-mega-teal'
                      : 'border-transparent text-mega-text-muted hover:text-mega-text'
                  }`}
                >
                  Presenças
                  {presencas.length > 0 && (
                    <span className="ml-1.5 text-[10px] bg-mega-teal text-white rounded-full px-1.5 py-0.5">
                      {presencas.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* ── Tab: Dados ── */}
            {activeTab === 'dados' && (
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
                  <Field label="Como soube" value={candidato.como_soube} />
                  {candidato.experiencia_descricao && (
                    <LongField label="Exp. em Eventos (Detalhe)" value={candidato.experiencia_descricao} />
                  )}
                  {candidato.experiencia_profissional && (
                    <LongField label="Experiência Profissional" value={candidato.experiencia_profissional} />
                  )}
                  {candidato.observacoes && (
                    <LongField label="Observações" value={candidato.observacoes} />
                  )}
                </Section>

                {candidato.documento_foto && (
                  <Section title="Documento (CNH/RG)">
                    <div className="sm:col-span-2">
                      <p className="text-mega-text-muted mb-2">Arquivo: {candidato.documento_foto_nome}</p>
                      {candidato.documento_foto_tipo?.startsWith('image/') ? (
                        <img
                          src={candidato.documento_foto}
                          alt="Documento"
                          className="max-w-full max-h-96 rounded-lg border border-mega-border"
                        />
                      ) : (
                        <a
                          href={candidato.documento_foto}
                          download={candidato.documento_foto_nome}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-mega-teal hover:bg-mega-teal-hover text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Baixar PDF
                        </a>
                      )}
                    </div>
                  </Section>
                )}

                {candidato.curriculo && (
                  <Section title="Currículo">
                    <div className="sm:col-span-2">
                      <a
                        href={candidato.curriculo}
                        download={candidato.curriculo_nome}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-mega-navy hover:bg-mega-navy/90 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {candidato.curriculo_nome || 'Baixar Currículo'}
                      </a>
                    </div>
                  </Section>
                )}
              </div>
            )}

            {/* ── Tab: Presenças ── */}
            {activeTab === 'presencas' && (
              <div className="text-sm">
                {loadingPresencas ? (
                  <div className="text-center py-8 text-mega-text-muted">Carregando...</div>
                ) : (
                  <>
                    {/* Resumo financeiro */}
                    <div className="bg-mega-bg border border-mega-border rounded-xl px-4 py-3 mb-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-mega-text-muted">
                          {eventoConfig.dias_total} dias &nbsp;·&nbsp; {fmtValor(Number(eventoConfig.valor_diaria))}/dia &nbsp;·&nbsp; {fmtValor(Number(eventoConfig.valor_diaria) / 2)} meia
                        </p>
                        <p className="text-xs text-mega-text-muted">{presencas.length} de {eventoConfig.dias_total} dias</p>
                      </div>
                      {presencas.length > 0 && (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-mega-text-muted">
                            {diasInteiros > 0 && <span>{diasInteiros}× inteiro </span>}
                            {meias > 0 && <span>{meias}× meia</span>}
                          </p>
                          <p className="text-xs text-mega-text-muted">{fmtValor(totalDiarias)}</p>
                        </div>
                      )}
                      {premiacaoFinal > 0 && (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-amber-600 font-medium">
                            ⭐ Premiação{hasOverride && <span className="ml-1 opacity-70">(editada)</span>}
                          </p>
                          <p className="text-xs text-amber-600 font-medium">{fmtValor(premiacaoFinal)}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-mega-border/60 pt-1.5">
                        <p className="text-xs font-semibold text-mega-navy">Total</p>
                        <p className="text-lg font-bold text-mega-teal">{fmtValor(totalPagamento)}</p>
                      </div>
                    </div>

                    {/* Grade de dias */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
                      {Array.from({ length: eventoConfig.dias_total }, (_, i) => i + 1).map(dia => {
                        const pres = presencaMap.get(dia)
                        const isSelected = selectedDia === dia
                        const periodo = pres?.periodo
                        const abrev = PERIODOS.find(p => p.full === periodo)?.abrev
                        const isMeia = periodo && periodo !== 'Dia Inteiro'

                        return (
                          <button
                            key={dia}
                            onClick={() => handleDiaClick(dia)}
                            className={`
                              relative flex flex-col items-center justify-center rounded-xl border-2 py-3 px-1 transition-all text-xs font-semibold
                              ${pres
                                ? isSelected
                                  ? isMeia
                                    ? 'border-amber-500 bg-amber-500 text-white shadow-md scale-105'
                                    : 'border-mega-teal bg-mega-teal text-white shadow-md scale-105'
                                  : isMeia
                                    ? 'border-amber-400 bg-amber-50 text-amber-700 hover:scale-105'
                                    : 'border-mega-teal bg-mega-teal/10 text-mega-teal hover:scale-105'
                                : isSelected
                                  ? 'border-mega-navy bg-mega-navy/5 text-mega-navy shadow-md scale-105'
                                  : 'border-mega-border bg-white text-mega-text-muted hover:border-mega-teal/50 hover:text-mega-navy hover:scale-105'
                              }
                            `}
                          >
                            <span className="text-[9px] opacity-60 font-normal">Dia</span>
                            <span className="text-base leading-tight">{dia}</span>
                            {abrev && (
                              <span className={`text-[9px] font-bold mt-0.5 ${isMeia ? 'text-amber-600' : 'text-mega-teal'} ${isSelected ? '!text-white/80' : ''}`}>
                                {abrev}
                              </span>
                            )}
                            {pres && (
                              <span className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full text-white text-[8px] flex items-center justify-center shadow ${isMeia ? 'bg-amber-500' : 'bg-mega-teal'}`}>
                                ✓
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Painel do dia selecionado */}
                    {selectedDia !== null && (
                      <div className="border border-mega-border rounded-xl p-4 mb-3 bg-mega-bg">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-mega-navy text-sm">
                            Dia {selectedDia}
                            {presencaMap.get(selectedDia) && (
                              <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${
                                presencaMap.get(selectedDia)?.periodo === 'Dia Inteiro'
                                  ? 'bg-mega-teal/10 text-mega-teal'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {presencaMap.get(selectedDia)?.periodo}
                              </span>
                            )}
                          </p>
                          <button
                            onClick={() => { setSelectedDia(null); setDiaObs('') }}
                            className="text-mega-text-muted hover:text-mega-text text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>

                        {/* Seletor de período */}
                        <p className="text-xs text-mega-text-muted mb-2">Selecione o período (clique no ativo para remover):</p>
                        <div className="flex gap-2 flex-wrap mb-3">
                          {PERIODOS.map(p => {
                            const pres = presencaMap.get(selectedDia)
                            const isActive = pres?.periodo === p.full
                            return (
                              <button
                                key={p.abrev}
                                onClick={() => handlePeriodo(selectedDia, p.full)}
                                disabled={savingDia}
                                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border-2 ${
                                  isActive
                                    ? p.mult === 1
                                      ? 'border-mega-teal bg-mega-teal text-white'
                                      : 'border-amber-500 bg-amber-500 text-white'
                                    : 'border-mega-border text-mega-text-muted hover:border-mega-teal hover:text-mega-teal bg-white'
                                } disabled:opacity-50`}
                              >
                                <span className="font-bold">{p.abrev}</span>
                                <span className="ml-1 font-normal opacity-80">{p.full}</span>
                                <span className="ml-1 opacity-60">{fmtValor(p.mult * Number(eventoConfig.valor_diaria))}</span>
                              </button>
                            )
                          })}
                          {presencaMap.has(selectedDia) && (
                            <button
                              onClick={() => removerDia(selectedDia)}
                              disabled={savingDia}
                              className="px-3 py-2 rounded-lg text-xs border-2 border-red-200 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              Remover
                            </button>
                          )}
                        </div>

                        {/* Observação */}
                        <div>
                          <label className="block text-xs text-mega-text-muted mb-1">Observação (opcional)</label>
                          <input
                            type="text"
                            value={diaObs}
                            onChange={e => setDiaObs(e.target.value)}
                            placeholder="Ex: saiu mais cedo, hora extra..."
                            className="w-full border border-mega-border rounded-lg px-3 py-2 text-xs text-mega-text focus:outline-none focus:border-mega-teal"
                          />
                          <p className="text-[10px] text-mega-text-muted mt-1">A observação é salva automaticamente ao selecionar o período.</p>
                        </div>

                        {diaError && <p className="text-red-500 text-xs mt-2">{diaError}</p>}
                      </div>
                    )}

                    {selectedDia === null && (
                      <p className="text-center text-xs text-mega-text-muted py-1">
                        Clique em um dia para registrar ou alterar presença
                      </p>
                    )}

                    {/* Card de Premiação */}
                    {Number(eventoConfig.premiacao) > 0 && (
                      <div className="mt-4 border border-amber-200 bg-amber-50 rounded-xl px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-amber-700 mb-1">⭐ Premiação</p>
                            {atingiuCriterio && !hasOverride ? (
                              <p className="text-[11px] text-green-700">✓ Todos os dias trabalhados como Dia Inteiro</p>
                            ) : !hasOverride ? (
                              <p className="text-[11px] text-mega-text-muted">
                                {presencas.length < eventoConfig.dias_total
                                  ? `${eventoConfig.dias_total - presencas.length} falta(s) — sem premiação automática`
                                  : 'Possui meia diária — sem premiação automática'}
                              </p>
                            ) : (
                              <p className="text-[11px] text-amber-600">Valor editado manualmente pelo admin</p>
                            )}
                          </div>

                          {!editingPremiacao ? (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-sm font-bold text-amber-700">{fmtValor(premiacaoFinal)}</span>
                              <button
                                onClick={() => { setEditingPremiacao(true); setPremiacaoInput(String(premiacaoFinal)) }}
                                className="text-[11px] text-mega-text-muted hover:text-mega-navy border border-mega-border rounded px-2 py-1 bg-white transition-colors"
                              >
                                Editar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={premiacaoInput}
                                onChange={e => setPremiacaoInput(e.target.value)}
                                className="w-24 border border-amber-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-amber-500"
                                autoFocus
                              />
                              <button
                                onClick={() => savePremiacao(parseFloat(premiacaoInput) || 0)}
                                disabled={savingPremiacao}
                                className="text-[11px] bg-amber-500 hover:bg-amber-600 text-white rounded px-2 py-1 transition-colors disabled:opacity-50"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditingPremiacao(false)}
                                className="text-[11px] border border-mega-border text-mega-text-muted rounded px-2 py-1 hover:text-mega-text transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Reset para automático */}
                        {hasOverride && !editingPremiacao && (
                          <button
                            onClick={() => savePremiacao(null)}
                            className="mt-2 text-[11px] text-mega-text-muted hover:text-mega-navy underline"
                          >
                            Usar calculado automaticamente ({fmtValor(premiacaoAuto)})
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Ações de status */}
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

function LongField({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) return null
  return (
    <div className="sm:col-span-2">
      <p className="text-mega-text-muted text-xs mb-1">{label}:</p>
      <p className="text-mega-text text-sm whitespace-pre-wrap bg-mega-bg border border-mega-border rounded-lg px-3 py-2">{value}</p>
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
