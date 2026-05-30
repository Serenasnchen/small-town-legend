import React, { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { generateFeedPosts, generateFeedSummary } from '../agents/feedGenerator'
import { getAgentNarrativeLabel } from '../agents/agentStateUpdater'

export const FeedView: React.FC = () => {
  const { agents, eventLog, goToScene, currentScene } = useGameStore()
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  if (!currentScene || currentScene.type !== 'feed') return null

  const posts = generateFeedPosts(agents, eventLog)
  const summary = generateFeedSummary(agents)

  const handleContinue = () => {
    if (currentScene.nextScene) {
      goToScene(currentScene.nextScene)
    }
  }

  return (
    <div className="feed-page">
      <div className="feed-header">
        <h2>舆论场</h2>
        <div className="feed-wind">{summary.dominantNarrative}</div>
      </div>

      <div className="feed-agents">
        {Object.entries(agents).map(([id, agent]) => (
          <div
            key={id}
            className={`feed-agent-card ${getNarrativeClass(getAgentNarrativeLabel(agent))}`}
            onClick={() => setSelectedAgent(selectedAgent === id ? null : id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="feed-agent-name">{agent.name}</div>
            <div className="feed-agent-role">{agent.role} · {getAgentNarrativeLabel(agent)}</div>
            <div className="feed-agent-status">{agent.currentView || agent.feedVoice || '观望中'}</div>
          </div>
        ))}
      </div>

      {selectedAgent && agents[selectedAgent] && (
        <div className="feed-post" style={{ border: '1px solid var(--accent)', marginBottom: 16 }}>
          <div className="feed-post-author">{agents[selectedAgent].name}</div>
          <div className="feed-post-text">
            <div>当前理解：{agents[selectedAgent].currentView}</div>
            <div>情绪语气：{agents[selectedAgent].emotionalTone}</div>
            <div>反思：{agents[selectedAgent].reflection?.summary || '还没有形成稳定反思'}</div>
            <div>记忆：{agents[selectedAgent].memoryStream.slice(-3).map(m => m.summary).join(' / ') || '无'}</div>
          </div>
        </div>
      )}

      <div className="feed-posts">
        {posts.map(post => (
          <div key={post.id} className="feed-post">
            <div className="feed-post-author">{post.agentName} · {post.narrativeLabel} · {post.emotionalTone}</div>
            <div className="feed-post-text">{post.text}</div>
          </div>
        ))}
      </div>

      <div className="feed-actions">
        <button className="feed-action-btn" onClick={handleContinue}>
          继续
        </button>
      </div>
    </div>
  )
}

function getNarrativeClass(label: string): string {
  const map: Record<string, string> = {
    靠近: 'supportive',
    摇摆: 'conflicted',
    施压: 'hostile',
    观望: 'neutral',
  }
  return map[label] || 'neutral'
}
