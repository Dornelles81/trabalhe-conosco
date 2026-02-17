'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step5Schema, Step5Data, FormData } from '@/lib/validations'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'

interface Props {
  data: FormData
  updateData: (data: Partial<FormData>) => void
  onNext: () => void
  onPrev: () => void
}

export default function Step5InformacoesAdicionais({ data, updateData, onNext, onPrev }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileError, setFileError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step5Data>({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      escolaridade: data.escolaridade,
      curso: data.curso,
      experiencia_eventos: data.experiencia_eventos,
      experiencia_descricao: data.experiencia_descricao,
      cargo_pretendido: data.cargo_pretendido,
      disponibilidade: data.disponibilidade,
      como_soube: data.como_soube,
      observacoes: data.observacoes,
      documento_foto: data.documento_foto,
      documento_foto_nome: data.documento_foto_nome,
      documento_foto_tipo: data.documento_foto_tipo,
    },
  })

  const experienciaEventos = watch('experiencia_eventos')
  const documentoFotoNome = watch('documento_foto_nome')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileError('')
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setFileError('O arquivo deve ter no máximo 5MB')
      e.target.value = ''
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setFileError('Formato inválido. Use JPG, PNG, WebP ou PDF')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setValue('documento_foto', base64, { shouldValidate: true })
      setValue('documento_foto_nome', file.name)
      setValue('documento_foto_tipo', file.type)
    }
    reader.readAsDataURL(file)
  }

  const removeFile = () => {
    setValue('documento_foto', '', { shouldValidate: true })
    setValue('documento_foto_nome', '')
    setValue('documento_foto_tipo', '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = (values: Step5Data) => {
    updateData(values)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold text-mega-navy mb-6">Informações Adicionais</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Escolaridade"
          {...register('escolaridade')}
          error={errors.escolaridade?.message}
          options={[
            { value: 'Ensino Fundamental Incompleto', label: 'Ensino Fundamental Incompleto' },
            { value: 'Ensino Fundamental Completo', label: 'Ensino Fundamental Completo' },
            { value: 'Ensino Médio Incompleto', label: 'Ensino Médio Incompleto' },
            { value: 'Ensino Médio Completo', label: 'Ensino Médio Completo' },
            { value: 'Superior Incompleto', label: 'Superior Incompleto' },
            { value: 'Superior Completo', label: 'Superior Completo' },
            { value: 'Pós-Graduação', label: 'Pós-Graduação' },
          ]}
        />
        <Input
          label="Curso"
          {...register('curso')}
          error={errors.curso?.message}
          placeholder="Curso em andamento ou concluído"
        />
      </div>

      <Select
        label="Cargo Pretendido"
        {...register('cargo_pretendido')}
        error={errors.cargo_pretendido?.message}
        options={[
          { value: 'Caixa', label: 'Caixa' },
          { value: 'Orientador', label: 'Orientador' },
          { value: 'Garçom', label: 'Garçom' },
          { value: 'Auxiliar Administrativo', label: 'Auxiliar Administrativo' },
        ]}
      />

      <Select
        label="Disponibilidade"
        {...register('disponibilidade')}
        error={errors.disponibilidade?.message}
        options={[
          { value: 'Integral', label: 'Integral' },
          { value: 'Manhã', label: 'Manhã' },
          { value: 'Tarde', label: 'Tarde' },
          { value: 'Noite', label: 'Noite' },
          { value: 'Fins de Semana', label: 'Fins de Semana' },
          { value: 'Flexível', label: 'Flexível' },
        ]}
      />

      <Checkbox
        label="Possui experiência em eventos?"
        {...register('experiencia_eventos')}
      />

      {experienciaEventos && (
        <Textarea
          label="Descreva sua experiência"
          {...register('experiencia_descricao')}
          error={errors.experiencia_descricao?.message}
          placeholder="Descreva os eventos em que trabalhou, funções exercidas, etc."
        />
      )}

      <Select
        label="Como soube da vaga?"
        {...register('como_soube')}
        error={errors.como_soube?.message}
        options={[
          { value: 'Instagram', label: 'Instagram' },
          { value: 'Facebook', label: 'Facebook' },
          { value: 'Indicação', label: 'Indicação' },
          { value: 'Site', label: 'Site' },
          { value: 'Outro', label: 'Outro' },
        ]}
      />

      <Textarea
        label="Observações"
        {...register('observacoes')}
        error={errors.observacoes?.message}
        placeholder="Informações adicionais que julgar relevantes"
      />

      {/* Upload de documento */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-mega-text">
          Foto do Documento (CNH ou RG) <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-mega-text-muted">
          Anexe uma foto legível da sua CNH ou RG. Formatos aceitos: JPG, PNG, WebP ou PDF (máx. 5MB).
        </p>

        {documentoFotoNome ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-green-700 truncate flex-1">{documentoFotoNome}</span>
            <button
              type="button"
              onClick={removeFile}
              className="text-red-500 hover:text-red-700 text-sm font-medium shrink-0"
            >
              Remover
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-mega-border hover:border-mega-teal rounded-lg p-6 text-center cursor-pointer transition-colors"
          >
            <svg className="w-8 h-8 mx-auto text-mega-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-mega-text-secondary">Clique para selecionar o arquivo</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        {/* Hidden field for validation */}
        <input type="hidden" {...register('documento_foto')} />
        {(errors.documento_foto?.message || fileError) && (
          <p className="text-red-500 text-xs">{fileError || errors.documento_foto?.message}</p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={onPrev}>Anterior</Button>
        <Button type="submit">Revisar Cadastro</Button>
      </div>
    </form>
  )
}
