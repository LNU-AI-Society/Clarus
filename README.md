# Clarus

Clarus is an AI powered legal assistant for Swedish employment and immigration topics. It provides a chat experience, guided workflows, and a document analysis placeholder to help users understand common scenarios and next steps.

## Vision and Mission

Navigating Swedish employment and immigration law can be overwhelming. Legal information is often scattered, dense, and difficult to interpret without expertise.

Clarus aims to democratize access to legal information by making Swedish employment and immigration guidance accessible, understandable, and actionable.

## About the Project

Clarus helps users understand their options, navigate common legal processes, and prepare for next steps related to work permits and employment changes.

## Core Features

- Chat mode with streaming responses
- Guided workflows for common scenarios
- Session history for guided workflows
- Document analysis placeholder that returns a summary and suggested questions
- Clerk based sign in and sign out

## Tech Stack

- Frontend: TypeScript, React, Vite, Tailwind CSS
- Backend: Convex functions and database
- AI and LLM: Google Gemini via the AI SDK in Convex actions
- Authentication: Clerk

## Architecture Summary

- UI calls Convex queries, mutations, and actions through `frontend/src/services/api.ts`
- Streaming chat uses the Convex HTTP route `/chat/stream`
- Guided workflows are defined in `frontend/convex/workflows.ts`
- Guided sessions are stored in the `guidedSessions` table
- Document analysis is a stub in `frontend/convex/documents.ts`

## Environment Variables

Frontend:
- `VITE_CLERK_PUBLISHABLE_KEY` Clerk publishable key
- `VITE_CONVEX_URL` Convex deployment URL, default `http://localhost:3210`
- `VITE_CONVEX_SITE_URL` Optional Convex site URL used for streaming endpoint

Convex backend:
- `GEMINI_API_KEY` Required for chat responses
- `GEMINI_MODEL` Optional, default `gemini-3-flash-preview`
- `CLIENT_ORIGIN` Optional CORS origin for streaming endpoint, default `http://localhost:5173`

## Local Development

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

In another terminal:

```bash
cd frontend
npm run dev:convex
```

## Build and Preview

```bash
cd frontend
npm run build
npm run preview
```

## Project Structure

- `frontend/` React app and Convex backend
  - `src/` UI pages and components
  - `convex/` Convex actions, queries, mutations, and schema
- `docs/` Internal notes and sandbox review
- `docker-compose.yml` Legacy reference to a backend directory not included here

## Limitations

- Document analysis is a placeholder and does not parse files yet
- Chat citations are not implemented

## Disclaimer

Clarus provides informational guidance only and does not constitute legal advice. Users should consult qualified legal professionals for their specific situations.
