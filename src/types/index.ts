// ===== 剧本类型 =====

export type SceneType =
  | 'dialogue'
  | 'narration'
  | 'choice'
  | 'feed'
  | 'mirror'
  | 'ending'
  | 'agent_event';

export interface ConditionalText {
  condition?: string;
  default?: boolean;
  value: string;
}

export interface ChoiceOption {
  id: string;
  text: string;
  hint?: string;
  nextScene: string;
  requirement?: string;
  metricImpact?: Partial<Record<'tech' | 'vision' | 'brother' | 'opinion' | 'publicPressure', number>>;
  semanticLabels?: string[];
  eventLog?: string[];
  mirrorCost?: string;
}

export interface SceneNode {
  id: string;
  type: SceneType;
  scriptId?: string;
  chapter?: string;
  speaker?: string;
  character?: string;
  expression?: string;
  background?: string;
  music?: string;
  text?: string | ConditionalText[];
  choices?: ChoiceOption[];
  nextScene?: string;
  universeId?: string;
  skeleton?: boolean;
  effects?: string[];
}

export interface ScriptData {
  id: string;
  scenes: SceneNode[];
}

// ===== 游戏状态类型 =====

export interface GameMetrics {
  tech: number;
  vision: number;
  brother: number;
  opinion: number;
  publicPressure: number;
}

export interface UniverseFrame {
  scriptId: string;
  sceneId: string;
  returnScene: string;
}

export interface GameState {
  currentScriptId: string;
  currentSceneId: string;
  universeStack: UniverseFrame[];
  metrics: GameMetrics;
  eventLog: string[];
  flags: Record<string, boolean>;
  collectedFragments: Record<string, boolean>;
  agents: Record<string, AgentStateMVP>;
  triggeredEvents: Record<string, boolean>;
}

export interface SaveData {
  version: number;
  timestamp: number;
  state: GameState;
}

// ===== Agent 类型 =====

export type AgentStance = 'supportive' | 'skeptical' | 'hostile' | 'conflicted' | 'neutral';

export interface MemoryEntry {
  id: string;
  summary: string;
  sourceEvent: string;
  semanticLabels: string[];
  importance: number;
  emotion: string;
  createdAt: number;
}

export interface Reflection {
  summary: string;
  reason: string;
  updatedAt: number;
}

export interface RelationshipEntry {
  targetId: string;
  view: string;
  tension?: string;
}

export interface AgentIdentity {
  corePersonality: string;
  speakingStyle: string;
  coreBeliefs: string[];
  immutableTraits: string;
}

export interface AgentDebugSignals {
  stance?: AgentStance;
  trustHint?: number;
  affinityHint?: number;
}

export interface AgentStateMVP {
  id: string;
  name: string;
  role: string;
  identity: AgentIdentity;
  currentView: string;
  emotionalTone: string;
  recentMood: string;
  memoryStream: MemoryEntry[];
  reflection: Reflection | null;
  relationshipMap: Record<string, RelationshipEntry>;
  feedVoice: string;
  debugSignals?: AgentDebugSignals;
}

export interface NarrativeHook {
  type:
    | 'conditional_text'
    | 'feed_post'
    | 'agent_event_candidate'
    | 'emergent_event_candidate'
    | 'parallel_epilogue'
    | 'atmosphere_patch';
  priority: 'low' | 'medium' | 'high';
  target?: string;
  text?: string;
  eventTag?: string;
  reason: string;
}

export interface ConditionalTextCandidate {
  sceneId?: string;
  conditionTag: string;
  text: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

export interface InterventionCandidate {
  eventTag: string;
  title: string;
  text: string;
  triggerReason: string;
  priority: 'low' | 'medium' | 'high';
}

export interface PromptAssembledInput {
  agentId: string;
  identityBlock: string;
  retrievedMemories: MemoryEntry[];
  currentReflection: Reflection | null;
  relationshipContext: RelationshipEntry[];
  currentEvent: {
    description: string;
    semanticLabels: string[];
    eventLog: string[];
  };
  outputSchema: 'agent_update_v1';
}

export interface AgentUpdateResult {
  updatedCurrentView: string;
  emotionalTone: string;
  recentMood: string;
  newMemory: MemoryEntry | null;
  reflection: Reflection | null;
  feedPost: string;
  conditionalTextCandidates: ConditionalTextCandidate[];
  interventionCandidate: InterventionCandidate | null;
  debugSignals?: AgentDebugSignals;
}

// ===== 资产类型 =====

export interface AssetRef {
  id: string;
  path: string;
  usage: string;
  status: 'placeholder' | 'concept' | 'candidate' | 'final';
  promptVersion?: string;
  safeTextArea?: { x: number; y: number; w: number; h: number };
}

export interface AssetManifest {
  backgrounds: Record<string, AssetRef>;
  characters: Record<string, AssetRef>;
  ui: Record<string, AssetRef>;
  effects: Record<string, AssetRef>;
  audio: Record<string, AssetRef>;
}

// ===== LLM 预留接口 =====

export interface PromptContract {
  name: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  fallbackTemplate: (input: Record<string, unknown>) => string;
}

export interface FeedPromptInput {
  agentId: string;
  agentState: AgentStateMVP;
  eventLabels: string[];
  recentEvents: string[];
}

export interface AgentReflectionInput {
  agentId: string;
  memoryStream: MemoryEntry[];
  currentView: string;
}

export interface NarrativePatchInput {
  sceneId: string;
  eventLog: string[];
  agentStates: Record<string, AgentStateMVP>;
}
