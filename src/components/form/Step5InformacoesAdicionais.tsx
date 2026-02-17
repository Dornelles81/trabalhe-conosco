'use client'

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
  const {
    register,
    handleSubmit,
    watch,
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
    },
  })

  const experienciaEventos = watch('experiencia_eventos')

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

      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={onPrev}>Anterior</Button>
        <Button type="submit">Revisar Cadastro</Button>
      </div>
    </form>
  )
}
