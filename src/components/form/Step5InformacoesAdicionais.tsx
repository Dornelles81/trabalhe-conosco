'use client'

import { useRef, useState, useEffect } from 'react'
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

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// ── Modal de câmera ────────────────────────────────────────────────────────────
function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (base64: string, fileName: string) => void
  onClose: () => void
}) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [camError, setCamError] = useState('')

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => setReady(true)
        }
      })
      .catch(() => setCamError('Não foi possível acessar a câmera. Verifique as permissões do navegador.'))
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const handleCapture = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg', 0.92)
    streamRef.current?.getTracks().forEach(t => t.stop())
    onCapture(base64, `foto_${Date.now()}.jpg`)
  }

  const handleClose = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-mega-border">
          <p className="text-sm font-semibold text-mega-navy">Câmera</p>
          <button type="button" onClick={handleClose} className="text-mega-text-muted hover:text-mega-text text-2xl leading-none">&times;</button>
        </div>

        {/* Vídeo */}
        <div className="bg-black relative">
          {camError ? (
            <div className="p-8 text-center text-red-400 text-sm">{camError}</div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-[60vh] object-contain"
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                  Iniciando câmera...
                </div>
              )}
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Ações */}
        <div className="p-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-mega-border text-mega-text-secondary text-sm hover:border-mega-navy transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={!ready || !!camError}
            className="flex items-center gap-2 px-6 py-2 bg-mega-teal hover:bg-mega-teal-hover text-white rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Capturar foto
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Campo de upload com câmera ─────────────────────────────────────────────────
function UploadField({
  label,
  required,
  hint,
  accept,
  fileName,
  error,
  inputRef,
  withCamera,
  onFileChange,
  onCameraCapture,
  onRemove,
}: {
  label: string
  required?: boolean
  hint: string
  accept: string
  fileName?: string
  error?: string
  inputRef: React.RefObject<HTMLInputElement | null>
  withCamera?: boolean
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCameraCapture?: (base64: string, fileName: string) => void
  onRemove: () => void
}) {
  const [showCamera, setShowCamera] = useState(false)

  const handleCapture = (base64: string, name: string) => {
    onCameraCapture?.(base64, name)
    setShowCamera(false)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-mega-text">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-mega-text-muted">{hint}</p>}

      {fileName ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-green-700 truncate flex-1">{fileName}</span>
          <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700 text-sm font-medium shrink-0">
            Remover
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-mega-border rounded-lg p-4 text-center space-y-3">
          <svg className="w-8 h-8 mx-auto text-mega-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-mega-border bg-white hover:border-mega-teal hover:text-mega-teal text-mega-text-secondary text-xs font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Arquivo / Galeria
            </button>
            {withCamera && (
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-mega-border bg-white hover:border-mega-teal hover:text-mega-teal text-mega-text-secondary text-xs font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Usar câmera
              </button>
            )}
          </div>
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} onChange={onFileChange} className="hidden" />
      {error && <p className="text-red-500 text-xs">{error}</p>}

      {showCamera && (
        <CameraCapture onCapture={handleCapture} onClose={() => setShowCamera(false)} />
      )}
    </div>
  )
}

