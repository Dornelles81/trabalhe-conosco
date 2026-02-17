'use client'

import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step4Schema, Step4Data, FormData } from '@/lib/validations'
import Input from '@/components/ui/Input'
import DateInput from '@/components/ui/DateInput'
import Select from '@/components/ui/Select'
import MaskedInput from '@/components/ui/MaskedInput'
import Checkbox from '@/components/ui/Checkbox'
import Button from '@/components/ui/Button'
import { maskCPF } from '@/lib/masks'

interface Props {
  data: FormData
  updateData: (data: Partial<FormData>) => void
  onNext: () => void
  onPrev: () => void
}

export default function Step4Familia({ data, updateData, onNext, onPrev }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      possui_dependentes: data.possui_dependentes,
      dependentes: data.dependentes?.length ? data.dependentes : [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'dependentes',
  })

  const possuiDependentes = watch('possui_dependentes')

  const onSubmit = (values: Step4Data) => {
    updateData(values)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold text-mega-navy mb-6">Família e Dependentes</h2>

      <Checkbox
        label="Possui dependentes?"
        {...register('possui_dependentes')}
      />

      {possuiDependentes && (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-mega-border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-mega-text">
                  Dependente {index + 1}
                </h4>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  Remover
                </button>
              </div>

              <Input
                label="Nome"
                required
                {...register(`dependentes.${index}.nome`)}
                error={errors.dependentes?.[index]?.nome?.message}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Controller
                  name={`dependentes.${index}.data_nascimento`}
                  control={control}
                  render={({ field: dateField }) => (
                    <DateInput
                      label="Data de Nascimento"
                      required
                      value={dateField.value}
                      onChange={dateField.onChange}
                      onBlur={dateField.onBlur}
                      error={errors.dependentes?.[index]?.data_nascimento?.message}
                    />
                  )}
                />
                <Select
                  label="Parentesco"
                  required
                  {...register(`dependentes.${index}.parentesco`)}
                  error={errors.dependentes?.[index]?.parentesco?.message}
                  options={[
                    { value: 'Filho(a)', label: 'Filho(a)' },
                    { value: 'Cônjuge', label: 'Cônjuge' },
                    { value: 'Pai/Mãe', label: 'Pai/Mãe' },
                    { value: 'Outro', label: 'Outro' },
                  ]}
                />
                <MaskedInput
                  label="CPF"
                  maskFn={maskCPF}
                  {...register(`dependentes.${index}.cpf`)}
                  error={errors.dependentes?.[index]?.cpf?.message}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="secondary"
            onClick={() => append({ nome: '', data_nascimento: '', parentesco: '', cpf: '' })}
          >
            + Adicionar Dependente
          </Button>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={onPrev}>Anterior</Button>
        <Button type="submit">Próximo</Button>
      </div>
    </form>
  )
}
