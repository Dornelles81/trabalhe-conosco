import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Não disponível em produção' }, { status: 403 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)

    await sql`
      CREATE TABLE IF NOT EXISTS candidatos (
        id SERIAL PRIMARY KEY,
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
        cpf VARCHAR(14) NOT NULL UNIQUE,
        rg VARCHAR(20) NOT NULL,
        orgao_emissor VARCHAR(20),
        data_emissao_rg DATE,
        ctps VARCHAR(20),
        serie_ctps VARCHAR(10),
        pis VARCHAR(20),
        possui_dependentes BOOLEAN DEFAULT FALSE,
        escolaridade VARCHAR(50),
        curso VARCHAR(100),
        experiencia_eventos BOOLEAN DEFAULT FALSE,
        experiencia_descricao TEXT,
        cargo_pretendido VARCHAR(100),
        disponibilidade VARCHAR(50),
        como_soube VARCHAR(100),
        observacoes TEXT,
        documento_foto TEXT,
        documento_foto_nome VARCHAR(255),
        documento_foto_tipo VARCHAR(50),
        status VARCHAR(20) NOT NULL DEFAULT 'novo',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS dependentes (
        id SERIAL PRIMARY KEY,
        candidato_id INTEGER NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
        nome VARCHAR(255) NOT NULL,
        data_nascimento DATE NOT NULL,
        parentesco VARCHAR(50) NOT NULL,
        cpf VARCHAR(14)
      )
    `

    await sql`ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS premiacao_override NUMERIC(10,2) DEFAULT NULL`
    await sql`ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS chave_pix VARCHAR(255)`
    await sql`ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS pix_nao_possui BOOLEAN DEFAULT FALSE`
    await sql`ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS doc_frente TEXT`
    await sql`ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS doc_frente_nome VARCHAR(255)`
    await sql`ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS doc_frente_tipo VARCHAR(100)`
    await sql`ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS doc_verso TEXT`
    await sql`ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS doc_verso_nome VARCHAR(255)`
    await sql`ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS doc_verso_tipo VARCHAR(100)`
    await sql`ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS curriculo TEXT`
    await sql`ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS curriculo_nome VARCHAR(255)`
    await sql`ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS curriculo_tipo VARCHAR(100)`
    await sql`ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS experiencia_profissional TEXT`
    await sql`CREATE INDEX IF NOT EXISTS idx_candidatos_status ON candidatos(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_candidatos_created_at ON candidatos(created_at DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_dependentes_candidato_id ON dependentes(candidato_id)`

    // Se a tabela presencas existir com schema antigo (coluna data), recria com novo schema
    await sql`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'presencas' AND column_name = 'data'
        ) THEN
          DROP TABLE presencas CASCADE;
        END IF;
      END $$;
    `

    await sql`
      CREATE TABLE IF NOT EXISTS presencas (
        id SERIAL PRIMARY KEY,
        candidato_id INTEGER NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
        dia_numero INTEGER NOT NULL,
        periodo VARCHAR(20) NOT NULL DEFAULT 'Dia Inteiro',
        observacao TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(candidato_id, dia_numero)
      )
    `
    await sql`ALTER TABLE presencas ADD COLUMN IF NOT EXISTS periodo VARCHAR(20) NOT NULL DEFAULT 'Dia Inteiro'`
    await sql`CREATE INDEX IF NOT EXISTS idx_presencas_candidato_id ON presencas(candidato_id)`

    await sql`
      CREATE TABLE IF NOT EXISTS evento_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        dias_total INTEGER NOT NULL DEFAULT 6,
        valor_diaria NUMERIC(10,2) NOT NULL DEFAULT 180.00,
        premiacao NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    await sql`ALTER TABLE evento_config ADD COLUMN IF NOT EXISTS premiacao NUMERIC(10,2) NOT NULL DEFAULT 0.00`
    await sql`
      INSERT INTO evento_config (id, dias_total, valor_diaria, premiacao)
      VALUES (1, 6, 180.00, 0.00)
      ON CONFLICT (id) DO NOTHING
    `

    return NextResponse.json({ message: 'Schema criado com sucesso' })
  } catch (error) {
    console.error('Erro no setup:', error)
    return NextResponse.json({ error: 'Falha ao configurar banco de dados', details: String(error) }, { status: 500 })
  }
}
