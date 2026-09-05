"""Optional CUDA kernels used by the Sovereign numerical acceleration layer."""

try:
    import cupy as cp
except Exception:  # pragma: no cover - exercised only on CPU-only machines
    cp = None


def launch_update(x, gradient, correction, learning_rate):
    """Fused non-negative vector update; retained for future iterative kernels."""
    if cp is None:
        raise RuntimeError("CuPy is not installed")
    n = x.size
    kernel = cp.ElementwiseKernel(
        "float64 x, float64 gradient, float64 correction, float64 learning_rate",
        "float64 y",
        "y = fmax(x - learning_rate * gradient - learning_rate * correction, 0.0)",
        "sovereign_update_solution",
    )
    kernel(x, gradient, correction, learning_rate, x)


def synchronize():
    if cp is None:
        raise RuntimeError("CuPy is not installed")
    cp.cuda.Stream.null.synchronize()
