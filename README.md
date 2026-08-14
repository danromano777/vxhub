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

O schema (`db/init/001_schema.sql`) cria as tabelas `users`, `brands`, `brand_logos`, `brand_fonts`, `brand_colors` e já popula um seed inicial com os 11 clientes (Canal Brasil, ESPN, NBCU Hub, Prio, Sony Channel, Sony Home Entertainment, Sony One, Studio Universal, Universal TV, USA, VX), incluindo logo e cores de cada um. Esse script roda automaticamente na primeira inicialização do container MySQL (via `docker-entrypoint-initdb.d`) — se o banco já existir, rode `docker compose down -v` antes de subir de novo para reaplicar o seed.

## Painel admin

O painel (`/admin`) tem 3 áreas:
- **Clientes**: lista de marcas com logo (clique/arraste sobre o logo para trocar via upload), cores do gradiente e ações de editar/excluir.
- **Seções**: visão agregada dos links de Logos/Fontes/Brandguide/Cores cadastrados por cliente.
- **Usuários**: gestão de contas do painel (somente para admins).

Upload de logo salva o arquivo em `server/uploads/logos/` (persistido via volume Docker `app_uploads` para sobreviver a rebuilds).

## Deploy

Variáveis de FTP/SSH em `.env.example` são usadas para deploy manual (fora deste README). Preencha apenas se for publicar via FTP/SFTP.
