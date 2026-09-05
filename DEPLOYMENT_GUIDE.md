# Sovereign Optimizer — Production Deployment Guide

## Current verified architecture

Frontend:
- React + Vite
- `src/solverApi.js` sends LP, MILP and QP models to the FastAPI backend.

Backend:
- FastAPI + Uvicorn
- LP: HiGHS-backed SciPy `linprog`
- MILP: HiGHS-backed SciPy `milp`
- Convex QP: SLSQP with objective definiteness checks
- CUDA/CuPy: GPU-side numerical evaluation/validation for LP when enabled

Important:
CUDA/CuPy is currently a numerical acceleration/validation layer. It does NOT mean MILP or QP are GPU-native. The exact MILP and QP optimization paths remain CPU-based.

## Local Windows run

### Backend

Open CMD 1:

```cmd
cd "C:\Users\YUVRAJ CHAUDHARY\Downloads\sovereign-optimizer-production\sovereign-optimizer\solver-backend"
.venv\Scripts\activate
set SOLVER_MODE=gpu
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

For an existing virtual environment, use it instead of creating a new one.

Health endpoint:
`http://localhost:8000/health`

### Frontend

Open CMD 2:

```cmd
cd "C:\Users\YUVRAJ CHAUDHARY\Downloads\sovereign-optimizer-production\sovereign-optimizer"
npm install
npm run dev
```

Open:
`http://localhost:5173`

The local frontend defaults to:
`http://localhost:8000`

## Production frontend

Vercel cannot execute the Python/CUDA backend. Deploy the frontend to Vercel and deploy `solver-backend` to an NVIDIA GPU-capable host.

Set the Vercel environment variable:

```text
VITE_SOLVER_API_URL=https://YOUR-GPU-BACKEND-DOMAIN
```

Do not use `localhost` for the production Vercel deployment.

## Production backend

Set:

```text
SOLVER_MODE=gpu
ALLOWED_ORIGINS=https://YOUR-VERCEL-DOMAIN
```

The included Dockerfile uses an NVIDIA CUDA runtime image and the CUDA 12.x CuPy package. This is separate from the local CUDA 13.x setup used during development.

The included `docker-compose.gpu.yml` requests all available GPUs and exposes FastAPI on port 8000.

## API endpoints

`GET /` — service information

`GET /health` — backend and GPU availability

`POST /solve` — solve LP, MILP or QP

## Supported examples

LP:
```text
Minimize: 3x + 5y
2x + y <= 10
x + 3y <= 15
x, y >= 0
```

MILP:
```text
Maximize: 3x + 5y
2x + y <= 10
x + 3y <= 15
x, y >= 0
x, y integer
```

QP:
```text
Minimize: x^2 + y^2 - 4x - 6y
x + y <= 10
x, y >= 0
```

## Before public launch

1. Deploy the backend to an NVIDIA GPU host.
2. Confirm `/health` reports the GPU.
3. Set `ALLOWED_ORIGINS` to the exact Vercel origin.
4. Set `VITE_SOLVER_API_URL` in Vercel.
5. Redeploy the frontend.
6. Test LP, MILP and QP from the public website.
7. Run reproducible benchmark suites before publishing performance numbers.

Do not present static benchmark figures as measured results unless they have actually been benchmarked.
