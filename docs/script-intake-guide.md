# 剧情剧本接入指南

> 本文档供策划/编剧同学参考。所有剧情数据以 JSON 形式写入 `public/data/scripts/`。

## 剧本文件

| 文件 | 内容 |
|------|------|
| `main.json` | 主线剧情 |
| `universe-engineer.json` | 工程师宇宙（平行分支） |
| `universe-fast-star.json` | 快餐明星宇宙 |
| `universe-no-foundation.json` | 无根基宇宙 |
| `universe-silent-captain.json` | 沉默船长宇宙 |

## SceneNode 类型

每个场景是一个 `SceneNode`，`type` 必须是以下之一：

| type | 用途 | 关键字段 |
|------|------|---------|
| `narration` | 旁白叙述 | `text` |
| `dialogue` | 角色对话 | `speaker`, `character`, `text` |
| `choice` | 玩家选择 | `text`, `choices[]` |
| `feed` | 舆论场 | `text`（标题） |
| `mirror` | 镜中走廊入口 | `text` |
| `ending` | 章节/宇宙结局 | `text`, `universeId` |
| `agent_event` | Agent 主动事件 | `text` |

## 基础结构示例

```json
{
  "id": "main",
  "scenes": [
    {
      "id": "act0_opening",
      "type": "narration",
      "background": "bg_stadium_stage",
      "text": "黑场。先听见雨声……",
      "nextScene": "act0_next"
    }
  ]
}
```

字段规则：
- `id`：全局唯一，建议用 `act{数字}_{描述}` 格式
- `background`：引用 `asset-manifest.json` 里的背景 ID
- `character`：引用 asset-manifest 里的角色 ID
- `music`：引用 asset-manifest 里的音频 ID
- `nextScene`：下一场景的 ID，必须存在于某个剧本中

## 选择分支（choice）

```json
{
  "id": "act1_choice",
  "type": "choice",
  "background": "bg_classroom",
  "text": "镜子提示第一个选择：把小镇丢下，还是把小镇带走？",
  "choices": [
    {
      "id": "choice_take_hometown",
      "text": "把小镇带走，把家人、方言、县城人物写进歌里",
      "nextScene": "act1_after_choice",
      "metricImpact": { "vision": 5, "brother": 3, "opinion": 2 },
      "semanticLabels": ["remembered_hometown", "stayed_real"],
      "eventLog": ["choice_take_hometown"],
      "mirrorCost": "你选择了把根带在身上。这条路很重，但你的歌里永远有具体的人。"
    }
  ]
}
```

### 选择字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | ✓ | 全局唯一 |
| `text` | ✓ | 玩家看到的选项文字 |
| `nextScene` | ✓ | 选择后跳转的场景 ID |
| `metricImpact` | ✗ | 影响指标：`tech`, `vision`, `brother`, `opinion`, `publicPressure` |
| `semanticLabels` | ✗ | 语义标签列表，决定 Agent 舆论反应 |
| `eventLog` | ✗ | 写入事件日志的标识，供条件分支判断 |
| `mirrorCost` | ✗ | 选择后果文案，镜中走廊显示 |
| `requirement` | ✗ | 前置条件，见下方「安全条件语法」 |

## 条件文本（ConditionalText）

用于根据玩家之前的选择显示不同文本。

```json
{
  "id": "act1_after_choice",
  "type": "narration",
  "text": [
    {
      "condition": "eventLog.includes('choice_take_hometown')",
      "value": "你把奶奶塞的钱放进了钱包最里层。"
    },
    {
      "condition": "eventLog.includes('choice_leave_hometown')",
      "value": "你把钱放进了抽屉，和旧照片一起。"
    },
    {
      "default": true,
      "value": "你站在路口，车来了。"
    }
  ]
}
```

**规则**：
- 必须有一条 `default: true` 的兜底文本
- `condition` 只能使用下方「安全条件语法」中的表达式

## 安全条件语法（⚠️ 重要）

为防止安全问题，**不允许**写任意 JavaScript 表达式。只支持以下白名单语法：

| 表达式 | 示例 | 含义 |
|--------|------|------|
| `eventLog.includes('...')` | `eventLog.includes('choice_take_hometown')` | 事件日志包含某事件 |
| `collectedFragments['...']` | `collectedFragments['universe-engineer']` | 已收集某宇宙碎片 |
| `flags.xxx === true/false` | `flags.has_met_mac === true` | 某 flag 为 true/false |
| `metrics.xxx >= N` | `metrics.tech >= 60` | 某指标大于等于 N |
| `metrics.xxx <= N` | `metrics.vision <= 20` | 某指标小于等于 N |
| `metrics.xxx === N` | `metrics.brother === 10` | 某指标等于 N |

**不允许的写法（会被校验拒绝）**：
- `new Function(...)` 或 `eval`
- `Math.random()` 等函数调用
- `document` / `window` 等浏览器对象
- `fetch` / `XMLHttpRequest` 等网络请求
- 任意算术运算如 `metrics.tech + 5 > 10`

## 语义标签（semanticLabels）

标签必须在 `public/data/semantic-labels.json` 中预注册。当前有 6 大类 34 个标签：

| 类别 | 示例标签 |
|------|---------|
| 真实/表演 | `stayed_real`, `performed_authenticity`, `chose_image_over_music` |
| 兄弟/信任 | `protected_brother`, `abandoned_day1`, `shared_credit` |
| 舆论/回应 | `answered_publicly`, `stayed_silent`, `answered_with_music` |
| 根/恨/家 | `remembered_hometown`, `rejected_hometown`, `faced_mother_wound` |
| 成功/膨胀 | `chose_commercial_route`, `showed_wealth`, `chose_long_term_music` |
| 技术/作品 | `answered_diss_with_music`, `restrained_response`, `elevated_craft` |

**新增标签流程**：
1. 在 `semantic-labels.json` 的对应类别下添加标签定义
2. 在 `agentImpact` 中标注哪些 Agent 会关注该标签
3. 运行 `npm run validate` 确认通过

## 平行宇宙剧本规范

宇宙剧本命名：`universe-{宇宙名}.json`

结构要求：
- 必须包含 `ending` 场景，且 `ending` 必须有 `universeId`（与文件名中的宇宙名一致）
- 最后一场景必须是 `narration` 类型，且有 `nextScene` 指向主线回归场景
- 宇宙内部 `id` 也要求全局唯一，建议加前缀如 `uni_eng_`

示例结尾：
```json
{
  "id": "uni_eng_ending",
  "type": "ending",
  "universeId": "universe-engineer",
  "text": "你选择了键盘。",
  "nextScene": "uni_eng_return"
},
{
  "id": "uni_eng_return",
  "type": "narration",
  "text": "镜子碎了，你回到原来的路。",
  "nextScene": "act3_xiamen_opening"
}
```

## 校验流程

写完剧本后，在终端运行：

```bash
npm run validate
```

校验会检查：
- scene ID 是否全局唯一
- nextScene 引用是否存在
- choice ID 是否全局唯一
- semanticLabels 是否在白名单
- asset ID 是否在 manifest
- 宇宙是否有 return path
- ending 是否有 universeId
- condition 语法是否安全

**必须全部通过才能提交。**

## 新增剧本文件

如果新增剧本（如 Agent 个人剧情线）：
1. 在 `public/data/scripts/` 创建新 `.json` 文件
2. 文件结构同 main.json：`{ "id": "...", "scenes": [...] }`
3. 运行 `npm run validate` 确认无冲突
4. 如需在游戏里加载，通知程序在 `gameStore.ts` 的 `initGame()` 中注册
