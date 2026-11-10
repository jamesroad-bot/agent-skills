# 参数定义、默认配置与输入输出契约

本文件是 `socratic-questioning` 的规范性参考，定义全部参数、类型与校验、默认配置（`config.yaml`）、输入/输出契约与内部状态模型。`SKILL.md` 是运行时的精简入口，冲突时以本文件的契约定义为准。

## 一、参数定义

所有参数均为可选项，唯一**必填**的是 `topic`。未提供的参数一律回落到下方默认值。

### 1. `topic`（主题）
- 类型：文本字符串。
- 含义：本轮引导式追问围绕的核心主题、决策、观点或信念。
- 校验：非空；去除首尾空白后长度 ≥ 2。
- 缺失时：不得开始追问，先请用户补一句主题；主题过于宽泛时，用一句澄清把它收窄到可追问。

### 2. `goal`（目标）
- 类型：文本字符串。
- 含义：期望用户最终达到的认知状态（如"分清事实与推断""识别自己的隐含假设""想清楚取舍标准"）。
- 校验：可选；缺省视为"无固定目标"，由对话自然收敛。
- 用法：`goal` 非空时，作为 `goal_met` 判定的依据之一。

### 3. `audience_level`（受众水平）
- 类型：枚举 `beginner | intermediate | advanced`。
- 默认：`intermediate`。
- 影响：问题措辞的抽象度、术语用量、单轮信息量。
  - beginner：口语化、避免术语、一次只聚焦一个具体点。
  - intermediate：适度抽象，可引入简单框架但不堆术语。
  - advanced：可处理抽象概念、元认知与反事实推理。

### 4. `max_rounds`（轮次上限）
- 类型：正整数。
- 范围：1–20。
- 默认：6。
- 校验：非整数或越界时回落到 6 并可提示一次。
- 用法：达到该轮次即触发反思总结，不再继续追问。

### 5. `end_condition`（结束条件）
- 类型：枚举 `answer_confirmed | rounds_exhausted | user_stop | goal_met | goal_met_or_rounds_exhausted`。
- 默认：`goal_met_or_rounds_exhausted`（达成目标或触及轮次上限，先到为准）。
- 语义：
  - `goal_met`：判定用户已达成 `goal` 即收尾。
  - `rounds_exhausted`：仅以轮次上限为准。
  - `user_stop`：用户表达停止/够了/不想继续即收尾。
  - `answer_confirmed`：用户明确确认"想清楚了/有结论了"即收尾。
  - `goal_met_or_rounds_exhausted`：以上任一命中即收尾（默认组合）。

### 6. `tone`（语气）
- 类型：枚举 `neutral | warm | formal`。
- 默认：`neutral`。
- 影响：措辞温度与称呼方式，但**不改变**中立、不评判、不泄露结论的硬约束。

### 7. `language`（输出语言）
- 类型：枚举 `zh | en | auto`。
- 默认：`zh`（满足"默认交互文案使用中文"的要求）。
- `auto`：跟随用户当前对话语言。

## 二、默认配置 `config.yaml`

技能内置默认配置；用户在对话中给出的同名参数优先覆盖此处。

```yaml
# socratic-questioning 默认配置
topic: null              # 必填，无默认
goal: null              # 可选，无固定目标
audience_level: intermediate
max_rounds: 6
end_condition: goal_met_or_rounds_exhausted
tone: neutral
language: zh            # 默认交互文案中文
strategies_order:       # 策略默认推进顺序（可动态跳过/回环）
  - clarify_concepts
  - examine_evidence
  - challenge_assumptions
  - explore_alternatives
  - guide_reflection
summary_fields:         # 反思总结默认字段
  - core_topic
  - clarified_points
  - surfaced_assumptions
  - alternatives_considered
  - open_questions
  - user_conclusion_or_next_step
constraints:            # 不可被配置关闭的红线
  one_question_per_round: true
  neutral_non_judgmental: true
  no_leak_preset_conclusion: true
  no_unmentioned_frameworks_or_services: true
```

## 三、输入契约（Input Contract）

技能被触发时接收一个"启动包"。约定如下：

```
启动请求 = topic（必填）+ 可选 {goal, audience_level, max_rounds, end_condition, tone, language}
```

- 解析顺序：用户显式参数 > `config.yaml` 默认值。
- 校验失败：仅回落默认值并最多提示一次，绝不因此中断整个引导流程。
- 信息不足（缺 `topic`）：先补澄清，不臆测主题。

## 四、输出契约（Output Contract）

### 每轮提问（round output）
恰好一个问题，允许附带：
- 一句对**上一轮用户原话**的中立复述（不含评价、不含新增判断）。
- 可选策略标签（默认隐藏，便于用户理解进程时才展示）。

禁止：一次抛出多个问题；给出结论或答案；暗示标准答案；评判用户回答。

### 结束输出（structured reflection summary）
命中结束条件后输出结构化总结，字段固定为：
1. `core_topic` 核心议题
2. `clarified_points` 已澄清的关键点
3. `surfaced_assumptions` 浮现出的假设
4. `alternatives_considered` 考虑过的替代视角
5. `open_questions` 尚未解决的问题
6. `user_conclusion_or_next_step` 用户自己的结论 / 下一步

要求：内容只允许来源于**用户在对话中已表达**的信息；助手不得在总结中夹带未经用户认可的结论。

## 五、内部状态模型

```
State {
  topic: string
  goal: string?
  audience_level: enum
  max_rounds: int            # 1..20, 默认 6
  end_condition: enum
  tone: enum
  language: enum
  round: int = 0             # 每提问一次 +1
  covered_strategies: string[]
  accumulated_insights: string[]   # 用户原话提炼（中立）
  open_threads: string[]           # 尚未追完的线索
  user_refusals: int = 0
}
```

状态转移（简化）：
1. 收到用户回答 → 更新 `accumulated_insights` / `open_threads`，必要时更新 `covered_strategies`。
2. 评估结束条件（`round>=max_rounds`？`goal` 达成？用户 `user_stop`/`answer_confirmed`？）。
3. 命中 → 由 `accumulated_insights` 组装反思总结；未命中 → 选策略、基于最近回答生成下一个聚焦问题，`round += 1`。

状态对用户不可见，仅在用户索取"进度/我聊到哪了"时以摘要形式给出。

## 六、与配套文件的关系

- 策略句式与编排细节见 [strategies.md](strategies.md)。
- 边界处理话术见 [edge-cases.md](edge-cases.md)。
- 示例与完整样张见 [examples.md](examples.md)。
- 验收用例见 [acceptance-tests.md](acceptance-tests.md)。
