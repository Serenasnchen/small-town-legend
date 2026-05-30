import React, { useState } from 'react'
import { useGameStore } from '../store/gameStore'

export const DevPanel: React.FC = () => {
  const [open, setOpen] = useState(false)
  const {
    currentScriptId,
    currentSceneId,
    currentScript,
    metrics,
    eventLog,
    flags,
    collectedFragments,
    agents,
    triggeredEvents,
    assetManifest,
    jumpToScene,
    resetGame,
    initGame,
  } = useGameStore()

  const scenes = currentScript?.scenes || []
  const currentScene = scenes.find(s => s.id === currentSceneId)

  const assetInfo = (() => {
    if (!currentScene) return null
    const assets: { key: string; id: string | undefined; status?: string; missing?: boolean }[] = [
      { key: 'background', id: currentScene.background },
      { key: 'character', id: currentScene.character },
      { key: 'music', id: currentScene.music },
      ...(currentScene.effects || []).map((id, i) => ({ key: `effect[${i}]`, id })),
    ]
    return assets.map(a => {
      if (!a.id) return { ...a, missing: true }
      const found =
        assetManifest?.backgrounds?.[a.id] ||
        assetManifest?.characters?.[a.id] ||
        assetManifest?.effects?.[a.id] ||
        assetManifest?.audio?.[a.id] ||
        assetManifest?.ui?.[a.id]
      return { ...a, status: found?.status || 'not-in-manifest', missing: !found }
    })
  })()

  if (!open) {
    return (
      <button className="dev-panel-toggle" onClick={() => setOpen(true)}>
        Dev
      </button>
    )
  }

  return (
    <div className="dev-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0 }}>DevPanel</h4>
        <button className="dev-btn" onClick={() => setOpen(false)}>关闭</button>
      </div>

      {/* Scene Info */}
      <div className="dev-section">
        <h4>场景</h4>
        <div className="dev-row">
          <span className="dev-label">Script</span>
          <span className="dev-value">{currentScriptId}</span>
        </div>
        <div className="dev-row">
          <span className="dev-label">Scene</span>
          <span className="dev-value">{currentSceneId}</span>
        </div>
        <div className="dev-row">
          <span className="dev-label">Type</span>
          <span className="dev-value">{currentScene?.type || '-'}</span>
        </div>
        <select
          className="dev-select"
          value={currentSceneId}
          onChange={e => jumpToScene(e.target.value)}
        >
          {scenes.map(s => (
            <option key={s.id} value={s.id}>{s.id} ({s.type})</option>
          ))}
        </select>
      </div>

      {/* Asset Usage */}
      {assetInfo && assetInfo.length > 0 && (
        <div className="dev-section">
          <h4>当前场景资产</h4>
          {assetInfo.map(a => (
            <div className="dev-row" key={a.key}>
              <span className="dev-label">{a.key}</span>
              <span className="dev-value">
                {a.id ? (
                  <>
                    {a.id}
                    {a.missing ? (
                      <span style={{ color: '#ff4444', marginLeft: 6 }}>⚠ 未注册</span>
                    ) : a.status !== 'final' ? (
                      <span style={{ color: '#ffaa00', marginLeft: 6 }}>[{a.status}]</span>
                    ) : (
                      <span style={{ color: '#44ff44', marginLeft: 6 }}>[final]</span>
                    )}
                  </>
                ) : (
                  <span style={{ color: '#888' }}>-</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Metrics */}
      <div className="dev-section">
        <h4>四维指标</h4>
        {Object.entries(metrics).map(([key, val]) => (
          <div className="dev-row" key={key}>
            <span className="dev-label">{key}</span>
            <span className="dev-value">{val}</span>
          </div>
        ))}
      </div>

      {/* Flags */}
      <div className="dev-section">
        <h4>Flags</h4>
        {Object.keys(flags).length === 0 ? (
          <div className="dev-value">无</div>
        ) : (
          Object.entries(flags).map(([k, v]) => (
            <div className="dev-row" key={k}>
              <span className="dev-label">{k}</span>
              <span className="dev-value">{v ? 'true' : 'false'}</span>
            </div>
          ))
        )}
      </div>

      {/* Fragments */}
      <div className="dev-section">
        <h4>Fragments</h4>
        {Object.keys(collectedFragments).length === 0 ? (
          <div className="dev-value">无</div>
        ) : (
          Object.entries(collectedFragments).map(([k, v]) => (
            <div className="dev-row" key={k}>
              <span className="dev-label">{k}</span>
              <span className="dev-value">{v ? '✓' : '✗'}</span>
            </div>
          ))
        )}
      </div>

      {/* Event Log */}
      <div className="dev-section">
        <h4>Event Log ({eventLog.length})</h4>
        <div className="dev-log">
          {eventLog.slice(-20).map((e, i) => (
            <div key={i} className="dev-log-item">{e}</div>
          ))}
        </div>
      </div>

      {/* Agents */}
      <div className="dev-section">
        <h4>Agents</h4>
        {Object.entries(agents).map(([id, a]) => (
          <div key={id} style={{ marginBottom: 8 }}>
            <div className="dev-row">
              <span className="dev-label">{a.name}</span>
              <span className="dev-value">{a.debugSignals?.stance || 'neutral'} T:{a.debugSignals?.trustHint ?? '-'} A:{a.debugSignals?.affinityHint ?? '-'}</span>
            </div>
            <div className="dev-log-item">view: {a.currentView}</div>
            <div className="dev-log-item">tone: {a.emotionalTone}</div>
            <div className="dev-log-item">reflection: {a.reflection?.summary || '无'}</div>
            <div className="dev-log-item">memories: {a.memoryStream.length}</div>
          </div>
        ))}
      </div>

      {/* Triggered Events */}
      <div className="dev-section">
        <h4>Triggered</h4>
        {Object.keys(triggeredEvents).length === 0 ? (
          <div className="dev-value">无</div>
        ) : (
          Object.keys(triggeredEvents).map(k => (
            <div key={k} className="dev-log-item">{k}</div>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="dev-section">
        <h4>操作</h4>
        <button className="dev-btn" onClick={resetGame}>Reset Save</button>
        <button className="dev-btn" onClick={initGame}>Reload Scripts</button>
      </div>
    </div>
  )
}
