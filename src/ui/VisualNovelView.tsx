import React from 'react'
import { useGameStore } from '../store/gameStore'
import { getSceneText } from '../engine/sceneRunner'

export const VisualNovelView: React.FC = () => {
  const { currentScene, assetManifest, advanceScene, metrics, eventLog, flags, agents, collectedFragments } = useGameStore()

  if (!currentScene) {
    return (
      <div className="vn-scene">
        <div className="vn-background placeholder">加载中...</div>
      </div>
    )
  }

  const sceneText = getSceneText(currentScene, {
    metrics,
    eventLog,
    flags,
    agents,
    collectedFragments,
  })

  const bgAsset = currentScene.background
    ? assetManifest?.backgrounds?.[currentScene.background]
    : null

  const charAsset = currentScene.character
    ? assetManifest?.characters?.[currentScene.character]
    : null

  return (
    <div className="vn-scene">
      {/* Background */}
      <div
        className={`vn-background ${!bgAsset ? 'placeholder' : ''}`}
        style={
          bgAsset?.status !== 'placeholder'
            ? { backgroundImage: `url(${bgAsset?.path})` }
            : undefined
        }
      >
        {!bgAsset && currentScene.background}
      </div>

      {/* Character */}
      {currentScene.character && (
        <div className="vn-character-layer">
          {charAsset && charAsset.status !== 'placeholder' ? (
            <img
              src={charAsset.path}
              alt={currentScene.character}
              className="vn-character"
            />
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              [{currentScene.character}{currentScene.expression ? ` · ${currentScene.expression}` : ''}]
            </div>
          )}
        </div>
      )}

      {/* Text */}
      <div className="vn-text-layer">
        {currentScene.speaker && (
          <div className="vn-speaker">{currentScene.speaker}</div>
        )}
        <div className={`vn-text ${currentScene.type === 'narration' ? 'vn-narration' : ''}`}>
          {sceneText}
        </div>
      </div>

      {/* Click area for advancing */}
      {currentScene.type !== 'choice' && currentScene.type !== 'feed' && currentScene.type !== 'mirror' && (
        <div className="vn-click-area" onClick={advanceScene} />
      )}
    </div>
  )
}
