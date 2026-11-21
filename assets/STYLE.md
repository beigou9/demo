# 画风说明：老周的铁匠铺

素材包里所有图都按这份说明生成。你们自己用 AI 生新图时，把下面的“提示词模板”整段复制过去，再改“画什么”那一行，生成的图就能和现有素材放在一起不违和。

如果你用的生图工具支持上传参考图，再附上 1–2 张同类的现有素材（比如生道具就附 `images/item/item_sword.webp`），效果会稳定很多。

## 一句话

**可爱 Q 版的中国古风小镇，像手机休闲游戏的图标和贴纸：粗深棕描边、暖色、平涂加一层柔和阴影、圆润饱满。**

## 细则

| 项 | 要求 |
|---|---|
| 描边 | 所有物体都有**连续的深棕色描边**（接近 #5a3220），粗细均匀、圆头，不用纯黑 |
| 上色 | 平涂为主，加**一层**柔和的暗部阴影和一小块白色高光（左上方） |
| 光源 | 左上方的柔和光，没有强烈投影 |
| 配色 | 暖色为主：木头橙棕、砖红、奶油黄、樱花粉；冷色只用淡蓝、灰蓝点缀（金属、水、天空）。饱和度中等偏高，不发灰、不刺眼 |
| 造型 | 圆润、厚实、比例夸张：边角都是圆角，物件偏短粗；不要尖锐细长的写实造型 |
| 角色 | 约 2.5 头身，大头、圆脸、腮红、黑豆眼、小鼻子；中国古代平民服饰；正面或微侧的全身站姿 |
| 道具和图标 | 单个物体居中，占画面约 80%；45° 斜放或正面；可以带简单的表情（像铁坯那样）但不是必须 |
| 背景 | 横版 16:9，正面平视；**画面中间留出空地**，方便游戏把角色和 UI 放上去；远景简化、颜色更淡 |
| 不要 | 文字和字母、写实或 3D 渲染、像素风、暗黑或血腥、复杂纹理和噪点、照片质感、渐变很重的发光 |

## 提示词模板

中文（大多数国产生图工具）：

```text
画什么：<一句话描述，例如：一把铁锄头，木柄>

画风：可爱 Q 版中国古风休闲游戏素材，像手机游戏的图标贴纸。连续的粗深棕色描边（不是黑色），圆头线条；平涂上色，加一层柔和阴影和左上方的一小块白色高光；暖色调，饱和度中等偏高；造型圆润厚实、边角圆滑。
构图：单个物体居中，占画面约 80%，四周留少量空白。
背景：纯色背景，方便抠成透明底。
不要：文字、字母、水印、写实、3D 渲染、像素风、复杂纹理、阴暗色调。
```

English（部分工具英文效果更好）：

```text
Subject: <one sentence, e.g. an iron hoe with a wooden handle>

Style: cute chibi ancient-Chinese casual mobile game asset, like a sticker icon. Thick continuous dark-brown outline (not black) with rounded line caps; flat colors with one soft shadow tone and a small white highlight from the top-left; warm palette, medium-high saturation; chunky rounded shapes with soft corners.
Composition: single object centered, filling about 80% of the frame, small margin.
Background: plain solid color for easy background removal.
Avoid: text, letters, watermark, realism, 3D render, pixel art, noisy textures, dark gloomy colors.
```

### 换成其它类型时，改“构图”和“背景”两行

| 类型 | 构图 | 背景 |
|---|---|---|
| 道具、图标、材料 | 单个物体居中，占画面约 80% | 纯色背景，方便抠图 |
| 角色 | 全身正面站姿，2.5 头身，脚底完整，占画面高度约 90% | 纯色背景，方便抠图 |
| 角色的另一种表情 | 和上一张**同一个角色、同样姿势和服装**，只改表情 | 同上；一定要附上上一张当参考图 |
| 怪物、动物 | 圆滚滚的可爱造型，不吓人，全身入画 | 纯色背景，方便抠图 |
| 场景背景 | 横版 16:9，正面平视，画面中间和下方留出空地 | 完整场景，不抠图；不要出现人物 |
| 特效 | 单个特效图案居中，形状简单、边缘清楚 | 纯色背景，方便抠图 |
| 平台、地块 | 正面或略带俯视，可以左右拼接 | 纯色背景，方便抠图 |

## 生成之后

1. 抠掉背景，存成透明 PNG 或 WebP。边缘不要留一圈背景色。
2. 文件名用小写英文加下划线，按类别加前缀：`bg_`、`char_`、`mob_`、`tool_`、`mat_`、`item_`、`ui_`、`icon_`、`fx_`、`tile_`。
3. 放进游戏的 `assets/images/`，在 `manifest.json` 登记，在 `ASSETS.md` 加一行。
4. 在 README 的素材清单里写上用的是哪个 AI 工具。
