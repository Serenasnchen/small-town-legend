import type { ScriptData } from '../types'

const SCRIPT_CACHE: Record<string, ScriptData> = {}

export async function loadScript(scriptId: string): Promise<ScriptData> {
  if (SCRIPT_CACHE[scriptId]) {
    return SCRIPT_CACHE[scriptId]
  }

  const res = await fetch(`/data/scripts/${scriptId}.json`)
  if (!res.ok) {
    throw new Error(`Failed to load script: ${scriptId} (${res.status})`)
  }

  const data = (await res.json()) as ScriptData

  // Validate basic structure
  if (!data.id || !Array.isArray(data.scenes)) {
    throw new Error(`Invalid script format: ${scriptId}`)
  }

  SCRIPT_CACHE[scriptId] = data
  return data
}

export function clearScriptCache(): void {
  Object.keys(SCRIPT_CACHE).forEach(key => delete SCRIPT_CACHE[key])
}

export function getCachedScript(scriptId: string): ScriptData | undefined {
  return SCRIPT_CACHE[scriptId]
}
