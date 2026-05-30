import type { ChoiceOption, GameMetrics } from '../types'
import { evaluateCondition } from './conditionEvaluator'

export function checkRequirement(
  requirement: string | undefined,
  metrics: GameMetrics,
  flags: Record<string, boolean>,
  eventLog: string[]
): boolean {
  if (!requirement) return true

  return evaluateCondition(requirement, { metrics, flags, eventLog })
}

export function resolveChoiceOptions(
  choices: ChoiceOption[],
  metrics: GameMetrics,
  flags: Record<string, boolean>,
  eventLog: string[]
): Array<ChoiceOption & { available: boolean }> {
  return choices.map(choice => ({
    ...choice,
    available: checkRequirement(choice.requirement, metrics, flags, eventLog),
  }))
}