// ── Step principal ─────────────────────────────────────────────────────────────
export default function Step5InformacoesAdicionais({ data, updateData, onNext, onPrev }: Props) {
  const frenteInputRef    = useRef<HTMLInputElement>(null)
  const versoInputRef     = useRef<HTMLInputElement>(null)
  const curriculoInputRef = useRef<HTMLInputElement>(null)

  const [frenteError,    setFrenteError]    = useState('')
  const [versoError,     setVersoError]     = useState('')
  const [curriculoError, setCurriculoError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step5Data>({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      escolaridade:             data.escolaridade,
      curso:                    data.curso,
      experiencia_eventos:      data.experiencia_eventos,
      experiencia_descricao:    data.experiencia_descricao,
      como_soube:               data.como_soube,
      doc_frente:               data.doc_frente,
      doc_frente_nome:          data.doc_frente_nome,
      doc_frente_tipo:          data.doc_frente_tipo,
      doc_verso:                data.doc_verso,
      doc_verso_nome:           data.doc_verso_nome,
      doc_verso_tipo:           data.doc_verso_tipo,
      curriculo:                data.curriculo,
      curriculo_nome:           data.curriculo_nome,
      curriculo_tipo:           data.curriculo_tipo,
      experiencia_profissional: data.experiencia_profissional,
    },
  })

  const experienciaEventos = watch('experiencia_eventos')
  const frenteNome         = watch('doc_frente_nome')
  const versoNome          = watch('doc_verso_nome')
  const curriculoNome      = watch('curriculo_nome')

  // ── Handler genérico para inputs de arquivo ───────────────────────
  function makeFileHandler(
    fields: { base64: 'doc_frente' | 'doc_verso'; nome: 'doc_frente_nome' | 'doc_verso_nome'; tipo: 'doc_frente_tipo' | 'doc_verso_tipo' },
    setError: (msg: string) => void,
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      setError('')
      if (!file) return
      if (file.size > 5 * 1024 * 1024) { setError('O arquivo deve ter no máximo 5MB'); e.target.value = ''; return }
      if (!IMAGE_TYPES.includes(file.type)) { setError('Formato inválido. Use JPG, PNG ou WebP'); e.target.value = ''; return }
      const reader = new FileReader()
      reader.onload = () => {
        setValue(fields.base64, reader.result as string, { shouldValidate: true })
        setValue(fields.nome, file.name)
        setValue(fields.tipo, file.type)
      }
      reader.readAsDataURL(file)
    }
  }

  // ── Handler genérico para captura de câmera ───────────────────────
  function makeCameraHandler(
    fields: { base64: 'doc_frente' | 'doc_verso'; nome: 'doc_frente_nome' | 'doc_verso_nome'; tipo: 'doc_frente_tipo' | 'doc_verso_tipo' },
  ) {
    return (base64: string, fileName: string) => {
      setValue(fields.base64, base64, { shouldValidate: true })
      setValue(fields.nome, fileName)
      setValue(fields.tipo, 'image/jpeg')
    }
  }

  const handleFrenteChange  = makeFileHandler({ base64: 'doc_frente', nome: 'doc_frente_nome', tipo: 'doc_frente_tipo' }, setFrenteError, frenteInputRef)
  const handleFrenteCamera  = makeCameraHandler({ base64: 'doc_frente', nome: 'doc_frente_nome', tipo: 'doc_frente_tipo' })
  const removeFrente = () => {
    setValue('doc_frente', '', { shouldValidate: true })
    setValue('doc_frente_nome', '')
    setValue('doc_frente_tipo', '')
    if (frenteInputRef.current) frenteInputRef.current.value = ''
    setFrenteError('')
  }

  const handleVersoChange  = makeFileHandler({ base64: 'doc_verso', nome: 'doc_verso_nome', tipo: 'doc_verso_tipo' }, setVersoError, versoInputRef)
  const handleVersoCamera  = makeCameraHandler({ base64: 'doc_verso', nome: 'doc_verso_nome', tipo: 'doc_verso_tipo' })
  const removeVerso = () => {
    setValue('doc_verso', '', { shouldValidate: true })
    setValue('doc_verso_nome', '')
    setValue('doc_verso_tipo', '')
    if (versoInputRef.current) versoInputRef.current.value = ''
    setVersoError('')
  }

  const handleCurriculoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setCurriculoError('')
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setCurriculoError('O arquivo deve ter no máximo 5MB'); e.target.value = ''; return }
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type)) { setCurriculoError('Formato inválido. Use PDF, DOC ou DOCX'); e.target.value = ''; return }
    const reader = new FileReader()
    reader.onload = () => {
      setValue('curriculo', reader.result as string)
      setValue('curriculo_nome', file.name)
      setValue('curriculo_tipo', file.type)
    }
    reader.readAsDataURL(file)
  }

  const removeCurriculo = () => {
    setValue('curriculo', '')
    setValue('curriculo_nome', '')
    setValue('curriculo_tipo', '')
    if (curriculoInputRef.current) curriculoInputRef.current.value = ''
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
          required
          {...register('escolaridade')}
          error={errors.escolaridade?.message}
          options={[
            { value: 'Ensino Fundamental Incompleto', label: 'Ensino Fundamental Incompleto' },
            { value: 'Ensino Fundamental Completo',   label: 'Ensino Fundamental Completo' },
            { value: 'Ensino Médio Incompleto',        label: 'Ensino Médio Incompleto' },
            { value: 'Ensino Médio Completo',          label: 'Ensino Médio Completo' },
            { value: 'Superior Incompleto',            label: 'Superior Incompleto' },
            { value: 'Superior Completo',              label: 'Superior Completo' },
            { value: 'Pós-Graduação',                  label: 'Pós-Graduação' },
          ]}
        />
        <Input
          label="Curso"
          {...register('curso')}
          error={errors.curso?.message}
          placeholder="Curso em andamento ou concluído"
        />
      </div>

      <Checkbox label="Possui experiência em eventos?" {...register('experiencia_eventos')} />

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
          { value: 'Facebook',  label: 'Facebook' },
          { value: 'Indicação', label: 'Indicação' },
          { value: 'Site',      label: 'Site' },
          { value: 'Outro',     label: 'Outro' },
        ]}
      />

      {/* Documento de identidade — frente e verso */}
      <div className="border border-mega-border rounded-lg p-4 bg-mega-bg space-y-4">
        <p className="text-xs font-semibold text-mega-teal">Documento de Identidade (CNH ou RG) — Frente e Verso</p>
        <p className="text-xs text-mega-text-muted -mt-2">
          Tire fotos legíveis dos dois lados. Formatos aceitos: JPG, PNG ou WebP (máx. 5MB cada).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UploadField
            label="Frente"
            required
            hint=""
            accept="image/jpeg,image/png,image/webp"
            fileName={frenteNome}
            error={frenteError || errors.doc_frente?.message}
            inputRef={frenteInputRef}
            withCamera
            onFileChange={handleFrenteChange}
            onCameraCapture={handleFrenteCamera}
            onRemove={removeFrente}
          />
          <UploadField
            label="Verso"
            required
            hint=""
            accept="image/jpeg,image/png,image/webp"
            fileName={versoNome}
            error={versoError || errors.doc_verso?.message}
            inputRef={versoInputRef}
            withCamera
            onFileChange={handleVersoChange}
            onCameraCapture={handleVersoCamera}
            onRemove={removeVerso}
          />
        </div>
      </div>
      <input type="hidden" {...register('doc_frente')} />
      <input type="hidden" {...register('doc_verso')} />

      {/* Currículo */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-mega-text">
          Currículo <span className="text-mega-text-muted text-xs font-normal">(opcional)</span>
        </label>
        <p className="text-xs text-mega-text-muted">Anexe seu currículo em PDF, DOC ou DOCX (máx. 5MB).</p>

        {curriculoNome ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-green-700 truncate flex-1">{curriculoNome}</span>
            <button type="button" onClick={removeCurriculo} className="text-red-500 hover:text-red-700 text-sm font-medium shrink-0">
              Remover
            </button>
          </div>
        ) : (
          <div
            onClick={() => curriculoInputRef.current?.click()}
            className="border-2 border-dashed border-mega-border hover:border-mega-teal rounded-lg p-6 text-center cursor-pointer transition-colors"
          >
            <svg className="w-8 h-8 mx-auto text-mega-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-mega-text-secondary">Clique para selecionar o arquivo</p>
            <p className="text-xs text-mega-text-muted mt-1">PDF, DOC ou DOCX</p>
          </div>
        )}

        <input
          ref={curriculoInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleCurriculoChange}
          className="hidden"
        />
        {curriculoError && <p className="text-red-500 text-xs">{curriculoError}</p>}
      </div>

      {/* Experiência profissional */}
      <Textarea
        label="Experiência Profissional"
        {...register('experiencia_profissional')}
        error={errors.experiencia_profissional?.message}
        placeholder="Descreva seus empregos anteriores, cargos ocupados, tempo de atuação e principais atividades realizadas."
        rows={5}
      />

      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={onPrev}>Anterior</Button>
        <Button type="submit">Revisar Cadastro</Button>
      </div>
    </form>
  )
}
