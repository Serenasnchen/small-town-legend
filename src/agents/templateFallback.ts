import type { AgentStateMVP, AgentDebugSignals, AgentUpdateResult, MemoryEntry, PromptAssembledInput } from '../types'

interface AgentInterpretation {
  view: string;
  tone: string;
  mood: string;
  feedPost: string;
  reflection: string;
  stance: AgentDebugSignals['stance'];
  trustShift: number;
  affinityShift: number;
  importance: number;
}

const POSITIVE_LABELS = new Set([
  'stayed_real',
  'answered_with_music',
  'answered_diss_with_music',
  'restrained_response',
  'protected_brother',
  'shared_credit',
  'repaired_trust',
  'remembered_hometown',
  'held_grandma_memory',
  'chose_long_term_music',
  'turned_hate_into_love',
])

const PRESSURE_LABELS = new Set([
  'fed_the_drama',
  'answered_publicly',
  'showed_wealth',
  'performed_authenticity',
  'chose_image_over_music',
  'hid_behind_persona',
  'mistook_pride_for_truth',
])

const WOUND_LABELS = new Set([
  'faced_mother_wound',
  'turned_hate_into_drive',
  'rejected_hometown',
  'abandoned_day1',
  'chose_alone',
  'feared_not_enough',
])

export function fallbackAgentUpdate(agent: AgentStateMVP, input: PromptAssembledInput): AgentUpdateResult {
  const labels = input.currentEvent.semanticLabels
  const interpretation = interpretEvent(agent, labels, input.currentEvent.description)
  const newMemory = createMemory(agent.id, input.currentEvent.description, labels, interpretation)
  const priorReflection = input.currentReflection?.summary
  const memoryEcho = input.retrievedMemories[0]?.summary
  const reflectionSummary = memoryEcho
    ? `${interpretation.reflection} 这也让 ${agent.name} 想起：${memoryEcho}`
    : interpretation.reflection

  return {
    updatedCurrentView: interpretation.view,
    emotionalTone: interpretation.tone,
    recentMood: interpretation.mood,
    newMemory,
    reflection: {
      summary: priorReflection
        ? `${reflectionSummary} 之前的判断没有消失，而是被这次事件重新解释。`
        : reflectionSummary,
      reason: `由 ${labels.join(', ') || '无标签事件'} 触发的 mock/fallback Agent 续写。`,
      updatedAt: Date.now(),
    },
    feedPost: interpretation.feedPost,
    conditionalTextCandidates: [],
    interventionCandidate: buildInterventionCandidate(agent, labels, interpretation),
    debugSignals: {
      stance: interpretation.stance,
      trustHint: clampHint((agent.debugSignals?.trustHint ?? 50) + interpretation.trustShift),
      affinityHint: clampHint((agent.debugSignals?.affinityHint ?? 50) + interpretation.affinityShift),
    },
  }
}

function buildInterventionCandidate(
  agent: AgentStateMVP,
  labels: string[],
  interpretation: AgentInterpretation
): AgentUpdateResult['interventionCandidate'] {
  if (interpretation.importance < 8) return null

  return {
    eventTag: `agent_intervention:${agent.id}:${labels.join('+') || 'unlabeled'}`,
    title: `${agent.name} 的舆论介入`,
    text: interpretation.feedPost,
    triggerReason: `fallback 根据高重要性事件生成，供后续 LLM provider 使用同一输出契约。`,
    priority: 'medium',
  }
}

