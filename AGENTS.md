# Project Overview
Clarus is an AI-powered legal assistant that helps users navigate Swedish employment and immigration topics via chat,
guided workflows, and document analysis. The current repo contains a React + Vite frontend paired with Convex
serverless functions and a Convex database schema, with AI responses routed through the OpenRouter API for chat
completion.

## Repository Structure
- `CONTRIBUTING.md`
- `DEPLOYMENT.md`
- `LICENSE`
- `README.md`
- `docker-compose.yml`
- `test_doc.txt`
- `docs/` - Project documentation and internal notes for architecture, setup, and prompts.
  - `architecture.md`
  - `setup.md`
  - `sandbox_review.md`
  - `frontend/`
  - `prompt_lib/`
    - `gen_agents.md`
- `frontend/` - React + Vite client plus Convex functions and schema. Contains the UI, Convex backend code, and build
  tooling.
  - `Dockerfile`
  - `index.html`
  - `package.json`
  - `package-lock.json`
  - `bun.lock`
  - `.eslintrc.cjs`
  - `.prettierrc.json`
  - `tsconfig.json`
  - `tsconfig.node.json`
  - `vite.config.ts`
  - `dist/`
  - `node_modules/`
  - `convex/`
    - `_generated/`
      - `api.d.ts`
      - `api.js`
      - `dataModel.d.ts`
      - `server.d.ts`
      - `server.js`
    - `chat.ts`
    - `documents.ts`
    - `guided.ts`
    - `http.ts`
    - `schema.ts`
    - `workflows.ts`
  - `src/`
    - `App.tsx`
    - `main.tsx`
    - `index.css`
    - `convexClient.ts`
    - `types.ts`
    - `services/`
      - `api.ts`
    - `pages/`
      - `ChatPage.tsx`
      - `DashboardPage.tsx`
      - `GuidedPage.tsx`
      - `LandingPage.tsx`
    - `components/`
      - `chat/`
        - `AnalysisView.tsx`
        - `ChatInput.tsx`
        - `ChatMessage.tsx`
        - `ChatWindow.tsx`
        - `FileUploadArea.tsx`

## Tech stack
- Package managers
  - npm (scripts and `package-lock.json`).
  - bun (`bun.lock` present).
    > TODO: confirm preferred package manager.
- Build tooling
  - Vite for dev server and production build.
  - TypeScript for typing and compilation checks.
  - Tailwind CSS via `@tailwindcss/vite`.
- Frontend framework & UI
  - React 18 with React Router for routing.
  - Lucide React for icons.
- Backend/serverless
  - Convex for queries, mutations, actions, HTTP routes, and data storage.
- AI integration
  - OpenRouter API for chat completions (`OPENROUTER_API_KEY`, default model `openai/gpt-4o-mini`).
- Containers
  - Docker for frontend image build and `docker-compose` orchestration.
- Backend (non-present)
  - README references Python/FastAPI and Gemini.
    > TODO: confirm backend location and whether it is still part of this repo.

## Database Schema
- Convex schema (`frontend/convex/schema.ts`)
  - `guidedSessions`
    - Fields: `workflow_id` (string), `current_step_id` (optional string), `answers` (record string → string),
      `is_complete` (boolean), `tasks` (array of task objects), `warnings` (array of strings),
      `created_at` (number), `updated_at` (number).
    - Task object fields: `id` (string), `title` (string), `description` (string), `due_date` (optional string).
    - Relationships: `workflow_id` and `current_step_id` correspond to entries in `convex/workflows.ts` via app logic
      (no enforced foreign keys).
  - `chatMessages`
    - Fields: `role` (string), `content` (string), `created_at` (number).
    - Currently defined in schema only; no usage elsewhere in the codebase.
- Constraints
  - Convex enforces types and optional fields as defined in the schema.
  - No indexes or uniqueness constraints are defined in the schema.
    > TODO: add any additional tables or constraints if the backend is restored.

## Build & Development Commands
1. Frontend install
```bash
cd frontend
npm install
```
2. Frontend dev servers (UI + Convex)
```bash
cd frontend
npm run dev
npm run dev:convex
```
3. Frontend lint
```bash
cd frontend
npm run lint
```
4. Frontend format
```bash
cd frontend
npm run format
```
5. Frontend build and preview
```bash
cd frontend
npm run build
npm run preview
```
6. Docker Compose (frontend + referenced backend)
```bash
docker-compose up --build
```
> TODO: backend install/lint/format/dev commands (backend directory not present in repo).

## Code Style, Quality and Conventions
- Formatting
  - Prettier with `printWidth: 100`, `tabWidth: 2`, `semi: true`, `singleQuote: true`, `trailingComma: all`.
  - Import sorting via `@trivago/prettier-plugin-sort-imports`.
  - Tailwind class sorting via `prettier-plugin-tailwindcss`.
- Linting
  - ESLint with `eslint:recommended`, `@typescript-eslint/recommended`, `react-hooks/recommended`, `prettier`.
  - React refresh rule enabled: `react-refresh/only-export-components`.
- TypeScript practices
  - Strict mode enabled (`strict: true`) and unused checks enforced.
  - Avoid `any`; define interfaces/types for all shapes.
- React conventions
  - Use functional components and hooks.
- Commit/PR messaging
  - PR titles follow Conventional Commits (e.g., `feat: add chat input`).
    > TODO: define commit message style if different from PR titles.

## Architecture Notes
```mermaid
flowchart LR
  UI[React UI (pages/components)] --> API[services/api.ts]
  API --> ConvexClient[Convex React Client]
  ConvexClient --> Queries[Convex queries/mutations/actions]
  Queries --> DB[(Convex DB)]
  Queries --> OpenRouter[OpenRouter Chat API]
  OpenRouter --> Queries
  Queries --> SSE[/SSE stream via convex/http.ts/]
  SSE --> UI
```
The React app (pages and chat components) uses `frontend/src/services/api.ts` and the Convex client to invoke
Convex queries, mutations, and actions defined in `frontend/convex/*`. Guided workflows are defined in
`convex/workflows.ts`, and user sessions are persisted in the `guidedSessions` table. Chat responses are generated
by calling the OpenRouter API; both standard responses and streaming responses are supported via `convex/chat.ts`
and the SSE route in `convex/http.ts`. Document analysis is currently stubbed in `convex/documents.ts`, returning a
placeholder summary.

## Development Tools
- Context7: use to fetch up-to-date, authoritative library documentation and API usage examples during development.
