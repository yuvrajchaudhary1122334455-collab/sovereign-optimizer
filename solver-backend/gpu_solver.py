"""CUDA/CuPy acceleration and validation layer for Sovereign Optimizer.

The mathematical solve remains exact through the SciPy HiGHS-backed LP/MILP
routines and convex QP routine. CUDA is used for dense/sparse numerical
pre-processing, objective/constraint evaluation, and final feasibility
validation. This avoids claiming that CuPy itself is a MILP/QP solver.
"""

from __future__ import annotations

import time
from typing import Any, Dict

import numpy as np

from solver import OptimizationSolver


class GPUUnavailable(RuntimeError):
    pass


class GPUSolver:
    def __init__(self, problem: Dict[str, Any]):
        try:
            import cupy as cp
            import cupyx.scipy.sparse as cpx_sparse
            from scipy import sparse
        except Exception as exc:
            raise GPUUnavailable(f"CuPy/CUDA is unavailable: {exc}") from exc

        self.cp = cp
        self.cpx_sparse = cpx_sparse
        self.problem = problem
        self.cpu_solver = OptimizationSolver(problem)
        self.variables = self.cpu_solver.variables

        # Upload model data once. Large sparse models stay sparse on the GPU.
        self.d_c = cp.asarray(self.cpu_solver.c, dtype=cp.float64)
        self.d_Q = cp.asarray(self.cpu_solver.Q, dtype=cp.float64)
        self.d_lower = cp.asarray(self.cpu_solver.lower, dtype=cp.float64)
        self.d_upper = cp.asarray(self.cpu_solver.upper, dtype=cp.float64)
        self.d_row_lower = cp.asarray(self.cpu_solver.row_lower, dtype=cp.float64)
        self.d_row_upper = cp.asarray(self.cpu_solver.row_upper, dtype=cp.float64)
        self.d_A = cpx_sparse.csr_matrix(
            sparse.csr_matrix(self.cpu_solver.A, dtype=np.float64)
        )

    def _gpu_evaluate(self, x: np.ndarray):
        cp = self.cp
        d_x = cp.asarray(x, dtype=cp.float64)
        d_values = self.d_A @ d_x if self.cpu_solver.A.shape[0] else cp.empty(0, dtype=cp.float64)
        d_objective = cp.dot(self.d_c, d_x) + 0.5 * cp.dot(d_x, self.d_Q @ d_x)

        if d_values.size:
            d_low = cp.maximum(self.d_row_lower - d_values, 0.0)
            d_high = cp.maximum(d_values - self.d_row_upper, 0.0)
            violation = cp.maximum(d_low, d_high)
            # Infinite row bounds produce harmless NaNs in the arithmetic above;
            # explicitly mask them before reduction.
            violation = cp.where(cp.isfinite(violation), violation, 0.0)
            max_violation = float(cp.max(violation).get())
            values = cp.asnumpy(d_values)
        else:
            max_violation = 0.0
            values = np.empty(0, dtype=np.float64)

        lower_v = cp.maximum(self.d_lower - d_x, 0.0)
        upper_v = cp.maximum(d_x - self.d_upper, 0.0)
        bound_v = cp.maximum(lower_v, upper_v)
        bound_v = cp.where(cp.isfinite(bound_v), bound_v, 0.0)
        max_violation = max(max_violation, float(cp.max(bound_v).get()) if bound_v.size else 0.0)
        cp.cuda.Stream.null.synchronize()
        return float(d_objective.get()), values, max_violation

    def solve(self):
        start = time.perf_counter()

        # The CPU engine is the exact mathematical optimizer. CUDA accelerates
        # model-side numerical work and performs an independent final check.
        cpu_result = self.cpu_solver.solve()
        if not cpu_result.get("success"):
            cpu_result.update({
                "gpu_validation": False,
                "gpu_available": True,
                "gpu_time": 0.0,
                "total_time": time.perf_counter() - start,
            })
            return cpu_result

        gpu_start = time.perf_counter()
        gpu_objective, gpu_constraints, gpu_violation = self._gpu_evaluate(
            np.array([cpu_result["solution"][v] for v in self.variables], dtype=np.float64)
        )
        gpu_time = time.perf_counter() - gpu_start

        cpu_result["objective"] = gpu_objective
        cpu_result["constraints"] = gpu_constraints.tolist()
        cpu_result["violation"] = gpu_violation
        cpu_result["gpu_validation"] = gpu_violation <= 1e-6
        cpu_result["success"] = bool(cpu_result.get("success")) and cpu_result["gpu_validation"]
        cpu_result["gpu_available"] = True
        cpu_result["gpu_time"] = gpu_time
        cpu_result["time"] = time.perf_counter() - start
        cpu_result["message"] = (
            f"{cpu_result.get('message', 'Optimization complete')} "
            "GPU numerical validation completed with CUDA/CuPy."
        )
        return cpu_result


GPULPSolver = GPUSolver
GPUOptimizationSolver = GPUSolver
GPUOptimizer = GPUSolver
