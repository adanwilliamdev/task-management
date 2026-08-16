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
* Gerenciamento de notificações
* Service Discovery com Eureka
* API Gateway centralizado
* PostgreSQL separado por serviço
* Execução completa com Docker Compose

## 🔄 Principais Endpoints

### Autenticação

```http
POST /api/auth/register
POST /api/auth/login
```

### Usuários

```http
GET /api/users/me
PUT /api/users/me
```

### Tarefas

```http
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/{id}
PATCH  /api/tasks/{id}
DELETE /api/tasks/{id}
```

### Notificações

```http
GET    /api/notifications
PATCH  /api/notifications/{id}
DELETE /api/notifications/{id}
```

Todas as operações autenticadas utilizam:

```http
Authorization: Bearer <JWT>
```

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

Inicie os serviços nesta ordem:

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
