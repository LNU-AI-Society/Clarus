# Deployment Guide

## Prerequisites
- Docker & Docker Compose installed.
- Valid `GEMINI_API_KEY`.

## Local Deployment (Docker)
1. **Create .env file** (optional, or pass inline):
   ```bash
   export GEMINI_API_KEY=your_key_here
   ```

2. **Build and Run**:
   ```bash
   docker-compose up --build
   ```

3. **Access**:
   - Frontend: http://localhost:3000
   - Backend Docs: http://localhost:8000/docs

## Cloud Deployment (Example: Render / Railway)

### Backend
1. Connect repository.
2. Select `backend/` as root directory.
3. Build Command: `pip install -r requirements.txt`.
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Add Environment Variable: `GEMINI_API_KEY`.

### Frontend
1. Connect repository.
2. Select `frontend/` as root directory.
3. Build Command: `npm install && npm run build`.
4. Publish Directory: `dist`.
5. SPA Rewrite: Redirect all 404s to `/index.html`.

## HTTPS
- Most PaaS providers (Render, Railway, Netlify, Vercel) provide automatic HTTPS.
- If running on a VPS (EC2/DigitalOcean), use Nginx + Certbot (Let's Encrypt).
