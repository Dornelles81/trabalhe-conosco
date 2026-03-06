'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from '@/components/ui/ProgressBar'
import Button from '@/components/ui/Button'
import Step1DadosPessoais from './Step1DadosPessoais'
import Step2EnderecoContato from './Step2EnderecoContato'
import Step3Documentos from './Step3Documentos'
import Step5InformacoesAdicionais from './Step5InformacoesAdicionais'
import Step6Revisao from './Step6Revisao'
import type { FormData } from '@/lib/validations'

const STEP_LABELS = ['Pessoais', 'Endereço', 'Documentos', 'Adicionais', 'Revisão']

const defaultFormData: FormData = {
  nome_completo: '',
  data_nascimento: '',
  sexo: '',
  estado_civil: '',
  nacionalidade: 'Brasileira',
  etnia: '',
  possui_deficiencia: false,
  tipo_deficiencia: '',
  naturalidade: '',
  nome_pai: '',
  nome_mae: '',
  pix_nao_possui: false,
  chave_pix: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  telefone: '',
  celular: '',
  email: '',
  cpf: '',
  rg: '',
  orgao_emissor: '',
  data_emissao_rg: '',
  possui_dependentes: false,
  dependentes: [],
  escolaridade: '',
  curso: '',
  experiencia_eventos: false,
  experiencia_descricao: '',
  como_soube: '',
  doc_frente: '',
  doc_frente_nome: '',
  doc_frente_tipo: '',
  doc_verso: '',
  doc_verso_nome: '',
  doc_verso_tipo: '',
  curriculo: '',
  curriculo_nome: '',
  curriculo_tipo: '',
  experiencia_profissional: '',
}

export default function FormWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const updateData = (stepData: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }))
  }

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReset = () => {
    if (!confirm('Tem certeza que deseja limpar todos os dados e começar do zero?')) return
    setFormData(defaultFormData)
    setCurrentStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const payload = JSON.stringify(formData)
      const payloadSizeMB = new Blob([payload]).size / (1024 * 1024)
      if (payloadSizeMB > 4) {
        throw new Error(
          `Os arquivos enviados são muito grandes (${payloadSizeMB.toFixed(1)}MB). ` +
          'Remova o currículo ou as fotos do documento e tente novamente.'
        )
      }

      const res = await fetch('/api/candidatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })

      if (!res.ok) {
        let errorMessage = 'Erro ao enviar cadastro'
        try {
          const err = await res.json()
          errorMessage = err.error || errorMessage
        } catch {
          // Resposta não é JSON (ex: "Request Entity Too Large" do proxy da Vercel)
          if (res.status === 413 || res.status === 400) {
            errorMessage = 'Arquivos muito grandes. Remova o currículo ou reduza as fotos e tente novamente.'
          } else {
            errorMessage = `Erro no servidor (${res.status}). Tente novamente.`
          }
        }
        throw new Error(errorMessage)
      }

      router.push('/trabalhe-conosco/confirmacao')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao enviar cadastro')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    const common = { data: formData, updateData }
    switch (currentStep) {
      case 1: return <Step1DadosPessoais {...common} onNext={nextStep} onReset={handleReset} />
      case 2: return <Step2EnderecoContato {...common} onNext={nextStep} onPrev={prevStep} />
      case 3: return <Step3Documentos {...common} onNext={nextStep} onPrev={prevStep} />
      case 4: return <Step5InformacoesAdicionais {...common} onNext={nextStep} onPrev={prevStep} />
      case 5:
        return (
          <Step6Revisao
            data={formData}
            onPrev={prevStep}
            onSubmit={handleSubmit}
            onReset={handleReset}
            isSubmitting={isSubmitting}
            goToStep={setCurrentStep}
          />
        )
      default: return null
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8">
        <ProgressBar currentStep={currentStep} totalSteps={5} labels={STEP_LABELS} />
      </div>
      <div className="bg-white border border-mega-border rounded-xl p-6 md:p-8 shadow-sm">
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {submitError}
          </div>
        )}
        {renderStep()}
      </div>
    </div>
  )
}
