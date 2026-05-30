import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { isSupportedConditionSyntax } from '../src/engine/conditionEvaluator';
import type { AssetManifest, AssetRef, SceneNode, ScriptData } from '../src/types';

const DATA_DIR = join(process.cwd(), 'public', 'data');
const SCRIPTS_DIR = join(DATA_DIR, 'scripts');
const PUBLIC_DIR = join(process.cwd(), 'public');

const VALID_SCENE_TYPES = new Set([
  'dialogue', 'narration', 'choice', 'feed', 'mirror', 'ending', 'agent_event'
]);
const VALID_METRIC_KEYS = new Set(['tech', 'vision', 'brother', 'opinion', 'publicPressure']);
const VALID_ASSET_STATUS = new Set(['placeholder', 'concept', 'candidate', 'final']);

interface SemanticLabelDoc {
  categories: Record<string, {
    labels: Record<string, string>;
  }>;
}

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function error(msg: string) {
  console.error('❌ ' + msg);
  process.exitCode = 1;
}

function warn(msg: string) {
  console.warn('⚠️ ' + msg);
}

function ok(msg: string) {
  console.log('✅ ' + msg);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function publicAssetPath(asset: AssetRef): string {
  return join(PUBLIC_DIR, asset.path.replace(/^\/+/, ''));
}

async function main() {
  console.log('🔍 Content Validation Start\n');

  // 1. 加载所有脚本
  const scriptFiles = readdirSync(SCRIPTS_DIR).filter(f => f.endsWith('.json'));
  const allScripts: ScriptData[] = [];
  const allScenes = new Map<string, { scriptId: string; scene: SceneNode }>();
  const allChoices = new Map<string, { scriptId: string; sceneId: string }>();

  for (const file of scriptFiles) {
    const script = loadJson<ScriptData>(join(SCRIPTS_DIR, file));
    allScripts.push(script);

    for (const scene of script.scenes) {
      if (allScenes.has(scene.id)) {
        error(`Scene ID duplicate: "${scene.id}" in ${file} (also in ${allScenes.get(scene.id)!.scriptId})`);
      } else {
        allScenes.set(scene.id, { scriptId: file, scene });
      }

      if (scene.choices) {
        for (const choice of scene.choices) {
          if (allChoices.has(choice.id)) {
            error(`Choice ID duplicate: "${choice.id}" in ${file}::${scene.id}`);
          } else {
            allChoices.set(choice.id, { scriptId: file, sceneId: scene.id });
          }
        }
      }
    }
  }

  if (!process.exitCode) ok(`All ${allScenes.size} scene IDs unique`);
  if (!process.exitCode) ok(`All ${allChoices.size} choice IDs unique`);

  // 1b. Scene 必填字段检查
  let badSceneFields = 0;
  for (const [sceneId, { scriptId, scene }] of allScenes) {
    if (!isNonEmptyString(scene.id)) {
      error(`Scene in ${scriptId} missing required field: id`);
      badSceneFields++;
    }
    if (!scene.type) {
      error(`Scene "${sceneId}" (${scriptId}) missing required field: type`);
      badSceneFields++;
    } else if (!VALID_SCENE_TYPES.has(scene.type)) {
      error(`Scene "${sceneId}" (${scriptId}) has invalid type: "${scene.type}"`);
      badSceneFields++;
    }
    if (!scene.text) {
      error(`Scene "${sceneId}" (${scriptId}) missing required field: text`);
      badSceneFields++;
    } else if (typeof scene.text === 'string' && scene.text.trim().length === 0) {
      error(`Scene "${sceneId}" (${scriptId}) has empty text`);
      badSceneFields++;
    }
  }
  if (badSceneFields === 0) ok('All scenes have valid required fields');

  // 1c. Choice 必填字段检查
  let badChoiceFields = 0;
  for (const [sceneId, { scriptId, scene }] of allScenes) {
    if (scene.choices) {
      for (const choice of scene.choices) {
        if (!choice.id) {
          error(`Choice in "${sceneId}" (${scriptId}) missing required field: id`);
          badChoiceFields++;
        }
        if (!choice.text) {
          error(`Choice "${choice.id || 'unknown'}" in "${sceneId}" (${scriptId}) missing required field: text`);
          badChoiceFields++;
        }
        if (!choice.nextScene) {
          error(`Choice "${choice.id || 'unknown'}" in "${sceneId}" (${scriptId}) missing required field: nextScene`);
          badChoiceFields++;
        }
        // metricImpact key 检查
        if (choice.metricImpact) {
          for (const key of Object.keys(choice.metricImpact)) {
            if (!VALID_METRIC_KEYS.has(key)) {
              error(`Choice "${choice.id}" in "${sceneId}" has invalid metric key: "${key}"`);
              badChoiceFields++;
            }
          }
        }
      }
    }
  }
  if (badChoiceFields === 0) ok('All choices have valid required fields and metric keys');

  // 2. nextScene 存在性检查
  let missingNext = 0;
  for (const [sceneId, { scriptId, scene }] of allScenes) {
    if (scene.nextScene && !allScenes.has(scene.nextScene)) {
      error(`Missing nextScene: "${scene.nextScene}" referenced by "${sceneId}" in ${scriptId}`);
      missingNext++;
    }
    if (scene.choices) {
      for (const choice of scene.choices) {
        if (choice.nextScene && !allScenes.has(choice.nextScene)) {
          error(`Missing nextScene: "${choice.nextScene}" in choice "${choice.id}" of "${sceneId}"`);
          missingNext++;
        }
      }
    }
  }
  if (missingNext === 0) ok('All nextScene references resolve');

  // 3. 语义标签白名单检查
  const semanticDoc = loadJson<SemanticLabelDoc>(join(DATA_DIR, 'semantic-labels.json'));
  const validLabels = new Set<string>();
  for (const cat of Object.values(semanticDoc.categories)) {
    for (const labelId of Object.keys(cat.labels)) {
      validLabels.add(labelId);
    }
  }

  let badLabels = 0;
  for (const [sceneId, { scriptId, scene }] of allScenes) {
    if (scene.choices) {
      for (const choice of scene.choices) {
        if (choice.semanticLabels) {
          for (const label of choice.semanticLabels) {
            if (!validLabels.has(label)) {
              error(`Unknown semanticLabel: "${label}" in choice "${choice.id}" of "${sceneId}" in ${scriptId}`);
              badLabels++;
            }
          }
        }
      }
    }
  }
  if (badLabels === 0) ok(`All semanticLabels in whitelist (${validLabels.size} labels)`);

  // 4. Condition grammar 检查 + conditionalText default 兜底检查
  let badConditions = 0;
  let missingDefaults = 0;
  for (const [sceneId, { scriptId, scene }] of allScenes) {
    if (Array.isArray(scene.text)) {
      const hasDefault = scene.text.some(t => t.default === true);
      if (!hasDefault) {
        error(`Scene "${sceneId}" (${scriptId}) conditionalText missing default fallback`);
        missingDefaults++;
      }
      for (const textItem of scene.text) {
        if (!isNonEmptyString(textItem.value)) {
          error(`Scene "${sceneId}" (${scriptId}) conditionalText item missing non-empty value`);
          badConditions++;
        }
        if (!isSupportedConditionSyntax(textItem.condition)) {
          error(`Unsupported condition syntax: "${textItem.condition}" in "${sceneId}" (${scriptId})`);
          badConditions++;
        }
      }
    }
    if (scene.choices) {
      for (const choice of scene.choices) {
        if (!isSupportedConditionSyntax(choice.requirement)) {
          error(`Unsupported requirement syntax: "${choice.requirement}" in choice "${choice.id}" of "${sceneId}"`);
          badConditions++;
        }
      }
    }
  }
  if (missingDefaults === 0) ok('All conditionalText arrays have default fallback');
  if (badConditions === 0) ok('All conditions use supported safe syntax');

  // 5. Asset ID 存在性检查
  const assetDoc = loadJson<AssetManifest>(join(DATA_DIR, 'asset-manifest.json'));
  const validAssets = new Set<string>();
  let badAssetStatus = 0;
  const assetGroups: Array<{ name: keyof AssetManifest; assets: Record<string, AssetRef> }> = [
    { name: 'backgrounds', assets: assetDoc.backgrounds },
    { name: 'characters', assets: assetDoc.characters },
    { name: 'effects', assets: assetDoc.effects },
    { name: 'audio', assets: assetDoc.audio },
    { name: 'ui', assets: assetDoc.ui },
  ];

  for (const { name, assets } of assetGroups) {
    for (const asset of Object.values(assets)) {
      if (asset?.id) validAssets.add(asset.id);
      if (!isNonEmptyString(asset.id)) {
        error(`Asset in "${name}" missing required field: id`);
        badAssetStatus++;
      }
      if (!isNonEmptyString(asset.path)) {
        error(`Asset "${asset.id}" missing required field: path`);
        badAssetStatus++;
      }
      if (!isNonEmptyString(asset.usage)) {
        error(`Asset "${asset.id}" missing required field: usage`);
        badAssetStatus++;
      }
      if (asset?.status && !VALID_ASSET_STATUS.has(asset.status)) {
        error(`Asset "${asset.id}" has invalid status: "${asset.status}"`);
        badAssetStatus++;
      }
      if (name === 'backgrounds' && !asset.safeTextArea) {
        error(`Background asset "${asset.id}" missing safeTextArea`);
        badAssetStatus++;
      }
      if (asset.status !== 'placeholder' && isNonEmptyString(asset.path) && !existsSync(publicAssetPath(asset))) {
        error(`Asset "${asset.id}" path does not exist: "${asset.path}"`);
        badAssetStatus++;
      }
    }
  }
  if (badAssetStatus === 0) ok('All asset statuses are valid');

  let badAssets = 0;
  for (const [sceneId, { scriptId, scene }] of allScenes) {
    if (scene.background && !validAssets.has(scene.background)) {
      error(`Unknown background asset: "${scene.background}" in "${sceneId}" (${scriptId})`);
      badAssets++;
    }
    if (scene.character && !validAssets.has(scene.character)) {
      error(`Unknown character asset: "${scene.character}" in "${sceneId}" (${scriptId})`);
      badAssets++;
    }
    if (scene.music && !validAssets.has(scene.music)) {
      error(`Unknown music asset: "${scene.music}" in "${sceneId}" (${scriptId})`);
      badAssets++;
    }
    for (const effect of scene.effects || []) {
      if (!validAssets.has(effect)) {
        error(`Unknown effect asset: "${effect}" in "${sceneId}" (${scriptId})`);
        badAssets++;
      }
    }
  }
  if (badAssets === 0) ok('All referenced assets exist in manifest');

  // 6. Universe return path 检查
  let badReturn = 0;
  for (const script of allScripts) {
    if (script.id.startsWith('universe-')) {
      const lastScene = script.scenes[script.scenes.length - 1];
      if (lastScene.type !== 'narration' || !lastScene.nextScene) {
        error(`Universe "${script.id}" last scene must be narration with nextScene return path`);
        badReturn++;
        continue;
      }
      if (!allScenes.has(lastScene.nextScene)) {
        error(`Universe "${script.id}" return target "${lastScene.nextScene}" does not exist`);
        badReturn++;
      }
    }
  }
  if (badReturn === 0) ok('All universe return paths resolve');

  // 7. Universe fragment collection 检查
  let badUniverse = 0;
  for (const script of allScripts) {
    if (script.id.startsWith('universe-')) {
      const ending = script.scenes.find(s => s.type === 'ending');
      if (!ending) {
        error(`Universe "${script.id}" missing ending scene`);
        badUniverse++;
      } else if (!ending.universeId) {
        error(`Universe "${script.id}" ending scene missing universeId`);
        badUniverse++;
      }
    }
  }
  if (badUniverse === 0) ok('All universes have ending with universeId');

  // 8. Summary
  console.log('\n📊 Summary');
  console.log(`  Scripts: ${scriptFiles.length}`);
  console.log(`  Scenes: ${allScenes.size}`);
  console.log(`  Choices: ${allChoices.size}`);
  console.log(`  Semantic labels: ${validLabels.size}`);
  console.log(`  Assets: ${validAssets.size}`);

  if (process.exitCode) {
    console.log('\n❌ Validation FAILED');
  } else {
    console.log('\n✅ Validation PASSED');
  }
}

main();
