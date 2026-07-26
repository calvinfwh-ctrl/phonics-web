# Phonics Web App 教学重新设计方案

> 基于 Science of Reading / Structured Literacy 研究成果
> 日期：2026-07-26

## 一、研究发现

### 核心教学原则

| 原则 | 来源 | 当前 App 是否遵循 |
|------|------|------------------|
| **听→说→读→写** 渐进顺序 | Reading Rockets, Lexia | ❌ 直接跳到读 |
| **I Do → We Do → You Do** 渐进释放 | Reading Universe | ❌ 没有"I Do"教学阶段 |
| **Blending + Segmenting 是核心技能** | National Reading Panel (2000) | ⚠️ 只测了 blending |
| **Phoneme-Grapheme Mapping**（音形映射） | Savvas, Orton-Gillingham | ❌ 音和形没有分离测试 |
| **从已知词族迁移到未知词** | Five from Five, analogy phonics | ⚠️ 迁移设计有答案泄露 |
| **Multisensory**（听+看+动手） | Literacy Minnesota, 95% Group | ❌ 只有听+点击选择 |

### 业界标杆：Teach Your Monster to Read

三阶段设计（2年课程）：
- **Stage 1**: 音图识别（phoneme→grapheme matching）
- **Stage 2**: Blending + Segmenting（听词找字母 / 听音拼词）
- **Stage 3**: 句子阅读理解

关键设计：**听词 → 选字母 → 组成单词**（segmenting），而非显示单词 → 选择。

### 当前 App 的根本问题

不是 UI bug，是**教学设计缺陷**：

```
当前：题干（文字+字母）→ 暴露答案 → 选择题形同虚设

应有：题干只给一种模态（音 OR 形）→ 选择题考另一种模态的转换能力
```

## 二、重新设计：5 级练习体系

### 设计原则

1. **每级只测一个核心技能**（不混淆）
2. **输入模态 ≠ 输出模态**（否则不是测试而是抄写）
3. **从被动识别到主动构建**（逐渐增加难度）
4. **听→读→写方向**（遵循自然习得顺序）

### 新 5 级体系

| 级别 | 名称 | 测试技能 | 输入（题干） | 输出（答题） | 解释 |
|------|------|---------|-------------|-------------|------|
| **L1** | 听音辨音 | 音素识别 | 🔊 纯音频播放单词 | ✅有/❌没有 目标语素 | 纯语音意识，不接触文字 |
| **L2** | 听音选词 | Blending（拼读解码） | 🔊 播放单词发音 | 从3个**文字**选项中选对的 | 音→形映射（解码） |
| **L3** | 听音拼词 | Segmenting（切分编码） | 🔊 播放单词发音 | 拖拽**字母 tile** 拼出单词 | 主动构建（编码），不是被动选择 |
| **L4** | 替换造词 | 音素替换 | 🔊 语音指令"把cat的/c/换成/h/" + 显示基础词 | 拖拽字母替换 → 产出新词 | 音素操控能力 |
| **L5** | 拼读生词 | 规则迁移 | 显示**假词/生词**文字（如"zat"） | 🔊 听3个发音 → 选正确读音 | 能否用学的规则解码未见过的词 |

### 对比：旧设计 vs 新设计

| 级别 | 旧设计 | 问题 | 新设计 | 改进 |
|------|--------|------|--------|------|
| L1 | 🔊听词→有/没有目标音 | ✅ OK | 保持不变 | — |
| L2 | 显示字母c-a-t→选"cat" | 字母=答案 | 🔊只播放发音→选文字词 | 音→形，真测解码 |
| L3 | 显示c+-at→选"cat" | 拼写=答案 | 🔊播放发音→拖字母拼词 | 从选择改为构建 |
| L4 | 显示cat→换c成h→选"hat" | 算术题 | 🔊"把cat的c换成h"+显示cat→拖字母替换 | 动手操作+语音指令 |
| L5 | 显示"zat"→选读音 | 能直接读 | 显示"zat"→🔊3个发音选对的 | 测规则应用，不是记忆力 |

### L1 详设（不变，仅确认）

```
Hooty: "仔细听！有今天学的音吗？"
🔊 [播放按钮] → 播放 "bag"
[✅ 有] [❌ 没有]
→ 答对：Hooty "对啦！bag 里有 /æ/！"
→ 答错：Hooty "再听一次～" 🔊重播
```

### L2 详设（重构）

```
Hooty: "听一听，是哪个词？"
🔊 [播放按钮] → 播放 "cat" (完整单词发音)

选项（文字，不带图片/发音）：
  [cat]  [cot]  [cut]

→ 答对：Hooty 跳一下 "没错！🔊cat！" + 字母浮现 c-a-t
→ 答错：Hooty "仔细听～" 🔊重播 + 高亮正确项
```

**关键变化：**
- ❌ 移除：逐字母展示、blend 播报
- ✅ 新增：纯音频驱动，文字选项作为"解码目标"
- 干扰项设计：同结构不同元音（cat/cot/cut），考元音辨识

**分段提示（scaffold）：** 如果连续答错2次，降低难度：
- 第3次：🔊慢速分段播放 /c/.../æ/.../t/
- 第4次：显示首字母提示 "c__"

### L3 详设（重构）

```
Hooty: "听词拼字！把字母拖到方格里～"
🔊 [播放按钮] → 播放 "bat"

字母池（打乱）：[a] [b] [t] [c] [h]
空格框：[_] [_] [_]

→ 孩子拖拽字母填入
→ 拼对：Hooty 撒花 "太棒了！b-a-t，bat！" 🔊播放完整词
→ 拼错：错的字母弹回 + Hooty "再听一次～" 🔊重播
→ 连续2次错：高亮首字母位置 + 🔊分段播报
```

