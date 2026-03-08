'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/admin/StatusBadge'
import CandidatoModal from '@/components/admin/CandidatoModal'

interface EventoConfig {
  dias_total: number
  valor_diaria: number
  premiacao: number
}

interface CandidatoRow {
  id: number
  nome_completo: string
  cpf: string
  celular: string
  cargo_pretendido: string
  doc_frente_nome: string | null
  curriculo_nome: string | null
  status: string
  created_at: string
}

interface StatusCounts {
  novo: number
  em_analise: number
  aprovado: number
  reprovado: number
  contratado: number
  total_geral: number
}

// null = contratado mas ausente | {id, periodo} = registrado
type PresencaEntry = { id: number; periodo: string } | null

const MEIAS = new Set(['Manhã', 'Tarde', 'Noite', 'Meia Diária'])

export default function AdminDashboard() {
  const router = useRouter()
  const [candidatos, setCandidatos] = useState<CandidatoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState<StatusCounts>({ novo: 0, em_analise: 0, aprovado: 0, reprovado: 0, contratado: 0, total_geral: 0 })
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Configuração do evento
  const [eventoConfig, setEventoConfig] = useState<EventoConfig>({ dias_total: 6, valor_diaria: 180, premiacao: 0 })
  const [showEventoForm, setShowEventoForm] = useState(false)
  const [eventoFormDias, setEventoFormDias] = useState('')
  const [eventoFormValor, setEventoFormValor] = useState('')
  const [eventoFormPremiacao, setEventoFormPremiacao] = useState('')
  const [savingEvento, setSavingEvento] = useState(false)

  // Presença inline
  const [presencaDia, setPresencaDia] = useState<number | null>(null)
  const [presencaMap, setPresencaMap] = useState<Map<number, PresencaEntry>>(new Map())
  const [loadingPresenca, setLoadingPresenca] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set())

  const fetchCandidatos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', String(page))
      const res = await fetch(`/api/candidatos?${params}`)
      if (res.status === 401) { router.push('/admin'); return }
      const data = await res.json()
      setCandidatos(data.candidatos || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
      if (data.counts) setCounts(data.counts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page, router])

  useEffect(() => { fetchCandidatos() }, [fetchCandidatos])

  useEffect(() => {
    fetch('/api/evento-config').then(r => r.json()).then(d => setEventoConfig(d)).catch(() => {})
  }, [])

  // Carrega presenças do dia selecionado (todos os contratados)
  useEffect(() => {
    if (presencaDia === null) { setPresencaMap(new Map()); return }
    setLoadingPresenca(true)
    fetch(`/api/presencas/dia/${presencaDia}`)
      .then(r => r.json())
      .then((rows: Array<{ candidato_id: number; presenca_id: number | null; periodo: string | null }>) => {
        const m = new Map<number, PresencaEntry>()
        rows.forEach(r => m.set(r.candidato_id, r.presenca_id ? { id: r.presenca_id, periodo: r.periodo! } : null))
        setPresencaMap(m)
      })
      .catch(console.error)
      .finally(() => setLoadingPresenca(false))
  }, [presencaDia])

  const saveEventoConfig = async () => {
    setSavingEvento(true)
    const res = await fetch('/api/evento-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dias_total: eventoFormDias, valor_diaria: eventoFormValor, premiacao: eventoFormPremiacao }),
    })
    if (res.ok) { const d = await res.json(); setEventoConfig(d); setShowEventoForm(false) }
    setSavingEvento(false)
  }

  // Alterna presença de um candidato no dia selecionado
  // tipo: 'Dia Inteiro' | 'Manhã' (proxy para "meia diária" genérica)
  const handlePresenca = async (candidatoId: number, tipo: 'Dia Inteiro' | 'Manhã') => {
    if (presencaDia === null || updatingIds.has(candidatoId)) return
    const current = presencaMap.get(candidatoId)
    if (current === undefined) return // não está no mapa (não contratado)

    const isDI      = current?.periodo === 'Dia Inteiro'
    const isMeia    = current && MEIAS.has(current.periodo)
    const removing  = tipo === 'Dia Inteiro' ? isDI : isMeia

    // Atualização otimista
    const optimistic: PresencaEntry = removing ? null : { id: current?.id ?? -1, periodo: tipo }
    setPresencaMap(prev => new Map([...prev, [candidatoId, optimistic]]))
    setUpdatingIds(prev => new Set([...prev, candidatoId]))

    try {
      if (removing) {
        await fetch(`/api/candidatos/${candidatoId}/presencas/${current!.id}`, { method: 'DELETE' })
      } else {
        const res = await fetch(`/api/candidatos/${candidatoId}/presencas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dia_numero: presencaDia, periodo: tipo }),
        })
        const data = await res.json()
        setPresencaMap(prev => new Map([...prev, [candidatoId, { id: data.id, periodo: data.periodo }]]))
      }
    } catch {
      setPresencaMap(prev => new Map([...prev, [candidatoId, current ?? null]]))
    } finally {
      setUpdatingIds(prev => { const s = new Set(prev); s.delete(candidatoId); return s })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este candidato?')) return
    await fetch(`/api/candidatos/${id}`, { method: 'DELETE' })
    fetchCandidatos()
  }

  const handleLogout = () => {
    document.cookie = 'admin_session=; path=/; max-age=0'
    router.push('/admin')
  }

  const colCount = presencaDia !== null ? 8 : 7

  return (
    <div className="min-h-screen bg-mega-bg">
      {/* Header */}
      <header className="border-b border-mega-border bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">
            <span className="text-mega-teal">MEGA</span>{' '}
            <span className="text-mega-navy">FEIRA</span>
            <span className="text-mega-text-muted font-normal text-sm ml-2">Admin</span>
          </h1>
          <button onClick={handleLogout} className="text-sm text-mega-text-secondary hover:text-mega-navy transition-colors">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total" value={counts.total_geral} />
          <StatCard label="Novos" value={counts.novo} color="blue" />
          <StatCard label="Em Análise" value={counts.em_analise} color="yellow" />
          <StatCard label="Aprovados" value={counts.aprovado} color="green" />
          <StatCard label="Contratados" value={counts.contratado} color="purple" />
        </div>

        {/* Configurações do Evento */}
        <div className="bg-white border border-mega-border rounded-xl shadow-sm mb-6 overflow-hidden">
          <button
            onClick={() => {
              setShowEventoForm(v => {
                if (!v) {
                  setEventoFormDias(String(eventoConfig.dias_total))
                  setEventoFormValor(String(eventoConfig.valor_diaria))
                  setEventoFormPremiacao(String(eventoConfig.premiacao ?? 0))
                }
                return !v
              })
            }}
            className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-mega-bg transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-mega-text-muted font-medium uppercase text-xs">Configurações do Evento</span>
              <span className="text-mega-navy font-semibold">
                {eventoConfig.dias_total} dias &nbsp;·&nbsp; R$ {Number(eventoConfig.valor_diaria).toFixed(2).replace('.', ',')}/dia
                {Number(eventoConfig.premiacao) > 0 && (
                  <span className="text-amber-600"> &nbsp;·&nbsp; Premiação R$ {Number(eventoConfig.premiacao).toFixed(2).replace('.', ',')}</span>
                )}
              </span>
            </div>
            <span className="text-mega-text-muted text-xs">{showEventoForm ? '▲ Fechar' : '▼ Editar'}</span>
          </button>
          {showEventoForm && (
            <div className="border-t border-mega-border px-4 py-3 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-mega-text-muted mb-1">Dias do evento</label>
                <input type="number" min={1} value={eventoFormDias} onChange={e => setEventoFormDias(e.target.value)}
                  className="w-24 border border-mega-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mega-teal/30" />
              </div>
              <div>
                <label className="block text-xs text-mega-text-muted mb-1">Valor por diária (R$)</label>
                <input type="number" min={0} step={0.01} value={eventoFormValor} onChange={e => setEventoFormValor(e.target.value)}
                  className="w-32 border border-mega-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mega-teal/30" />
              </div>
              <div>
                <label className="block text-xs text-mega-text-muted mb-1">Premiação (R$)</label>
                <input type="number" min={0} step={0.01} value={eventoFormPremiacao} onChange={e => setEventoFormPremiacao(e.target.value)}
                  placeholder="0,00"
                  className="w-32 border border-mega-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mega-teal/30" />
              </div>
              <button onClick={saveEventoConfig} disabled={savingEvento}
                className="px-4 py-2 bg-mega-teal hover:bg-mega-teal-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {savingEvento ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          )}
        </div>

        {/* Filtros + Seletor de dia */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar por nome ou CPF..."
              className="flex-1 bg-white border border-mega-border rounded-lg px-4 py-2.5 text-mega-text placeholder-mega-text-muted focus:outline-none focus:ring-2 focus:ring-mega-teal/30"
            />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="bg-white border border-mega-border rounded-lg px-4 py-2.5 text-mega-text focus:outline-none focus:ring-2 focus:ring-mega-teal/30">
              <option value="">Todos os status</option>
              <option value="novo">Novo</option>
              <option value="em_analise">Em Análise</option>
              <option value="aprovado">Aprovado</option>
              <option value="reprovado">Reprovado</option>
              <option value="contratado">Contratado</option>
            </select>
            <a
              href={`/api/candidatos/exportar-todos-word${statusFilter ? `?status=${statusFilter}` : ''}`}
              className="inline-flex items-center justify-center gap-2 bg-mega-teal hover:bg-mega-teal-hover text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
              title={statusFilter ? `Exportar fichas com status "${statusFilter}" em ZIP` : 'Exportar todas as fichas em ZIP'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Exportar Word {statusFilter ? `(${statusFilter})` : '(todos)'}
            </a>
          </div>

          {/* Seletor de dia para presença inline */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-mega-text-muted">Presença:</span>
            {Array.from({ length: eventoConfig.dias_total }, (_, i) => i + 1).map(dia => (
              <button
                key={dia}
                onClick={() => setPresencaDia(prev => prev === dia ? null : dia)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                  presencaDia === dia
                    ? 'bg-mega-teal text-white border-mega-teal shadow-sm'
                    : 'bg-white border-mega-border text-mega-text-muted hover:border-mega-teal hover:text-mega-navy'
                }`}
              >
                Dia {dia}
              </button>
            ))}
            {presencaDia !== null && (
              <>
                {loadingPresenca && <span className="text-xs text-mega-text-muted animate-pulse">carregando...</span>}
                <button onClick={() => setPresencaDia(null)}
                  className="text-xs text-mega-text-muted hover:text-mega-text ml-1 px-2 py-1 rounded border border-mega-border hover:border-mega-text-muted transition-colors">
                  ✕ fechar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-mega-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mega-border">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Nome</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">CPF</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden lg:table-cell">Cargo</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">Arquivos</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                  {presencaDia !== null && (
                    <th className="text-left px-4 py-3 font-medium">
                      <span className="text-mega-teal text-xs">Dia {presencaDia}</span>
                    </th>
                  )}
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">Data</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={colCount} className="px-4 py-8 text-center text-gray-500">Carregando...</td></tr>
                ) : candidatos.length === 0 ? (
                  <tr><td colSpan={colCount} className="px-4 py-8 text-center text-gray-500">Nenhum candidato encontrado</td></tr>
                ) : (
                  candidatos.map((c) => {
                    const pres = presencaMap.get(c.id)         // undefined = não contratado / não carregado
                    const isContratado = c.status === 'contratado'
                    return (
                      <tr key={c.id}
                        className="border-b border-mega-border/50 hover:bg-mega-bg cursor-pointer"
                        onClick={() => setSelectedId(c.id)}
                      >
                        <td className="px-4 py-3 text-mega-text font-medium">{c.nome_completo}</td>
                        <td className="px-4 py-3 text-mega-text-secondary hidden md:table-cell">{c.cpf}</td>
                        <td className="px-4 py-3 text-mega-text-secondary hidden lg:table-cell">{c.cargo_pretendido || '—'}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            {c.doc_frente_nome ? (
                              <span title={`Documento: ${c.doc_frente_nome}`}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
                                Doc
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-400 border border-gray-200">Doc</span>
                            )}
                            {c.curriculo_nome ? (
                              <span title={`Currículo: ${c.curriculo_nome}`}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-600 border border-green-200">
                                CV
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-400 border border-gray-200">CV</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>

                        {/* Coluna de presença (visível quando um dia está selecionado) */}
                        {presencaDia !== null && (
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            {isContratado ? (
                              <PresencaToggle
                                pres={pres ?? null}
                                isLoaded={presencaMap.has(c.id)}
                                isUpdating={updatingIds.has(c.id)}
                                onToggle={tipo => handlePresenca(c.id, tipo)}
                              />
                            ) : (
                              <span className="text-mega-text-muted text-xs">—</span>
                            )}
                          </td>
                        )}

                        <td className="px-4 py-3 text-mega-text-secondary hidden sm:table-cell">{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <a
                              href={`/api/candidatos/${c.id}/exportar-contrato`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-mega-teal hover:text-mega-teal-hover text-xs font-medium"
                              title="Baixar contrato RPA preenchido"
                            >
                              Contrato
                            </a>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }}
                              className="text-red-500 hover:text-red-600 text-xs"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-mega-border">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="text-sm text-mega-text-secondary hover:text-mega-navy disabled:opacity-30">Anterior</button>
              <span className="text-sm text-mega-text-muted">Página {page} de {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="text-sm text-mega-text-secondary hover:text-mega-navy disabled:opacity-30">Próxima</button>
            </div>
          )}
        </div>
      </main>

      <CandidatoModal
        candidatoId={selectedId}
        onClose={() => setSelectedId(null)}
        onStatusChange={fetchCandidatos}
      />
    </div>
  )
}

// ─── Componente de toggle de presença inline ──────────────────────────────────
function PresencaToggle({
  pres,
  isLoaded,
  isUpdating,
  onToggle,
}: {
  pres: PresencaEntry
  isLoaded: boolean
  isUpdating: boolean
  onToggle: (tipo: 'Dia Inteiro' | 'Manhã') => void
}) {
  if (!isLoaded) {
    return <span className="text-[10px] text-mega-text-muted animate-pulse">...</span>
  }

  const isDI   = pres?.periodo === 'Dia Inteiro'
  const isMeia = pres != null && MEIAS.has(pres.periodo)

  return (
    <div className="flex items-center gap-1">
      {/* Botão Inteira */}
      <button
        onClick={() => onToggle('Dia Inteiro')}
        disabled={isUpdating}
        title="Dia Inteiro"
        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all border ${
          isDI
            ? 'bg-mega-teal border-mega-teal text-white shadow-sm'
            : 'border-mega-border text-mega-text-muted hover:border-mega-teal hover:text-mega-teal bg-white'
        } disabled:opacity-40 disabled:cursor-wait`}
      >
        I
      </button>
      {/* Botão Meia */}
      <button
        onClick={() => onToggle('Manhã')}
        disabled={isUpdating}
        title="Meia Diária"
        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all border ${
          isMeia
            ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
            : 'border-mega-border text-mega-text-muted hover:border-amber-400 hover:text-amber-600 bg-white'
        } disabled:opacity-40 disabled:cursor-wait`}
      >
        ½
      </button>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  const colorMap: Record<string, string> = { blue: 'text-blue-400', green: 'text-green-400', purple: 'text-purple-400', yellow: 'text-amber-400' }
  return (
    <div className="bg-white border border-mega-border rounded-lg p-4 shadow-sm">
      <p className="text-xs text-mega-text-muted uppercase">{label}</p>
      <p className={`text-2xl font-bold ${color ? colorMap[color] : 'text-mega-navy'}`}>{value}</p>
    </div>
  )
}
