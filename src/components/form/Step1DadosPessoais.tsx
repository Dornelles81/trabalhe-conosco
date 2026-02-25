'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step1Schema, Step1Data, FormData } from '@/lib/validations'
import Input from '@/components/ui/Input'
import DateInput from '@/components/ui/DateInput'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import Button from '@/components/ui/Button'

interface Props {
  data: FormData
  updateData: (data: Partial<FormData>) => void
  onNext: () => void
  onReset?: () => void
}

export default function Step1DadosPessoais({ data, updateData, onNext, onReset }: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
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
      possui_deficiencia: data.possui_deficiencia,
      tipo_deficiencia: data.tipo_deficiencia,
      naturalidade: data.naturalidade,
      nome_pai: data.nome_pai,
      nome_mae: data.nome_mae,
      pix_nao_possui: data.pix_nao_possui,
      chave_pix: data.chave_pix,
    },
  })

  const possuiDeficiencia = watch('possui_deficiencia')
  const pixNaoPossui = watch('pix_nao_possui')

  const onSubmit = (values: Step1Data) => {
    if (!values.possui_deficiencia) {
      values.tipo_deficiencia = ''
    }
    if (values.pix_nao_possui) {
      values.chave_pix = ''
    }
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

      <div className="space-y-3">
        <Checkbox
          label="Possui Deficiência?"
          {...register('possui_deficiencia')}
        />
        {possuiDeficiencia && (
          <Select
            label="Tipo de Deficiência"
            required
            {...register('tipo_deficiencia')}
            error={errors.tipo_deficiencia?.message}
            options={[
              { value: 'Visual', label: 'Visual' },
              { value: 'Auditivo', label: 'Auditivo' },
              { value: 'Motora', label: 'Motora' },
              { value: 'Físico', label: 'Físico' },
              { value: 'Mental', label: 'Mental' },
              { value: 'Intelectual', label: 'Intelectual' },
            ]}
          />
        )}
      </div>

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

      <div className="border border-mega-border rounded-lg p-4 bg-mega-bg">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-mega-teal">Dados para Pagamento</p>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('pix_nao_possui')}
              className="w-4 h-4 rounded border-mega-border text-mega-teal accent-mega-teal"
            />
            <span className="text-xs text-mega-text-secondary">Não possui</span>
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
        {onReset && (
          <Button type="button" variant="secondary" onClick={onReset}>
            Limpar formulário
          </Button>
        )}
        <Button type="submit">Próximo</Button>
      </div>
    </form>
  )
}
