/**
 * LLM Prompt Contracts - Type definitions for future LLM integration.
 * No actual LLM calls are made in this MVP version.
 * All outputs fall back to deterministic templates.
 */

import type { AgentStateMVP, MemoryEntry, PromptContract, RelationshipEntry } from '../types'

// ===== Feed Post Generation =====

export interface FeedPromptInput {
  agentId: string
  agentState: AgentStateMVP
  eventLabels: string[]
  recentEvents: string[]
  chapterContext: string
}

export interface FeedPromptOutput {
  postText: string
  updatedCurrentView: string
  emotionalTone: string
  significance: 'none' | 'minor' | 'moderate' | 'major'
}

export const feedPostContract: PromptContract = {
  name: 'feed_post_generation',
  inputSchema: {
    type: 'object',
    properties: {
      agentId: { type: 'string' },
      agentState: { type: 'object' },
      eventLabels: { type: 'array', items: { type: 'string' } },
      recentEvents: { type: 'array', items: { type: 'string' } },
      chapterContext: { type: 'string' },
    },
  },
  outputSchema: {
    type: 'object',
    properties: {
      postText: { type: 'string' },
      updatedCurrentView: { type: 'string' },
      emotionalTone: { type: 'string' },
      significance: { type: 'string', enum: ['none', 'minor', 'moderate', 'major'] },
    },
  },
  fallbackTemplate: (input: Record<string, unknown>) => {
    const state = (input.agentState as AgentStateMVP)
    const labels = (input.eventLabels as string[]) || []
    return `[${state.name}] ${state.feedVoice || state.currentView || '保持关注'} (${labels.join(', ')})`
  },
}

// ===== Agent Reflection =====

export interface ReflectionPromptInput {
  agentId: string
  memoryStream: MemoryEntry[]
  currentView: string
  relationshipContext: RelationshipEntry[]
}

export interface ReflectionPromptOutput {
  newView: string
  newReflection: string
  relationshipChanges: Record<string, string>
}

export const reflectionContract: PromptContract = {
  name: 'agent_reflection',
  inputSchema: {
    type: 'object',
    properties: {
      agentId: { type: 'string' },
      memoryStream: { type: 'array', items: { type: 'object' } },
      currentView: { type: 'string' },
      relationshipContext: { type: 'array', items: { type: 'object' } },
    },
  },
  outputSchema: {
    type: 'object',
    properties: {
      newView: { type: 'string' },
      newReflection: { type: 'string' },
      relationshipChanges: { type: 'object' },
    },
  },
  fallbackTemplate: () => 'Agent reflection requires LLM. Using cached state.',
}

// ===== Narrative Patch / Conditional Text =====

export interface NarrativePatchInput {
  sceneId: string
  originalText: string
  eventLog: string[]
  agentStates: Record<string, AgentStateMVP>
  metrics: Record<string, number>
}

export interface NarrativePatchOutput {
  patchedText: string
  patchType: 'conditional_text' | 'atmosphere_patch' | 'none'
  reason: string
}

export const narrativePatchContract: PromptContract = {
  name: 'narrative_patch',
  inputSchema: {
    type: 'object',
    properties: {
      sceneId: { type: 'string' },
      originalText: { type: 'string' },
      eventLog: { type: 'array', items: { type: 'string' } },
      agentStates: { type: 'object' },
      metrics: { type: 'object' },
    },
  },
  outputSchema: {
    type: 'object',
    properties: {
      patchedText: { type: 'string' },
      patchType: { type: 'string', enum: ['conditional_text', 'atmosphere_patch', 'none'] },
      reason: { type: 'string' },
    },
  },
  fallbackTemplate: (input: Record<string, unknown>) => (input.originalText as string) || '',
}

// ===== Short Monologue =====

export interface MonologuePromptInput {
  character: string
  emotion: string
  context: string
  eventLog: string[]
}

export const monologueContract: PromptContract = {
  name: 'short_monologue',
  inputSchema: {
    type: 'object',
    properties: {
      character: { type: 'string' },
      emotion: { type: 'string' },
      context: { type: 'string' },
      eventLog: { type: 'array', items: { type: 'string' } },
    },
  },
  outputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string' },
      length: { type: 'number' },
    },
  },
  fallbackTemplate: (input: Record<string, unknown>) => {
    const character = input.character as string
    const emotion = input.emotion as string
    return `${character} (${emotion}): ...`
  },
}

// ===== Export all contracts =====

export const PROMPT_CONTRACTS: PromptContract[] = [
  feedPostContract,
  reflectionContract,
  narrativePatchContract,
  monologueContract,
]
