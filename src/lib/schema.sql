CREATE TABLE IF NOT EXISTS candidatos (
  id SERIAL PRIMARY KEY,
  -- Step 1: Dados Pessoais
  nome_completo VARCHAR(255) NOT NULL,
  data_nascimento DATE NOT NULL,
  sexo VARCHAR(20) NOT NULL,
  estado_civil VARCHAR(30) NOT NULL,
  nacionalidade VARCHAR(100) NOT NULL DEFAULT 'Brasileira',
  etnia VARCHAR(30) NOT NULL DEFAULT '',
  possui_deficiencia BOOLEAN DEFAULT FALSE,
  tipo_deficiencia VARCHAR(50),
  naturalidade VARCHAR(100),
  nome_pai VARCHAR(255),
  nome_mae VARCHAR(255),

  -- Step 2: Endereço e Contato
  cep VARCHAR(10) NOT NULL,
  endereco VARCHAR(255) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  complemento VARCHAR(100),
  bairro VARCHAR(100) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  telefone VARCHAR(20),
  celular VARCHAR(20) NOT NULL,
  email VARCHAR(255),

  -- Step 3: Documentos
  cpf VARCHAR(14) NOT NULL UNIQUE,
  rg VARCHAR(20) NOT NULL,
  orgao_emissor VARCHAR(20),
  data_emissao_rg DATE,
  ctps VARCHAR(20),
  serie_ctps VARCHAR(10),
  pis VARCHAR(20),

  -- Step 4: Família
  possui_dependentes BOOLEAN DEFAULT FALSE,

  -- Step 5: Informações Adicionais
  escolaridade VARCHAR(50),
  curso VARCHAR(100),
  experiencia_eventos BOOLEAN DEFAULT FALSE,
  experiencia_descricao TEXT,
  cargo_pretendido VARCHAR(100),
  disponibilidade VARCHAR(50),
  como_soube VARCHAR(100),
  observacoes TEXT,

  -- Documento (foto CNH/RG)
  documento_foto TEXT,
  documento_foto_nome VARCHAR(255),
  documento_foto_tipo VARCHAR(50),

  -- Currículo
  curriculo TEXT,
  curriculo_nome VARCHAR(255),
  curriculo_tipo VARCHAR(100),
  experiencia_profissional TEXT,

  -- Metadata
  status VARCHAR(20) NOT NULL DEFAULT 'novo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dependentes (
  id SERIAL PRIMARY KEY,
  candidato_id INTEGER NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  data_nascimento DATE NOT NULL,
  parentesco VARCHAR(50) NOT NULL,
  cpf VARCHAR(14)
);

CREATE INDEX IF NOT EXISTS idx_candidatos_status ON candidatos(status);
CREATE INDEX IF NOT EXISTS idx_candidatos_created_at ON candidatos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dependentes_candidato_id ON dependentes(candidato_id);
