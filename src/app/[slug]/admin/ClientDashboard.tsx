'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/admin/StatusBadge'
import CandidatoModal from '@/components/admin/CandidatoModal'
import { empresaConfig } from '@/lib/feira.config'

interface Evento {
  id: number
  slug: string
  nome: string
  nome_evento: string | null
  dias_total: number
  valor_diaria: number
  premiacao: number
}

interface CandidatoRow {
  id: number
  nome_completo: string
  cpf: string
  celular: string
  cargo_pretendido: string | null
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

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  }
  return (
    <div className="bg-white border border-mega-border rounded-xl p-4 shadow-sm">
      <p className="text-xs text-mega-text-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ? colors[color] : 'text-mega-navy'}`}>{value}</p>
    </div>
  )
}

export default function ClientDashboard({ evento }: { evento: Evento }) {
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

  const nomeEvento = evento.nome_evento || evento.nome

  const fetchCandidatos = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      p.set('evento', evento.slug)
      if (search) p.set('search', search)
      if (statusFilter) p.set('status', statusFilter)
      p.set('page', String(page))

      const res = await fetch(`/api/candidatos?${p}`)
      if (res.status === 401) { router.push(`/${evento.slug}/admin/login`); return }
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
  }, [search, statusFilter, page, evento.slug, router])

  useEffect(() => { fetchCandidatos() }, [fetchCandidatos])

  const handleLogout = async () => {
    await fetch(`/api/eventos/${evento.slug}/auth`, { method: 'DELETE' })
    router.push(`/${evento.slug}/admin/login`)
  }

  return (
    <div className="min-h-screen bg-mega-bg">
      {/* Header */}
      <header className="border-b border-mega-border bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">
              <span className="text-mega-teal">{empresaConfig.nomeDisplay.split(' ')[0]}</span>{' '}
              <span className="text-mega-navy">{empresaConfig.nomeDisplay.split(' ').slice(1).join(' ')}</span>
              <span className="text-mega-text-muted font-normal text-sm ml-2">{nomeEvento}</span>
            </h1>
          </div>
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

        {/* Info do evento */}
        <div className="bg-white border border-mega-border rounded-xl px-4 py-3 mb-6 text-sm text-mega-text-muted flex flex-wrap gap-4">
          <span><strong>Evento:</strong> {nomeEvento}</span>
          <span><strong>Dias:</strong> {evento.dias_total}</span>
          <span><strong>Diária:</strong> R$ {Number(evento.valor_diaria).toFixed(2).replace('.', ',')}</span>
          {Number(evento.premiacao) > 0 && (
            <span><strong>Premiação:</strong> R$ {Number(evento.premiacao).toFixed(2).replace('.', ',')}</span>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por nome ou CPF..."
            className="flex-1 bg-white border border-mega-border rounded-lg px-4 py-2.5 text-mega-text
                       placeholder-mega-text-muted focus:outline-none focus:ring-2 focus:ring-mega-teal/30"
          />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="bg-white border border-mega-border rounded-lg px-4 py-2.5 text-mega-text
                       focus:outline-none focus:ring-2 focus:ring-mega-teal/30"
          >
            <option value="">Todos os status</option>
            <option value="novo">Novo</option>
            <option value="em_analise">Em Análise</option>
            <option value="aprovado">Aprovado</option>
            <option value="reprovado">Reprovado</option>
            <option value="contratado">Contratado</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-mega-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-mega-border flex items-center justify-between">
            <span className="text-sm text-mega-text-muted">
              {loading ? 'Carregando...' : `${total} candidato${total !== 1 ? 's' : ''}`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mega-border bg-mega-bg">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mega-text-muted uppercase tracking-wide">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mega-text-muted uppercase tracking-wide">CPF</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mega-text-muted uppercase tracking-wide hidden md:table-cell">Celular</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mega-text-muted uppercase tracking-wide hidden md:table-cell">Docs</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mega-text-muted uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mega-text-muted uppercase tracking-wide hidden lg:table-cell">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mega-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-mega-text-muted">Carregando...</td>
                  </tr>
                ) : candidatos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-mega-text-muted">Nenhum candidato encontrado</td>
                  </tr>
                ) : candidatos.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="hover:bg-mega-bg cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-mega-text">{c.nome_completo}</td>
                    <td className="px-4 py-3 text-mega-text-secondary font-mono text-xs">{c.cpf}</td>
                    <td className="px-4 py-3 text-mega-text-secondary hidden md:table-cell">{c.celular}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex gap-1.5">
                        {c.doc_frente_nome && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Doc</span>}
                        {c.curriculo_nome && <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">CV</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-mega-text-muted text-xs hidden lg:table-cell">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-mega-border flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm px-3 py-1.5 rounded border border-mega-border hover:bg-mega-bg disabled:opacity-40 transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-sm text-mega-text-muted">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-sm px-3 py-1.5 rounded border border-mega-border hover:bg-mega-bg disabled:opacity-40 transition-colors"
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal de candidato */}
      {selectedId !== null && (
        <CandidatoModal
          candidatoId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusChange={fetchCandidatos}
        />
      )}
    </div>
  )
}
