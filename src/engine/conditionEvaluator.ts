import type { GameState } from '../types'

type EvalContext = Pick<GameState, 'metrics' | 'eventLog' | 'flags' | 'agents' | 'collectedFragments'>
type PartialEvalContext = Partial<EvalContext> & Pick<GameState, 'metrics' | 'eventLog' | 'flags'>

const METRIC_KEYS = new Set(['tech', 'vision', 'brother', 'opinion', 'publicPressure'])
const COMPARATORS = new Set(['>', '>=', '<', '<=', '===', '!=='])

export function evaluateCondition(condition: string | undefined, ctx: PartialEvalContext): boolean {
  if (!condition) return true

  const trimmed = condition.trim()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false

  const eventMatch = trimmed.match(/^eventLog\.includes\(['"]([^'"]+)['"]\)$/)
  if (eventMatch) return ctx.eventLog.includes(eventMatch[1])

  const flagMatch = trimmed.match(/^flags(?:\.([A-Za-z0-9_-]+)|\[['"]([^'"]+)['"]\])(?:\s*(===|!==)\s*(true|false))?$/)
  if (flagMatch) {
    const key = flagMatch[1] || flagMatch[2]
    return compareBoolean(Boolean(ctx.flags[key]), flagMatch[3], flagMatch[4])
  }

  const fragmentMatch = trimmed.match(/^collectedFragments(?:\.([A-Za-z0-9_-]+)|\[['"]([^'"]+)['"]\])(?:\s*(===|!==)\s*(true|false))?$/)
  if (fragmentMatch) {
    const key = fragmentMatch[1] || fragmentMatch[2]
    return compareBoolean(Boolean(ctx.collectedFragments?.[key]), fragmentMatch[3], fragmentMatch[4])
  }

  const metricMatch = trimmed.match(/^metrics\.([A-Za-z]+)\s*(>=|<=|>|<|===|!==)\s*(-?\d+(?:\.\d+)?)$/)
  if (metricMatch) {
    const [, key, comparator, rawValue] = metricMatch
    if (!METRIC_KEYS.has(key) || !COMPARATORS.has(comparator)) return false
    return compareNumber(ctx.metrics[key as keyof GameState['metrics']], comparator, Number(rawValue))
  }

  console.warn('Unsupported condition syntax:', condition)
  return false
}

export function isSupportedConditionSyntax(condition: string | undefined): boolean {
  if (!condition) return true
  const trimmed = condition.trim()
  return trimmed === 'true'
    || trimmed === 'false'
    || /^eventLog\.includes\(['"][^'"]+['"]\)$/.test(trimmed)
    || /^flags(?:\.[A-Za-z0-9_-]+|\[['"][^'"]+['"]\])(?:\s*(?:===|!==)\s*(?:true|false))?$/.test(trimmed)
    || /^collectedFragments(?:\.[A-Za-z0-9_-]+|\[['"][^'"]+['"]\])(?:\s*(?:===|!==)\s*(?:true|false))?$/.test(trimmed)
    || /^metrics\.(?:tech|vision|brother|opinion|publicPressure)\s*(?:>=|<=|>|<|===|!==)\s*-?\d+(?:\.\d+)?$/.test(trimmed)
}

function compareBoolean(actual: boolean, comparator?: string, expected?: string): boolean {
  if (!comparator || !expected) return actual
  const expectedBool = expected === 'true'
  return comparator === '===' ? actual === expectedBool : actual !== expectedBool
}

function compareNumber(actual: number, comparator: string, expected: number): boolean {
  switch (comparator) {
    case '>': return actual > expected
    case '>=': return actual >= expected
    case '<': return actual < expected
    case '<=': return actual <= expected
    case '===': return actual === expected
    case '!==': return actual !== expected
    default: return false
  }
}

export function resolveConditionalText(
  text: string | Array<{ condition?: string; default?: boolean; value: string }>,
  ctx: EvalContext
): string {
  if (typeof text === 'string') return text

  for (const item of text) {
    if (item.default) continue
    if (item.condition && evaluateCondition(item.condition, ctx)) {
      return item.value
    }
  }

  const defaultItem = text.find(t => t.default)
  if (defaultItem) return defaultItem.value
  return text[text.length - 1]?.value || ''
}
