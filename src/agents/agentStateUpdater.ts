import type { AgentStateMVP } from '../types'
import { assembleAgentPrompt } from './promptAssembler'
import { fallbackAgentUpdate } from './templateFallback'

export function updateAgentsFromEvent(
  agents: Record<string, AgentStateMVP>,
  semanticLabels: string[],
  eventLog: string[],
  eventDescription: string
): Record<string, AgentStateMVP> {
  const result: Record<string, AgentStateMVP> = {}

  for (const [agentId, agent] of Object.entries(agents)) {
    const promptInput = assembleAgentPrompt(agent, semanticLabels, eventLog, eventDescription)
    const update = fallbackAgentUpdate(agent, promptInput)
    const nextMemoryStream = update.newMemory
      ? [...agent.memoryStream.slice(-11), update.newMemory]
      : agent.memoryStream

    result[agentId] = {
      ...agent,
      currentView: update.updatedCurrentView,
      emotionalTone: update.emotionalTone,
      recentMood: update.recentMood,
      memoryStream: nextMemoryStream,
      reflection: update.reflection,
      feedVoice: update.feedPost,
      debugSignals: update.debugSignals,
    }
  }

  return result
}

export function getAgentStanceLabel(stance: string | undefined): string {
  const map: Record<string, string> = {
    supportive: '支持',
    skeptical: '审慎',
    hostile: '质疑',
    conflicted: '矛盾',
    neutral: '观望',
  }
  return stance ? map[stance] || '观望' : '观望'
}

export function getAgentNarrativeLabel(agent: AgentStateMVP): string {
  const text = `${agent.currentView} ${agent.emotionalTone} ${agent.recentMood} ${agent.reflection?.summary || ''}`
  if (/支持|相信|认可|松了一口气|回到作品|没有丢掉/.test(text)) return '靠近'
  if (/质疑|怀疑|攻击|裂缝|热搜|包装|表演/.test(text)) return '施压'
  if (/矛盾|担心|不服|观望|保留/.test(text)) return '摇摆'
  return '观望'
}

export function getDominantNarrative(agents: Record<string, AgentStateMVP>): string {
  const tones = Object.values(agents).map(getAgentNarrativeLabel)
  const counts: Record<string, number> = {}
  for (const tone of tones) {
    counts[tone] = (counts[tone] || 0) + 1
  }

  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]

  const narratives: Record<string, string> = {
    靠近: '舆论正在把这次选择解释成一种回到作品和真实的姿态',
    施压: '质疑正在寻找可放大的裂缝，事件意义被重新争夺',
    摇摆: '支持和怀疑同时存在，世界还没有给出稳定解释',
    观望: '舆论场还在等待下一次选择来解释阿森',
  }

  return narratives[dominant || '观望']
}
