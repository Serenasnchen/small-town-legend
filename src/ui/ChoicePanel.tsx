import React from 'react'
import { useGameStore } from '../store/gameStore'
import { resolveChoiceOptions } from '../engine/choiceResolver'
import { getSceneText } from '../engine/sceneRunner'

export const ChoicePanel: React.FC = () => {
  const { currentScene, metrics, flags, eventLog, agents, collectedFragments, makeChoice } = useGameStore()

  if (!currentScene || currentScene.type !== 'choice' || !currentScene.choices) {
    return null
  }

  const options = resolveChoiceOptions(currentScene.choices, metrics, flags, eventLog)
  const promptText = getSceneText(currentScene, {
    metrics,
    eventLog,
    flags,
    agents,
    collectedFragments,
  }) || '做出你的选择：'

  return (
    <div className="choice-panel">
      <div className="choice-prompt">
        {promptText}
      </div>
      <div className="choice-options">
        {options.map((option, idx) => (
          <button
            key={option.id}
            className={`choice-option ${!option.available ? 'disabled' : ''}`}
            onClick={() => option.available && makeChoice(idx)}
            disabled={!option.available}
          >
            <div>{option.text}</div>
            {option.hint && option.available && (
              <div className="choice-hint">{option.hint}</div>
            )}
            {option.mirrorCost && (
              <div className="choice-cost">{option.mirrorCost}</div>
            )}
            {!option.available && option.hint && (
              <div className="choice-hint">[不可用] {option.hint}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
