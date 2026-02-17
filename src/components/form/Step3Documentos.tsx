'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step3Schema, Step3Data, FormData } from '@/lib/validations'
import Input from '@/components/ui/Input'
import DateInput from '@/components/ui/DateInput'
import MaskedInput from '@/components/ui/MaskedInput'
import Button from '@/components/ui/Button'
import { maskCPF, maskPIS } from '@/lib/masks'

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
      ctps: data.ctps,
      serie_ctps: data.serie_ctps,
      pis: data.pis,
      titulo_eleitor: data.titulo_eleitor,
      zona_eleitoral: data.zona_eleitoral,
      secao_eleitoral: data.secao_eleitoral,
    },
  })

  const onSubmit = (values: Step3Data) => {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="CTPS (Carteira de Trabalho)"
          {...register('ctps')}
          error={errors.ctps?.message}
        />
        <Input
          label="Série CTPS"
          {...register('serie_ctps')}
          error={errors.serie_ctps?.message}
        />
      </div>

      <MaskedInput
        label="PIS/PASEP"
        maskFn={maskPIS}
        {...register('pis')}
        error={errors.pis?.message}
        placeholder="000.00000.00-0"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Título de Eleitor"
          {...register('titulo_eleitor')}
          error={errors.titulo_eleitor?.message}
        />
        <Input
          label="Zona Eleitoral"
          {...register('zona_eleitoral')}
          error={errors.zona_eleitoral?.message}
        />
        <Input
          label="Seção Eleitoral"
          {...register('secao_eleitoral')}
          error={errors.secao_eleitoral?.message}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={onPrev}>Anterior</Button>
        <Button type="submit">Próximo</Button>
      </div>
    </form>
  )
}
