import React, { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { VisualNovelView } from './ui/VisualNovelView'
import { ChoicePanel } from './ui/ChoicePanel'
import { FeedView } from './ui/FeedView'
import { MirrorCorridor } from './ui/MirrorCorridor'
import { DevPanel } from './ui/DevPanel'

const App: React.FC = () => {
  const { initGame, currentScene, returnFromUniverse, collectFragment } = useGameStore()

  useEffect(() => {
    initGame()
  }, [initGame])

  // Handle ending scenes: collect fragment and return
  useEffect(() => {
    if (currentScene?.type === 'ending' && currentScene.universeId) {
      collectFragment(currentScene.universeId)
      const timer = setTimeout(() => {
        returnFromUniverse()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [currentScene, collectFragment, returnFromUniverse])

  if (!currentScene) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark)',
        color: 'var(--text-primary)',
      }}>
        加载中...
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Main scene renderer */}
      {currentScene.type === 'feed' ? (
        <FeedView />
      ) : currentScene.type === 'mirror' ? (
        <MirrorCorridor />
      ) : currentScene.type === 'ending' ? (
        <EndingView />
      ) : (
        <>
          <VisualNovelView />
          {currentScene.type === 'choice' && <ChoicePanel />}
        </>
      )}

      <DevPanel />
    </div>
  )
}

const EndingView: React.FC = () => {
  const { currentScene } = useGameStore()

  const text = typeof currentScene?.text === 'string'
    ? currentScene.text
    : currentScene?.text?.find(t => t.default)?.value || ''

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-mirror)',
      padding: 40,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.5rem', color: 'var(--accent)', marginBottom: 24 }}>
        宇宙终章
      </div>
      <div style={{ fontSize: '1.1rem', maxWidth: 600, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
      <div style={{ marginTop: 32, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        3秒后返回镜中走廊...
      </div>
    </div>
  )
}

export default App
