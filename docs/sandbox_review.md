# Sandbox Review: Clarus Toy Repository

**Date:** 2025-12-18
**Reviewer:** Antigravity

## Overview
This document summarizes the review of the toy repository (`clarus-gemini`) to identify reusable concepts and patterns for the official `Clarus` project.

## Key Findings
- **Architecture**: The toy project is a client-side React application that communicates directly with the Google Gemini API using the `@google/genai` SDK. There is no intermediate backend.
- **State Management**: It uses a `ChatState` enum (`CLARIFYING`, `SEARCHING`, `GROUNDING`, `DRAFTING_REPORT`, `SHOWING_REPORT`) to manage the conversation flow.
- **Modes**: Features a "Mode Selection" screen (Chat vs Guided).
- **Guided Mode**: Implemented as an "Intake Wizard" that collects data before starting a session.

## Interaction Patterns to Copy
1.  **Chat State Machine**: The transition from Clarification -> Search -> Report is a strong pattern for legal advice and should be preserved in the new backend logic.
2.  **Guided Intake**: The wizard approach for collecting context before the main interaction is good.
3.  **Citations**: The UI handles `GroundingChunk`s to show sources. This needs to be supported by the new Python backend API.

## What to Avoid
-   **Client-side Keys**: The toy repo relies on `process.env.API_KEY` in the frontend. The new project MUST store keys in the Python backend.
-   **Monolithic App Component**: `App.tsx` contains too much logic. We should refactor state management (e.g., custom hooks or Context) in the new frontend.
-   **Direct API Calls**: Ensure all LLM calls go through `backend/app/gemini_client.py` as planned.

## Reusable Components
-   `ChatWindow`, `ChatMessage` (bubbles), `ThinkingIndicator`.
-   `ReportView` for the final output.
-   `IntakeWizard` logic (needs adaptation to new JSON schema).
