# Verbex AI — AI Agent Management Platform

A full-stack platform to create, manage, and embed AI chatbots on any website.

---

## Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (Next.js 14)         │
│  Admin Dashboard (3000) | Chat Widget (3001) │
└──────────────┬──────────────────────────┘
               │ HTTP
┌──────────────▼──────────────────────────┐
│           Nginx (Port 80)               │
│         Reverse Proxy / Router          │
└──────┬───────────┬───────────┬──────────┘
       │           │           │
┌──────▼──┐  ┌─────▼───┐  ┌───▼──────┐
│  Auth   │  │  Agent  │  │  Chat    │
│ Service │  │ Service │  │ Service  │
│ :4001   │  │  :4002  │  │  :4003   │
└──────┬──┘  └────┬────┘  └───┬──────┘
       │          │            │
       └──────────┼────────────┘
                  │
         ┌────────▼────────┐
         │   PostgreSQL     │
         │     :5432        │
         └─────────────────┘
```

### Services

| Service | Port | Responsibility |
|---------|------|----------------|
| Auth Service | 4001 | Signup, login, JWT, refresh tokens, API keys |
| Agent Service | 4002 | Agent CRUD, conversations list, analytics |
| Chat Service | 4003 | SSE streaming chat, LLM integration, webhooks |
| Admin Dashboard | 3000 | Next.js app — agent management UI |
| Chat Widget | 3001 | Next.js app — public embeddable chat UI |
| Nginx | 80 | Reverse proxy routing `/api/auth/`, `/api/agents/`, `/api/chat/` |

---

## Setup Instructions

### Prerequisites

- Docker & Docker Compose installed
- OpenRouter Account(for free LLM model):https://openrouter.ai

### 1. Clone & configure

```bash
git clone <your-repo-url>
cd verbex-ai
cp .env.example .env
```

Edit `.env` and fill in:
```
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_very_long_random_secret
JWT_REFRESH_SECRET=another_very_long_random_secret
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Run with Docker Compose

```bash
docker compose up --build
```

This starts all services. First build takes ~3–5 minutes.

### 3. Access the apps

| App | URL |
|-----|-----|
| Admin Dashboard | http://localhost:3000 |
| Chat Widget | http://localhost:3001/chat/{agentId} |
| Auth API | http://localhost/api/auth/ |
| Agents API | http://localhost/api/agents/ |
| Chat API | http://localhost/api/chat/ |

### Running services individually (development)

```bash
# Terminal 1 — PostgreSQL only
docker compose up postgres -d

# Terminal 2 — Auth service
cd services/auth-service && npm install && npm run start:dev

# Terminal 3 — Agent service
cd services/agent-service && npm install && npm run start:dev

# Terminal 4 — Chat service
cd services/chat-service && npm install && npm run start:dev

# Terminal 5 — Admin dashboard
cd frontend/admin-dashboard && npm install && npm run dev

# Terminal 6 — Chat widget
cd frontend/chat-widget && npm install && npm run dev
```

---

## API Documentation

### Auth Service — `http://localhost/api/auth`

#### POST /signup
```json
// Request
{ "email": "user@example.com", "password": "secret123" }

// Response 201
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

#### POST /login
```json
// Request
{ "email": "user@example.com", "password": "secret123" }

// Response 200
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

#### POST /refresh
```json
// Request
{ "refreshToken": "eyJ..." }

// Response 200
{ "accessToken": "eyJ...", "refreshToken": "eyJ..." }
```

#### GET /profile  `🔒 Bearer token required`
```json
// Response 200
{
  "id": "uuid",
  "email": "user@example.com",
  "created_at": "2025-01-01T00:00:00Z",
  "apiKey": { "key_prefix": "vx_abc123", "created_at": "..." }
}
```

#### POST /api-key  `🔒 Bearer token required`
```json
// Response 201 (shown ONCE — copy immediately)
{
  "apiKey": "vx_abc123def456...",
  "prefix": "vx_abc123",
  "message": "Copy this key now — it will not be shown again"
}
```

---

### Agent Service — `http://localhost/api/agents`

All routes require `Authorization: Bearer <accessToken>` except `GET /public/:id`.

#### POST /  — Create agent
```json
// Request
{
  "name": "Support Bot",
  "systemPrompt": "You are a helpful customer support agent...",
  "temperature": 0.7,
  "llmProvider": "openai",
  "webhookUrl": "https://your-server.com/webhook"
}

// Response 201
{
  "id": "uuid",
  "name": "Support Bot",
  "system_prompt": "...",
  "temperature": "0.70",
  "llm_provider": "openai",
  "webhook_url": "https://...",
  "created_at": "2025-01-01T00:00:00Z"
}
```

#### GET /  — List all agents with analytics
```json
// Response 200
[
  {
    "id": "uuid",
    "name": "Support Bot",
    "total_conversations": "12",
    "total_messages": "48",
    "last_activity": "2025-01-01T00:00:00Z"
  }
]
```

