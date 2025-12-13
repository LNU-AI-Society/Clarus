# Clarus - AI Legal Assistant for Sweden

## Vision & Mission

Navigating Swedish employment and immigration law can be overwhelming. Legal information is often scattered, dense, and difficult to interpret without expertise.

**Clarus** aims to democratize access to legal information by making Swedish employment and immigration guidance accessible, understandable, and actionable. We believe everyone deserves clear, reliable information about their rights and obligations.

## About the Project

Clarus is an AI-powered legal assistant. It helps users understand their rights, navigate complex legal processes, and take informed action on matters related to work permits, employment changes, and permanent residence.

### Core Features

* **Chat Mode:** Interactive Q&A with an AI assistant that understands your specific legal situation.
* **Guided Mode:** Structured workflows for common scenarios (e.g., Work Permit Renewal).
* **Document Analysis:** Upload contracts or forms for summary and risk assessment.
* **Citation-Backed Answers:** All AI responses include inline citations to ensure transparency.

## Tech Stack

* **Frontend:** React (TypeScript), Vite
* **Backend:** Python (FastAPI)
* **AI/LLM:** Google Gemini Pro (via Vertex AI or Gemini API)
* **Containerization:** Docker

## Getting Started

### Prerequisites

* **Node.js** (v18+)
* **Python** (v3.11+)
* **Gemini API Key** or Google Cloud credentials

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/youni20/Clarus.git](https://github.com/youni20/Clarus.git)
    cd Clarus
    ```

2.  **Install dependencies**
    * Frontend: `cd frontend && npm install`
    * Backend: `cd backend && pip install -r requirements.txt`

3.  **Environment Setup**
    Create a `.env` file in the backend directory with your `GEMINI_API_KEY`.

4.  **Run Development Servers**
    * Frontend: `npm run dev`
    * Backend: `uvicorn app.main:app --reload`

## Contributing

Please see our internal Notion page for the "Clarus Engineering" contribution guide, branching rules, and coding standards.

---
**Disclaimer:** This application provides informational guidance only and does not constitute legal advice. Users should consult with qualified legal professionals for their specific legal situations.
