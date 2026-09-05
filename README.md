# Sovereign Optimizer — GPU + LP/MILP/QP Integration

This build connects the Vercel React/Vite console to a Python FastAPI optimization backend.

## What was fixed

- **LP** remains supported through SciPy's HiGHS-backed `linprog` path.
- **MILP** is now enabled through SciPy's HiGHS-backed `milp` implementation, including integer and binary variables.
- **Convex QP** is now enabled through SLSQP with a positive/negative-semidefinite check (convex minimization or concave maximization).
- **CUDA/CuPy** is integrated into the backend. When a CUDA GPU is present and `SOLVER_MODE=auto`/`gpu`, the model is uploaded to the GPU and the final objective, constraint activities and bound feasibility are independently evaluated on CUDA.
- If CUDA is unavailable, the backend automatically falls back to CPU in `auto` mode.
- The frontend no longer disables MILP/QP and now sends the selected problem type to the API.

> Important: CuPy is a GPU numerical acceleration/validation layer; it is not itself a general MILP solver. Exact LP/MILP solving is handled by HiGHS-backed SciPy routines. QP solving uses the convex SLSQP path. This avoids falsely reporting a GPU solve when the optimization algorithm itself is running on CPU.

## Local development

### Backend

From `solver-backend`:

```text
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements-api.txt
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

For a CPU-only machine, install the requirements and remove/skip the CuPy package if NVIDIA CUDA is not available. Use `SOLVER_MODE=cpu` or leave `SOLVER_MODE=auto` for automatic fallback.

Health check:

```text
http://localhost:8000/health
```

### Frontend

From the project root:

```text
npm install
npm run dev
```

Create `.env.local` from `.env.example` and set:

```text
VITE_SOLVER_API_URL=http://localhost:8000
```

## Console syntax

### LP

```text
Objective: Maximize: 3x + 5y
Constraints:
2x + y <= 10
x + 3y <= 15
x, y >= 0
```

### MILP

Declare integer/binary variables on their own lines:

```text
Maximize: 7x + 5y
2x + y <= 10
integer: x
x, y >= 0
```

Binary example:

```text
Maximize: 10x + 8y
x + y <= 1
binary: x, y
```

### QP

Quadratic terms use `x^2` and `x*y`:

```text
Minimize: 2x^2 + 2x*y + 3y^2 + 5x + 4y
x + y >= 1
x, y >= 0
```

QP currently requires continuous variables and a convex minimization or concave maximization objective.

## GPU deployment

The included Dockerfile is based on NVIDIA CUDA 12.6 runtime and installs CuPy for CUDA 12.x.

Set:

```text
SOLVER_MODE=gpu
ALLOWED_ORIGINS=https://your-vercel-domain.example
```

Run the container on an NVIDIA GPU host with the NVIDIA Container Toolkit and expose port 8000. The Vercel project should set:

```text
VITE_SOLVER_API_URL=https://your-solver-api.example.com
```

Do **not** put CUDA/Python dependencies in the Vercel frontend deployment.

## Smoke tests

From `solver-backend`:

```text
python test_solver.py
```

The test covers LP, MILP and convex QP. On a GPU machine, also verify `/health` reports `gpu_available: true` and then run a model through `/solve` with `SOLVER_MODE=gpu`.

## Production note

For true GPU-native LP optimization rather than GPU-side numerical evaluation, HiGHS provides a CUDA/cuPDLP build option (`CUPDLP_GPU=ON`). That requires building HiGHS with CUDA support rather than using the standard Python wheel. The current integration deliberately keeps the exact MILP path and QP path reliable while using CUDA where it can be used safely.


## Production packaging

This package is cleaned for deployment: development `node_modules`, Python `__pycache__`, virtual environments, and build output are excluded. See `DEPLOYMENT_GUIDE.md` for local and production setup.
