import type { AgentStateMVP, PromptAssembledInput, RelationshipEntry } from '../types'
import { retrieveRelevantMemories } from './memoryRetrieval'

export function assembleAgentPrompt(
  agent: AgentStateMVP,
  semanticLabels: string[],
  eventLog: string[],
  eventDescription: string
): PromptAssembledInput {
  const relationshipContext: RelationshipEntry[] = Object.values(agent.relationshipMap)

  return {
    agentId: agent.id,
    identityBlock: [
      `name: ${agent.name}`,
      `role: ${agent.role}`,
      `corePersonality: ${agent.identity.corePersonality}`,
      `speakingStyle: ${agent.identity.speakingStyle}`,
      `coreBeliefs: ${agent.identity.coreBeliefs.join(' / ')}`,
      `immutableTraits: ${agent.identity.immutableTraits}`,
      `currentView: ${agent.currentView}`,
      `emotionalTone: ${agent.emotionalTone}`,
      `recentMood: ${agent.recentMood}`,
    ].join('\n'),
    retrievedMemories: retrieveRelevantMemories(agent, semanticLabels),
    currentReflection: agent.reflection,
    relationshipContext,
    currentEvent: {
      description: eventDescription,
      semanticLabels,
      eventLog,
    },
    outputSchema: 'agent_update_v1',
  }
}
