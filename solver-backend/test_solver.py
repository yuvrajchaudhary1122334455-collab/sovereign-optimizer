"""Smoke tests for LP, MILP and convex QP backends."""

from solver import OptimizationSolver


def test_lp():
    problem = {
        "problem_type": "LP", "sense": "maximize",
        "variables": {"x": {"type": "continuous", "lower": 0, "upper": None}, "y": {"type": "continuous", "lower": 0, "upper": None}},
        "objective": {"x": 3, "y": 5}, "quadratic": {},
        "constraints": [{"x": 2, "y": 1, "relation": "<=", "limit": 10}, {"x": 1, "y": 3, "relation": "<=", "limit": 15}],
    }
    result = OptimizationSolver(problem).solve()
    assert result["success"] and abs(result["objective"] - 29) < 1e-6


def test_milp():
    problem = {
        "problem_type": "MILP", "sense": "maximize",
        "variables": {"x": {"type": "integer", "lower": 0, "upper": 10}, "y": {"type": "continuous", "lower": 0, "upper": 10}},
        "objective": {"x": 7, "y": 5}, "quadratic": {},
        "constraints": [{"x": 2, "y": 1, "relation": "<=", "limit": 10}],
    }
    result = OptimizationSolver(problem).solve()
    assert result["success"] and all(abs(result["solution"][v] - round(result["solution"][v])) < 1e-7 for v in ["x"])


def test_qp():
    problem = {
        "problem_type": "QP", "sense": "minimize",
        "variables": {"x": {"type": "continuous", "lower": 0, "upper": None}, "y": {"type": "continuous", "lower": 0, "upper": None}},
        "objective": {"x": 5, "y": 4}, "quadratic": {"x^2": 2, "x*y": 2, "y^2": 3},
        "constraints": [{"x": 1, "y": 1, "relation": ">=", "limit": 1}],
    }
    result = OptimizationSolver(problem).solve()
    assert result["success"] and abs(result["constraints"][0] - 1) < 1e-6


if __name__ == "__main__":
    test_lp(); test_milp(); test_qp(); print("All solver smoke tests passed.")
