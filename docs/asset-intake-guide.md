# 美术素材接入指南

> 本文档供美术同学参考。请按本文档的命名规范、目录结构和 status 流程提交素材。

## 目录结构

素材放在 `public/assets/` 下，按类型分目录：

```
public/assets/
  backgrounds/    # 背景图
  characters/     # 角色立绘
  effects/        # 特效叠加层
  audio/          # BGM / SFX
```

UI 素材暂由程序统一处理，美术不需要直接提供。

## 命名规范

格式：`{场景/角色}_{描述}_{状态}.png`

- 全部小写
- 单词间用下划线 `_` 分隔
- 占位图后缀固定为 `_placeholder`
- 终稿去掉 `_placeholder`，其余不变

示例：

| 阶段 | 文件名 |
|------|--------|
| 占位 | `stadium_stage_placeholder.png` |
| 概念 | `stadium_stage_concept.png` |
| 终稿 | `stadium_stage.png` |

## Asset Manifest 登记

每新增/替换一个素材，必须同步修改 `public/data/asset-manifest.json`。

### 字段说明

```json
{
  "id": "bg_stadium_stage",           // 唯一标识，剧本里引用这个 ID
  "path": "/assets/backgrounds/stadium_stage.png",  // 实际文件路径
  "usage": "体育馆舞台，开场和终章",   // 用途说明（供程序/策划查阅）
  "status": "final",                   // 素材阶段：placeholder / concept / candidate / final
  "safeTextArea": {                    // 仅背景图需要：安全文字区域
    "x": 240, "y": 120,
    "w": 1440, "h": 760
  }
}
```

### status 四阶段

| status | 含义 | 谁可以改 |
|--------|------|---------|
| `placeholder` | 占位图/纯色块 | 任何人 |
| `concept` | 概念草图，确定构图方向 | 美术 |
| `candidate` | 接近终稿，等待确认 | 美术 |
| `final` | 终稿，程序正式使用 | 美术 + 策划确认 |

**规则**：只有 `status: "final"` 的素材才会在正式构建中被视为完成。`placeholder` 和 `concept` 在运行时会有视觉提示。

## 接入流程

1. **美术提交素材** → 放到对应目录，命名符合规范
2. **更新 manifest** → 添加/修改对应 entry，status 设为 `concept` 或 `candidate`
3. **运行校验** → 在终端执行 `npm run validate`，确认 asset ID 被正确识别
4. **策划/程序确认** → 如无问题，status 改为 `final`
5. **剧本引用** → 策划在 `.json` 剧本里用 `background: "bg_stadium_stage"` 等形式引用

## 当前占位素材清单（需替换）

见 `public/data/asset-manifest.json`。当前所有素材均为 `placeholder` 状态，等待替换。

## 安全文字区域（背景图专用）

背景图必须标注 `safeTextArea`，告诉程序哪里可以放对话框文字，避免文字被画面主体遮挡。

坐标系：以 1920×1080 为基准画布。

示例：
```json
"safeTextArea": { "x": 240, "y": 120, "w": 1440, "h": 760 }
```

如果不确定，先用 `{ "x": 200, "y": 100, "w": 1520, "h": 800 }` 作为默认值。