#### GET /:id  — Get single agent  `🔒`
#### PUT /:id  — Update agent  `🔒`
#### DELETE /:id  — Delete agent  `🔒`

#### GET /:id/conversations  — Conversation list  `🔒`
```json
// Response 200
[
  {
    "id": "uuid",
    "started_at": "2025-01-01T00:00:00Z",
    "last_message": "2025-01-01T00:05:00Z",
    "message_count": 6,
    "first_message": "Hello, I need help with..."
  }
]
```

#### GET /analytics  — All agents analytics  `🔒`

#### GET /public/:id  — Public agent info  `🌐 No auth`
```json
// Response 200
{ "id": "uuid", "name": "Support Bot", "llm_provider": "openai" }
```

---

### Chat Service — `http://localhost/api/chat`

#### POST /:agentId/stream  — Stream chat response  `🌐 No auth`

Returns **Server-Sent Events (SSE)** stream.

```bash
# Example with curl
curl -N -X POST http://localhost/api/chat/{agentId}/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "conversationId": "optional-uuid"}'
```

SSE events:
```
data: {"text": "Hello"}
data: {"text": "! How"}
data: {"text": " can I help?"}
data: {"done": true}
```

#### Programmatic access with API key
```bash
curl -N -X POST http://localhost/api/chat/{agentId}/stream \
  -H "Authorization: Bearer vx_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

#### GET /:agentId/conversations/:conversationId/messages
```json
// Response 200
[
  { "role": "user", "content": "Hello!", "created_at": "..." },
  { "role": "assistant", "content": "Hi! How can I help?", "created_at": "..." }
]
```

---

### Webhook Payload

When a new conversation starts, the agent's webhook URL receives:

```json
{
  "event": "conversation.started",
  "conversationId": "uuid",
  "agentId": "uuid",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## Embedding the Chat Widget

Add to any HTML page:

```html
<iframe
  src="http://localhost:3001/chat/YOUR_AGENT_ID"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);"
/>
```

---

## Database Schema

```sql
users          — id, email, password_hash, created_at
api_keys       — id, user_id, key_hash, key_prefix, created_at
agents         — id, user_id, name, system_prompt, temperature, llm_provider, webhook_url
conversations  — id, agent_id, started_at, last_message, message_count
messages       — id, conversation_id, role, content, created_at
```

---

## AI Tools Usage

### Tools used
- **Claude (claude.ai)** — Primary coding assistant throughout the project
- **GitHub Copilot** — Inline autocomplete for boilerplate NestJS/Next.js patterns

### Time saved estimate
~60–70% of total development time. Estimated manual time: 40+ hours. With AI assistance: ~12–15 hours.

### Example of a helpful prompt
> "Create a NestJS service that streams responses from both OpenAI and Anthropic APIs using SSE. The service should accept a provider string, messages array, system prompt, and temperature, and write chunks to an Express Response object as `data: {text}` lines."

This gave a working first draft of `llm.service.ts` in one shot, which only needed minor adjustments for error handling.

### One challenge faced
**SSE proxy buffering via Nginx** — initial streaming responses were arriving as one big chunk instead of token-by-token. The fix was adding `proxy_buffering off`, `proxy_cache off`, and `chunked_transfer_encoding on` to the Nginx location block for `/api/chat/`. Claude identified this issue immediately when shown the nginx.conf and the symptom description.

---

## Project Structure

```
verbex-ai/
├── docker-compose.yml
├── .env.example
├── init.sql                         ← DB schema
├── nginx/
│   └── nginx.conf
├── services/
│   ├── auth-service/
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       ├── jwt.strategy.ts
│   │       ├── dto/auth.dto.ts
│   │       └── database/database.module.ts
│   ├── agent-service/
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── agent.controller.ts
│   │       ├── agent.service.ts
│   │       ├── jwt.strategy.ts
│   │       ├── dto/agent.dto.ts
│   │       └── database/database.module.ts
│   └── chat-service/
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── chat.controller.ts
│           ├── chat.service.ts
│           ├── llm.service.ts
│           ├── webhook.service.ts
│           ├── jwt.strategy.ts
│           ├── api-key.guard.ts
│           └── database/database.module.ts
└── frontend/
    ├── admin-dashboard/
    │   └── src/
    │       ├── app/
    │       │   ├── layout.tsx
    │       │   ├── page.tsx
    │       │   ├── login/page.tsx
    │       │   ├── signup/page.tsx
    │       │   └── dashboard/
    │       │       ├── layout.tsx
    │       │       ├── page.tsx
    │       │       ├── analytics/page.tsx
    │       │       ├── settings/page.tsx
    │       │       └── agents/[id]/conversations/page.tsx
    │       ├── components/
    │       │   └── AgentFormModal.tsx
    │       ├── context/AuthContext.tsx
    │       └── lib/api.ts
    └── chat-widget/
        └── src/
            └── app/
                ├── layout.tsx
                ├── page.tsx
                └── chat/[agentId]/page.tsx
```
