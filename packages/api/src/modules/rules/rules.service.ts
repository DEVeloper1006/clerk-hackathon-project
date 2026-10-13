import type { CompiledPolicy, Rule, RuleInput } from '@clerk/shared'

export async function listRules(_tenantId: string): Promise<Rule[]> {
  // TODO: implement — select rules where tenant_id = tenantId.
  return []
}

export async function createRule(_tenantId: string, _input: RuleInput): Promise<Rule | null> {
  // TODO: implement — compile the rule, insert row, publish rule.updated on the bus.
  return null
}

export async function updateRule(
  _tenantId: string,
  _ruleId: string,
  _input: Partial<RuleInput>,
): Promise<Rule | null> {
  // TODO: implement — recompile if naturalLanguage changed, update row scoped by tenant_id.
  return null
}

export async function deleteRule(_tenantId: string, _ruleId: string): Promise<boolean> {
  // TODO: implement — delete rule row scoped by tenant_id.
  return false
}

/** Natural-language rule compiler: "Flag any order over $500 from a new customer" → CompiledPolicy. */
export async function compileRule(_naturalLanguage: string): Promise<CompiledPolicy | null> {
  // TODO: implement — prompt the LLM with a JSON schema for CompiledPolicy and validate the output.
  return null
}
