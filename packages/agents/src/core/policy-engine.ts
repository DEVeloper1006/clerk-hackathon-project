import type { CompiledPolicy, Rule } from '@clerk/shared'

export interface PolicyDecision {
  ruleId: string
  matched: boolean
  actions: CompiledPolicy['actions']
}

/** Evaluates a single compiled policy against an input fact object. */
export function evaluatePolicy(
  _policy: CompiledPolicy,
  _facts: Record<string, unknown>,
): { matched: boolean; actions: CompiledPolicy['actions'] } {
  // TODO: implement — evaluate each condition (field/op/value) against facts; return actions when all match.
  return { matched: false, actions: [] }
}

/** Runs every enabled, compiled rule for an agent and returns the decisions. */
export function evaluateRules(rules: Rule[], facts: Record<string, unknown>): PolicyDecision[] {
  return rules
    .filter((rule) => rule.enabled && rule.compiledPolicy)
    .map((rule) => {
      const result = evaluatePolicy(rule.compiledPolicy as CompiledPolicy, facts)
      return { ruleId: rule.id, ...result }
    })
}
