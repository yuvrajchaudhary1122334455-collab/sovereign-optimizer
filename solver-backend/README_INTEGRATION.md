# Sovereign Optimizer — Solver Integration

This project connects the React/Vite Solver Console to the Python FastAPI solver backend.

## Architecture

Browser/Vercel frontend
-> POST /solve
-> FastAPI
-> GPUSolver (when CUDA is available)
-> SciPy HiGHS + CUDA/CuPy validation
-> JSON response
-> Solver Console

The current GPUSolver still performs the LP optimization with SciPy HiGHS on CPU. CUDA/CuPy evaluates the resulting solution and validates constraints on the GPU. This is not yet a fully GPU-native LP optimizer.

## 1. Frontend setup

From the website root:

```bash
npm install
```

Copy `.env.example` to `.env.local`:

```bash
copy .env.example .env.local
```

On macOS/Linux:

```bash
cp .env.example .env.local
```

The default value is:

```text
VITE_SOLVER_API_URL=http://localhost:8000
```

## 2. Backend setup

Open a second terminal:

```bash
cd solver-backend
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

Install dependencies:

```bash
pip install -r requirements-api.txt
```

For a computer without CUDA, you can omit CuPy and run the CPU fallback:

```bash
pip install fastapi "uvicorn[standard]" "pydantic>=2,<3" "numpy>=2,<3" "scipy>=1.14,<2"
```

Copy `.env.example` to `.env` and use:

```text
SOLVER_MODE=auto
ALLOWED_ORIGINS=http://localhost:5173
```

Start the API:

```bash
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

Test:

```text
http://localhost:8000/health
```

## 3. Start the website

From the website root, in another terminal:

```bash
npm run dev
```

Open the URL Vite prints, normally:

```text
http://localhost:5173
```

Scroll to **Solver** and press **RUN SOLVER**.

## 4. Production

Keep the React/Vite frontend on Vercel.

Run the Python backend on a GPU-capable server/container. Set the Vercel environment variable:

```text
VITE_SOLVER_API_URL=https://YOUR-SOLVER-API.example.com
```

Set the backend environment variables:

```text
ALLOWED_ORIGINS=https://YOUR-SOVEREIGN-OPTIMIZER-DOMAIN
SOLVER_MODE=gpu
```

Do not deploy CUDA/Python dependencies as part of the Vercel frontend.

## Supported console input

Objective:

```text
Minimize: 3x + 5y
```

or:

```text
Maximize: 3x + 5y
```

Constraints:

```text
2x + y <= 10
x + 3y <= 15
x, y >= 0
```

The console currently sends LP models. MILP and QP options are displayed as unavailable until their backend engines are implemented.
