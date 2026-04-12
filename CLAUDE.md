# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos principais

```bash
npm run dev      # Servidor de desenvolvimento (porta 3000; se ocupada, use --port 3002)
npm run build    # Build de produção
npm run lint     # ESLint
```

O servidor de desenvolvimento pode estar na porta 3002 se 3000 estiver ocupada (`npm run dev -- --port 3002`).

## Variáveis de ambiente

O arquivo `.env.local` contém:
- `DATABASE_URL` — string de conexão Neon PostgreSQL (inclui `?sslmode=require&channel_binding=require`)
- `ADMIN_PASSWORD` — senha do dashboard administrativo

## Arquitetura

### Stack
Next.js 16 App Router + TypeScript + Tailwind CSS. Banco: Neon (PostgreSQL serverless) via `@neondatabase/serverless`. Validação: Zod + React Hook Form. Geração de documentos: `docx` (Word) e `exceljs` (Excel).

### Acesso ao banco
**Sempre use `getDb()` de `src/lib/db.ts`**, nunca instancie `neon()` diretamente. A URL precisa ter o parâmetro `channel_binding` removido antes da conexão (já tratado em `getDb()`).

### Tabelas principais
- `candidatos` — registro central com 45+ campos: dados pessoais, endereço, documentos, arquivos base64 (documento_foto, curriculo), dados profissionais
- `dependentes` — vinculada a `candidatos` pelo campo `candidato_id`

### Rotas de API (`src/app/api/`)

| Rota | Métodos | Função |
|---|---|---|
| `/api/candidatos` | POST, GET | Inserção de candidato + listagem com counts por status |
| `/api/candidatos/[id]` | GET, PATCH, DELETE | Candidato individual (GET retorna `SELECT *` incluindo base64) |
| `/api/candidatos/[id]/exportar-word` | GET | Ficha Word individual |
| `/api/candidatos/[id]/exportar-rpa` | GET | RPA em Excel |
| `/api/candidatos/exportar-todos-word` | GET | ZIP com todas as fichas Word |
| `/api/admin/login` | POST | Autenticação por senha |
| `/api/setup` | POST | Inicialização do banco |

**Atenção de performance:** O GET da listagem (`/api/candidatos`) **não retorna campos base64** — apenas metadados de arquivo (`_nome`, `_tipo`). O GET individual retorna tudo. O POST tem `maxDuration = 30` definido na rota.

### Formulário de cadastro (`src/components/form/`)
Wizard de 6 steps orquestrado por `FormWizard.tsx`:
1. Dados pessoais (nome, nascimento, sexo, etnia, etc.)
2. Endereço e contato (CEP, telefone, email)
3. Documentos e PIX (CPF único, RG, chave PIX)
4. Família (dependentes opcionais)
5. Informações adicionais (escolaridade, experiência, upload de documentos)
6. Revisão e envio

Cada step tem seu próprio schema Zod em `src/lib/validations.ts`. O pré-envio verifica se o payload total excede 4MB antes de submeter.

### Limite de upload
Imagens comprimidas para máx. 900px / qualidade 0.60 (~60-120KB). Currículo limitado a 800KB. Limite total do servidor: 10MB (`next.config.ts` → `serverActions.bodySizeLimit`). A Vercel Serverless Functions tem limite prático de ~4.5MB por request.

### Dashboard admin (`src/app/admin/`)
Acesso por senha (`ADMIN_PASSWORD`). Exibe stats reais vindas do backend (campo `counts` no response do GET lista). Modal de edição em `src/components/admin/CandidatoModal.tsx`.

### Tema Tailwind
Paleta customizada `mega` definida em `tailwind.config.ts` — use sempre as classes `mega-*` (ex: `bg-mega-bg`, `text-mega-navy`, `bg-mega-teal`) em vez de cores genéricas do Tailwind.

## Script Python de automação eSocial

`automatizar_esocial.py` — automação Playwright para lançamento em massa de TSVE (S-2300) no portal eSocial.

**Pré-requisitos:**
- Chrome aberto com `--remote-debugging-port=9222` e sessão eSocial ativa
- `pip install playwright psycopg2-binary` + `playwright install chromium`
- `esocial_final_62.csv` no diretório raiz

**Fluxo (4 passos):**
1. Navega para `InicioCompleto`, preenche CPF + DataNascimento, Data de Início `08/03/2026`, Tipo `Início de TSVE`, Categoria `701`, clica Continuar
2. Aba Dados Cadastrais: Sexo, Etnia, Grau Instrução, País Nascimento/Nacionalidade (`105`), CEP (aguarda AJAX do município), Logradouro/Número/Bairro (re-injeção via JS pré-salvar), ativa aba Dados Contratuais via Bootstrap JS
3. Aba Dados Contratuais: Natureza `Trabalho Urbano`, Matrícula (sequencial do CSV), Cargo `Orientador de Trafego para Estacionamento`, CBO `519925`, clica Salvar
4. Verifica texto de sucesso: `"vínculo de emprego incluído com sucesso"` ou `"gestão de trabalhadores"`

**Dados:** lidos do banco (`candidatos` por CPF) + matrícula do CSV. Mapeamentos em `SEXO_MAP`, `ETNIA_MAP`, `ESCOLARIDADE_MAP` no topo do arquivo.

**Controle de execução:**
- `MODO_TESTE = True` processa apenas os 3 primeiros
- Log em `log_esocial.json` — CPFs com `status: "OK"` são pulados automaticamente
- Se sessão expirar (~15 min / ~18 workers), o script para com aviso claro; basta re-logar e re-executar

**Campos readonly do portal (Logradouro, Bairro):** preenchidos via JS puro (`el.value = '...'`) sem disparar eventos, e re-injetados imediatamente antes do clique em Salvar para evitar que o AJAX do CEP sobrescreva.
