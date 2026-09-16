# VX Hub

Hub de marcas da VX Comunicação: página estática de apresentação (`index.html`) + painel administrativo (React + Express + MySQL) para gerenciar marcas, logos, fontes e cores.

## Estrutura do projeto

```
.
├── index.html / hub-preview.html / styles.css   # site estático (hub de marcas)
├── admin/            # painel admin (React + Vite)
├── server/           # API (Node/Express + mysql2)
├── db/init/          # schema + seed do MySQL (rodado automaticamente pelo container)
├── docker-compose.yml
├── Dockerfile
└── .env.example      # modelo de variáveis de ambiente
```

## Pré-requisitos

- [Node.js 20+](https://nodejs.org/) e npm
- [Docker](https://www.docker.com/) + Docker Compose (para banco de dados e/ou stack completa)
- Git

## 1. Clonar o repositório

```bash
git clone https://github.com/danromano777/vxhub.git
cd vxhub
```

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e preencha ao menos:
- `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
- `JWT_SECRET` (string aleatória longa)
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (usuário admin criado na primeira subida)

Nunca commite o `.env` real (já está no `.gitignore`).

## 3. Rodar localmente

Existem três formas, dependendo do que você quer testar:

### A) Apenas a landing page estática (mais rápido)

```bash
npm install
npm run dev
```

Abre `index.html` em `http://localhost:5500` via `live-server`.

### B) Stack completa com Docker (banco + painel admin + API)

```bash
docker compose --profile app up -d --build
```

- Sobe o MySQL (com schema e seed de `db/init/001_schema.sql`) e a API/admin buildados em produção.
- Landing page disponível em `http://localhost:3000/`.
- Painel admin disponível em `http://localhost:3000/admin` (login com `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`).
- Para subir só o banco (sem o app): `docker compose up -d` (sem `--profile app`).
- Para parar: `docker compose down` (adicione `-v` para apagar também os dados do MySQL).

### C) Desenvolvimento com hot-reload (banco via Docker, app local)

```bash
# 1. Sobe só o MySQL
docker compose up -d

# 2. API (em um terminal)
cd server
npm install
npm run dev        # node --watch, porta 3000 por padrão

# 3. Painel admin (em outro terminal)
cd admin
npm install
npm run dev         # Vite dev server, normalmente http://localhost:5173
```

Configure a API do admin (`admin/src/api.js`) para apontar para `http://localhost:3000` se necessário durante o desenvolvimento local.

## Scripts úteis

| Local | Comando | Descrição |
|---|---|---|
| raiz | `npm run dev` | live-server para a landing estática |
| `server/` | `npm start` | roda a API em produção |
| `server/` | `npm run dev` | roda a API com watch/reload |
| `admin/` | `npm run dev` | Vite dev server do painel |
| `admin/` | `npm run build` | build de produção do painel (gera `admin-dist` usado pelo Dockerfile) |

## Banco de dados

O schema (`db/init/001_schema.sql`) cria as tabelas `users`, `brands`, `sections` e `blocks`, e já popula um seed inicial com os 11 clientes (Canal Brasil, ESPN, NBCU Hub, Prio, Sony Channel, Sony Home Entertainment, Sony One, Studio Universal, Universal TV, USA, VX). Cada cliente recebe 4 seções padrão (Logos, Fontes, Brandguide, Cores); o Canal Brasil vem com os blocos reais migrados do hub de referência (logos, fontes, cores, brandguide), os demais clientes recebem um bloco de logo principal e blocos de cor derivados do gradiente da marca. Esse script roda automaticamente na primeira inicialização do container MySQL (via `docker-entrypoint-initdb.d`) — se o banco já existir, rode `docker compose down -v` antes de subir de novo para reaplicar o seed.

`sections` são as áreas de conteúdo de cada cliente (fixas ou criadas livremente pelo usuário). `blocks` são os itens dentro de uma seção — cada bloco tem um `block_type` (`image_download`, `video`, `font_card`, `color_palette`, `pdf_viewer`, `link_item` ou `code_snippet`) que determina quais campos são usados.

`db/init/002_briefings.sql` cria as tabelas `briefings` (briefing de job vinculado opcionalmente a um cliente, com status `rascunho`/`enviado`/`em_revisao`/`aprovado`/`reprovado`) e `briefing_status_history` (histórico de cada mudança de status, com autor e nota).

`db/init/003_briefing_nomenclature.sql` evolui o briefing para a estrutura completa usada pelo Agente de Briefings VX (contexto, objetivo, público, produto/serviço, mensagem/conceito, escopo, canais, referências, histórico, do's & don'ts, KPIs e pontos a apurar) e adiciona a sigla de cada marca (`brands.code`, ex: `CB`, `ESPN`, `ALAD`) usada para gerar automaticamente a nomenclatura padrão de card/arquivo da esteira ON+OFF+PRIO (`[SIGLA]mês-dia_NomeCampanha_Título_EST|VID_nPeças[_formato]`). Também cadastra (como `briefing_only = TRUE`, ou seja, disponíveis apenas no seletor de cliente do briefing e **fora** da home pública do hub) os demais clientes da esteira que ainda não existiam no hub: Aladdin, Casa Roberto Marinho, Coach ISM, Colicaliv, Costa Verde, Universo Herbarium, Globoplay, Globo Internacional, GNT, Megapix, Multishow, Musquee, Omater Gest, Oshadhi, Riberalves, Soter, Stanley, VX Portugal e Ecoponte.

`db/init/004_prio_code.sql` define a sigla `PRIO` para o cliente Prio, que não estava na tabela de siglas do documento de nomenclatura (só era citado como equipe/time separado da esteira ON+OFF).

Esses scripts rodam automaticamente na primeira inicialização do container MySQL (via `docker-entrypoint-initdb.d`); se o banco já existir de uma versão anterior do projeto, rode o conteúdo de cada arquivo novo manualmente, na ordem, por exemplo: `docker compose exec -T db mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < db/init/003_briefing_nomenclature.sql` (sem perder os dados existentes).

## Extração de briefing por IA (opcional)

Na tela de briefing existe uma caixa "Colar texto do cliente" com três formas de preencher o formulário automaticamente:
- **Colar texto** (WhatsApp, e-mail etc.) e clicar em "Extrair texto colado".
- **Enviar um arquivo de imagem ou PDF** (print de conversa, pedido em PDF) pelo botão "📎 Enviar arquivo".
- **Enviar um áudio** (nota de voz do WhatsApp etc.) pelo mesmo botão — é transcrito automaticamente e depois extraído, em uma única ação.

Texto, imagem e PDF vão direto para a API da Anthropic (modelo `claude-opus-5`, `POST /api/ai/extract-briefing` ou `/api/ai/extract-briefing-file`), que devolve só os campos explicitamente presentes no material (nunca inventa informação) e preenche automaticamente os campos do formulário que ainda estavam vazios.

**Áudio** passa primeiro pela OpenAI (Whisper, `POST /api/ai/transcribe-audio`) para virar texto — a API da Anthropic não faz transcrição de fala — e o texto resultante entra na caixa de colar texto (você pode revisar/editar) antes de seguir automaticamente para a extração de campos. Vídeo continua sem suporte.

Para habilitar cada parte, defina no `.env`:
- `ANTHROPIC_API_KEY` (extração de texto/imagem/PDF) — https://console.anthropic.com/
- `OPENAI_API_KEY` (transcrição de áudio via Whisper) — https://platform.openai.com/api-keys

Sem alguma dessas chaves, o botão correspondente continua visível mas retorna um aviso de que aquela etapa não está configurada, em vez de falhar silenciosamente. Cada extração/transcrição gera uma chamada de API paga na conta vinculada à respectiva chave.

Para habilitar, defina `ANTHROPIC_API_KEY` no `.env` (gere a chave em https://console.anthropic.com/) — sem ela, os botões continuam visíveis mas retornam um aviso de que a extração por IA não está configurada. Cada extração gera uma chamada de API (custo pequeno, cobrado na conta da Anthropic vinculada à chave).

**Áudio:** a API da Anthropic não faz transcrição de fala (não existe endpoint de speech-to-text no Claude) — então "jogar um áudio do cliente e virar texto" precisa de um provedor separado (ex: mesmo faz sentido usar algo como Whisper/OpenAI, Google Speech-to-Text, AssemblyAI ou Deepgram só para o passo de transcrição; o texto resultante aí sim pode ser colado na mesma caixa acima e extraído pela Anthropic). Isso ainda não foi implementado — avise se quiser seguir com algum desses provedores.

## Painel admin

O painel (`/admin`) tem 4 abas, todas na mesma tela (sem navegar pra outra URL):
- **Clientes**: lista de marcas com busca (nome/slug/grupo/filtro), filtros por Grupo e por Filtro, ordenação, logo (passe o mouse para trocar via upload) e ações de editar/excluir. "Editar cores" ajusta o gradiente do card (incluindo cor de fundo e o toggle "fundo claro"). Cada marca tem uma **sigla** (usada na nomenclatura do briefing) e um toggle **"somente para briefing"**, que a esconde da home pública mantendo-a disponível só no seletor de cliente do briefing.
- **Conteúdo do Site**: título, subtítulo, descrição e logo da home pública.
- **Briefings**: plataforma de briefing interna. Ao criar um novo briefing, primeiro escolhe-se o **tipo de job** (`admin/src/lib/jobTypes.js`), que decide quais campos o formulário pede:
  - **Job avulso** (formulário enxuto): Post social/Stories, Vídeo/Reels, Trinca de posts, Vaga (RH), E-mail marketing.
  - **Campanha** (formulário completo — identificação, contexto, objetivo, público, produto/serviço, mensagem/conceito, escopo e entregáveis, canais, referências, histórico, prazos, orçamento, do's & don'ts, KPIs e pontos a apurar): KV/Key Visual, Campanha completa, Anúncio digital/Mídia paga, Website/Landing page, Evento.
  - **Ajuste** e **Refação** (formulário enxuto, sem geração de nomenclatura — são pedidos sobre uma peça que já existe, não um card novo): seguem o vocabulário padronizado do guia interno da conta ("Tela", não "Card"; "Ajustar"/"Refação", não termos vagos como "arrumar"/"mexer"/"fazer diferente"), com placeholders e lembrete do vocabulário direto no campo de escopo.

  Além disso: filtro por status/cliente na listagem, geração automática da nomenclatura padrão de card/arquivo a partir da sigla do cliente (quando o tipo gera nomenclatura), e uma tela de detalhe que permite avançar o status (rascunho → enviado → em revisão → aprovado/reprovado) registrando uma nota e mantendo o histórico completo de aprovação.
- **Usuários**: gestão de contas do painel (somente para admins).

Na edição de cada cliente (✎), Grupo e Filtro são escolhidos num menu suspenso com os valores já em uso (ou "+ Novo…" para cadastrar um valor novo), o logo aceita URL ou upload direto da máquina, e há um ajuste manual de centralização horizontal do logo para os casos em que a centralização automática não fica perfeita.

Dentro de cada cliente, a tela de **Seções** ("📂 Seções") permite criar seções livremente ("+ Nova Seção"), renomeá-las (✎) e adicionar blocos de qualquer tipo (imagem, imagem+link, vídeo, fonte, cor, PDF, link ou código) via o seletor "+ Bloco"; editar/excluir um bloco existente é feito passando o mouse sobre o próprio thumbnail dele. Uploads de logo e de arquivos de bloco (imagem/fonte/vídeo) são salvos em `server/uploads/` (persistido via volume Docker `app_uploads` para sobreviver a rebuilds) e só aceitam extensões de imagem/fonte/vídeo conhecidas.

## Backup e restauração do banco

Com a stack rodando (`docker compose --profile app up -d`), para gerar um backup:

```bash
docker compose exec db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --databases "$MYSQL_DATABASE" > backup.sql
```

Para restaurar (banco precisa já existir, mesmo que vazio):

```bash
docker compose exec -T db mysql -u root -p"$MYSQL_ROOT_PASSWORD" < backup.sql
```

No PowerShell, troque `$MYSQL_ROOT_PASSWORD`/`$MYSQL_DATABASE` pelos valores reais do seu `.env` (ou rode o comando a partir do WSL/Git Bash, onde a sintaxe acima funciona direto).

## Esqueci a senha do admin

Não existe fluxo de "esqueci minha senha" na tela de login. Para resetar, gere um novo hash bcrypt e atualize direto no banco:

```bash
docker compose exec app node -e "import('bcryptjs').then(b=>b.hash('nova_senha_aqui',10)).then(console.log)"
docker compose exec db mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" \
  -e "UPDATE users SET password_hash='<hash gerado acima>' WHERE email='seu@email.com';"
```

## Deploy

Variáveis de FTP/SSH em `.env.example` são usadas para deploy manual (fora deste README). Preencha apenas se for publicar via FTP/SFTP.
