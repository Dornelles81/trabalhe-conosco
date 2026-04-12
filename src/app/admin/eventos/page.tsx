'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Evento {
  id: number
  slug: string
  nome: string
  nome_evento: string | null
  data_evento: string | null
  local_evento: string | null
  cargo_padrao: string | null
  dias_total: number
  valor_diaria: number
  premiacao: number
  data_pagamento: string | null
  ativo: boolean
  created_at: string
}

const emptyForm = {
  nome: '', slug: '', nome_evento: '', data_evento: '', local_evento: '',
  cargo_padrao: 'Operador de Estacionamento', dias_total: '6',
  valor_diaria: '180.00', premiacao: '0.00', data_pagamento: '', client_password: '',
}

export default function AdminEventos() {
  const router = useRouter()
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editSlug, setEditSlug] = useState<string | null>(null)

  const fetchEventos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/eventos?todos=1')
      if (res.status === 401) { router.push('/admin'); return }
      const data = await res.json()
      setEventos(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEventos() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const url = editSlug ? `/api/eventos/${editSlug}` : '/api/eventos'
      const method = editSlug ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          dias_total: parseInt(form.dias_total) || 6,
          valor_diaria: parseFloat(form.valor_diaria) || 180,
          premiacao: parseFloat(form.premiacao) || 0,
          data_pagamento: form.data_pagamento || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Erro ao salvar')
        return
      }
      setShowForm(false)
      setEditSlug(null)
      setForm(emptyForm)
      fetchEventos()
    } catch {
      setError('Erro de rede')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (ev: Evento) => {
    setForm({
      nome: ev.nome,
      slug: ev.slug,
      nome_evento: ev.nome_evento || '',
      data_evento: ev.data_evento || '',
      local_evento: ev.local_evento || '',
      cargo_padrao: ev.cargo_padrao || 'Operador de Estacionamento',
      dias_total: String(ev.dias_total),
      valor_diaria: String(ev.valor_diaria),
      premiacao: String(ev.premiacao),
      data_pagamento: ev.data_pagamento ? ev.data_pagamento.split('T')[0] : '',
      client_password: '',
    })
    setEditSlug(ev.slug)
    setShowForm(true)
    setError('')
  }

  const toggleAtivo = async (ev: Evento) => {
    await fetch(`/api/eventos/${ev.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !ev.ativo }),
    })
    fetchEventos()
  }

  return (
    <div className="min-h-screen bg-mega-bg">
      <header className="border-b border-mega-border bg-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin/dashboard')} className="text-sm text-mega-text-muted hover:text-mega-navy transition-colors">
              ← Dashboard
            </button>
            <h1 className="text-lg font-bold text-mega-navy">Gerenciar Eventos</h1>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditSlug(null); setForm(emptyForm); setError('') }}
            className="bg-mega-teal hover:bg-mega-teal-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Novo Evento
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Formulário */}
        {showForm && (
          <div className="bg-white border border-mega-border rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-base font-semibold text-mega-navy mb-4">
              {editSlug ? `Editar: ${editSlug}` : 'Novo Evento'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nome exibição *" value={form.nome} onChange={v => setForm(f => ({ ...f, nome: v }))} placeholder="FEICAP" required />
              <Field label="Slug (URL) *" value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                placeholder="feicap-2026" required disabled={!!editSlug} />
              <Field label="Nome do evento" value={form.nome_evento} onChange={v => setForm(f => ({ ...f, nome_evento: v }))} placeholder="FEICAP 2026" />
              <Field label="Datas (texto)" value={form.data_evento} onChange={v => setForm(f => ({ ...f, data_evento: v }))} placeholder="10 a 15/05/2026" />
              <Field label="Local" value={form.local_evento} onChange={v => setForm(f => ({ ...f, local_evento: v }))} placeholder="Carambeí/PR" />
              <Field label="Cargo padrão" value={form.cargo_padrao} onChange={v => setForm(f => ({ ...f, cargo_padrao: v }))} />
              <Field label="Dias totais" type="number" value={form.dias_total} onChange={v => setForm(f => ({ ...f, dias_total: v }))} />
              <Field label="Valor diária (R$)" type="number" value={form.valor_diaria} onChange={v => setForm(f => ({ ...f, valor_diaria: v }))} step="0.01" />
              <Field label="Premiação assiduidade (R$)" type="number" value={form.premiacao} onChange={v => setForm(f => ({ ...f, premiacao: v }))} step="0.01" />
              <Field label="Data de pagamento" type="date" value={form.data_pagamento} onChange={v => setForm(f => ({ ...f, data_pagamento: v }))} />
              <div className="sm:col-span-2">
                <Field label={editSlug ? 'Nova senha do cliente (deixe em branco para manter)' : 'Senha do cliente *'}
                  type="password" value={form.client_password}
                  onChange={v => setForm(f => ({ ...f, client_password: v }))}
                  required={!editSlug} placeholder="Senha de acesso ao dashboard" />
              </div>

              {error && <p className="sm:col-span-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

              <div className="sm:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="bg-mega-teal hover:bg-mega-teal-hover text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditSlug(null) }}
                  className="border border-mega-border px-6 py-2 rounded-lg text-sm hover:bg-mega-bg transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de eventos */}
        <div className="bg-white border border-mega-border rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="px-4 py-8 text-center text-mega-text-muted">Carregando...</div>
          ) : eventos.length === 0 ? (
            <div className="px-4 py-8 text-center text-mega-text-muted">Nenhum evento cadastrado</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mega-border bg-mega-bg">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mega-text-muted uppercase">Evento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mega-text-muted uppercase hidden md:table-cell">Datas / Local</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mega-text-muted uppercase">Config</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mega-text-muted uppercase">Acesso</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-mega-text-muted uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mega-border">
                {eventos.map(ev => (
                  <tr key={ev.id} className={ev.ativo ? '' : 'opacity-50'}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-mega-navy">{ev.nome_evento || ev.nome}</p>
                      <p className="text-xs text-mega-text-muted font-mono">/{ev.slug}</p>
                      {!ev.ativo && <span className="text-xs text-red-500">Inativo</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-mega-text-secondary">
                      <p>{ev.data_evento || '—'}</p>
                      <p className="text-xs">{ev.local_evento || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-mega-text-secondary text-xs">
                      <p>{ev.dias_total}d · R$ {Number(ev.valor_diaria).toFixed(0)}/dia</p>
                      {Number(ev.premiacao) > 0 && <p>+ R$ {Number(ev.premiacao).toFixed(0)} prêmio</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <a href={`/${ev.slug}`} target="_blank" className="text-xs text-mega-teal hover:underline">
                          Formulário ↗
                        </a>
                        <a href={`/${ev.slug}/admin`} target="_blank" className="text-xs text-mega-blue hover:underline">
                          Dashboard ↗
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(ev)}
                          className="text-xs border border-mega-border px-2 py-1 rounded hover:bg-mega-bg transition-colors">
                          Editar
                        </button>
                        <button onClick={() => toggleAtivo(ev)}
                          className={`text-xs border px-2 py-1 rounded transition-colors ${ev.ativo ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                          {ev.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, required, disabled, step }: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  step?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-mega-text-muted mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        step={step}
        className="w-full border border-mega-border rounded-lg px-3 py-2 text-sm text-mega-text
                   focus:outline-none focus:ring-2 focus:ring-mega-teal/30 disabled:bg-mega-bg disabled:text-mega-text-muted"
      />
    </div>
  )
}
