# Deploy do Frontend — Vercel

1. https://vercel.com → **Add New… → Project** → importe `kayser-one-frontend`.
   A Vercel detecta o Next.js automaticamente.
2. Em **Environment Variables**, adicione:

   | Variável | Valor |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | URL pública do backend (Railway) + `/api/v1` — ex.: `https://kayser-one-backend.up.railway.app/api/v1` |

3. **Deploy**. A Vercel devolve a URL pública (ex.: `https://kayser-one.vercel.app`).
4. No backend (Railway), defina `FRONTEND_URL` com essa URL da Vercel para o CORS liberar as requisições.

> O guia completo (backend + banco) está em `kayser-one-backend/DEPLOY.md`.