function interpretEvent(agent: AgentStateMVP, labels: string[], eventDescription: string): AgentInterpretation {
  const positive = labels.some(label => POSITIVE_LABELS.has(label))
  const pressure = labels.some(label => PRESSURE_LABELS.has(label))
  const wound = labels.some(label => WOUND_LABELS.has(label))

  switch (agent.id) {
    case 'fan_berry':
      if (pressure) {
        return build('conflicted', -5, -4, '担心但还没放弃', '浆果开始害怕阿森正在把真实包装成别人容易转发的样子。', '我不是不信他了，我只是怕他越来越会把自己演得像自己。', '她仍想相信阿森，但第一次开始替自己的相信找证据。', 8)
      }
      if (positive || wound) {
        return build('supportive', 6, 6, '松了一口气', '浆果把这次选择理解成阿森还记得最初为什么写歌。', '我宁愿听他把话写进歌里，也不想看他在评论区赢。', '她相信阿森没有丢掉根，只是学会把疼藏进作品。', 7)
      }
      break
    case 'fan_echo':
      if (positive) return build('supportive', 7, 3, '冷静认可', '回声更愿意把阿森重新放回作品本身讨论。', '至少这一次，作品比人设更先开口。', '他判断阿森是否成立，仍然只看作品能不能独自站住。', 7)
      if (pressure) return build('skeptical', -5, -2, '保持距离', '回声开始怀疑阿森是否把音乐让位给了叙事包装。', '热闹不是作品，争议也不是作品。', '他担心阿森越来越懂传播，却越来越少让歌自己说话。', 7)
      break
    case 'hater_dark':
      if (positive) return build('conflicted', 2, -1, '暂时失手', '小黑发现这次不好直接攻击，只能转向翻旧账。', '这次算他聪明，但别急，旧账总会有。', '他不愿承认阿森做对了，只能寻找新的攻击角度。', 6)
      if (pressure) return build('hostile', -6, -5, '兴奋', '小黑觉得阿森终于给了他可以放大的裂缝。', '看吧，我早说这人迟早露出来。', '他把阿森的选择解释成自己长期质疑终于被验证。', 8)
      break
    case 'critic_lin':
      if (positive) return build('supportive', 5, 1, '审慎认可', '林老师开始把这次选择视作成熟表达，而不是情绪反击。', '这次回应有职业意识，值得继续观察。', '他认可阿森把冲突转译成作品的能力，但仍保留判断。', 7)
      if (pressure) return build('skeptical', -3, -1, '警惕', '林老师担心阿森正在用争议替代作品推进。', '表达可以锋利，但不能让噪音替你完成作品。', '他把这次事件记为一次需要后续作品证明的风险。', 6)
      break
    case 'gossip_z':
      if (pressure) return build('supportive', 3, 4, '活跃', '八卦Z只看见了可传播的冲突和热搜空间。', '这波有讨论度，后面就看他怎么接。', '它不关心阿森是否真实，只关心事件能不能被包装。', 6)
      if (positive) return build('neutral', -1, 0, '降温', '八卦Z觉得作品回应可传播，但爆点不够直接。', '用歌回应也行，不过标题得想想。', '它把作品也当成流量素材，而不是情感答案。', 5)
      break
    case 'passerby':
      if (positive) return build('supportive', 3, 2, '被说服一点', '路人甲暂时觉得阿森没有被舆论牵着走。', '不了解全部，但这次看起来还算稳。', '大众观感容易摇摆，但会被清晰姿态短暂稳定。', 5)
      if (pressure) return build('skeptical', -3, -2, '被带节奏', '路人甲开始用热搜标题理解阿森，而不是用作品。', '刷多了以后，感觉这事确实有点怪。', '他不是主动攻击者，但会被最响的解释推着走。', 5)
      break
    case 'peer_rival':
      if (positive) return build('conflicted', 3, -1, '不服但认可', '同行承认阿森这次处理有技术和格局，但竞争心更强。', 'respect，但这个位置我也想站。', '他越认可阿森，越不愿轻易服输。', 6)
      if (pressure) return build('hostile', -3, -3, '抓住机会', '同行把这次争议当作挑战阿森位置的窗口。', '他要是只剩话题，那这个位置也该换人坐。', '圈内竞争会把公共争议转化成位置争夺。', 6)
      break
    case 'elder_long':
      if (positive || wound) return build('supportive', 5, 2, '缓慢认可', '龙叔看见阿森没有只追眼前输赢，而是在找长期的站法。', '年轻人能忍住第一拳，不容易。', '他用十年尺度判断阿森，而不是用一晚热搜。', 7)
      if (pressure) return build('skeptical', -5, -2, '担心', '龙叔担心阿森被赢的姿态困住，忘了长期要靠作品留下。', '热闹会过去，歌会留下，也可能留不下。', '他不怕阿森被骂，怕阿森开始依赖被讨论。', 7)
      break
  }

  return build('neutral', 0, 0, '观望', `${agent.name} 暂时把这件事放进记忆，等待下一次选择来解释它。`, `${eventDescription}，先记着。`, '这次事件还不足以改变他的长期判断。', 4)
}

function build(
  stance: AgentDebugSignals['stance'],
  trustShift: number,
  affinityShift: number,
  mood: string,
  view: string,
  feedPost: string,
  reflection: string,
  importance: number
): AgentInterpretation {
  return {
    view,
    tone: mood,
    mood,
    feedPost,
    reflection,
    stance,
    trustShift,
    affinityShift,
    importance,
  }
}

function createMemory(
  agentId: string,
  description: string,
  semanticLabels: string[],
  interpretation: AgentInterpretation
): MemoryEntry {
  return {
    id: `${agentId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    summary: `${description}；${interpretation.view}`,
    sourceEvent: description,
    semanticLabels,
    importance: interpretation.importance,
    emotion: interpretation.mood,
    createdAt: Date.now(),
  }
}

function clampHint(n: number): number {
  return Math.max(0, Math.min(100, n))
}
