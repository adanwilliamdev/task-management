# 🚀 TaskFlow

Sistema de gerenciamento de tarefas desenvolvido com **Java, Spring Boot, arquitetura de microsserviços e React**.

O projeto foi construído com foco em **arquitetura distribuída, autenticação JWT, comunicação entre serviços, persistência de dados e containerização com Docker**.

## 🏗️ Arquitetura

```text
                         ┌─────────────────────┐
                         │      Frontend       │
                         │   React + Vite      │
                         │      :3000          │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     API Gateway     │
                         │ Spring Cloud Gateway│
                         │       :8080         │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
       │Auth Service │       │User Service │       │Task Service │
       │    :8081    │       │    :8082    │       │    :8083    │
       └─────────────┘       └─────────────┘       └─────────────┘
              │                     │                     │
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │Notification Service │
                         │       :8084         │
                         └─────────────────────┘

                         ┌─────────────────────┐
                         │      Eureka         │
                         │ Service Discovery   │
                         │       :8761         │
                         └─────────────────────┘

                         ┌─────────────────────┐
                         │     PostgreSQL      │
                         │       :5432         │
                         │                     │
                         │ 4 bancos de dados   │
                         └─────────────────────┘
```

## 🧩 Serviços

| Serviço                |       Porta | Responsabilidade                   |
| ---------------------- | ----------: | ---------------------------------- |
| `discovery-service`    |        8761 | Service Discovery com Eureka       |
| `api-gateway`          |        8080 | Gateway e roteamento das APIs      |
| `auth-service`         |        8081 | Registro, login e emissão de JWT   |
| `user-service`         |        8082 | Gerenciamento do perfil do usuário |
| `task-service`         |        8083 | CRUD de tarefas                    |
| `notification-service` |        8084 | Gerenciamento de notificações      |
| `frontend`             | 3000 / 5173 | Interface React                    |
| `postgres`             |        5432 | Persistência dos microsserviços    |

## 🛠️ Tecnologias

### Backend

* Java
* Spring Boot
* Spring Cloud Gateway
* Spring Cloud Netflix Eureka
* Spring Security
* JWT
* Maven
* PostgreSQL

### Frontend

* React
* TypeScript
* Vite

### DevOps

* Docker
* Docker Compose
* Nginx

## 🔐 Autenticação

O `auth-service` é responsável pelo registro e login dos usuários.

Após a autenticação, o serviço gera um **JWT utilizando HS256**.

Os demais microsserviços validam o token localmente através do `JwtAuthFilter`, utilizando um segredo compartilhado configurado em cada `application.yml`.

```text
Login/Register
      │
      ▼
 Auth Service
      │
      │ JWT
      ▼
   Frontend
      │
      │ Authorization: Bearer <token>
      ▼
 API Gateway
      │
      ▼
 Microsserviço
      │
      ▼
 JwtAuthFilter
      │
      ▼
 Autorização
```

Não existe uma chamada de rede entre os microsserviços para validar o JWT.

## 📋 Funcionalidades

* Cadastro de usuários
* Login com JWT
* Autenticação baseada em Bearer Token
* Gerenciamento de perfil
* Criação de tarefas
* Listagem de tarefas
* Atualização de tarefas
* Exclusão de tarefas
* Tarefas isoladas por usuário
* Gerenciamento de notificações (geradas automaticamente ao criar/concluir tarefas)
* Busca e filtro de tarefas, quadro com arrastar e soltar
* **Projetos colaborativos** com membros e papéis (Dono, Editor, Leitor)
* **Atribuição de tarefas** a membros do projeto, com notificação ao responsável
* **Labels** nas tarefas, com filtro no quadro
* **Comentários** e **histórico de atividade** por tarefa
* **Lembretes de prazo** automáticos (vence hoje/amanhã ou atrasada)
* Service Discovery com Eureka
* API Gateway centralizado
* PostgreSQL separado por serviço
* Execução completa com Docker Compose

## 🔄 Principais Endpoints

### Autenticação

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me          (requer token)
GET  /api/auth/users/lookup?username=   # resolve username → id (usado ao convidar membros)
```

### Usuários

```http
GET /api/users/me
PUT /api/users/me
```

### Tarefas

```http
GET    /api/tasks?projectId=&status=&priority=&q=&label=&assigneeId=
                                         # sem projectId: tarefas pessoais; com projectId: tarefas do projeto
