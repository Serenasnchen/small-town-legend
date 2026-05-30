# Agent Handoff

This file is the operating guide for coding agents working inside `small-town-legend`.

## Project Shape

- React + Vite + TypeScript visual novel prototype.
- Content lives in `public/data/`.
- Runtime code lives in `src/`.
- Content validation lives in `scripts/validateContent.ts`.

## Required Commands

Run these before claiming completion:

```bash
npm run validate
npm run typecheck
npm run build
```

If you change visual UI behavior, also run the app with `npm run dev` and inspect the affected flow in browser.

## Content Rules

- Do not hand-edit generated `dist/`.
- Do not commit `node_modules/`, `.omc/`, `.omx/`, or `*.tsbuildinfo`.
- Keep story content in `public/data/scripts/*.json`.
- Keep asset records in `public/data/asset-manifest.json`.
- Keep semantic choice labels in `public/data/semantic-labels.json`.
- Do not add arbitrary JavaScript expression support to conditions. Use the whitelist in `src/engine/conditionEvaluator.ts`.
- For non-placeholder assets, ensure the `path` points to a real file under `public/`.
- Background assets must include `safeTextArea`.

## Architecture Boundaries

- `src/store/gameStore.ts` owns runtime state transitions.
- `src/engine/sceneRunner.ts` owns scene text resolution.
- `src/engine/choiceResolver.ts` owns choice availability.
- `src/engine/conditionEvaluator.ts` owns safe condition evaluation.
- `src/agents/` owns prompt assembly, agent updates, memory retrieval, and fallback feed behavior.
- `scripts/validateContent.ts` is the gate for teammate content handoff. Strengthen this script when adding new content schema fields.

## Safe Agent Tasks

Good next tasks for an autonomous agent:

- Add or revise JSON scenes while preserving validation.
- Add real candidate/final asset entries and matching files.
- Extend semantic labels and update validation fixtures.
- Improve prompt contracts in `src/agents/promptContracts.ts`.
- Add tests or richer validation for new schema fields.

Avoid broad rewrites unless the user explicitly asks. This project is in handoff mode, so small, verifiable changes are preferred.
