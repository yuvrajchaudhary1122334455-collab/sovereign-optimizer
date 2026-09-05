const API_BASE_URL =
  import.meta.env.VITE_SOLVER_API_URL || "http://localhost:8000";

const VARIABLE_PATTERN = /([+-]?)\s*(?:(\d+(?:\.\d+)?)\s*\*?\s*)?([A-Za-z_][A-Za-z0-9_]*)/g;

function parseLinearExpression(expression) {
  const cleaned = expression
    .replace(/\b(minimize|maximize|subject to|s\.t\.)\b/gi, "")
    .replace(/−/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  const coefficients = {};
  let match;
  let consumed = 0;
  VARIABLE_PATTERN.lastIndex = 0;

  while ((match = VARIABLE_PATTERN.exec(cleaned)) !== null) {
    const between = cleaned.slice(consumed, match.index);
    if (between.trim() && !/^[+\-\s]*$/.test(between)) {
      throw new Error(`Unsupported expression near "${between.trim()}".`);
    }

    const sign = match[1] === "-" ? -1 : 1;
    const magnitude = match[2] ? Number(match[2]) : 1;
    const variable = match[3];
    coefficients[variable] = (coefficients[variable] || 0) + sign * magnitude;
    consumed = VARIABLE_PATTERN.lastIndex;
  }

  const remainder = cleaned.slice(consumed).trim();
  if (remainder && !/^[+\-\s]*$/.test(remainder)) {
    throw new Error(`Unsupported expression near "${remainder}".`);
  }
  if (Object.keys(coefficients).length === 0) {
    throw new Error(`Could not find variables in "${expression}".`);
  }
  return coefficients;
}

function parseQuadraticExpression(expression) {
  const cleaned = expression
    .replace(/\b(minimize|maximize|subject to|s\.t\.)\b/gi, "")
    .replace(/−/g, "-")
    .replace(/\s+/g, "")
    .trim();

  const terms = cleaned.replace(/-/g, "+-" ).split("+").filter(Boolean);
  const linear = {};
  const quadratic = {};

  terms.forEach((rawTerm) => {
    const term = rawTerm.trim();
    let sign = 1;
    let body = term;
    if (body.startsWith("-")) {
      sign = -1;
      body = body.slice(1);
    }

    const coefficientMatch = body.match(/^(?:(\d+(?:\.\d+)?|\.\d+)\*?)?(.*)$/);
    if (!coefficientMatch) {
      throw new Error(`Could not parse objective term "${rawTerm}".`);
    }
    const magnitude = coefficientMatch[1] ? Number(coefficientMatch[1]) : 1;
    const factor = sign * magnitude;
    const expressionBody = coefficientMatch[2];

    if (!expressionBody) {
      throw new Error(`Missing variable in objective term "${rawTerm}".`);
    }

    const square = expressionBody.match(/^([A-Za-z_][A-Za-z0-9_]*)\^2$/);
    const product = expressionBody.match(/^([A-Za-z_][A-Za-z0-9_]*)\*([A-Za-z_][A-Za-z0-9_]*)$/);
    const variable = expressionBody.match(/^([A-Za-z_][A-Za-z0-9_]*)$/);

    if (square) {
      const name = square[1];
      quadratic[`${name}^2`] = (quadratic[`${name}^2`] || 0) + factor;
    } else if (product) {
      const names = [product[1], product[2]].sort();
      const key = `${names[0]}*${names[1]}`;
      quadratic[key] = (quadratic[key] || 0) + factor;
    } else if (variable) {
      const name = variable[1];
      linear[name] = (linear[name] || 0) + factor;
    } else {
      throw new Error(
        `Unsupported quadratic term "${rawTerm}". Use forms such as 2x^2, 3x*y or 5x.`
      );
    }
  });

  return { linear, quadratic };
}

function parseNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Invalid numeric value "${value}".`);
  return number;
}

function addVariable(variables, name, type = "continuous") {
  if (!variables[name]) {
    variables[name] = { type, lower: 0, upper: null };
  } else if (type !== "continuous") {
    variables[name].type = type;
  }
}

function applyBound(variables, names, relation, limit) {
  names.forEach((name) => {
    addVariable(variables, name);
    if (relation === ">=") variables[name].lower = limit;
    else if (relation === "<=") variables[name].upper = limit;
    else throw new Error("Variable equality bounds are not supported in the UI.");

    if (
      variables[name].upper !== null &&
      variables[name].upper < variables[name].lower
    ) {
      throw new Error(`Invalid bounds for variable "${name}".`);
    }
  });
}

function applyType(variables, names, type) {
  names.forEach((name) => {
    addVariable(variables, name, type);
    if (type === "binary") {
      variables[name].lower = 0;
      variables[name].upper = 1;
    }
  });
}

export function buildProblemFromText(problemType, objectiveText, constraintsText) {
  const objectiveLine = objectiveText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0];
  if (!objectiveLine) throw new Error("Enter an objective function.");

  const objectiveMatch = objectiveLine.match(/^\s*(maximize|max|minimize|min)\s*:?\s*(.+)$/i);
  if (!objectiveMatch) {
    throw new Error('Objective must start with "Maximize:" or "Minimize:".');
  }

  const senseWord = objectiveMatch[1].toLowerCase();
  const sense = senseWord === "maximize" || senseWord === "max" ? "maximize" : "minimize";
  const variables = {};
  const objective = {};
  const quadratic = {};

  if (problemType === "QP") {
    const parsed = parseQuadraticExpression(objectiveMatch[2]);
    Object.entries(parsed.linear).forEach(([name, coefficient]) => {
      addVariable(variables, name);
      objective[name] = coefficient;
    });
    Object.entries(parsed.quadratic).forEach(([key, coefficient]) => {
      const names = key.endsWith("^2") ? [key.slice(0, -2)] : key.split("*");
      names.forEach((name) => addVariable(variables, name));
      quadratic[key] = coefficient;
    });
  } else {
    Object.assign(objective, parseLinearExpression(objectiveMatch[2]));
    Object.keys(objective).forEach((name) => addVariable(variables, name));
  }

  const constraints = [];
  const lines = constraintsText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  lines.forEach((line, index) => {
    const typeMatch = line.match(/^\s*(integer|int|binary|bin|continuous|cont)\s*:\s*(.+)$/i);
    if (typeMatch) {
      const typeWord = typeMatch[1].toLowerCase();
      const type = typeWord.startsWith("bin") ? "binary" : typeWord.startsWith("int") ? "integer" : "continuous";
      const names = typeMatch[2].split(",").map((name) => name.trim()).filter(Boolean);
      if (!names.length || names.some((name) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))) {
        throw new Error(`Invalid variable declaration on line ${index + 1}.`);
      }
      applyType(variables, names, type);
      return;
    }

    const inlineTypeMatch = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*(?:\s*,\s*[A-Za-z_][A-Za-z0-9_]*)*)\s+(integer|int|binary|bin|continuous|cont)\s*$/i);
    if (inlineTypeMatch) {
      const typeWord = inlineTypeMatch[2].toLowerCase();
      const type = typeWord.startsWith("bin") ? "binary" : typeWord.startsWith("int") ? "integer" : "continuous";
      applyType(variables, inlineTypeMatch[1].split(",").map((name) => name.trim()), type);
      return;
    }

    const boundMatch = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*(?:\s*,\s*[A-Za-z_][A-Za-z0-9_]*)*)\s*(<=|>=)\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (boundMatch) {
      applyBound(
        variables,
        boundMatch[1].split(",").map((name) => name.trim()),
        boundMatch[2],
        parseNumber(boundMatch[3])
      );
      return;
    }

    const constraintMatch = line.match(/^\s*(.+?)\s*(<=|>=|=)\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (!constraintMatch) {
      throw new Error(`Constraint ${index + 1} is invalid. Use "2x + y <= 10".`);
    }

    const coefficients = parseLinearExpression(constraintMatch[1]);
    Object.keys(coefficients).forEach((name) => addVariable(variables, name));
    constraints.push({ ...coefficients, relation: constraintMatch[2], limit: parseNumber(constraintMatch[3]) });
  });

  if (problemType === "MILP" && !Object.values(variables).some((v) => v.type === "integer" || v.type === "binary")) {
    throw new Error("MILP needs at least one integer or binary variable. Add, for example, " + '"integer: x, y".');
  }
  if (problemType === "QP" && Object.values(variables).some((v) => v.type !== "continuous")) {
    throw new Error("QP currently supports continuous variables only.");
  }

  return { problem_type: problemType, sense, variables, objective, quadratic, constraints };
}

export async function solveOptimization(problem) {
  const response = await fetch(`${API_BASE_URL}/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(problem),
  });

  let payload;
  try { payload = await response.json(); }
  catch { throw new Error(`Solver API returned an invalid response (HTTP ${response.status}).`); }
  if (!response.ok) throw new Error(payload?.detail || `Solver request failed (HTTP ${response.status}).`);
  return payload;
}

export async function checkSolverHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error(`Solver API health check failed (HTTP ${response.status}).`);
  return response.json();
}
