# Sovereign Optimizer — Complete Solver Integration Guide

This package contains the website source plus the Python solver backend.

## What changed

### Website
- `src/App.jsx`
  - Replaced the fake 2.5-second solver animation with a real API request.
  - Added editable objective and constraint state.
  - Parses LP text into the JSON format expected by the backend.
  - Displays the returned objective, status, timing, variables, GPU validation and errors.
  - MILP and QP are visibly disabled because the current backend only implements continuous LP.

- `src/solverApi.js`
  - Converts text such as `2x + y <= 10` into structured constraints.
  - Sends `POST /solve` to the Python API.
  - Uses Vite's `VITE_SOLVER_API_URL` environment variable.

- `src/index.css`
  - Adds styling for live solver errors, solution variables and integration status.

- `.env.example`
  - Contains the local frontend API URL.

### Backend
- `solver-backend/api.py`
  - FastAPI endpoint `/solve`.
  - Health endpoint `/health`.
  - CORS configuration.
  - `SOLVER_MODE=auto|gpu|cpu`.
  - Automatically uses GPU when available in `auto` mode.
  - CPU fallback makes local development possible on machines without CUDA.
  - `SOLVER_MODE=gpu` can be used in production to require CUDA.

## Important technical truth

The current `GPUSolver` does NOT perform the LP optimization itself on the GPU.

Current flow:

1. SciPy HiGHS solves the LP on CPU.
2. CuPy/CUDA evaluates the objective and constraints on GPU.
3. The GPU result is used to validate the CPU solution.

This is an honest GPU-accelerated validation architecture. A fully GPU-native LP engine is a later solver-engineering phase.

# STEP 1 — Install Node.js

Install a current LTS version of Node.js if it is not already installed.

Then verify:

```bash
node --version
npm --version
```

# STEP 2 — Open the project

Extract this ZIP.

Open the extracted `sovereign-optimizer` folder in VS Code.

You should see:

```text
sovereign-optimizer/
├── src/
├── public/
├── solver-backend/
├── package.json
└── vite.config.js
```

# STEP 3 — Install frontend packages

Open a terminal in the website root:

```bash
npm install
```

# STEP 4 — Create the frontend environment file

Copy:

```text
.env.example
```

to:

```text
.env.local
```

Windows CMD:

```bash
copy .env.example .env.local
```

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS/Linux:

```bash
cp .env.example .env.local
```

The file should contain:

```text
VITE_SOLVER_API_URL=http://localhost:8000
```

# STEP 5 — Prepare the Python backend

Open a second terminal.

Move into:

```bash
cd solver-backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

# STEP 6 — Install backend packages

For a CUDA-capable NVIDIA machine:

```bash
pip install -r requirements-api.txt
```

For CPU-only local development:

```bash
pip install fastapi "uvicorn[standard]" "pydantic>=2,<3" "numpy>=2,<3" "scipy>=1.14,<2"
```

CPU-only development uses the API's fallback path. Production GPU deployment should use the CUDA requirements.

# STEP 7 — Start the backend

From `solver-backend`:

```bash
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

Keep this terminal open.

Test the API in your browser:

```text
http://localhost:8000/health
```

You should receive JSON.

CPU-only example:

```json
{
  "status": "ok",
  "gpu_available": false,
  "gpu": null
}
```

GPU example:

```json
{
  "status": "ok",
  "gpu_available": true,
  "gpu": "..."
}
```

# STEP 8 — Start the website

Open another terminal at the website root:

```bash
npm run dev
```

Vite will print a local address, normally:

```text
http://localhost:5173
```

Open it.

# STEP 9 — Test the Solver

Scroll to:

```text
SOLVER CONSOLE
```

Use:

```text
Problem Type:
Linear Programming (LP)
```

Objective:

```text
Minimize: 3x + 5y
```

Constraints:

```text
2x + y <= 10
x + 3y <= 15
x, y >= 0
```

Click:

```text
RUN SOLVER →
```

The button now sends a real HTTP request to:

```text
POST http://localhost:8000/solve
```

It is no longer a fake timer.

# STEP 10 — Understand the request

The frontend converts the text into approximately:

