import { z } from 'zod'

export const step1Schema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  sexo: z.string().min(1, 'Selecione o sexo'),
  estado_civil: z.string().min(1, 'Selecione o estado civil'),
  nacionalidade: z.string().min(1, 'Nacionalidade é obrigatória'),
  etnia: z.string().min(1, 'Etnia é obrigatória'),
  possui_deficiencia: z.boolean(),
  tipo_deficiencia: z.string().optional(),
  naturalidade: z.string().optional(),
  nome_pai: z.string().optional(),
  nome_mae: z.string().optional(),
})

export const step2Schema = z.object({
  cep: z.string().min(9, 'CEP inválido'),
  endereco: z.string().min(3, 'Endereço é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Bairro é obrigatório'),
  cidade: z.string().min(2, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'Estado deve ter 2 letras'),
  telefone: z.string().optional(),
  celular: z.string().min(14, 'Celular inválido'),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
})

export const step3Schema = z.object({
  cpf: z.string().min(14, 'CPF inválido'),
  rg: z.string().min(5, 'RG é obrigatório'),
  orgao_emissor: z.string().optional(),
  data_emissao_rg: z.string().optional(),
  pis: z.string().min(13, 'PIS/PASEP inválido'),
})

export const step4Schema = z.object({
  possui_dependentes: z.boolean(),
  dependentes: z.array(z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
    parentesco: z.string().min(1, 'Parentesco é obrigatório'),
    cpf: z.string().optional(),
  })).optional(),
})

export const step5Schema = z.object({
  escolaridade: z.string().min(1, 'Escolaridade é obrigatória'),
  curso: z.string().optional(),
  experiencia_eventos: z.boolean(),
  experiencia_descricao: z.string().optional(),
  como_soube: z.string().optional(),
  documento_foto: z.string().min(1, 'Anexe uma foto do documento (CNH ou RG)'),
  documento_foto_nome: z.string().optional(),
  documento_foto_tipo: z.string().optional(),
  curriculo: z.string().optional(),
  curriculo_nome: z.string().optional(),
  curriculo_tipo: z.string().optional(),
  experiencia_profissional: z.string().optional(),
})

export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
export type Step3Data = z.infer<typeof step3Schema>
export type Step4Data = z.infer<typeof step4Schema>
export type Step5Data = z.infer<typeof step5Schema>

export type FormData = Step1Data & Step2Data & Step3Data & Step4Data & Step5Data
