import type { AgentStateMVP, MemoryEntry } from '../types'

export function retrieveRelevantMemories(
  agent: AgentStateMVP,
  semanticLabels: string[],
  limit = 5
): MemoryEntry[] {
  const now = Date.now()

  return [...agent.memoryStream]
    .map(memory => {
      const relevance = memory.semanticLabels.some(label => semanticLabels.includes(label)) ? 3 : 0
      const recency = Math.max(0, 3 - Math.floor((now - memory.createdAt) / 86_400_000))
      const importance = memory.importance / 3
      return { memory, score: relevance + recency + importance }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.memory)
}
