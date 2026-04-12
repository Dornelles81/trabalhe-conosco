'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LGPDModal from './LGPDModal'

interface LGPDConsentButtonProps {
  eventoSlug?: string
  destino?: string   // sobrescreve a URL de destino padrão
}

export default function LGPDConsentButton({ eventoSlug, destino }: LGPDConsentButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleAccept = () => {
    setOpen(false)
    const url = destino ?? (eventoSlug ? `/trabalhe-conosco/${eventoSlug}` : '/trabalhe-conosco')
    router.push(url)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-block bg-mega-teal hover:bg-mega-teal-hover text-white font-semibold px-10 py-4 rounded-full text-lg transition-colors shadow-md hover:shadow-lg"
      >
        Cadastre-se Agora
      </button>

      <LGPDModal open={open} onClose={() => setOpen(false)} onAccept={handleAccept} />
    </>
  )
}
