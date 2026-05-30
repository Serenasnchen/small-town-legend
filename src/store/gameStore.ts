import { create } from 'zustand'
import type {
  GameState,
  GameMetrics,
  AgentStateMVP,
  SceneNode,
  ScriptData,
  AssetManifest,
} from '../types'
import { loadScript } from '../engine/scriptLoader'
import { saveToStorage, loadFromStorage, resetStorage } from '../engine/saveSystem'
import { updateAgentsFromEvent } from '../agents/agentStateUpdater'

interface GameStore extends GameState {
  // Scene & Script
  currentScript: ScriptData | null
  currentScene: SceneNode | null
  scripts: Record<string, ScriptData>
  assetManifest: AssetManifest | null

  // Actions
  initGame: () => Promise<void>
  loadScript: (scriptId: string) => Promise<void>
  goToScene: (sceneId: string) => void
  advanceScene: () => void
  makeChoice: (choiceIndex: number) => void
  enterUniverse: (universeId: string, returnScene: string) => Promise<void>
  returnFromUniverse: () => void
  collectFragment: (fragmentId: string) => void
  triggerEvent: (eventId: string) => void
  setFlag: (flag: string, value: boolean) => void
  updateMetrics: (delta: Partial<GameMetrics>) => void
  resetGame: () => void
  jumpToScene: (sceneId: string) => void
}

const INITIAL_METRICS: GameMetrics = {
  tech: 50,
  vision: 50,
  brother: 50,
  opinion: 50,
  publicPressure: 30,
}

