# Rumo — Gestão de Tarefas

Aplicação full-stack de gestão de tarefas em formato kanban, com autenticação própria e quadro de arrastar e soltar. Backend em **Spring Boot**, frontend em **React + Material UI**.

## Visão geral

Cada usuário se cadastra, faz login e passa a ter seu próprio quadro com três colunas — **A fazer**, **Em andamento** e **Concluído**. As tarefas podem ser criadas, editadas, movidas entre colunas (arrastando ou editando o status) e excluídas. Todo o acesso é protegido por token: um usuário só enxerga e manipula as próprias tarefas.

## Funcionalidades

- Cadastro e login com autenticação via JWT (access token + refresh token)
- Quadro kanban com drag-and-drop entre colunas
- Criação, edição, exclusão e priorização de tarefas (baixa / média / alta)
- Data de vencimento com aviso visual para tarefas atrasadas
- Busca por título/descrição e barra de progresso de conclusão
- Renovação automática do token de acesso quando expira, sem derrubar a sessão
- Interface responsiva, com estados de carregamento e vazio tratados

## Stack técnica

| Camada | Tecnologias |
|---|---|
| Backend | Java 17, Spring Boot 3, Spring Security, Spring Data JPA, PostgreSQL, JWT (jjwt), Lombok |
| Frontend | React 18, Material UI 5, React Router, Axios, @hello-pangea/dnd, react-hot-toast, date-fns |

## Arquitetura

```
task-management/
├── backend/                 API REST (Spring Boot)
│   └── src/main/java/com/taskmanagement/
│       ├── controller/      Endpoints REST (Auth, Task)
│       ├── service/         Regras de negócio
│       ├── repository/      Acesso a dados (Spring Data JPA)
│       ├── model/           Entidades (User, Task)
│       ├── dto/              Objetos de requisição/resposta
│       ├── security/        JWT, filtro de autenticação, UserDetails
│       ├── config/          Configuração de segurança e CORS
│       └── exception/       Tratamento centralizado de erros
│
└── frontend/                 SPA (React)
    └── src/
        ├── components/auth/   Login, cadastro, rota privada
        ├── components/tasks/  Quadro, cartão de tarefa, formulário
        ├── contexts/          Estado global de autenticação e tarefas
        └── services/          Cliente HTTP (Axios) com interceptors
```

O frontend nunca acessa o banco diretamente: toda a comunicação passa pela API REST do backend, autenticada via header `Authorization: Bearer <token>`.

## Como executar localmente

### Pré-requisitos

- Java 17+ e Maven
- Node.js 18+ e npm
- PostgreSQL rodando localmente (ou acessível via URL)

### 1. Banco de dados

Crie um banco chamado `taskdb` (ou ajuste as variáveis de ambiente abaixo). As tabelas são criadas automaticamente na primeira execução (`ddl-auto: update`).

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

Variáveis de ambiente disponíveis (todas opcionais, com valores padrão para desenvolvimento):

| Variável | Padrão | Descrição |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/taskdb` | URL de conexão com o banco |
| `DB_USERNAME` | `postgres` | Usuário do banco |
| `DB_PASSWORD` | `postgres` | Senha do banco |
| `JWT_SECRET` | valor de desenvolvimento embutido | Chave usada para assinar os tokens |
| `JWT_EXPIRATION` | `86400000` (24h) | Validade do access token, em ms |
| `JWT_REFRESH_EXPIRATION` | `604800000` (7 dias) | Validade do refresh token, em ms |
| `FRONTEND_URL` | `http://localhost:3000` | Origem liberada no CORS |

A API sobe em `http://localhost:8080`.

> Em produção, defina sempre `JWT_SECRET` com um valor próprio e mantenha-o fora do controle de versão.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

A aplicação sobe em `http://localhost:3000` e já aponta para a API local por padrão (configurável em `.env`, variável `REACT_APP_API_URL`).

## Principais endpoints da API

| Método | Rota | Descrição | Autenticado |
|---|---|---|---|
| POST | `/api/auth/register` | Cria uma conta | Não |
| POST | `/api/auth/login` | Autentica e retorna os tokens | Não |
| POST | `/api/auth/refresh` | Renova o access token | Não |
| GET | `/api/tasks` | Lista as tarefas do usuário logado | Sim |
| GET | `/api/tasks/filter` | Lista tarefas filtrando por status/prioridade/vencimento | Sim |
| GET | `/api/tasks/{id}` | Detalha uma tarefa | Sim |
| POST | `/api/tasks` | Cria uma tarefa | Sim |
| PUT | `/api/tasks/{id}` | Atualiza uma tarefa | Sim |
| PATCH | `/api/tasks/{id}/status` | Atualiza apenas o status | Sim |
| DELETE | `/api/tasks/{id}` | Remove uma tarefa | Sim |

Todas as rotas autenticadas exigem o header `Authorization: Bearer <accessToken>`. Cada usuário só consegue ler e alterar suas próprias tarefas — a checagem de propriedade é feita no backend.

## Segurança

- Senhas armazenadas com hash BCrypt, nunca em texto plano
- Sessão stateless: nenhuma informação de autenticação fica guardada no servidor entre requisições
- CORS restrito à origem configurada em `FRONTEND_URL`
- Validação de entrada em cadastro e criação de tarefas (Bean Validation)

## Possíveis evoluções

- Compartilhamento de tarefas entre usuários ou times
- Notificações de vencimento próximo
- Testes automatizados (unitários e de integração)
- Deploy containerizado (Docker Compose com backend + frontend + banco)
