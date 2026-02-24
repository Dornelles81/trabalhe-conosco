'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from '@/components/ui/ProgressBar'
import Button from '@/components/ui/Button'
import Step1DadosPessoais from './Step1DadosPessoais'
import Step2EnderecoContato from './Step2EnderecoContato'
import Step3Documentos from './Step3Documentos'
import Step5InformacoesAdicionais from './Step5InformacoesAdicionais'
import Step6Revisao from './Step6Revisao'
import type { FormData } from '@/lib/validations'

const STORAGE_KEY = 'mega-feira-form'
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
  pis: '',
  possui_dependentes: false,
  dependentes: [],
  escolaridade: '',
  curso: '',
  experiencia_eventos: false,
  experiencia_descricao: '',
  como_soube: '',
  documento_foto: '',
  documento_foto_nome: '',
  documento_foto_tipo: '',
}

export default function FormWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setFormData({ ...defaultFormData, ...parsed.data })
        if (parsed.step) setCurrentStep(parsed.step)
      } catch {}
    }
  }, [])

  // Save to localStorage (exclude large base64 photo)
  useEffect(() => {
    const { documento_foto, ...dataToSave } = formData
    void documento_foto
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: dataToSave, step: currentStep }))
  }, [formData, currentStep])

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

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch('/api/candidatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao enviar cadastro')
      }

      localStorage.removeItem(STORAGE_KEY)
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
      case 1: return <Step1DadosPessoais {...common} onNext={nextStep} />
      case 2: return <Step2EnderecoContato {...common} onNext={nextStep} onPrev={prevStep} />
      case 3: return <Step3Documentos {...common} onNext={nextStep} onPrev={prevStep} />
      case 4: return <Step5InformacoesAdicionais {...common} onNext={nextStep} onPrev={prevStep} />
      case 5:
        return (
          <Step6Revisao
            data={formData}
            onPrev={prevStep}
            onSubmit={handleSubmit}
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
