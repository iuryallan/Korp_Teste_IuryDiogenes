# Korp NF — Sistema de Emissão de Notas Fiscais

Projeto técnico desenvolvido para o processo seletivo da Korp ERP (by Viasoft).

## Tecnologias

**Backend**
- Go 1.22
- Gin (framework HTTP)
- GORM (ORM)
- PostgreSQL

**Frontend**
- Angular 19
- Angular Material

**Infraestrutura**
- Docker (PostgreSQL)
- Groq API — Llama 3.3 70B (resumo executivo com IA)

---

## Arquitetura

O sistema é composto por dois microsserviços independentes e um frontend Angular: 

        [Angular :4200]
          ↓          ↓
[Estoque :8081]   [Faturamento :8082]
          ↓          ↓
        [PostgreSQL :5432]

O Faturamento também chama o Estoque diretamente na impressão:

[Faturamento :8082] → [Estoque :8081]

- **Serviço de Estoque** — gerencia produtos e saldos
- **Serviço de Faturamento** — gerencia notas fiscais e se comunica com o estoque na impressão

---

## Pré-requisitos

- [Go 1.22+](https://go.dev/dl/)
- [Node.js LTS](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Angular CLI — `npm install -g @angular/cli`

---

## Como rodar

### 1. Banco de dados

```bash
docker run --name korp-db \
  -e POSTGRES_PASSWORD=senha123 \
  -e POSTGRES_DB=korpdb \
  -p 5432:5432 -d postgres
```

### 2. Serviço de Estoque

```bash
cd estoque
cp .env.example .env
go run main.go
```

Sobe em `http://localhost:8081`

### 3. Serviço de Faturamento

```bash
cd faturamento
cp .env.example .env
# Edite o .env e adicione sua GROQ_API_KEY
go run main.go
```

Sobe em `http://localhost:8082`

> Gere sua chave gratuita em https://console.groq.com

### 4. Frontend

```bash
cd frontend
npm install
ng serve
```

Abre em `http://localhost:4200`

---

## Variáveis de ambiente

### `estoque/.env`
| Variável | Descrição | Padrão |
|---|---|---|
| `DB_HOST` | Host do banco | `localhost` |
| `DB_USER` | Usuário do banco | `postgres` |
| `DB_PASSWORD` | Senha do banco | — |
| `DB_NAME` | Nome do banco | `korpdb` |
| `DB_PORT` | Porta do banco | `5432` |
| `PORT` | Porta do serviço | `8081` |

### `faturamento/.env`
| Variável | Descrição | Padrão |
|---|---|---|
| `DB_HOST` | Host do banco | `localhost` |
| `DB_USER` | Usuário do banco | `postgres` |
| `DB_PASSWORD` | Senha do banco | — |
| `DB_NAME` | Nome do banco | `korpdb` |
| `DB_PORT` | Porta do banco | `5432` |
| `PORT` | Porta do serviço | `8082` |
| `INVENTORY_SERVICE_URL` | URL do serviço de estoque | `http://localhost:8081` |
| `GROQ_API_KEY` | Chave da API do Groq | — |

---

## Rotas da API

### Estoque (`localhost:8081`)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/products` | Lista produtos |
| GET | `/products/:id` | Busca produto |
| POST | `/products` | Cria produto |
| PUT | `/products/:id` | Atualiza produto |
| PUT | `/products/:id/debit` | Debita saldo |
| PUT | `/products/:id/return` | Devolve saldo |

### Faturamento (`localhost:8082`)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/invoices` | Lista notas |
| GET | `/invoices/summary` | Resumo executivo com IA |
| GET | `/invoices/:id` | Busca nota |
| POST | `/invoices` | Cria nota |
| PUT | `/invoices/:id` | Edita nota |
| DELETE | `/invoices/:id` | Exclui nota |
| POST | `/invoices/:id/print` | Imprime nota |

---

## Funcionalidades implementadas

### Obrigatórias
- Cadastro de produtos com código, descrição e saldo
- Cadastro de notas fiscais com numeração sequencial
- Inclusão de múltiplos produtos por nota
- Impressão de nota — debita saldo dos produtos e fecha a nota
- Bloqueio de impressão para notas já fechadas
- Arquitetura de microsserviços (Estoque + Faturamento)
- Tratamento de falhas — erro claro quando o serviço de estoque está indisponível
- Persistência em banco de dados PostgreSQL

### Opcionais implementados
- **Tratamento de Concorrência** — uso de `SELECT FOR UPDATE` em transação no débito de saldo, garantindo que duas impressões simultâneas do mesmo produto não causem saldo negativo
- **Idempotência** — envio de `Idempotency-Key` nas requisições de débito, evitando que uma operação repetida (por falha de rede, por exemplo) debite o saldo duas vezes
- **Inteligência Artificial** — resumo executivo das notas fiscais gerado pelo modelo Llama 3.3 70B via Groq API, acessível na tela de notas fiscais

---

## Detalhamento técnico

### Ciclos de vida Angular utilizados
- `ngOnInit` — utilizado em todos os componentes para carregar dados ao inicializar a tela
- `ngOnDestroy` — não foi necessário pois os componentes são destruídos pelo router sem subscriptions pendentes

### RxJS
Utilizado via `HttpClient` do Angular. Todas as chamadas HTTP retornam `Observable`. Foi utilizado o método `.subscribe()` com os callbacks `next` e `error` para consumir os dados e tratar falhas de forma reativa.

### Bibliotecas Angular
- **Angular Material** — componentes visuais (tabelas, formulários, snackbar, dialog, select)
- **Angular Router** — navegação entre páginas e leitura de parâmetros de rota (`ActivatedRoute`)

### Gerenciamento de dependências Go
Utilizado o sistema nativo `go mod`. O arquivo `go.mod` define o módulo e as dependências, equivalente ao `package.json` do Node.js. As dependências são instaladas com `go get` e versionadas no `go.sum`.

### Frameworks Go
- **Gin** — framework HTTP para definição de rotas e handlers
- **GORM** — ORM para comunicação com PostgreSQL, incluindo migrations automáticas via `AutoMigrate`

### Tratamento de erros no backend
Em Go, erros são valores explícitos retornados pelas funções (`if err != nil`). Dentro das transações, erros são propagados via `return err` e tratados no handler com o status HTTP apropriado. Erros de comunicação entre microsserviços retornam `503 Service Unavailable` com mensagem clara para o frontend.