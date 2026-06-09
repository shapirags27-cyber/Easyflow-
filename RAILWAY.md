# Deploy EasyFlow on Railway (Frontend + PostgreSQL)

## 1. Create Railway project

1. Go to [railway.app](https://railway.app) and create a new project.
2. **Add PostgreSQL**: `+ New` → **Database** → **PostgreSQL**.
3. **Add frontend**: `+ New` → **GitHub Repo** → select this repository.

You will have **two services** in one project:
- `Postgres` — database
- `easyflow` (web) — Next.js frontend

## 2. Link database to frontend

On the **web service** → **Variables** → add:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `ADMIN_ADDRESS` | `0xe7AEC4044e0E75b71394b0eC1Bc12365Aa3603D9` |
| `NEXT_PUBLIC_IOPN_RPC` | `https://testnet-rpc.iopn.tech` |
| `NEXT_PUBLIC_CHAIN_ID` | `984` |
| `NEXT_PUBLIC_AMM_ROUTER_ADDRESS` | `0xB489bce5c9c9364da2D1D1Bc5CE4274F63141885` |
| `NEXT_PUBLIC_AMM_FACTORY_ADDRESS` | `0x8860242B65611dfd077aEe26C3C7920813dF9208` |

Optional (admin fee backend auto-submit):
- `ADMIN_PRIVATE_KEY` — only if server should submit fee txs

**Do not** put `PRIVATE_KEY` on Railway unless you deploy contracts from CI.

## 3. Deploy

Railway reads `railway.toml` and runs:

```bash
npm run build:railway   # prisma generate + migrate + next build
npm run start:railway   # next start on $PORT
```

Health check: `GET /api/health` → `{ database: "connected" }`

## 4. Run migrations locally (optional)

```bash
cp .env.example .env
# set DATABASE_URL to your Railway Postgres URL (public URL from Railway dashboard)
npm install
npm run db:migrate
```

## 5. API endpoints (Postgres-backed)

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | App + DB status |
| `GET /api/stats` | Platform stats (TVL, staked, etc.) |
| `GET /api/transactions?wallet=0x...` | User transaction history |
| `POST /api/transactions` | Log a transaction |

## 6. Custom domain

Web service → **Settings** → **Networking** → **Generate Domain** or add custom domain.

---

**Architecture**

```
[Railway Postgres] ← DATABASE_URL ← [Railway Web Service (Next.js)]
                                              ↓
                                    IOPN Testnet (RPC / contracts)
```