**关键变化：**
- ❌ 移除：选择题形式、显示 onset+rime
- ✅ 新增：拖拽交互（multisensory tactile）、字母池含干扰字母
- 从"选"变成"做"，认知负荷更高但更有效

**Elkonin Boxes 原理：** 每个音对应一个框，视觉上建立音-形对应。

### L4 详设（重构）

```
Hooty: "换一换，变成新词！"
显示：[c] [a] [t]  🔊播放 "cat"
Hooty: "把第一个音 /c/ 换成 /h/！" 🔊

字母池：[h] [b] [m]（含干扰）
操作区：[c→] [a] [t]  （第一个位置高亮，可替换）

→ 孩子拖 [h] 到第一个位置
→ "hat" 出现 → 🔊播放 "hat"
→ Hooty "厉害！cat → hat！"
```

**关键变化：**
- ❌ 移除：文字指令"把c换成h"（孩子直接算出答案）
- ✅ 新增：语音指令 + 拖拽操作 + 视觉替换动画
- 音素替换是**操作性的**，不是计算性的

### L5 详设（重构）

```
Hooty: "用你学的规则，读这个词！"
显示文字：zat（假词，从未教过）
🔊 [播放按钮 × 3]
  选项A: /zæt/（正确——短元音a）
  选项B: /zeɪt/（错误——长元音）
  选项C: /zet/（错误——错误元音）

→ 孩子点听三个发音 → 选对的
→ 答对：Hooty "牛！你用规则读出了一个没见过的词！"
→ 答错：Hooty "想想短元音a怎么发～" + 🔊重播正确项
```

**关键变化：**
- ❌ 移除：先显示文字再自己读（没有测试性）
- ✅ 新增：三个发音选对的——测试"文字→发音"的规则应用
- 假词是"金标准测试"（Orton-Gillingham 方法论），因为孩子不可能靠记忆

## 三、新增：教学阶段（"I Do"）

**当前问题：** 进入规则直接开始 L1 练习，没有教学环节。

**新增方案：** 每个规则首次进入时，先走教学流程：

```
🎬 教学环节（约30-60秒）

Step 1: Hooty 介绍
"今天我们来学短元音 Aa！"
显示大字母 "Aa" + 🔊播放 /æ/

Step 2: 发音示范
"张大嘴巴，发 aaaa，像咬一口大苹果！🍎"
🔊 播放 /æ/ × 3 次

Step 3: 示例词展示
"听这些词，都有 aaaa 的音："
🔊 apple  🔊 cat  🔊 bag  🔊 hat
（每个词配一个简单图标，点一下可以重播）

Step 4: 对比演示
"这个没有 aaaa："
🔊 dog  🔊 pig（对比）

Step 5: 准备开始
"准备好练习了吗？" [开始练习 →]
```

**技术实现：** 新增 `TeachScreen` 组件，在 `startSession` 时如果 `progress.status === "not_started"` 则先走教学。

## 四、数据模型变更

### 需要新增的字段

```typescript
// L3 新题型：拖拽拼词
export interface SegmentQuestion {
  word: string;           // "bat"
  letters: string[];      // ["b", "a", "t"]
  distractorLetters: string[]; // ["c", "h"] 额外干扰字母
  elkoninBoxes: number;   // 3 (CVC = 3 boxes)
}

// L4 新题型：拖拽替换
export interface SubstituteQuestionV2 {
  baseWord: string;       // "cat"
  targetWord: string;     // "hat"
  swapFrom: string;       // "c"
  swapTo: string;         // "h"
  poolLetters: string[];  // ["h", "b", "m"] 替换选项池
}

// L5 新题型：选发音
export interface TransferQuestionV2 {
  word: string;           // "zat" (假词)
  isNonsense: boolean;
  audioOptions: string[]; // ["zæt", "zeɪt", "zet"] TTS播放文本
  correctIndex: number;   // 0
}
```

### 题目生成器变更

- `generateBlendQuestions` → 改为纯音频驱动，不暴露字母
- `generateFamilyQuestions` → 升级为 `generateSegmentQuestions`（拖拽拼词）
- `generateSubstituteQuestions` → 升级为拖拽替换模式
- `generateTransferQuestions` → 改为"选发音"模式

## 五、技术实现要点

### 拖拽交互

使用 `@dnd-kit/core` + `@dnd-kit/sortable`（React 拖拽库）：
- 轻量级，触摸友好
- 支持 iPad/iPhone touch 事件
- 动画流畅

```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

### TTS 多发音对比（L5）

```typescript
// L5 需要播放三种不同发音
// TTS 引擎直接读不同文字即可
const options = ["zat", "zayt", "zet"];
// TTS 读 "zat" → /zæt/ ✅
// TTS 读 "zayt" → /zeɪt/ ❌ (长元音)
// TTS 读 "zet" → /zet/ ❌ (错误元音)
```

### 分段播放（scaffold）

```typescript
// L2 答错后的提示：慢速分段播放
speechService.speakBlend(["c", "a", "t"], { rate: 0.5, gap: 300 });
// 已有 speakBlend 方法，调整参数即可
```

## 六、实施优先级

| 优先级 | 改动 | 原因 |
|--------|------|------|
| **P0** | L2 移除字母展示，改为纯音频 | 当前最严重的答案泄露 |
| **P0** | L3 从选择题改为拖拽拼词 | 核心教学价值 |
| **P1** | 新增教学环节（I Do 阶段） | 教学完整性 |
| **P1** | L4 改为拖拽替换 | 交互升级 |
| **P2** | L5 改为选发音模式 | 测试有效性 |
| **P2** | 连续答错 scaffold（分段提示） | 自适应难度 |
