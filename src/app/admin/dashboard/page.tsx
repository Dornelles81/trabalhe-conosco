'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/admin/StatusBadge'
import CandidatoModal from '@/components/admin/CandidatoModal'

interface CandidatoRow {
  id: number
  nome_completo: string
  cpf: string
  celular: string
  cargo_pretendido: string
  status: string
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [candidatos, setCandidatos] = useState<CandidatoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const fetchCandidatos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', String(page))

      const res = await fetch(`/api/candidatos?${params}`)
      if (res.status === 401) {
        router.push('/admin')
        return
      }
      const data = await res.json()
      setCandidatos(data.candidatos || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page, router])

  useEffect(() => {
    fetchCandidatos()
  }, [fetchCandidatos])

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este candidato?')) return
    await fetch(`/api/candidatos/${id}`, { method: 'DELETE' })
    fetchCandidatos()
  }

  const handleLogout = () => {
    document.cookie = 'admin_session=; path=/; max-age=0'
    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-mega-bg">
      {/* Header */}
      <header className="border-b border-mega-border bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">
              <span className="text-mega-teal">MEGA</span>{' '}
              <span className="text-mega-navy">FEIRA</span>
              <span className="text-mega-text-muted font-normal text-sm ml-2">Admin</span>
            </h1>
          </div>
          <button onClick={handleLogout} className="text-sm text-mega-text-secondary hover:text-mega-navy transition-colors">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total" value={total} />
          <StatCard label="Novos" value={candidatos.filter(c => c.status === 'novo').length} color="blue" />
          <StatCard label="Aprovados" value={candidatos.filter(c => c.status === 'aprovado').length} color="green" />
          <StatCard label="Contratados" value={candidatos.filter(c => c.status === 'contratado').length} color="purple" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por nome ou CPF..."
            className="flex-1 bg-white border border-mega-border rounded-lg px-4 py-2.5 text-mega-text placeholder-mega-text-muted focus:outline-none focus:ring-2 focus:ring-mega-teal/30"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="bg-white border border-mega-border rounded-lg px-4 py-2.5 text-mega-text focus:outline-none focus:ring-2 focus:ring-mega-teal/30"
          >
            <option value="">Todos os status</option>
            <option value="novo">Novo</option>
            <option value="em_analise">Em Análise</option>
            <option value="aprovado">Aprovado</option>
            <option value="reprovado">Reprovado</option>
            <option value="contratado">Contratado</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-mega-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mega-border">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Nome</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">CPF</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden lg:table-cell">Cargo</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">Data</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Carregando...</td></tr>
                ) : candidatos.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Nenhum candidato encontrado</td></tr>
                ) : (
                  candidatos.map((c) => (
                    <tr key={c.id} className="border-b border-mega-border/50 hover:bg-mega-bg cursor-pointer" onClick={() => setSelectedId(c.id)}>
                      <td className="px-4 py-3 text-mega-text font-medium">{c.nome_completo}</td>
                      <td className="px-4 py-3 text-mega-text-secondary hidden md:table-cell">{c.cpf}</td>
                      <td className="px-4 py-3 text-mega-text-secondary hidden lg:table-cell">{c.cargo_pretendido || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-mega-text-secondary hidden sm:table-cell">{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }}
                          className="text-red-500 hover:text-red-600 text-xs"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-mega-border">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm text-mega-text-secondary hover:text-mega-navy disabled:opacity-30"
              >
                Anterior
              </button>
              <span className="text-sm text-mega-text-muted">Página {page} de {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-sm text-mega-text-secondary hover:text-mega-navy disabled:opacity-30"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <CandidatoModal
        candidatoId={selectedId}
        onClose={() => setSelectedId(null)}
        onStatusChange={fetchCandidatos}
      />
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
  }
  return (
    <div className="bg-white border border-mega-border rounded-lg p-4 shadow-sm">
      <p className="text-xs text-mega-text-muted uppercase">{label}</p>
      <p className={`text-2xl font-bold ${color ? colorMap[color] : 'text-mega-navy'}`}>{value}</p>
    </div>
  )
}
