import { useState } from "react";
import { buildProblemFromText, solveOptimization } from "./solverApi";

function App() {
  const [solverRunning, setSolverRunning] = useState(false);
  const [solverComplete, setSolverComplete] = useState(false);
  const [solverResult, setSolverResult] = useState(null);
  const [solverError, setSolverError] = useState("");
  const [problemType, setProblemType] = useState("LP");
  const [objectiveText, setObjectiveText] = useState("Minimize: 3x + 5y");
  const [constraintsText, setConstraintsText] = useState(
`2x + y <= 10
x + 3y <= 15
x, y >= 0`
  );

  const runSolver = async () => {
    setSolverRunning(true);
    setSolverComplete(false);
    setSolverResult(null);
    setSolverError("");

    try {
      const problem = buildProblemFromText(problemType, objectiveText, constraintsText);
      const result = await solveOptimization(problem);

      setSolverResult(result);
      setSolverComplete(Boolean(result.success));

      if (!result.success) {
        setSolverError(result.message || "The solver did not find a feasible solution.");
      }
    } catch (error) {
      setSolverError(error instanceof Error ? error.message : "Solver request failed.");
      setSolverComplete(false);
    } finally {
      setSolverRunning(false);
    }
  };

  const gpuAvailable = Boolean(solverResult?.gpu_available);
  const gpuValidationUsed = Boolean(solverResult?.gpu_validation);

  const getGpuConsoleStatus = () => {
    if (solverRunning) return " WAITING";
    if (!solverResult) return " STANDBY";
    if (gpuValidationUsed) return " COMPLETE";
    if (gpuAvailable) return " CPU SOLVER";
    return " CPU ONLY";
  };

  const getGpuConsoleLabel = () => {
    if (solverRunning || !solverResult) return "GPU / VALIDATION";
    if (gpuValidationUsed) return "GPU VALIDATION";
    if (gpuAvailable) return "GPU AVAILABLE";
    return "CPU ONLY";
  };

  const getSolverModeText = () => {
    if (!solverResult) return "STANDBY";
    if (gpuValidationUsed) return "CUDA/CUPY VALIDATION";
    if (problemType === "MILP") return "CPU / HIGHS-MILP";
    if (problemType === "QP") return "CPU / SLSQP-QP";
    return "CPU SOLVER";
  };

  return (
    <div className="app">

      {/* Navigation Bar */}
      <nav className="navbar">

        {/* Logo */}
        <div className="logo">
          <span className="logo-symbol">◈</span>
          SOVEREIGN
          <span className="logo-light">OPTIMIZER</span>
        </div>

        {/* Navigation Links */}
        <div className="nav-links">

          <a href="#platform">Platform</a>

          <a href="#capabilities">Capabilities</a>

          <a href="#industries">Industries</a>

          <a href="#architecture">Architecture</a>

          <a href="#performance">Performance</a>

          <a href="#benchmarks">Benchmarks</a>

          <a href="#solver">Solver</a>

          <a href="#about">About</a>

        </div>

        {/* Launch Button */}
        <button
          className="nav-button"
          onClick={() => {
            document
              .getElementById("solver")
              .scrollIntoView({ behavior: "smooth" });
          }}
        >
          Launch Solver
        </button>

      </nav>

      {/* MAIN START */}
      <main>

        {/* Hero Section */}
        <section className="hero" id="platform">

          <div className="hero-content">

            <div className="status-badge">
              <span className="status-dot"></span>
              SOVEREIGN OPTIMIZATION INFRASTRUCTURE
            </div>

            <h1>
              Optimization
              <br />
              <span>Built for India.</span>
            </h1>

            <p className="hero-description">
              A high-performance mathematical optimization engine
              designed for large-scale industrial problems across
              refining, power, manufacturing, logistics and supply chains.
            </p>

            <div className="hero-buttons">

              <button
                className="primary-button"
                onClick={() => {
                  document
                    .getElementById("solver")
                    .scrollIntoView({
                      behavior: "smooth"
                    });
                }}
              >
                Launch Solver →
              </button>

              <button className="secondary-button">
                Explore Capabilities
              </button>

            </div>

          </div>

          {/* Solver Information Card */}
          <div className="solver-card">

            <div className="card-header">

              <span>
                OPTIMIZATION ENGINE
              </span>

              <span className="online">
                ● ONLINE
              </span>

            </div>

            <div className="card-line"></div>

            <div className="solver-title">
              Sovereign Solver Core
            </div>

            <div className="solver-subtitle">
              Mathematical Optimization Engine
            </div>

            <div className="solver-metrics">

              <div>
                <strong>LP</strong>
                <span>SUPPORTED</span>
              </div>

              <div>
                <strong>MILP</strong>
                <span>SUPPORTED</span>
              </div>

              <div>
                <strong>QP</strong>
                <span>SUPPORTED</span>
              </div>

            </div>

            <div className="terminal">

              <div>
                solver.initialize()
              </div>

              <div>
                loading sparse matrix engine...
              </div>

              <div>
                presolve module............. OK
              </div>

              <div>
                optimization core........... OK
              </div>

              <div>
                parallel execution.......... READY
              </div>

              <div className="terminal-success">
                system ready_
              </div>

            </div>

          </div>

        </section>

        {/* Core Capabilities Section */}
        <section className="capabilities" id="capabilities">

          <div className="section-heading">

            <div className="section-label">
              CORE CAPABILITIES
            </div>

            <h2>
              Built from mathematical
              <span> first principles.</span>
            </h2>

            <p>
              A sovereign optimization engine designed to solve
              complex industrial problems with speed, stability
              and numerical reliability.
            </p>

          </div>

          <div className="capability-grid">

            {/* LP */}
            <div className="capability-card">

              <div className="capability-number">
                01
              </div>

              <div className="capability-icon">
                LP
              </div>

              <h3>
                Linear Programming
              </h3>

              <p>
                Solve large-scale linear optimization problems
                using efficient numerical algorithms and sparse
                matrix techniques.
              </p>

              <div className="capability-tags">
                <span>REVISED SIMPLEX</span>
                <span>INTERIOR POINT</span>
              </div>

            </div>

            {/* MILP */}
            <div className="capability-card">

              <div className="capability-number">
                02
              </div>

              <div className="capability-icon">
                MILP
              </div>

              <h3>
                Mixed-Integer Linear Programming
              </h3>

              <p>
                Handle difficult combinatorial optimization
                problems using branch-and-bound, cutting planes
                and intelligent heuristics.
              </p>

              <div className="capability-tags">
                <span>BRANCH &amp; BOUND</span>
                <span>BRANCH &amp; CUT</span>
              </div>

            </div>

            {/* QP */}
            <div className="capability-card">

              <div className="capability-number">
                03
              </div>

              <div className="capability-icon">
                QP
              </div>

              <h3>
                Quadratic Programming
              </h3>

              <p>
                Optimize problems with quadratic objectives while
                maintaining numerical stability and efficient
                convergence.
              </p>

              <div className="capability-tags">
                <span>NUMERICAL STABILITY</span>
                <span>SPARSE LINEAR ALGEBRA</span>
              </div>

            </div>

          </div>

        </section>

        {/* Why Sovereign Section */}
        <section className="why-sovereign" id="why-sovereign">

          <div className="sovereign-heading">

            <div className="section-label">
              WHY SOVEREIGN
            </div>

            <h2>
              Taking control of
              <span> optimization infrastructure.</span>
            </h2>

            <p>
              Critical industries should not depend entirely on
              proprietary optimization engines. Our goal is to build
              a transparent, extensible and sovereign optimization core.
            </p>

          </div>

          <div className="problem-grid">

            {/* Card 1 */}
            <div className="problem-card">

              <div className="problem-icon">
                $
              </div>

              <div className="problem-number">
                01
              </div>

              <h3>
                High License Costs
              </h3>

              <p>
                Commercial optimization engines require recurring
                licensing costs that can become significant at
                industrial scale.
              </p>

            </div>

            {/* Card 2 */}
            <div className="problem-card">

              <div className="problem-icon">
                ◇
              </div>

              <div className="problem-number">
                02
              </div>

              <h3>
                Limited Transparency
              </h3>

              <p>
                Proprietary solver internals cannot be freely inspected,
                modified or tailored for strategic industrial requirements.
              </p>

            </div>

            {/* Card 3 */}
            <div className="problem-card">

              <div className="problem-icon">
                ↗
              </div>

              <div className="problem-number">
                03
              </div>

              <h3>
                Foreign Dependency
              </h3>

              <p>
                Important optimization workloads can depend on a small
                number of foreign mathematical optimization platforms.
              </p>

            </div>

          </div>

          <div className="sovereign-banner">

            <div className="banner-left">

              <div className="banner-label">
                THE OBJECTIVE
              </div>

              <h3>
                A sovereign optimization
                <span> foundation for India.</span>
              </h3>

            </div>

            <div className="banner-right">

              <div className="banner-item">
                <strong>01</strong>
                <span>Built from scratch</span>
              </div>

              <div className="banner-item">
                <strong>02</strong>
                <span>Open &amp; extensible architecture</span>
              </div>

              <div className="banner-item">
                <strong>03</strong>
                <span>Designed for industrial scale</span>
              </div>

            </div>

          </div>

        </section>

        {/* Industries Section */}
        <section className="industries" id="industries">

          <div className="industries-heading">

            <div className="section-label">
              INDUSTRIAL APPLICATIONS
            </div>

            <h2>
              Optimization for
              <span> real-world systems.</span>
            </h2>

            <p>
              A general-purpose optimization engine designed for
              the complex planning, scheduling and resource-allocation
              problems found across India's critical industries.
            </p>

          </div>

          <div className="industry-grid">

            {/* Refining */}
            <div className="industry-card industry-large">

              <div className="industry-number">
                01
              </div>

              <div className="industry-code">
                REF / 01
              </div>

              <h3>
                Refining &amp; Petrochemicals
              </h3>

              <p>
                Optimize refinery scheduling, crude blending,
                production planning and feedstock allocation
                across complex processing systems.
              </p>

              <div className="industry-tags">
                SCHEDULING · BLENDING · PLANNING
              </div>

            </div>

            {/* Power */}
            <div className="industry-card">

              <div className="industry-number">
                02
              </div>

              <div className="industry-code">
                PWR / 02
              </div>

              <h3>
                Power Systems
              </h3>

              <p>
                Support generation planning, economic dispatch,
                unit commitment and energy resource allocation.
              </p>

              <div className="industry-tags">
                DISPATCH · ENERGY · GENERATION
              </div>

            </div>

            {/* Manufacturing */}
            <div className="industry-card">

              <div className="industry-number">
                03
              </div>

              <div className="industry-code">
                MFG / 03
              </div>

              <h3>
                Manufacturing
              </h3>

              <p>
                Optimize production schedules, machine allocation,
                inventory planning and resource utilization.
              </p>

              <div className="industry-tags">
                PRODUCTION · RESOURCES · CAPACITY
              </div>

            </div>

            {/* Logistics */}
            <div className="industry-card">

              <div className="industry-number">
                04
              </div>

              <div className="industry-code">
                LOG / 04
              </div>

              <h3>
                Logistics &amp; Transportation
              </h3>

              <p>
                Solve routing, transportation, fleet allocation
                and network optimization problems at scale.
              </p>

              <div className="industry-tags">
                ROUTING · NETWORKS · TRANSPORT
              </div>

            </div>

            {/* Supply Chain */}
            <div className="industry-card industry-large">

              <div className="industry-number">
                05
              </div>

              <div className="industry-code">
                SCM / 05
              </div>

              <h3>
                Supply Chain
              </h3>

              <p>
                Coordinate procurement, inventory, distribution
                and demand allocation across complex supply networks.
              </p>

              <div className="industry-tags">
                INVENTORY · DISTRIBUTION · PROCUREMENT
              </div>

            </div>

            {/* Strategic Planning */}
            <div className="industry-card">

              <div className="industry-number">
                06
              </div>

              <div className="industry-code">
                PLN / 06
              </div>

              <h3>
                Strategic Planning
              </h3>

              <p>
                Support long-term capacity planning, investment
                decisions and complex resource allocation.
              </p>

              <div className="industry-tags">
                PLANNING · CAPACITY · ALLOCATION
              </div>

            </div>

          </div>

        </section>

        {/* Solver Architecture Section */}
        <section className="architecture" id="architecture">

          <div className="architecture-heading">

            <div className="section-label">
              SOLVER ARCHITECTURE
            </div>

            <h2>
              From model to
              <span> optimal solution.</span>
            </h2>

            <p>
              A modular optimization pipeline designed for numerical
              stability, scalability and reliable performance on
              large industrial problems.
            </p>

          </div>

          <div className="architecture-flow">

            {/* Step 1 */}
            <div className="architecture-step">

              <div className="architecture-number">
                01
              </div>

              <div className="architecture-icon">
                INPUT
              </div>

              <h3>
                Mathematical Model
              </h3>

              <p>
                Define the objective function, variables and
                constraints for LP, MILP or QP problems.
              </p>

              <div className="architecture-tags">
                LP · MILP · QP
              </div>

            </div>

            <div className="flow-arrow">
              →
            </div>

            {/* Step 2 */}
            <div className="architecture-step">

              <div className="architecture-number">
                02
              </div>

              <div className="architecture-icon">
                PRE
              </div>

              <h3>
                Presolve
              </h3>

              <p>
                Reduce model complexity by identifying redundant
                constraints, fixed variables and simplifications.
              </p>

              <div className="architecture-tags">
                REDUCTION · SCALING
              </div>

            </div>

            <div className="flow-arrow">
              →
            </div>

            {/* Step 3 */}
            <div className="architecture-step">

              <div className="architecture-number">
                03
              </div>

              <div className="architecture-icon">
                CORE
              </div>

              <h3>
                Optimization Core
              </h3>

              <p>
                Apply advanced numerical algorithms including
                revised simplex and interior-point methods.
              </p>

              <div className="architecture-tags">
                SIMPLEX · INTERIOR POINT
              </div>

            </div>

            <div className="flow-arrow">
              →
            </div>

            {/* Step 4 */}
            <div className="architecture-step">

              <div className="architecture-number">
                04
              </div>

              <div className="architecture-icon">
                MIP
              </div>

              <h3>
                Mixed-Integer Engine
              </h3>

              <p>
                Solve difficult integer problems using branch-and-bound,
                cutting planes and optimization heuristics.
              </p>

              <div className="architecture-tags">
                BRANCH &amp; BOUND · CUTTING PLANES
              </div>

            </div>

            <div className="flow-arrow">
              →
            </div>

            {/* Step 5 */}
            <div className="architecture-step architecture-result">

              <div className="architecture-number">
                05
              </div>

              <div className="architecture-icon">
                ✓
              </div>

              <h3>
                Optimal Solution
              </h3>

              <p>
                Return a high-quality optimal or near-optimal solution
                together with optimization statistics.
              </p>

              <div className="architecture-tags">
                OPTIMAL · FEASIBLE
              </div>

            </div>

          </div>

          <div className="architecture-bottom">

            <div>
              <strong>
                SPARSE
              </strong>
              <span>
                Efficient sparse matrix techniques
              </span>
            </div>

            <div>
              <strong>
                NUMERICAL
              </strong>
              <span>
                Stability for difficult models
              </span>
            </div>

            <div>
              <strong>
                PARALLEL
              </strong>
              <span>
                Multi-core execution
              </span>
            </div>

            <div>
              <strong>
                EXTENSIBLE
              </strong>
              <span>
                Ready for MIQP, NLP &amp; MINLP
              </span>
            </div>

          </div>

        </section>

        {/* Performance Section */}
        <section className="performance" id="performance">

          <div className="performance-heading">

            <div className="section-label">
              PERFORMANCE &amp; BENCHMARKS
            </div>

            <h2>
              Built for
              <span> industrial scale.</span>
            </h2>

            <p>
              Designed to handle large, sparse and highly constrained
              optimization problems while maintaining numerical
              stability and practical computation times.
            </p>

          </div>

          <div className="benchmark-panel">

            <div className="benchmark-header">

              <div>
                <span className="benchmark-status">
                  ● BENCHMARK READY
                </span>

                <h3>
                  Large-Scale Optimization Engine
                </h3>
              </div>

              <div className="benchmark-model">
                MILP
              </div>

            </div>

            <div className="benchmark-metrics">

              <div className="metric">

                <span className="metric-label">
                  VARIABLES
                </span>

                <strong>
                  1M+
                </strong>

                <span className="metric-description">
                  Large-scale models
                </span>

              </div>

              <div className="metric">

                <span className="metric-label">
                  CONSTRAINTS
                </span>

                <strong>
                  1M+
                </strong>

                <span className="metric-description">
                  Highly constrained problems
                </span>

              </div>

              <div className="metric">

                <span className="metric-label">
                  MATRIX
                </span>

                <strong>
                  SPARSE
                </strong>

                <span className="metric-description">
                  Efficient sparse representation
                </span>

              </div>

              <div className="metric">

                <span className="metric-label">
                  EXECUTION
                </span>

                <strong>
                  PARALLEL
                </strong>

                <span className="metric-description">
                  Multi-core computation
                </span>

              </div>

            </div>

            <div className="benchmark-terminal">

              <div className="terminal-top">

                <span>
                  SOLVER BENCHMARK
                </span>

                <span>
                  RUNNING
                </span>

              </div>

              <div className="terminal-content">

                <p>
                  <span>&gt;</span> loading benchmark model...
                </p>

                <p>
                  <span>&gt;</span> variables............. 1,024,382
                </p>

                <p>
                  <span>&gt;</span> constraints........... 892,441
                </p>

                <p>
                  <span>&gt;</span> non-zero elements..... 4,812,903
                </p>

                <p>
                  <span>&gt;</span> presolve.............. COMPLETE
                </p>

                <p>
                  <span>&gt;</span> optimization............ RUNNING
                </p>

                <p className="terminal-success">
                  <span>&gt;</span> solver status.......... FEASIBLE
                </p>

              </div>

            </div>

          </div>

          <div className="benchmark-note">

            <span>
              BENCHMARK TARGET
            </span>

            <p>
              Performance will be evaluated against recognised
              optimization benchmark suites including MIPLIB,
              Netlib and Mittelmann instances.
            </p>

          </div>

        </section>

        {/* Launch Solver Section */}
        <section className="solver-console" id="solver">

          <div className="solver-heading">

            <div className="section-label">
              SOLVER CONSOLE
            </div>

            <h2>
              Run an optimization
              <span> problem.</span>
            </h2>

            <p>
              Send a linear optimization model directly to the Sovereign
              Solver API and inspect the returned solution and validation metrics.
            </p>

          </div>

          <div className="solver-layout">

            {/* LEFT SIDE — INPUT */}
            <div className="solver-input-panel">

              <div className="console-header">

                <div>
                  <span className="console-label">
                    MODEL INPUT
                  </span>

                  <h3>
                    Optimization Model
                  </h3>
                </div>

                <span className="console-status">
                  {solverRunning ? "● SENDING" : "● READY"}
                </span>

              </div>

              <div className="solver-field">

                <label>
                  PROBLEM TYPE
                </label>

                <select
                  value={problemType}
                  onChange={(event) => {
                    const next = event.target.value;
                    setProblemType(next);
                    if (next === "QP") {
                      setObjectiveText("Minimize: 2x^2 + 2x*y + 3y^2 + 5x + 4y");
                      setConstraintsText("x + y >= 1\nx, y >= 0");
                    } else if (next === "MILP") {
                      setObjectiveText("Maximize: 7x + 5y");
                      setConstraintsText("2x + y <= 10\ninteger: x\nx, y >= 0");
                    } else {
                      setObjectiveText("Minimize: 3x + 5y");
                      setConstraintsText("2x + y <= 10\nx + 3y <= 15\nx, y >= 0");
                    }
                  }}
                  disabled={solverRunning}
                >

                  <option value="LP">
                    Linear Programming (LP)
                  </option>

                  <option value="MILP">
                    Mixed Integer Linear Programming (MILP)
                  </option>

                  <option value="QP">
                    Quadratic Programming (QP) — convex
                  </option>

                </select>

              </div>

              <div className="solver-field">

                <label>
                  OBJECTIVE FUNCTION
                </label>

                <textarea
                  value={objectiveText}
                  onChange={(event) => setObjectiveText(event.target.value)}
                  rows="3"
                  disabled={solverRunning}
                  spellCheck="false"
                />

              </div>

              <div className="solver-field">

                <label>
                  CONSTRAINTS
                </label>

                <textarea
                  value={constraintsText}
                  onChange={(event) => setConstraintsText(event.target.value)}
                  rows="6"
                  disabled={solverRunning}
                  spellCheck="false"
                />

              </div>

              <p className="solver-help">
                <span>LP/MILP: <code>Maximize: 3x + 5y</code>. MILP variable types: <code>integer: x</code> or <code>binary: y</code>. </span>
                <span>QP: <code>Minimize: 2x^2 + 2x*y + 3y^2 + 5x</code>. </span>
                <span>Constraints: <code>2x + y &lt;= 10</code>; bounds such as <code>x, y &gt;= 0</code> are supported.</span>
              </p>

              <button
                className="run-solver-button"
                onClick={runSolver}
                disabled={solverRunning}
              >

                {solverRunning
                  ? "SOLVING..."
                  : "RUN SOLVER →"
                }

              </button>

              {solverError && (
                <div className="solver-error" role="alert">
                  {solverError}
                </div>
              )}

            </div>

            {/* RIGHT SIDE — OUTPUT */}
            <div className="solver-output-panel">

              <div className="console-header">

                <div>
                  <span className="console-label">
                    SOLVER OUTPUT
                  </span>

                  <h3>
                    Optimization Engine
                  </h3>
                </div>

                <span
                  className={
                    solverRunning
                      ? "console-status running"
                      : solverComplete
                      ? "console-status complete"
                      : solverError
                      ? "console-status error"
                      : "console-status"
                  }
                >

                  {solverRunning
                    ? "● RUNNING"
                    : solverComplete
                    ? "● COMPLETE"
                    : solverError
                    ? "● ERROR"
                    : "● STANDBY"
                  }

                </span>

              </div>

              <div className="solver-terminal">

                <p>
                  <span>&gt;</span>
                  API connection...
                  <b>{solverRunning ? " RUNNING" : solverResult ? " CONNECTED" : " READY"}</b>
                </p>

                <p>
                  <span>&gt;</span>
                  model parsing...
                  <b>{solverRunning ? " RUNNING" : solverResult || solverError ? " COMPLETE" : " READY"}</b>
                </p>

                <p>
                  <span>&gt;</span>
                  optimization core...
                  <b>{solverRunning ? " RUNNING" : solverResult ? " COMPLETE" : solverError ? " FAILED" : " READY"}</b>
                </p>

                <p>
                  <span>&gt;</span>
                  {getGpuConsoleLabel()}...
                  <b>{getGpuConsoleStatus()}</b>
                </p>

                {solverRunning && (
                  <p className="terminal-running">
                    &gt; solving model on Sovereign Solver API...
                  </p>
                )}

                {solverComplete && (
                  <>
                    <p className="terminal-success">
                      &gt; feasible solution found
                    </p>

                    <p className="terminal-success">
                      &gt; solution processing complete
                    </p>

                    {gpuValidationUsed && (
                      <p className="terminal-success">
                        &gt; CUDA/CuPy validation complete
                      </p>
                    )}

                    {!gpuValidationUsed && gpuAvailable && (
                      <p className="terminal-success">
                        &gt; CPU optimization complete — GPU available
                      </p>
                    )}
                  </>
                )}

                {solverError && (
                  <p className="terminal-error">
                    &gt; {solverError}
                  </p>
                )}

              </div>

              <div className="solver-result">

                <div>
                  <span>STATUS</span>
                  <strong>
                    {solverComplete
                      ? "OPTIMAL"
                      : solverRunning
                      ? "SOLVING"
                      : solverError
                      ? "FAILED"
                      : "READY"
                    }
                  </strong>
                </div>

                <div>
                  <span>OBJECTIVE</span>
                  <strong>
                    {solverResult?.objective != null
                      ? Number(solverResult.objective).toFixed(4)
                      : "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>TIME</span>
                  <strong>
                    {solverResult?.time != null
                      ? `${Number(solverResult.time).toFixed(4)}s`
                      : "—"
                    }
                  </strong>
                </div>

              </div>

              {solverResult?.solution && (
                <div className="solver-solution">
                  <div className="solution-header">SOLUTION VARIABLES</div>

                  {Object.entries(solverResult.solution).map(([variable, value]) => (
                    <div className="solution-row" key={variable}>
                      <span>{variable}</span>
                      <strong>{Number(value).toFixed(8)}</strong>
                    </div>
                  ))}

                  <div className="solution-meta">
                    <span>
                      ENGINE: {solverResult.solver || "Sovereign Solver"}
                    </span>

                    <span>
                      MODE: {getSolverModeText()}
                    </span>

                    <span>
                      GPU: {gpuAvailable ? "AVAILABLE" : "UNAVAILABLE"}
                    </span>

                    <span>
                      GPU VALIDATION: {gpuValidationUsed ? "USED" : "NOT USED"}
                    </span>

                    {solverResult.gpu_time != null &&
                      solverResult.gpu_time > 0 && (
                        <span>
                          GPU TIME: {Number(solverResult.gpu_time).toFixed(6)}s
                        </span>
                      )}

                    {solverResult.cpu_solve_time != null &&
                      solverResult.cpu_solve_time > 0 && (
                        <span>
                          CPU SOLVE TIME: {Number(solverResult.cpu_solve_time).toFixed(6)}s
                        </span>
                      )}

                    {solverResult.violation != null && (
                      <span>
                        MAX VIOLATION: {Number(solverResult.violation).toExponential(3)}
                      </span>
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>

        </section>

        {/* Benchmark Comparison Section */}
        <section className="comparison" id="benchmarks">

          <div className="comparison-heading">

            <div className="section-label">
              BENCHMARK &amp; VALIDATION
            </div>

            <h2>
              Measure performance.
              <span> Prove reliability.</span>
            </h2>

            <p>
              The solver will be evaluated against recognised benchmark
              suites and established optimization engines across
              solution quality, scalability and numerical robustness.
            </p>

          </div>

          <div className="comparison-table">

            <div className="comparison-row comparison-header">

              <div className="comparison-feature">
                EVALUATION AREA
              </div>

              <div>
                SOVEREIGN
              </div>

              <div>
                COMMERCIAL
              </div>

              <div>
                OPEN SOURCE
              </div>

            </div>

            <div className="comparison-row">

              <div className="comparison-feature">
                Linear Programming
              </div>

              <div className="target">
                TARGET
              </div>

              <div>
                REFERENCE
              </div>

              <div>
                REFERENCE
              </div>

            </div>

            <div className="comparison-row">

              <div className="comparison-feature">
                Mixed Integer LP
              </div>

              <div className="target">
                TARGET
              </div>

              <div>
                REFERENCE
              </div>

              <div>
                REFERENCE
              </div>

            </div>

            <div className="comparison-row">

              <div className="comparison-feature">
                Quadratic Programming
              </div>

              <div className="target">
                TARGET
              </div>

              <div>
                REFERENCE
              </div>

              <div>
                REFERENCE
              </div>

            </div>

            <div className="comparison-row">

              <div className="comparison-feature">
                Large-scale sparse models
              </div>

              <div className="target">
                TARGET
              </div>

              <div>
                BENCHMARK
              </div>

              <div>
                BENCHMARK
              </div>

            </div>

            <div className="comparison-row">

              <div className="comparison-feature">
                Numerical robustness
              </div>

              <div className="target">
                TARGET
              </div>

              <div>
                BENCHMARK
              </div>

              <div>
                BENCHMARK
              </div>

            </div>

            <div className="comparison-row">

              <div className="comparison-feature">
                Multi-core execution
              </div>

              <div className="target">
                TARGET
              </div>

              <div>
                REFERENCE
              </div>

              <div>
                REFERENCE
              </div>

            </div>

          </div>

          <div className="benchmark-suites">

            <div className="suite-title">
              VALIDATION SUITES
            </div>

            <div className="suite-list">

              <div className="suite">
                <strong>MIPLIB</strong>
                <span>Mixed-integer optimization</span>
              </div>

              <div className="suite">
                <strong>NETLIB</strong>
                <span>Linear programming</span>
              </div>

              <div className="suite">
                <strong>MITTELMANN</strong>
                <span>Optimization performance</span>
              </div>

            </div>

          </div>

          <div className="comparison-note">

            <span>● EVALUATION FRAMEWORK</span>

            <p>
              Performance figures will be populated from reproducible
              benchmark runs once the solver engine is integrated.
              No unverified performance claims are presented here.
            </p>

          </div>

        </section>

        {/* Sovereignty Section */}
        <section className="sovereignty" id="about">

          <div className="sovereignty-heading">

            <div className="section-label">
              SOVEREIGN BY DESIGN
            </div>

            <h2>
              Built from the
              <span> mathematical foundation.</span>
            </h2>

            <p>
              A transparent optimization core designed to give Indian
              developers and industries greater control over critical
              optimization infrastructure.
            </p>

          </div>

          <div className="sovereignty-grid">

            {/* CARD 1 */}
            <div className="sovereignty-card">

              <div className="card-number">
                01
              </div>

              <div className="card-icon">
                ◇
              </div>

              <h3>
                Sovereign Core
              </h3>

              <p>
                Developed independently from proprietary optimization
                engines, giving the underlying algorithms a transparent
                and extensible foundation.
              </p>

              <div className="card-line"></div>

              <span>
                INDEPENDENT TECHNOLOGY
              </span>

            </div>

            {/* CARD 2 */}
            <div className="sovereignty-card">

              <div className="card-number">
                02
              </div>

              <div className="card-icon">
                +
              </div>

              <h3>
                Modular Architecture
              </h3>

              <p>
                The solver core is designed as modular components so
                future optimization capabilities can be integrated
                without rebuilding the entire engine.
              </p>

              <div className="card-line"></div>

              <span>
                EXTENSIBLE FOUNDATION
              </span>

            </div>

            {/* CARD 3 */}
            <div className="sovereignty-card">

              <div className="card-number">
                03
              </div>

              <div className="card-icon">
                ◌
              </div>

              <h3>
                Industrial Focus
              </h3>

              <p>
                Designed around large, sparse and highly constrained
                optimization problems found in India's industrial and
                infrastructure sectors.
              </p>

              <div className="card-line"></div>

              <span>
                INDUSTRIAL OPTIMIZATION
              </span>

            </div>

          </div>

          <div className="sovereignty-statement">

            <div className="statement-symbol">
              "
            </div>

            <div>

              <p>
                Optimization infrastructure should be a capability,
                not a dependency.
              </p>

              <span>
                — SOVEREIGN OPTIMIZER
              </span>

            </div>

          </div>

        </section>

        {/* Footer */}
        <footer className="footer">

          <div className="footer-main">

            {/* Brand */}
            <div className="footer-brand">

              <div className="footer-logo">

                <span>◇</span>

                SOVEREIGN
                <small>OPTIMIZER</small>

              </div>

              <p>
                Sovereign mathematical optimization infrastructure
                for large-scale industrial decision making.
              </p>

            </div>

            {/* Navigation */}
            <div className="footer-column">

              <h4>
                PLATFORM
              </h4>

              <a href="#platform">
                Overview
              </a>

              <a href="#capabilities">
                Capabilities
              </a>

              <a href="#architecture">
                Architecture
              </a>

              <a href="#benchmarks">
                Benchmarks
              </a>

            </div>

            {/* Industries */}
            <div className="footer-column">

              <h4>
                APPLICATIONS
              </h4>

              <a href="#industries">
                Refining
              </a>

              <a href="#industries">
                Power
              </a>

              <a href="#industries">
                Manufacturing
              </a>

              <a href="#industries">
                Logistics
              </a>

            </div>

            {/* Solver */}
            <div className="footer-column">

              <h4>
                SOLVER
              </h4>

              <a href="#solver">
                Launch Console
              </a>

              <a href="#benchmarks">
                Validation
              </a>

              <a href="#about">
                Sovereignty
              </a>

            </div>

          </div>

          <div className="footer-bottom">

            <span>
              © 2026 SOVEREIGN OPTIMIZER
            </span>

            <span>
              BUILT FOR INDUSTRIAL-SCALE OPTIMIZATION
            </span>

          </div>

        </footer>

      </main>
      {/* MAIN ENDS */}

    </div>
  );
}

export default App;