'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step2Schema, Step2Data, FormData } from '@/lib/validations'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import MaskedInput from '@/components/ui/MaskedInput'
import Button from '@/components/ui/Button'
import { maskCEP, maskPhone } from '@/lib/masks'
import { useState } from 'react'

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
].map(s => ({ value: s, label: s }))

interface Props {
  data: FormData
  updateData: (data: Partial<FormData>) => void
  onNext: () => void
  onPrev: () => void
}

export default function Step2EnderecoContato({ data, updateData, onNext, onPrev }: Props) {
  const [loadingCep, setLoadingCep] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      cep: data.cep,
      endereco: data.endereco,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      telefone: data.telefone,
      celular: data.celular,
      email: data.email,
    },
  })

  const buscarCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return

    setLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setValue('endereco', data.logradouro || '')
        setValue('bairro', data.bairro || '')
        setValue('cidade', data.localidade || '')
        setValue('estado', data.uf || '')
      }
    } catch {
      // silently fail
    } finally {
      setLoadingCep(false)
    }
  }

  const onSubmit = (values: Step2Data) => {
    updateData(values)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold text-mega-navy mb-6">Endereço e Contato</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MaskedInput
          label="CEP"
          required
          maskFn={maskCEP}
          {...register('cep')}
          error={errors.cep?.message}
          placeholder="00000-000"
          onBlur={(e) => buscarCep(e.target.value)}
        />
        <div className="sm:col-span-2 flex items-end">
          {loadingCep && <span className="text-sm text-mega-text-muted pb-3">Buscando CEP...</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="sm:col-span-3">
          <Input
            label="Endereço"
            required
            {...register('endereco')}
            error={errors.endereco?.message}
          />
        </div>
        <Input
          label="Número"
          required
          {...register('numero')}
          error={errors.numero?.message}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Complemento"
          {...register('complemento')}
          error={errors.complemento?.message}
          placeholder="Apto, Bloco, etc."
        />
        <Input
          label="Bairro"
          required
          {...register('bairro')}
          error={errors.bairro?.message}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Cidade"
            required
            {...register('cidade')}
            error={errors.cidade?.message}
          />
        </div>
        <Select
          label="Estado"
          required
          {...register('estado')}
          error={errors.estado?.message}
          options={ESTADOS}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MaskedInput
          label="Telefone"
          maskFn={maskPhone}
          {...register('telefone')}
          error={errors.telefone?.message}
          placeholder="(00) 00000-0000"
        />
        <MaskedInput
          label="Celular"
          required
          maskFn={maskPhone}
          {...register('celular')}
          error={errors.celular?.message}
          placeholder="(00) 00000-0000"
        />
      </div>

      <Input
        label="E-mail"
        type="email"
        {...register('email')}
        error={errors.email?.message}
        placeholder="seu@email.com"
      />

      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={onPrev}>Anterior</Button>
        <Button type="submit">Próximo</Button>
      </div>
    </form>
  )
}
