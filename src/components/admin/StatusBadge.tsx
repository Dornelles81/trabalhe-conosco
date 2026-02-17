const statusConfig: Record<string, { label: string; classes: string }> = {
  novo: { label: 'Novo', classes: 'bg-blue-900/30 text-blue-400 border-blue-800' },
  em_analise: { label: 'Em Análise', classes: 'bg-yellow-900/30 text-yellow-400 border-yellow-800' },
  aprovado: { label: 'Aprovado', classes: 'bg-green-900/30 text-green-400 border-green-800' },
  reprovado: { label: 'Reprovado', classes: 'bg-red-900/30 text-red-400 border-red-800' },
  contratado: { label: 'Contratado', classes: 'bg-purple-900/30 text-purple-400 border-purple-800' },
}

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.novo
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}>
      {config.label}
    </span>
  )
}