GET    /api/tasks/stats?projectId=       # totais por status e atrasadas
GET    /api/tasks/{id}
POST   /api/tasks
PUT    /api/tasks/{id}
PATCH  /api/tasks/{id}/status
DELETE /api/tasks/{id}
GET    /api/tasks/{id}/comments
POST   /api/tasks/{id}/comments
DELETE /api/tasks/{id}/comments/{commentId}
GET    /api/tasks/{id}/activity          # histórico (últimos 50 eventos)
```

### Projetos

```http
GET    /api/projects                     # projetos dos quais sou membro (com meu papel)
POST   /api/projects
GET    /api/projects/{id}
PUT    /api/projects/{id}                # Dono
DELETE /api/projects/{id}                # Dono (apaga tarefas, comentários e histórico)
GET    /api/projects/{id}/members
POST   /api/projects/{id}/members        # Dono: { "username": "...", "role": "EDITOR|VIEWER" }
PATCH  /api/projects/{id}/members/{userId}   # Dono: { "role": "EDITOR|VIEWER" }
DELETE /api/projects/{id}/members/{userId}   # Dono remove qualquer um; membro pode sair
```

| Papel  | Ver tarefas/comentários | Criar/editar/comentar | Excluir tarefa       | Gerir projeto e membros |
| ------ | :---------------------: | :-------------------: | -------------------- | :---------------------: |
| Leitor |           ✅            |          ❌           | ❌                   |           ❌            |
| Editor |           ✅            |          ✅           | só as que criou      |           ❌            |
| Dono   |           ✅            |          ✅           | qualquer uma         |           ✅            |

Quem não é membro recebe **404** (o projeto não revela existir); membro sem permissão recebe **403**.

### Notificações

```http
GET    /api/notifications?onlyUnread=false
GET    /api/notifications/unread-count
PATCH  /api/notifications/read-all
PATCH  /api/notifications/{id}/read
DELETE /api/notifications/{id}
```

Todas as operações autenticadas utilizam:

```http
Authorization: Bearer <JWT>
```

Erros seguem um formato único (`timestamp`, `status`, `error`, `message`, `path`, `validationErrors`).
Token ausente, inválido ou expirado retorna **401** em JSON.

## 🔔 Notificações automáticas

Ao criar uma tarefa ou concluí-la, o `task-service` chama o `notification-service`
(via Eureka, repassando o JWT do usuário) depois do commit e em segundo plano.
Se o notification-service estiver fora do ar, a operação da tarefa não é afetada:
a falha só aparece no log. Para desligar: `NOTIFICATIONS_ENABLED=false`.

## ⏰ Lembretes e notificações entre usuários

Quando uma tarefa é atribuída a outra pessoa, um comentário é feito ou alguém é adicionado a um projeto,
o `task-service` notifica o destinatário pelo endpoint **interno** `POST /api/notifications/internal`
do `notification-service`. Esse endpoint é protegido por uma chave compartilhada (`INTERNAL_API_KEY`,
header `X-Internal-Key`) e o API Gateway o bloqueia para o tráfego externo (responde 404).
**Troque a chave em produção.**

Um agendador no `task-service` roda a cada hora (`REMINDERS_INTERVAL_MS`) e avisa o responsável
(ou o criador) de tarefas que vencem até amanhã ou estão atrasadas, uma única vez por data de entrega.
Para desligar: `REMINDERS_ENABLED=false`.

> Nota: com várias instâncias do `task-service`, o agendador pode duplicar lembretes;
> para escalar, use um lock distribuído (ex.: ShedLock).

## ⚙️ Configuração

Tudo é configurável por variáveis de ambiente; os valores padrão servem para desenvolvimento local.
Copie `.env.example` para `.env` antes de subir em qualquer outro ambiente.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `JWT_SECRET` | segredo de desenvolvimento | Segredo HS256 (mín. 32 caracteres), igual em todos os serviços |
| `JWT_EXPIRATION_MS` | `86400000` | Validade do token (auth-service) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | `taskflow` / `taskflow123` | Credenciais do banco |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | `localhost`, `5432`, banco do serviço | Conexão de cada serviço |
| `EUREKA_URL` | `http://localhost:8761/eureka/` | Service discovery |
| `CORS_ALLOWED_ORIGINS` | `localhost:3000,5173` | Origens aceitas pelo gateway |
| `NOTIFICATIONS_ENABLED` | `true` | Notificações automáticas de tarefas |

> **Atenção:** troque `JWT_SECRET` e a senha do banco fora do ambiente local.

## 🐳 Executando com Docker

A forma recomendada para executar o projeto é utilizando Docker Compose.

```bash
docker compose up --build
```

O ambiente iniciará:

* PostgreSQL
* Eureka
* API Gateway
* Auth Service
* User Service
* Task Service
* Notification Service
* Frontend

### Acessos

| Aplicação        | URL                   |
| ---------------- | --------------------- |
| Frontend         | http://localhost:3000 |
| API Gateway      | http://localhost:8080 |
| Eureka Dashboard | http://localhost:8761 |

O PostgreSQL utiliza um único container com quatro bancos:

```text
taskflow_auth
taskflow_user
taskflow_task
taskflow_notification
```

## 💻 Executando em Desenvolvimento

### Backend

Suba o PostgreSQL (os serviços usam `localhost` por padrão):

```bash
docker compose up -d postgres
```

Inicie os serviços nesta ordem (os timestamps são gravados em UTC; ao rodar fora do Docker use
`-Dspring-boot.run.jvmArguments=-Duser.timezone=UTC` para o horário das notificações ficar correto):

```bash
cd discovery-service
mvn spring-boot:run
```

```bash
cd auth-service
mvn spring-boot:run
```

```bash
cd user-service
mvn spring-boot:run
```

```bash
cd task-service
mvn spring-boot:run
```

```bash
cd notification-service
mvn spring-boot:run
```

```bash
cd api-gateway
mvn spring-boot:run
```

### Testes

```bash
cd task-service
mvn test
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend disponível em:

```text
http://localhost:5173
```

Durante o desenvolvimento, o Vite utiliza proxy para encaminhar as requisições `/api` para o API Gateway em `localhost:8080`.

## 📁 Estrutura do Projeto

```text
TaskFlow/
├── discovery-service/
├── api-gateway/
├── auth-service/
├── user-service/
├── task-service/
├── notification-service/
├── frontend/
├── postgres-init/
├── docker-compose.yml
└── README.md
```

## 🎯 Objetivo

O TaskFlow foi desenvolvido para demonstrar na prática conceitos de:

* Arquitetura de microsserviços
* API Gateway
* Service Discovery
* Autenticação e autorização com JWT
* Spring Security
* APIs REST
* Persistência com PostgreSQL
* Frontend React + TypeScript
* Docker e Docker Compose
* Separação de responsabilidades entre serviços

---

**TaskFlow**
Sistema de gerenciamento de tarefas baseado em **Java Spring Boot + React + Microsserviços**.
