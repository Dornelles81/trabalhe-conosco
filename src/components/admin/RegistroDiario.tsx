'use client'

import { useEffect, useState, useCallback } from 'react'

interface Registro {
  candidato_id: number
  nome_completo: string
  presenca_id: number | null
  periodo: string | null
  observacao: string | null
}

interface Props {
  diasTotal: number
  valorDiaria: number
}

const PERIODOS = [
  { abrev: 'DI', full: 'Dia Inteiro', multiplier: 1 },
  { abrev: 'M',  full: 'Manhã',       multiplier: 0.5 },
  { abrev: 'T',  full: 'Tarde',       multiplier: 0.5 },
  { abrev: 'N',  full: 'Noite',       multiplier: 0.5 },
]

function fmtValor(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function RegistroDiario({ diasTotal, valorDiaria }: Props) {
  const [selectedDia, setSelectedDia] = useState(1)
  const [registros, setRegistros] = useState<Registro[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')

  const loadDia = useCallback(async (dia: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/presencas/dia/${dia}`)
      const data = await res.json()
      setRegistros(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDia(selectedDia)
  }, [selectedDia, loadDia])

  const handlePeriodo = async (r: Registro, periodoFull: string) => {
    const id = r.candidato_id
    const isActive = r.periodo === periodoFull

    // Atualização otimista
    setRegistros(prev => prev.map(reg =>
      reg.candidato_id === id
        ? { ...reg, presenca_id: isActive ? null : (reg.presenca_id ?? -1), periodo: isActive ? null : periodoFull }
        : reg
    ))
    setLoadingIds(prev => new Set([...prev, id]))

    try {
      if (isActive) {
        // Clicar no período ativo → remove
        await fetch(`/api/candidatos/${id}/presencas/${r.presenca_id}`, { method: 'DELETE' })
      } else {
        // Clicar em outro período → upsert
        const res = await fetch(`/api/candidatos/${id}/presencas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dia_numero: selectedDia, periodo: periodoFull }),
        })
        const data = await res.json()
        setRegistros(prev => prev.map(reg =>
          reg.candidato_id === id ? { ...reg, presenca_id: data.id } : reg
        ))
      }
    } catch {
      // Reverte em caso de erro
      setRegistros(prev => prev.map(reg =>
        reg.candidato_id === id
          ? { ...reg, presenca_id: r.presenca_id, periodo: r.periodo }
          : reg
      ))
    } finally {
      setLoadingIds(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  const filtered = registros.filter(r =>
    r.nome_completo.toLowerCase().includes(search.toLowerCase())
  )

  const presentes     = registros.filter(r => r.periodo !== null).length
  const diasInteiros  = registros.filter(r => r.periodo === 'Dia Inteiro').length
  const meias         = presentes - diasInteiros
  const totalDia      = diasInteiros * valorDiaria + meias * (valorDiaria / 2)

  return (
    <div>
      {/* Seletor de dia */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {Array.from({ length: diasTotal }, (_, i) => i + 1).map(dia => {
          const isSelected = selectedDia === dia
          return (
            <button
              key={dia}
              onClick={() => setSelectedDia(dia)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isSelected
                  ? 'bg-mega-teal text-white shadow-sm'
                  : 'border border-mega-border text-mega-text-muted hover:border-mega-teal hover:text-mega-navy'
              }`}
            >
              Dia {dia}
            </button>
          )
        })}
      </div>

      {/* Resumo do dia */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs">
        <span className="text-mega-text-muted">
          <span className="font-bold text-mega-navy text-sm">{presentes}</span>
          <span>/{registros.length} presentes</span>
        </span>
        {diasInteiros > 0 && (
          <span className="text-mega-text-muted">{diasInteiros}× dia inteiro</span>
        )}
        {meias > 0 && (
          <span className="text-mega-text-muted">{meias}× meia diária</span>
        )}
        {presentes > 0 && (
          <span className="font-semibold text-mega-teal ml-auto">{fmtValor(totalDia)} neste dia</span>
        )}
      </div>

      {/* Busca */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Filtrar por nome..."
        className="w-full border border-mega-border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-mega-teal/30 bg-white"
      />

      {/* Lista */}
      {loading ? (
        <div className="text-center py-8 text-mega-text-muted text-sm">Carregando...</div>
      ) : registros.length === 0 ? (
        <div className="text-center py-6 text-mega-text-muted text-sm border border-dashed border-mega-border rounded-lg">
          Nenhum candidato com status "contratado"
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto rounded-lg border border-mega-border divide-y divide-mega-border/60">
          {filtered.map(r => {
            const isBusy = loadingIds.has(r.candidato_id)
            return (
              <div
                key={r.candidato_id}
                className={`flex items-center gap-2 px-3 py-2 transition-colors ${
                  r.periodo ? 'bg-mega-teal/5' : 'bg-white hover:bg-gray-50'
                }`}
              >
                {/* Nome */}
                <span className={`text-sm flex-1 min-w-0 truncate ${r.periodo ? 'text-mega-navy font-medium' : 'text-mega-text-muted'}`}>
                  {r.nome_completo}
                </span>

                {/* Botões de período */}
                <div className="flex gap-1 flex-shrink-0">
                  {PERIODOS.map(p => {
                    const isActive = r.periodo === p.full
                    return (
                      <button
                        key={p.abrev}
                        onClick={() => !isBusy && handlePeriodo(r, p.full)}
                        disabled={isBusy}
                        title={p.full + (p.multiplier < 1 ? ' (meia diária)' : '')}
                        className={`w-8 h-7 rounded text-[11px] font-bold transition-all ${
                          isActive
                            ? p.multiplier === 1
                              ? 'bg-mega-teal text-white shadow-sm'
                              : 'bg-amber-500 text-white shadow-sm'
                            : 'border border-mega-border text-mega-text-muted hover:border-mega-teal hover:text-mega-teal bg-white'
                        } disabled:opacity-40 disabled:cursor-wait`}
                      >
                        {p.abrev}
                      </button>
                    )
                  })}
                </div>

                {/* Indicador de valor */}
                {r.periodo && (
                  <span className="text-[10px] text-mega-text-muted w-14 text-right flex-shrink-0">
                    {fmtValor(
                      (PERIODOS.find(p => p.full === r.periodo)?.multiplier ?? 1) * valorDiaria
                    )}
                  </span>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && search && (
            <div className="text-center py-4 text-mega-text-muted text-sm">
              Nenhum resultado para "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
