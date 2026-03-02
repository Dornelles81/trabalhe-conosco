'use client'

import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step3Schema, Step3Data, FormData } from '@/lib/validations'
import Input from '@/components/ui/Input'
import DateInput from '@/components/ui/DateInput'
import MaskedInput from '@/components/ui/MaskedInput'
import Button from '@/components/ui/Button'
import { maskCPF } from '@/lib/masks'

interface Props {
  data: FormData
  updateData: (data: Partial<FormData>) => void
  onNext: () => void
  onPrev: () => void
}

export default function Step3Documentos({ data, updateData, onNext, onPrev }: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      cpf: data.cpf,
      rg: data.rg,
      orgao_emissor: data.orgao_emissor,
      data_emissao_rg: data.data_emissao_rg,
      pix_nao_possui: data.pix_nao_possui ?? false,
      chave_pix: data.chave_pix ?? '',
    },
  })

  const pixNaoPossui = useWatch({ control, name: 'pix_nao_possui' })

  const onSubmit = (values: Step3Data) => {
    if (values.pix_nao_possui) {
      values.chave_pix = ''
    }
    updateData(values)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold text-mega-navy mb-6">Documentos</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MaskedInput
          label="CPF"
          required
          maskFn={maskCPF}
          {...register('cpf')}
          error={errors.cpf?.message}
          placeholder="000.000.000-00"
        />
        <Input
          label="RG"
          required
          {...register('rg')}
          error={errors.rg?.message}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Órgão Emissor"
          {...register('orgao_emissor')}
          error={errors.orgao_emissor?.message}
          placeholder="SSP/UF"
        />
        <Controller
          name="data_emissao_rg"
          control={control}
          render={({ field }) => (
            <DateInput
              label="Data de Emissão RG"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.data_emissao_rg?.message}
            />
          )}
        />
      </div>

      <div className="border border-mega-border rounded-lg p-4 bg-mega-bg">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-mega-teal">Dados para Pagamento</p>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('pix_nao_possui')}
              className="w-4 h-4 rounded border-mega-border text-mega-teal accent-mega-teal"
            />
            <span className="text-xs text-mega-text-secondary">Não possui chave PIX</span>
          </label>
        </div>
        {!pixNaoPossui ? (
          <>
            <Input
              label="Chave PIX"
              required
              {...register('chave_pix')}
              error={errors.chave_pix?.message}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
            />
            <p className="text-xs text-mega-text-muted mt-1">A chave PIX deve estar no nome do candidato.</p>
          </>
        ) : (
          <p className="text-sm text-mega-text-muted italic">Candidato informou que não possui chave PIX.</p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={onPrev}>Anterior</Button>
        <Button type="submit">Próximo</Button>
      </div>
    </form>
  )
}