function createInitialState(): GameState {
  return {
    currentScriptId: 'main',
    currentSceneId: 'act0_stadium_opening',
    universeStack: [],
    metrics: { ...INITIAL_METRICS },
    eventLog: [],
    flags: {},
    collectedFragments: {},
    agents: {},
    triggeredEvents: {},
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),
  currentScript: null,
  currentScene: null,
  scripts: {},
  assetManifest: null,

  initGame: async () => {
    const saved = loadFromStorage()

    // Load asset manifest
    try {
      const manifestRes = await fetch('/data/asset-manifest.json')
      if (manifestRes.ok) {
        const manifest = await manifestRes.json() as AssetManifest
        set({ assetManifest: manifest })
      }
    } catch {
      // asset manifest is optional in dev
    }

    // Load agent states
    try {
      const agentRes = await fetch('/data/agent-states-mvp.json')
      if (agentRes.ok) {
        const agentData = await agentRes.json() as Record<string, AgentStateMVP>
        set({ agents: agentData })
      }
    } catch {
      // agents loaded later
    }

    if (saved) {
      const currentAgents = get().agents
      set({
        ...saved.state,
        agents: normalizeSavedAgents(saved.state.agents, currentAgents),
        currentScript: null,
        currentScene: null,
        scripts: {},
        assetManifest: get().assetManifest,
      })
      await get().loadScript(saved.state.currentScriptId)
      get().goToScene(saved.state.currentSceneId)
    } else {
      await get().loadScript('main')
      get().goToScene('act0_stadium_opening')
    }
  },

  loadScript: async (scriptId: string) => {
    const store = get()
    if (store.scripts[scriptId]) {
      set({
        currentScript: store.scripts[scriptId],
        currentScriptId: scriptId,
      })
      return
    }

    try {
      const script = await loadScript(scriptId)
      set({
        currentScript: script,
        currentScriptId: scriptId,
        scripts: { ...store.scripts, [scriptId]: script },
      })
    } catch (err) {
      console.error('Failed to load script:', scriptId, err)
      // Fallback: create empty script
      set({
        currentScript: { id: scriptId, scenes: [] },
        currentScriptId: scriptId,
      })
    }
  },

  goToScene: (sceneId: string) => {
    const { currentScript } = get()
    if (!currentScript) return

    const scene = currentScript.scenes.find(s => s.id === sceneId)
    if (!scene) {
      console.warn('Scene not found:', sceneId)
      return
    }

    set({ currentScene: scene, currentSceneId: sceneId })
    saveToStorage({ state: toSerializableGameState(get()) })
  },

  advanceScene: () => {
    const { currentScene } = get()
    if (!currentScene) return

    if (currentScene.type === 'choice' || currentScene.type === 'feed' || currentScene.type === 'mirror') {
      return // These require explicit interaction
    }

    const nextId = currentScene.nextScene
    if (nextId) {
      get().goToScene(nextId)
    }
  },

  makeChoice: (choiceIndex: number) => {
    const { currentScene, metrics, eventLog, agents } = get()
    if (!currentScene || !currentScene.choices) return

    const choice = currentScene.choices[choiceIndex]
    if (!choice) return

    // Apply metric impact
    const newMetrics = { ...metrics }
    if (choice.metricImpact) {
      Object.entries(choice.metricImpact).forEach(([key, delta]) => {
        const k = key as keyof GameMetrics
        newMetrics[k] = Math.max(0, Math.min(100, (newMetrics[k] || 50) + (delta || 0)))
      })
    }

    // Add to event log
    const newEventLog = [...eventLog, ...(choice.eventLog || []), `choice:${choice.id}`]

    // Update agents based on semantic labels
    let newAgents = { ...agents }
    if (choice.semanticLabels && choice.semanticLabels.length > 0) {
      newAgents = updateAgentsFromEvent(
        newAgents,
        choice.semanticLabels,
        newEventLog,
        choice.eventLog?.join(' / ') || choice.text
      )
    }

    set({
      metrics: newMetrics,
      eventLog: newEventLog,
      agents: newAgents,
    })

    // Navigate
    if (choice.nextScene) {
      get().goToScene(choice.nextScene)
    }
  },

  enterUniverse: async (universeId: string, returnScene: string) => {
    const { universeStack, currentScriptId, currentSceneId } = get()
    const newStack = [...universeStack, {
      scriptId: currentScriptId,
      sceneId: currentSceneId,
      returnScene,
    }]

    set({ universeStack: newStack })
    await get().loadScript(universeId)
    const script = get().scripts[universeId]
    if (script && script.scenes.length > 0) {
      get().goToScene(script.scenes[0].id)
    }
  },

  returnFromUniverse: () => {
    const { universeStack } = get()
    if (universeStack.length === 0) return

    const newStack = [...universeStack]
    const frame = newStack.pop()!

    set({ universeStack: newStack })
    get().loadScript(frame.scriptId).then(() => {
      get().goToScene(frame.returnScene)
    })
  },

  collectFragment: (fragmentId: string) => {
    const { collectedFragments } = get()
    set({
      collectedFragments: { ...collectedFragments, [fragmentId]: true },
    })
  },

  triggerEvent: (eventId: string) => {
    const { triggeredEvents } = get()
    set({ triggeredEvents: { ...triggeredEvents, [eventId]: true } })
  },

  setFlag: (flag: string, value: boolean) => {
    const { flags } = get()
    set({ flags: { ...flags, [flag]: value } })
  },

  updateMetrics: (delta: Partial<GameMetrics>) => {
    const { metrics } = get()
    const newMetrics = { ...metrics }
    Object.entries(delta).forEach(([key, val]) => {
      const k = key as keyof GameMetrics
      newMetrics[k] = Math.max(0, Math.min(100, (newMetrics[k] || 50) + (val || 0)))
    })
    set({ metrics: newMetrics })
  },

  resetGame: () => {
    resetStorage()
    const fresh = createInitialState()
    set({
      ...fresh,
      currentScript: null,
      currentScene: null,
      scripts: {},
    })
    get().initGame()
  },

  jumpToScene: (sceneId: string) => {
    get().goToScene(sceneId)
  },
}))

function normalizeSavedAgents(
  savedAgents: Record<string, AgentStateMVP> | undefined,
  defaults: Record<string, AgentStateMVP>
): Record<string, AgentStateMVP> {
  const normalized: Record<string, AgentStateMVP> = {}

  for (const [id, fallback] of Object.entries(defaults)) {
    const saved = savedAgents?.[id]
    if (saved?.identity && saved.memoryStream) {
      normalized[id] = saved
      continue
    }
    normalized[id] = fallback
  }

  return normalized
}

function toSerializableGameState(store: GameStore): GameState {
  return {
    currentScriptId: store.currentScriptId,
    currentSceneId: store.currentSceneId,
    universeStack: store.universeStack,
    metrics: store.metrics,
    eventLog: store.eventLog,
    flags: store.flags,
    collectedFragments: store.collectedFragments,
    agents: store.agents,
    triggeredEvents: store.triggeredEvents,
  }
}
