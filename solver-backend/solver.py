"""Mathematical optimization backend for LP, MILP and convex QP models."""

from __future__ import annotations

import time
from typing import Any, Dict, List, Tuple

import numpy as np
from scipy.optimize import Bounds, LinearConstraint, linprog, minimize, milp


class OptimizationSolver:
    """Solve LP, MILP and convex QP models with SciPy/HiGHS-backed routines."""

    def __init__(self, problem: Dict[str, Any]):
        self.problem = problem
        self.problem_type = problem.get("problem_type", "LP").upper()
        self.variables = list(problem["variables"].keys())
        self.n = len(self.variables)
        if not self.n:
            raise ValueError("At least one decision variable is required")

        self.index = {name: i for i, name in enumerate(self.variables)}
        self.c = np.array(
            [problem.get("objective", {}).get(v, 0.0) for v in self.variables],
            dtype=np.float64,
        )
        self.lower = np.array(
            [problem["variables"][v].get("lower", 0.0) for v in self.variables],
            dtype=np.float64,
        )
        self.upper = np.array(
            [
                np.inf if problem["variables"][v].get("upper") is None
                else problem["variables"][v]["upper"]
                for v in self.variables
            ],
            dtype=np.float64,
        )
        self.A, self.row_lower, self.row_upper = self._build_rows()
        self.Q = self._build_quadratic_matrix()

    def _build_rows(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        rows: List[np.ndarray] = []
        lower: List[float] = []
        upper: List[float] = []

        for constraint in self.problem.get("constraints", []):
            row = np.array(
                [constraint.get(variable, 0.0) for variable in self.variables],
                dtype=np.float64,
            )
            relation = constraint["relation"]
            limit = float(constraint["limit"])
            rows.append(row)
            if relation == "<=":
                lower.append(-np.inf)
                upper.append(limit)
            elif relation == ">=":
                lower.append(limit)
                upper.append(np.inf)
            elif relation == "=":
                lower.append(limit)
                upper.append(limit)
            else:
                raise ValueError(f"Unsupported constraint relation: {relation}")

        if not rows:
            return (
                np.empty((0, self.n), dtype=np.float64),
                np.empty(0, dtype=np.float64),
                np.empty(0, dtype=np.float64),
            )
        return np.vstack(rows), np.array(lower), np.array(upper)

    def _build_quadratic_matrix(self) -> np.ndarray:
        Q = np.zeros((self.n, self.n), dtype=np.float64)
        for key, coefficient in self.problem.get("quadratic", {}).items():
            parts = [part.strip() for part in key.split("*") if part.strip()]
            if len(parts) == 1:
                name = parts[0].removesuffix("^2")
                if name not in self.index:
                    raise ValueError(f"Quadratic term contains unknown variable '{name}'")
                # Input x^2 coefficient a represents a*x^2 = 0.5*(2a)*x^2.
                Q[self.index[name], self.index[name]] += 2.0 * float(coefficient)
            elif len(parts) == 2:
                a, b = parts
                if a not in self.index or b not in self.index:
                    raise ValueError(f"Quadratic term '{key}' contains an unknown variable")
                # Input b*x*y maps to symmetric Q entries b because
                # 0.5*x^T Q x contains Q_xy*x*y.
                i, j = self.index[a], self.index[b]
                value = float(coefficient)
                Q[i, j] += value
                Q[j, i] += value
            else:
                raise ValueError(f"Unsupported quadratic term '{key}'")
        return Q

    def _linear_constraints_for_linprog(self):
        A_ub: List[np.ndarray] = []
        b_ub: List[float] = []
        A_eq: List[np.ndarray] = []
        b_eq: List[float] = []
        for row, lo, hi in zip(self.A, self.row_lower, self.row_upper):
            if np.isfinite(hi):
                if np.isfinite(lo) and abs(lo - hi) <= 1e-12:
                    A_eq.append(row)
                    b_eq.append(lo)
                else:
                    A_ub.append(row)
                    b_ub.append(hi)
            if np.isfinite(lo) and not (np.isfinite(hi) and abs(lo - hi) <= 1e-12):
                A_ub.append(-row)
                b_ub.append(-lo)
        return (
            np.array(A_ub) if A_ub else None,
            np.array(b_ub) if b_ub else None,
            np.array(A_eq) if A_eq else None,
            np.array(b_eq) if b_eq else None,
        )

    def _bounds(self):
        return list(zip(self.lower, self.upper))

    def _objective_value(self, x: np.ndarray) -> float:
        return float(self.c @ x + 0.5 * x @ self.Q @ x)

    def _sense_multiplier(self) -> float:
        return -1.0 if self.problem.get("sense", "maximize") == "maximize" else 1.0

    def _base_result(self, start: float) -> Dict[str, Any]:
        return {
            "success": False,
            "solution": None,
            "objective": None,
            "constraints": None,
            "violation": None,
            "time": time.perf_counter() - start,
        }

    def _solution_result(self, x: np.ndarray, start: float, message: str, **extra):
        values = self.A @ x if self.A.size else np.empty(0)
        violation = 0.0
        if values.size:
            low_violation = np.maximum(self.row_lower - values, 0.0)
            high_violation = np.maximum(values - self.row_upper, 0.0)
            violation = float(np.max(np.maximum(low_violation, high_violation)))
        bound_violation = max(
            float(np.max(self.lower - x)) if x.size else 0.0,
            float(np.max(x - self.upper)) if x.size else 0.0,
            0.0,
        )
        violation = max(violation, bound_violation)
        solution = {v: float(x[i]) for i, v in enumerate(self.variables)}
        result = {
            "success": violation <= 1e-6,
            "solution": solution,
            "objective": self._objective_value(x),
            "constraints": values.tolist(),
            "violation": violation,
            "time": time.perf_counter() - start,
            "message": message,
        }
        result.update(extra)
        return result

    def solve_lp(self):
        start = time.perf_counter()
        A_ub, b_ub, A_eq, b_eq = self._linear_constraints_for_linprog()
        c = self.c * self._sense_multiplier()
        result = linprog(
            c,
            A_ub=A_ub,
            b_ub=b_ub,
            A_eq=A_eq,
            b_eq=b_eq,
            bounds=self._bounds(),
            method="highs",
        )
        if not result.success:
            output = self._base_result(start)
            output["message"] = result.message
            return output
        return self._solution_result(result.x, start, result.message, engine="HiGHS-LP")

    def solve_milp(self):
        start = time.perf_counter()
        integrality = []
        for variable in self.variables:
            kind = self.problem["variables"][variable].get("type", "continuous").lower()
            integrality.append(0 if kind == "continuous" else 1)

        result = milp(
            c=self.c * self._sense_multiplier(),
            integrality=np.array(integrality, dtype=np.int32),
            bounds=Bounds(self.lower, self.upper),
            constraints=(
                LinearConstraint(self.A, self.row_lower, self.row_upper)
                if self.A.shape[0]
                else None
            ),
            options={"disp": False},
        )
        if not result.success:
            output = self._base_result(start)
            output["message"] = result.message
            return output
        return self._solution_result(result.x, start, result.message, engine="HiGHS-MILP")

    def solve_qp(self):
        start = time.perf_counter()
        if np.any(np.abs(self.Q - self.Q.T) > 1e-10):
            return {**self._base_result(start), "message": "Quadratic matrix must be symmetric."}
        eigenvalues = np.linalg.eigvalsh(self.Q) if self.n else np.array([0.0])
        min_eigenvalue = float(np.min(eigenvalues))
        max_eigenvalue = float(np.max(eigenvalues))
        sense = self.problem.get("sense", "minimize")
        if sense == "minimize" and min_eigenvalue < -1e-8:
            return {
                **self._base_result(start),
                "message": "Minimization QP must be convex; the quadratic matrix is not positive semidefinite.",
                "min_eigenvalue": min_eigenvalue,
            }
        if sense == "maximize" and max_eigenvalue > 1e-8:
            return {
                **self._base_result(start),
                "message": "Maximization QP must be concave; the quadratic matrix is not negative semidefinite.",
                "max_eigenvalue": max_eigenvalue,
            }

        # Find a feasible point first, so SLSQP starts from a valid point whenever possible.
        A_ub, b_ub, A_eq, b_eq = self._linear_constraints_for_linprog()
        feasibility = linprog(
            np.zeros(self.n),
            A_ub=A_ub,
            b_ub=b_ub,
            A_eq=A_eq,
            b_eq=b_eq,
            bounds=self._bounds(),
            method="highs",
        )
        if not feasibility.success:
            return {**self._base_result(start), "message": f"No feasible point: {feasibility.message}"}

        multiplier = self._sense_multiplier()
        def objective(x):
            return multiplier * self._objective_value(x)

        constraints = []
        for row, lo, hi in zip(self.A, self.row_lower, self.row_upper):
            if np.isfinite(lo) and np.isfinite(hi) and abs(lo - hi) <= 1e-12:
                constraints.append({"type": "eq", "fun": lambda x, r=row, b=lo: float(r @ x - b)})
            else:
                if np.isfinite(hi):
                    constraints.append({"type": "ineq", "fun": lambda x, r=row, b=hi: float(b - r @ x)})
                if np.isfinite(lo):
                    constraints.append({"type": "ineq", "fun": lambda x, r=row, b=lo: float(r @ x - b)})

        result = minimize(
            objective,
            np.asarray(feasibility.x, dtype=np.float64),
            method="SLSQP",
            bounds=[(lo, None if not np.isfinite(hi) else hi) for lo, hi in self._bounds()],
            constraints=constraints,
            options={"ftol": 1e-9, "maxiter": 2000, "disp": False},
        )
        if not result.success:
            output = self._base_result(start)
            output["message"] = result.message
            return output
        return self._solution_result(
            result.x,
            start,
            result.message,
            engine="Convex-QP/SLSQP",
            min_eigenvalue=min_eigenvalue,
        )

    def solve(self):
        if self.problem_type == "LP":
            return self.solve_lp()
        if self.problem_type == "MILP":
            return self.solve_milp()
        if self.problem_type == "QP":
            return self.solve_qp()
        raise ValueError(f"Unsupported problem type: {self.problem_type}")


# Backward-compatible name used by older integrations.
CPUSolver = OptimizationSolver
