export function render(template: string | undefined, inputs: Record<string, unknown>) {
  return (template || "").replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key) => {
    if (!(key in inputs)) throw new Error(`MISSING_INPUT:${key}`);
    return String(inputs[key]);
  });
}

export function validateInputs(schema: Record<string, { type: string; required: boolean; pattern?: string }>, inputs: Record<string, unknown>) {
  for (const [name, spec] of Object.entries(schema)) {
    const value = inputs[name];
    if (spec.required && (value === undefined || value === "")) throw new Error(`INVALID_INPUT:${name}:required`);
    if (value !== undefined && typeof value !== spec.type) throw new Error(`INVALID_INPUT:${name}:expected_${spec.type}`);
    if (spec.pattern && !new RegExp(spec.pattern).test(String(value))) throw new Error(`INVALID_INPUT:${name}:pattern`);
  }
}
