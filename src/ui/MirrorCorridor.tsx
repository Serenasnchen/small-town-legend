import React from 'react'
import { useGameStore } from '../store/gameStore'

interface UniverseInfo {
  id: string
  name: string
  description: string
  available: boolean
}

const UNIVERSES: UniverseInfo[] = [
  { id: 'universe-engineer', name: '工程师宇宙', description: '稳定人生，音乐缺席', available: true },
  { id: 'universe-fast-star', name: '快消明星宇宙', description: '提前开花，人设消耗', available: true },
  { id: 'universe-no-foundation', name: '无地基宇宙', description: '没有兄弟的共同体', available: true },
  { id: 'universe-silent-captain', name: '沉默队长宇宙', description: '退居幕后，兄弟裂缝', available: true },
]

export const MirrorCorridor: React.FC = () => {
  const { collectedFragments, enterUniverse, currentScene } = useGameStore()

  if (!currentScene || currentScene.type !== 'mirror') return null

  const handleEnterUniverse = async (universeId: string) => {
    const returnScene = currentScene.nextScene || 'act3_xiamen_opening'
    await enterUniverse(universeId, returnScene)
  }

  return (
    <div className="mirror-corridor">
      <div className="mirror-title">镜中走廊</div>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center' }}>
        每一块碎片都是一个差一点成为的你
      </div>

      <div className="mirror-fragments">
        {UNIVERSES.map(u => {
          const collected = collectedFragments[u.id] || false
          return (
            <div
              key={u.id}
              className={`mirror-fragment ${collected ? 'collected' : ''} ${!u.available ? 'locked' : ''}`}
              onClick={() => u.available && handleEnterUniverse(u.id)}
            >
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>
                {collected ? '✦' : '◆'}
              </div>
              <div className="mirror-fragment-name">{u.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {u.description}
              </div>
              {collected && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: 8 }}>
                  已收集
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 32, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        已收集碎片: {Object.values(collectedFragments).filter(Boolean).length} / {UNIVERSES.length}
      </div>
    </div>
  )
}