```json
{
  "sense": "minimize",
  "variables": {
    "x": {
      "type": "continuous",
      "lower": 0,
      "upper": null
    },
    "y": {
      "type": "continuous",
      "lower": 0,
      "upper": null
    }
  },
  "objective": {
    "x": 3,
    "y": 5
  },
  "constraints": [
    {
      "x": 2,
      "y": 1,
      "relation": "<=",
      "limit": 10
    },
    {
      "x": 1,
      "y": 3,
      "relation": "<=",
      "limit": 15
    }
  ]
}
```

# STEP 11 — Understand the backend

FastAPI receives the JSON.

It validates:
- optimization direction
- variable names
- bounds
- constraint relations
- objective variables

Then:

```text
SOLVER_MODE=auto
        |
        +-- CUDA available --> GPUSolver
        |
        +-- CUDA unavailable -> CPUSolver
```

GPU mode:

```text
GPUSolver
   |
   +--> SciPy HiGHS CPU optimization
   |
   +--> CuPy/CUDA GPU evaluation
   |
   +--> constraint validation
```

# STEP 12 — Understand the response

The backend returns values such as:

```json
{
  "success": true,
  "solution": {
    "x": 0,
    "y": 0
  },
  "objective": 0,
  "time": 0.01,
  "cpu_solve_time": 0.009,
  "gpu_time": 0.001,
  "solver": "HiGHS + CUDA/CuPy validation",
  "gpu_validation": true,
  "status": "optimal"
}
```

The exact numbers depend on the model.

The frontend displays the actual returned values.

# STEP 13 — If the browser shows a CORS error

The backend defaults to:

```text
http://localhost:5173
http://localhost:3000
```

If Vite uses a different port, set the backend environment variable:

```text
ALLOWED_ORIGINS=http://localhost:5173
```

Restart the backend after changing it.

# STEP 14 — If the browser says "Failed to fetch"

Check both terminals.

Backend must still be running:

```bash
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

Frontend must be running:

```bash
npm run dev
```

Also check:

```text
http://localhost:8000/health
```

# STEP 15 — Deploying the frontend to Vercel

Push the website project to GitHub.

In Vercel, import the repository.

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

Add this Vercel environment variable:

```text
VITE_SOLVER_API_URL=https://YOUR-SOLVER-API-DOMAIN
```

Do not use `http://localhost:8000` in production.

Redeploy after adding the environment variable.

# STEP 16 — Deploying the Python solver

Do NOT deploy the CUDA Python backend as part of the Vercel frontend.

The backend needs a machine/container capable of running:
- Python
- SciPy
- NumPy
- FastAPI
- NVIDIA CUDA
- CuPy
- NVIDIA GPU

The included `Dockerfile` is prepared for a CUDA 12.6 runtime.

The production architecture is:

```text
User
 |
 v
Vercel
React/Vite
 |
 | HTTPS POST /solve
 v
GPU server
FastAPI
 |
 v
GPUSolver
 |
 +---- SciPy HiGHS
 |
 +---- CuPy/CUDA
```

# STEP 17 — Production backend environment

Use:

```text
ALLOWED_ORIGINS=https://YOUR-VERCEL-DOMAIN
SOLVER_MODE=gpu
```

`SOLVER_MODE=gpu` is recommended for a production GPU server because it prevents silently falling back to CPU.

# STEP 18 — Test production

First test:

```text
https://YOUR-SOLVER-API-DOMAIN/health
```

Then open the Vercel website and run the Solver.

The browser should send:

```text
https://YOUR-SOLVER-API-DOMAIN/solve
```

# Current scope

The connected console currently supports continuous LP models.

Supported input examples:

```text
Minimize: 3x + 5y
```

```text
Maximize: 10x + 20y
```

```text
2x + y <= 10
x + 3y >= 15
x - y = 2
x, y >= 0
```

Variable upper bounds:

```text
x <= 100
```

MILP and QP are intentionally not sent to the current backend because the supplied backend does not implement those engines yet.

# Next engineering phase

After the live LP integration is working, the next phase should be:

1. Implement/finish a genuine GPU-native LP algorithm.
2. Add integer variables and MILP branch-and-bound.
3. Add QP support.
4. Add presolve/scaling.
5. Add sparse model handling.
6. Add benchmark execution.
7. Add MIPLIB/Netlib validation.
8. Add authentication/rate limiting for a public API.
9. Add job queues for very large models.
10. Add reproducible performance reporting.

Do not claim 1M+ variable/constraint performance until reproducible benchmark results exist.
