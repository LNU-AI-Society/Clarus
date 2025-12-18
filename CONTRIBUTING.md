# Contributing to Clarus

We are building an AI-powered legal assistant to democratize access to Swedish legal information. This document outlines the standards and workflows we use to keep our codebase clean and reliable.

## 1. Branching Strategy

We use a simplified Gitflow workflow. Please follow these naming conventions:

* **`main`**: Production-ready code. **Never commit directly to main.**
* **`develop`**: The integration branch. All Pull Requests (PRs) should target this branch.
* **Feature Branches**: Create these off `develop`.
    * Format: `feat/short-description` (e.g., `feat/chat-interface`)
* **Bug Fixes**: Create these off `develop`.
    * Format: `fix/short-description` (e.g., `fix/login-error`)
* **Documentation/Chores**:
    * Format: `docs/readme-update` or `chore/dependency-bump`

## 2. Development Workflow

1.  **Sync**: Always pull the latest `develop` branch before starting.
2.  **Branch**: Create your feature branch.
3.  **Code**: Implement your changes.
4.  **Lint & Format**: Ensure your code meets our style guides (see below).
5.  **Push**: Push your branch to the repository.
6.  **PR**: Open a Pull Request targeting `develop`.

## 3. Coding Standards

### Backend (Python/FastAPI)
* **Tools**: We use **Ruff** for both linting and formatting.
* **Commands**:
    * Format: `ruff format backend`
    * Lint: `ruff check backend --fix`
* **Typing**: Strict type hints are required (Pydantic models).
    * *Good*: `def calculate_risk(age: int) -> float:`
* **Structure**: Keep business logic out of `routers/`.

### Frontend (React/TypeScript)
* **Tools**: **ESLint** (linting) and **Prettier** (formatting).
* **Commands**:
    * Format: `npm run format` (runs Prettier)
    * Lint: `npm run lint` (runs ESLint)
* **Typing**: No `any` types allowed. Define interfaces.
* **Components**: Use Functional Components with Hooks.

## 4. Pull Request (PR) Checklist

Before requesting a review, please ensure:

- [ ] My code follows the style guidelines of this project.
- [ ] I have performed a self-review of my own code.
- [ ] I have commented on my code, particularly in hard-to-understand areas.
- [ ] I have verified that the changes work locally (Frontend + Backend).
- [ ] The PR title follows the conventional commit format (e.g., "feat: add chat input").
- [ ] CI checks pass (Lint & Build).

## 5. Code Review Process

* **Requirement**: All PRs require at least **1 approval** from another team member.
* **Feedback**: Be constructive and kind. Focus on the code, not the person.
* **Merging**: Once approved and all checks pass, squash and merge into `develop`.