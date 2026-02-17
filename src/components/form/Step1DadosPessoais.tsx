'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step1Schema, Step1Data, FormData } from '@/lib/validations'
import Input from '@/components/ui/Input'
import DateInput from '@/components/ui/DateInput'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

interface Props {
  data: FormData
  updateData: (data: Partial<FormData>) => void
  onNext: () => void
}

export default function Step1DadosPessoais({ data, updateData, onNext }: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      nome_completo: data.nome_completo,
      data_nascimento: data.data_nascimento,
      sexo: data.sexo,
      estado_civil: data.estado_civil,
      nacionalidade: data.nacionalidade,
      etnia: data.etnia,
      naturalidade: data.naturalidade,
      nome_pai: data.nome_pai,
      nome_mae: data.nome_mae,
    },
  })

  const onSubmit = (values: Step1Data) => {
    updateData(values)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold text-mega-navy mb-6">Dados Pessoais</h2>

      <Input
        label="Nome Completo"
        required
        {...register('nome_completo')}
        error={errors.nome_completo?.message}
        placeholder="Digite seu nome completo"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="data_nascimento"
          control={control}
          render={({ field }) => (
            <DateInput
              label="Data de Nascimento"
              required
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.data_nascimento?.message}
            />
          )}
        />
        <Select
          label="Sexo"
          required
          {...register('sexo')}
          error={errors.sexo?.message}
          options={[
            { value: 'Masculino', label: 'Masculino' },
            { value: 'Feminino', label: 'Feminino' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Estado Civil"
          required
          {...register('estado_civil')}
          error={errors.estado_civil?.message}
          options={[
            { value: 'Solteiro(a)', label: 'Solteiro(a)' },
            { value: 'Casado(a)', label: 'Casado(a)' },
            { value: 'Divorciado(a)', label: 'Divorciado(a)' },
            { value: 'Viúvo(a)', label: 'Viúvo(a)' },
            { value: 'União Estável', label: 'União Estável' },
          ]}
        />
        <Input
          label="Nacionalidade"
          required
          {...register('nacionalidade')}
          error={errors.nacionalidade?.message}
        />
      </div>

      <Select
        label="Etnia"
        required
        {...register('etnia')}
        error={errors.etnia?.message}
        options={[
          { value: 'Branco', label: 'Branco' },
          { value: 'Negro', label: 'Negro' },
          { value: 'Pardo', label: 'Pardo' },
          { value: 'Amarela', label: 'Amarela' },
          { value: 'Indígena', label: 'Indígena' },
        ]}
      />

      <Input
        label="Naturalidade"
        {...register('naturalidade')}
        error={errors.naturalidade?.message}
        placeholder="Cidade/Estado de nascimento"
      />

      <Input
        label="Nome do Pai"
        {...register('nome_pai')}
        error={errors.nome_pai?.message}
      />

      <Input
        label="Nome da Mãe"
        {...register('nome_mae')}
        error={errors.nome_mae?.message}
      />

      <div className="flex justify-end pt-4">
        <Button type="submit">Próximo</Button>
      </div>
    </form>
  )
}
