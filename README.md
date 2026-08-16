# TaskFlow

Sistema de gerenciamento de tarefas em arquitetura de microsserviços (Spring Boot) com frontend em React.

## Arquitetura

| Serviço | Porta | Descrição |
|---|---|---|
| discovery-service | 8761 | Eureka Server (service discovery) |
| api-gateway | 8080 | Spring Cloud Gateway — roteia `/api/**` para os serviços |
| auth-service | 8081 | Registro/login, emissão de JWT |
| user-service | 8082 | Perfil do usuário |
| task-service | 8083 | CRUD de tarefas |
| notification-service | 8084 | Notificações do usuário |
| frontend | 3000 (docker) / 5173 (dev) | React + Vite + TypeScript |
| postgres | 5432 | Um container, 4 bancos (`taskflow_auth`, `taskflow_user`, `taskflow_task`, `taskflow_notification`) |

Autenticação: `auth-service` emite um JWT (HS256) assinado com um segredo compartilhado
(`app.jwt.secret` em cada `application.yml`). Os demais serviços validam esse token
localmente via `JwtAuthFilter` — não há chamada de rede entre eles para validar o token.

## Como rodar

### Opção 1 — Docker Compose (recomendado)

```bash
docker compose up --build
```

Isso sobe: Postgres (com os 4 bancos já criados via `postgres-init/`), Eureka,
os 4 microsserviços, o gateway e o frontend (Nginx servindo o build de produção,
proxyando `/api` para o gateway).

Acesse:
- Frontend: http://localhost:3000
- Gateway: http://localhost:8080
- Eureka dashboard: http://localhost:8761

### Opção 2 — Rodando manualmente (dev)

Backend (em ordem, cada um em um terminal):
```bash
cd discovery-service && mvn spring-boot:run
cd auth-service && mvn spring-boot:run
cd user-service && mvn spring-boot:run
cd task-service && mvn spring-boot:run
cd notification-service && mvn spring-boot:run
cd api-gateway && mvn spring-boot:run
```

Frontend:
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173, com proxy de /api para localhost:8080
```

## Fluxo de uso

1. `POST /api/auth/register` (ou tela de registro no frontend) → cria o usuário e já retorna um JWT.
2. O frontend guarda o token no `localStorage` e o envia em `Authorization: Bearer <token>` em toda chamada.
3. `GET/PUT /api/users/me` — perfil (criado automaticamente no primeiro acesso).
4. `GET/POST/PUT/PATCH/DELETE /api/tasks` — CRUD de tarefas, sempre isolado por usuário dono.
5. `GET/PATCH/DELETE /api/notifications` — notificações do usuário logado.

## ⚠️ Limitação conhecida deste ambiente

O backend foi **escrito por completo** (models, DTOs, repositories, services, controllers,
segurança JWT, tratamento de erros), mas **não pôde ser compilado nem testado em tempo de
execução** neste ambiente, porque o sandbox onde o código foi gerado não tem acesso à
internet para o Maven Central (só tem acesso a `npm`, `pypi`, `github`, etc.).

Isso significa que o Java **não foi validado com `mvn compile`/`mvn test` de verdade** —
apenas revisado manualmente (imports, chaves balanceadas, consistência entre camadas).
Rode `mvn clean install` em cada serviço (ou `docker compose up --build`) na sua máquina
com internet para compilar e pegar qualquer erro de digitação/import que eu não tenha
visto na revisão manual.

O **frontend foi de fato instalado, compilado e buildado com sucesso** (`npm run build`
e `tsc -b` passaram sem erros) neste ambiente, já que o registro do npm está acessível.

## Variáveis de ambiente / segurança

O segredo JWT (`taskflowSecretKeyForJwtTokenGenerationWith256BitsLength`) e a senha do
Postgres (`taskflow123`) estão hardcoded nos `application.yml` — isso é aceitável para
desenvolvimento local, mas **não deve ir para produção assim**. Antes de um deploy real,
mova esses valores para variáveis de ambiente/secrets.
