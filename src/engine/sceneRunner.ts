import type { SceneNode, ScriptData, GameState } from '../types'
import { evaluateCondition } from './conditionEvaluator'

export function findScene(script: ScriptData, sceneId: string): SceneNode | undefined {
  return script.scenes.find(s => s.id === sceneId)
}

export function getSceneText(
  scene: SceneNode,
  state: Pick<GameState, 'metrics' | 'eventLog' | 'flags' | 'agents' | 'collectedFragments'>
): string {
  if (!scene.text) return ''

  if (typeof scene.text === 'string') {
    return scene.text
  }

  // ConditionalText array
  for (const item of scene.text) {
    if (item.default) continue
    if (item.condition && evaluateCondition(item.condition, state)) {
      return item.value
    }
  }

  // Return default or last item
  const defaultItem = scene.text.find(t => t.default)
  if (defaultItem) return defaultItem.value
  return scene.text[scene.text.length - 1]?.value || ''
}

export function getAllSceneIds(script: ScriptData): string[] {
  return script.scenes.map(s => s.id)
}

export function validateScriptConnections(script: ScriptData): string[] {
  const errors: string[] = []
  const sceneIds = new Set(getAllSceneIds(script))

  for (const scene of script.scenes) {
    if (scene.nextScene && !sceneIds.has(scene.nextScene)) {
      errors.push(`Scene "${scene.id}" references missing nextScene: "${scene.nextScene}"`)
    }
    if (scene.choices) {
      for (const choice of scene.choices) {
        if (!sceneIds.has(choice.nextScene)) {
          errors.push(`Choice "${choice.id}" in scene "${scene.id}" references missing nextScene: "${choice.nextScene}"`)
        }
      }
    }
  }

  return errors
}
