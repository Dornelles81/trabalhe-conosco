'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LGPDConsentButton() {
  const [open, setOpen] = useState(true)
  const router = useRouter()

  const handleAccept = () => {
    setOpen(false)
    router.push('/trabalhe-conosco')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-block bg-mega-teal hover:bg-mega-teal-hover text-white font-semibold px-10 py-4 rounded-full text-lg transition-colors shadow-md hover:shadow-lg"
      >
        Cadastre-se Agora
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-mega-border">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-mega-teal flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h2 className="text-base font-bold text-mega-navy">Termo de Consentimento — LGPD</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-mega-text-muted hover:text-mega-text transition-colors text-xl leading-none"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            {/* Conteúdo rolável */}
            <div className="overflow-y-auto px-6 py-4 text-sm text-mega-text-secondary space-y-4">
              <p>
                Em conformidade com a <strong className="text-mega-text">Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018)</strong>,
                informamos como seus dados serão coletados e utilizados neste processo seletivo.
              </p>

              <div>
                <h3 className="font-semibold text-mega-text mb-1">Quais dados coletamos</h3>
                <p>
                  Nome completo, data de nascimento, documentos pessoais (CPF, RG, CTPS, PIS), endereço,
                  contatos (telefone e e-mail), escolaridade, experiência profissional e foto do documento de identificação.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-mega-text mb-1">Finalidade do tratamento</h3>
                <p>
                  Os dados coletados serão utilizados exclusivamente para fins de recrutamento e seleção de pessoal,
                  avaliação de candidatos e eventual formalização de vínculo de trabalho com a organização.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-mega-text mb-1">Base legal</h3>
                <p>
                  O tratamento dos dados ocorre com base no <strong className="text-mega-text">consentimento do titular</strong> (art. 7º, I da LGPD)
                  e, quando aplicável, para cumprimento de obrigação legal ou execução de contrato (art. 7º, II e V).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-mega-text mb-1">Compartilhamento</h3>
                <p>
                  Seus dados não serão compartilhados com terceiros para fins comerciais. O acesso é restrito
                  às equipes internas de recrutamento e recursos humanos.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-mega-text mb-1">Prazo de retenção</h3>
                <p>
                  Os dados serão mantidos pelo período necessário ao processo seletivo e, caso haja vínculo
                  empregatício, pelo prazo exigido pela legislação trabalhista vigente. Candidatos não selecionados
                  terão seus dados eliminados em até <strong className="text-mega-text">12 meses</strong> após o encerramento do processo.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-mega-text mb-1">Seus direitos</h3>
                <p>
                  Você pode, a qualquer momento, solicitar acesso, correção, eliminação ou portabilidade dos seus dados,
                  bem como revogar este consentimento, sem prejuízo à licitude dos tratamentos realizados anteriormente,
                  conforme art. 18 da LGPD.
                </p>
              </div>

              <p className="text-xs text-mega-text-muted border-t border-mega-border pt-3">
                Ao clicar em <strong>Aceitar e Continuar</strong>, você declara ter lido e concordado com este termo,
                autorizando o tratamento dos seus dados pessoais para as finalidades descritas acima.
              </p>
            </div>

            {/* Rodapé */}
            <div className="flex flex-col sm:flex-row gap-3 px-6 py-4 border-t border-mega-border">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 font-semibold px-6 py-2.5 rounded-lg border border-mega-border bg-white hover:bg-mega-bg text-mega-text-secondary transition-colors"
              >
                Recusar
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 font-semibold px-6 py-2.5 rounded-lg bg-mega-teal hover:bg-mega-teal-hover text-white transition-colors shadow-sm"
              >
                Aceitar e Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
