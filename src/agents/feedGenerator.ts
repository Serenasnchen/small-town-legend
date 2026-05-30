import type { AgentStateMVP } from '../types'
import { getAgentNarrativeLabel, getDominantNarrative } from './agentStateUpdater'

export interface FeedPost {
  id: string
  agentId: string
  agentName: string
  role: string
  narrativeLabel: string
  emotionalTone: string
  text: string
  timestamp: string
}

export function generateFeedPosts(
  agents: Record<string, AgentStateMVP>,
  eventLog: string[]
): FeedPost[] {
  const posts: FeedPost[] = []
  const latestEvents = eventLog.slice(-3)
  const latestEventKey = latestEvents[latestEvents.length - 1] || 'initial'

  for (const [agentId, agent] of Object.entries(agents)) {
    let text = agent.feedVoice || agent.currentView || '还在观察这件事会如何被解释。'
    if (latestEvents.length > 0) {
      const eventRef = latestEvents[latestEvents.length - 1]
      if (!text.includes(eventRef)) {
        text = `${text}（他把这件事和 ${eventRef.replace(/_/g, ' ')} 联系在一起。）`
      }
    }

    posts.push({
      id: `post_${agentId}_${latestEventKey}_${agent.memoryStream.length}`,
      agentId,
      agentName: agent.name,
      role: agent.role,
      narrativeLabel: getAgentNarrativeLabel(agent),
      emotionalTone: agent.emotionalTone,
      text,
      timestamp: latestEventKey,
    })
  }

  const labelOrder: Record<string, number> = { 施压: 0, 摇摆: 1, 靠近: 2, 观望: 3 }
  posts.sort((a, b) => {
    return labelOrder[a.narrativeLabel] - labelOrder[b.narrativeLabel]
  })

  return posts
}

export function generateFeedSummary(agents: Record<string, AgentStateMVP>): {
  dominantNarrative: string
  supportive: number
  skeptical: number
  hostile: number
  neutral: number
} {
  const counts: Record<string, number> = { 靠近: 0, 摇摆: 0, 施压: 0, 观望: 0 }
  for (const agent of Object.values(agents)) {
    const label = getAgentNarrativeLabel(agent)
    counts[label] = (counts[label] || 0) + 1
  }

  return {
    dominantNarrative: getDominantNarrative(agents),
    supportive: counts.靠近,
    skeptical: counts.摇摆,
    hostile: counts.施压,
    neutral: counts.观望,
  }
}
