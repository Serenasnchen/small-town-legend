import type { GameState, SaveData } from '../types'

const SAVE_KEY = 'stl_save_v1'
const SAVE_VERSION = 1

export function saveToStorage(data: { state: GameState }): void {
  try {
    const saveData: SaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      state: data.state,
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
  } catch (err) {
    console.warn('Save failed:', err)
  }
}

export function loadFromStorage(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null

    const data = parseSaveData(JSON.parse(raw))
    if (!data) {
      console.warn('Save data invalid, resetting')
      resetStorage()
      return null
    }
    if (data.version !== SAVE_VERSION) {
      console.warn('Save version mismatch, resetting')
      resetStorage()
      return null
    }
    return data
  } catch (err) {
    console.warn('Load failed:', err)
    return null
  }
}

export function resetStorage(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch (err) {
    console.warn('Reset failed:', err)
  }
}

export function hasSave(): boolean {
  try {
    return !!localStorage.getItem(SAVE_KEY)
  } catch {
    return false
  }
}

function parseSaveData(value: unknown): SaveData | null {
  if (!isRecord(value)) return null
  if (value.version !== SAVE_VERSION || typeof value.timestamp !== 'number' || !isRecord(value.state)) {
    return null
  }

  const state = value.state
  if (
    typeof state.currentScriptId !== 'string'
    || typeof state.currentSceneId !== 'string'
    || !Array.isArray(state.universeStack)
    || !isRecord(state.metrics)
    || !Array.isArray(state.eventLog)
  ) {
    return null
  }

  return {
    version: value.version,
    timestamp: value.timestamp,
    state: {
      currentScriptId: state.currentScriptId,
      currentSceneId: state.currentSceneId,
      universeStack: state.universeStack.filter(isUniverseFrame),
      metrics: {
        tech: readMetric(state.metrics.tech),
        vision: readMetric(state.metrics.vision),
        brother: readMetric(state.metrics.brother),
        opinion: readMetric(state.metrics.opinion),
        publicPressure: readMetric(state.metrics.publicPressure),
      },
      eventLog: state.eventLog.filter((item): item is string => typeof item === 'string'),
      flags: isRecord(state.flags) ? readBooleanRecord(state.flags) : {},
      collectedFragments: isRecord(state.collectedFragments) ? readBooleanRecord(state.collectedFragments) : {},
      agents: isRecord(state.agents) ? state.agents as SaveData['state']['agents'] : {},
      triggeredEvents: isRecord(state.triggeredEvents) ? readBooleanRecord(state.triggeredEvents) : {},
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readMetric(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50
}

function readBooleanRecord(value: Record<string, unknown>): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  for (const [key, val] of Object.entries(value)) {
    if (typeof val === 'boolean') result[key] = val
  }
  return result
}

function isUniverseFrame(value: unknown): value is SaveData['state']['universeStack'][number] {
  return isRecord(value)
    && typeof value.scriptId === 'string'
    && typeof value.sceneId === 'string'
    && typeof value.returnScene === 'string'
}
