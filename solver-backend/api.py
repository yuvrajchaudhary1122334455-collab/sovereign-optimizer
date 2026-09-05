import os
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict, field_validator

from solver import OptimizationSolver

app = FastAPI(
    title="Sovereign Optimization Solver API",
    version="2.0.0",
    description="LP, MILP and convex QP optimization API with optional CUDA/CuPy acceleration.",
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


class Variable(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: str = "continuous"
    lower: float = 0.0
    upper: Optional[float] = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        value = value.lower()
        if value not in {"continuous", "integer", "binary"}:
            raise ValueError("type must be continuous, integer, or binary")
        return value


class Constraint(BaseModel):
    model_config = ConfigDict(extra="allow")
    relation: str
    limit: float


class Problem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    problem_type: str = "LP"
    sense: str = "maximize"
    variables: Dict[str, Variable]
    objective: Dict[str, float] = Field(default_factory=dict)
    quadratic: Dict[str, float] = Field(default_factory=dict)
    constraints: List[Constraint] = Field(default_factory=list)

    @field_validator("problem_type")
    @classmethod
    def validate_problem_type(cls, value: str) -> str:
        value = value.upper()
        if value not in {"LP", "MILP", "QP"}:
            raise ValueError("problem_type must be LP, MILP, or QP")
        return value

    @field_validator("sense")
    @classmethod
    def validate_sense(cls, value: str) -> str:
        value = value.lower()
        if value not in {"maximize", "minimize"}:
            raise ValueError("sense must be maximize or minimize")
        return value


@app.get("/")
def root() -> Dict[str, Any]:
    return {
        "service": "sovereign-optimization-solver",
        "status": "ok",
        "version": "2.0.0",
        "problem_types": ["LP", "MILP", "QP"],
    }


def gpu_info() -> Dict[str, Any]:
    try:
        import cupy as cp
        count = cp.cuda.runtime.getDeviceCount()
        if count <= 0:
            return {"available": False, "name": None, "count": 0}
        props = cp.cuda.runtime.getDeviceProperties(0)
        name = props.get("name") if isinstance(props, dict) else None
        if isinstance(name, bytes):
            name = name.decode(errors="replace")
        return {"available": True, "name": name, "count": count}
    except Exception as exc:
        return {"available": False, "name": None, "count": 0, "error": str(exc)}


@app.get("/health")
def health() -> Dict[str, Any]:
    gpu = gpu_info()
    return {"status": "ok", "gpu_available": gpu["available"], "gpu": gpu["name"], "gpu_count": gpu["count"]}


def normalize_problem(data: Problem) -> Dict[str, Any]:
    variables: Dict[str, Any] = {}
    for name, var in data.variables.items():
        if not name.strip():
            raise HTTPException(status_code=422, detail="Variable names cannot be empty")
        lower = float(var.lower)
        upper = None if var.upper is None else float(var.upper)
        if var.type == "binary":
            if lower < 0 or (upper is not None and upper > 1):
                raise HTTPException(status_code=422, detail=f"Binary variable '{name}' must be within [0, 1]")
            lower, upper = 0.0, 1.0
        if upper is not None and upper < lower:
            raise HTTPException(status_code=422, detail=f"Variable '{name}': upper bound must be >= lower bound")
        if var.type in {"integer", "binary"} and lower != int(lower):
            raise HTTPException(status_code=422, detail=f"Integer variable '{name}' needs an integer lower bound")
        variables[name] = {"type": var.type, "lower": lower, "upper": upper}

    unknown_objective = set(data.objective) - set(variables)
    if unknown_objective:
        raise HTTPException(status_code=422, detail=f"Objective contains unknown variables: {sorted(unknown_objective)}")

    if data.problem_type in {"LP", "MILP"} and data.quadratic:
        raise HTTPException(status_code=422, detail="Quadratic terms are only valid for QP models")

    if data.problem_type == "MILP":
        if not any(v["type"] in {"integer", "binary"} for v in variables.values()):
            raise HTTPException(status_code=422, detail="MILP requires at least one integer or binary variable")
    elif data.problem_type == "QP":
        if any(v["type"] != "continuous" for v in variables.values()):
            raise HTTPException(status_code=422, detail="QP currently supports continuous variables only")

    quadratic: Dict[str, float] = {}
    for key, value in data.quadratic.items():
        parts = [part.strip() for part in key.split("*") if part.strip()]
        if len(parts) == 1 and parts[0].endswith("^2"):
            parts = [parts[0][:-2]]
            normalized_key = f"{parts[0]}^2"
        elif len(parts) == 1:
            normalized_key = parts[0]
        elif len(parts) == 2:
            normalized_key = "*".join(sorted(parts))
        else:
            raise HTTPException(status_code=422, detail=f"Invalid quadratic term '{key}'")
        if any(part not in variables for part in parts):
            raise HTTPException(status_code=422, detail=f"Quadratic term '{key}' contains an unknown variable")
        quadratic[normalized_key] = float(value)

    constraints: List[Dict[str, Any]] = []
    for index, constraint in enumerate(data.constraints):
        if constraint.relation not in {"<=", ">=", "="}:
            raise HTTPException(status_code=422, detail=f"Constraint {index + 1}: relation must be <=, >=, or =")
        row = {key: value for key, value in constraint.model_dump().items() if key not in {"relation", "limit"}}
        unknown = set(row) - set(variables)
        if unknown:
            raise HTTPException(status_code=422, detail=f"Constraint {index + 1}: unknown variables: {sorted(unknown)}")
        row["relation"] = constraint.relation
        row["limit"] = constraint.limit
        constraints.append(row)

    return {
        "problem_type": data.problem_type,
        "sense": data.sense,
        "variables": variables,
        "objective": data.objective,
        "quadratic": quadratic,
        "constraints": constraints,
    }


@app.post("/solve")
def solve(problem: Problem) -> Dict[str, Any]:
    normalized = normalize_problem(problem)
    mode = os.getenv("SOLVER_MODE", "auto").lower()
    if mode not in {"auto", "gpu", "cpu"}:
        raise HTTPException(status_code=500, detail="SOLVER_MODE must be auto, gpu, or cpu")

    use_gpu = False
    if mode != "cpu":
        info = gpu_info()
        use_gpu = info["available"]
        if mode == "gpu" and not use_gpu:
            raise HTTPException(status_code=503, detail=f"GPU mode requested but CUDA is unavailable: {info.get('error', 'no CUDA device')}")

    try:
        if use_gpu:
            from gpu_solver import GPUSolver
            result = GPUSolver(normalized).solve()
            result["solver"] = f"{result.get('engine', 'Sovereign')} + CUDA/CuPy validation"
        else:
            result = OptimizationSolver(normalized).solve()
            result["gpu_validation"] = False
            result["gpu_available"] = False
            result["gpu_time"] = 0.0
            result["solver"] = result.get("engine", "Sovereign CPU")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Solver error: {exc}") from exc

    result["status"] = "optimal" if result.get("success") else "failed"
    return result
