# 小镇传奇

AI 叙事驱动的视觉小说原型。当前版本重点是内容接入框架：剧情同学可以填 JSON 剧本，美术同学可以填素材 manifest，开发线用校验脚本把错误提前拦住。

## 快速开始

```bash
npm install
npm run validate
npm run typecheck
npm run build
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`。

## 队友入口

- 剧情接入：阅读 `docs/script-intake-guide.md`，编辑 `public/data/scripts/*.json`。
- 美术接入：阅读 `docs/asset-intake-guide.md`，把素材放入 `public/assets/`，并更新 `public/data/asset-manifest.json`。
- Agent 舆论/叙事：优先看 `src/agents/`、`src/engine/conditionEvaluator.ts`、`public/data/semantic-labels.json`。
- 游戏状态和流程：看 `src/store/gameStore.ts`、`src/engine/sceneRunner.ts`、`src/engine/scriptLoader.ts`。

## 每次交付前必须跑

```bash
npm run validate
npm run typecheck
npm run build
```

这三条全部通过，才说明剧情 JSON、素材 manifest、TypeScript 和生产构建都处于可交接状态。

## 内容校验覆盖

`npm run validate` 会检查：

- scene/choice ID 全局唯一。
- scene 必填字段和类型合法。
- choice 必填字段、指标 key、语义标签合法。
- `nextScene` 引用存在。
- ConditionalText 必须有 default fallback，且每条有非空 `value`。
- 条件语法只能使用白名单表达式。
- 剧本引用的素材 ID 必须存在于 manifest。
- 非 placeholder 素材的文件路径必须真实存在。
- 背景素材必须提供 `safeTextArea`。
- 平行宇宙必须有 ending，并能返回主线。

## 当前限制

- LLM 主路径仍是接口和 prompt contract 预留，当前运行时使用模板 fallback。
- `public/assets/` 目前没有真实素材；manifest 中的 placeholder 不强制检查文件存在。
- 新增剧本文件后，如果需要运行时主动加载，需要让开发同学把入口接到游戏流程里。
