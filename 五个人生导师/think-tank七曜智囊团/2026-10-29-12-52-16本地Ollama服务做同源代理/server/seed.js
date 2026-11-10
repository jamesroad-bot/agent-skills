import { get, save, uid } from './store.js';
import { addDays, fmtDate, relateAll } from './nlp.js';

function iso(daysAgo = 0, hour = 10, minute = 0) {
  const d = addDays(new Date(), -daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function note(data) {
  return {
    id: uid('n'),
    source: 'demo',
    pinned: false,
    archived: false,
    links: [],
    linkScores: {},
    entities: [],
    ai: { processed: true, mode: 'demo', model: 'demo', at: iso(0) },
    demo: true,
    ...data,
  };
}

export function seedDemo() {
  const s = get();
  if (s.notes.length || s.meta.demoCleared) return false;

  const notes = [
    note({
      title: '「慢下来」模式的产品构想',
      content:
        '## 想法\n做一个「慢下来」模式：当用户连续记录超过 20 分钟，界面自动收起所有未读和待办，只留下当前正在写的那一页。\n\n- 不是防沉迷，而是保护深度思考\n- 可以配一个很轻的呼吸动效，不要弹窗\n- 退出时生成一句「这段时间你写了什么」\n\n或许可以和每周复盘结合：把慢下来时写的内容单独标记，月底回看。',
      type: 'idea',
      tags: ['产品', '灵感', '效率'],
      summary: '构想一个保护深度思考的「慢下来」模式：收起干扰，只留当前页面，并与周复盘打通。',
      keyPoints: [
        '连续记录 20 分钟后自动收起未读与待办，只保留书写页',
        '用轻量呼吸动效代替弹窗，退出时生成一句书写回顾',
        '与每周复盘结合，月底单独回看慢下来时写的内容',
      ],
      entities: ['慢下来模式', '周复盘'],
      createdAt: iso(0, 9, 20),
      updatedAt: iso(0, 9, 20),
    }),
    note({
      title: '设计评审：新版首页方向',
      content:
        '会议纪要 10/28\n\n结论：首页从「信息流」改为「今天 + 稍后」两段式，降低首屏噪声。\n\n- 今天区只放 3 条最重要的内容\n- 稍后区可以折叠，默认不加载图片\n- 空状态不要用插画，用一句提问引导记录\n\n待办：\n- [ ] 周五前把新版首页交互稿发给我\n- [ ] 记得预约下周二用户访谈，找 3 位重度记录用户\n- 下周一同步给前端评估工作量',
      type: 'meeting',
      tags: ['会议', '设计', '产品'],
      summary: '首页确定改为「今天 + 稍后」两段式，优先降低首屏噪声，并安排交互稿与用户访谈。',
      keyPoints: [
        '首页从信息流改为「今天 + 稍后」两段式',
        '今天区限 3 条，稍后区折叠且默认不加载图片',
        '空状态用提问引导记录，不使用插画',
      ],
      entities: ['新版首页', '用户访谈', '前端'],
      createdAt: iso(1, 16, 40),
      updatedAt: iso(1, 16, 40),
    }),
    note({
      title: 'Local-first software 阅读摘录',
      content:
        '文章：https://www.inkandswitch.com/local-first/\n\n核心观点：本地优先的软件应该把用户数据的主副本放在本地，云端只是同步与协作的加速器。\n\n- 离线可用不是附加功能，而是默认状态\n- 数据所有权意味着用户可以随时导出、迁移\n- 冲突解决要尽量保留双方意图，而不是简单覆盖\n\n联想到知屿：数据放本地 JSON，模型也跑本地，这个方向是对的。下一步可以研究 CRDT，但个人单机场景暂时不需要。',
      type: 'reference',
      tags: ['阅读', '技术', 'AI'],
      summary: 'Local-first 的核心是数据主副本在本地、离线默认可用、用户拥有随时导出与迁移的权利。',
      keyPoints: [
        '数据主副本在本地，云端只做同步与协作加速',
        '离线可用是默认状态，不是附加功能',
        '冲突解决应保留双方意图；个人单机场景暂不需要 CRDT',
      ],
      entities: ['Local-first', 'CRDT', 'Ink & Switch'],
      createdAt: iso(2, 21, 10),
      updatedAt: iso(2, 21, 10),
    }),
    note({
      title: '这周要处理的生活杂事',
      content:
        '待办清单：\n- [ ] 预约牙医，最近刷牙有点酸\n- [ ] 续签护照，12 月要出差\n- [ ] 给妈妈挑生日礼物，11 月 3 日生日\n- [ ] 买露营气罐（周末出发前）\n\n本周尽量清掉，别再拖了。',
      type: 'todo',
      tags: ['生活', '健康', '人际'],
      summary: '本周生活待办：预约牙医、续签护照、给妈妈挑生日礼物、出发前买露营气罐。',
      keyPoints: ['牙医需要尽快预约，牙齿有酸痛', '护照 12 月出差前要续签', '妈妈 11 月 3 日生日'],
      entities: ['牙医', '护照', '妈妈', '露营'],
      createdAt: iso(3, 8, 30),
      updatedAt: iso(3, 8, 30),
    }),
    note({
      title: 'Ollama + RAG 的本地学习路线',
      content:
        '学习笔记\n\n目标：在自己的笔记库上跑一个可信的问答，不把数据发到云端。\n\n1. 用 Ollama 拉 qwen2.5:7b，先跑通 /api/chat\n2. 用 bge-m3 做 embedding，理解向量维度和余弦相似度\n3. 检索先做 BM25，再加向量混合排序，观察召回差异\n4. 提示词要求模型只依据材料回答，并强制带引用编号\n5. 评估：准备 20 个问题，人工看答案是否有据可查\n\n风险：7B 模型在长上下文里容易漏引用，上下文不要塞太多，控制在 6 条笔记以内。',
      type: 'reference',
      tags: ['学习', 'AI', '技术'],
      summary: '在本地笔记库上用 Ollama + bge-m3 搭建可引用的 RAG 问答，并用 20 个问题做人工评估。',
      keyPoints: [
        '先用 qwen2.5:7b 跑通 /api/chat，再用 bge-m3 做向量',
        '检索从 BM25 起步，再叠加向量做混合排序',
        '上下文控制在 6 条笔记内，提示词强制引用编号',
      ],
      entities: ['Ollama', 'bge-m3', 'BM25', 'RAG', 'qwen2.5'],
      createdAt: iso(4, 22, 5),
      updatedAt: iso(4, 22, 5),
    }),
    note({
      title: '周末露营装备清单',
      content:
        '周末去安吉露营，两天一夜。\n\n- 帐篷、防潮垫、睡袋（夜里 8 度，带厚的那条）\n- 气罐、炉头、锅、餐具、垃圾袋\n- 头灯、充电宝、驱蚊液、常用药\n- 早餐：面包、鸡蛋、咖啡；晚餐在营地解决\n\n记得出发前查天气，如果下雨就改到下周。',
      type: 'note',
      tags: ['旅行', '生活'],
      summary: '安吉两天一夜露营清单，重点带厚睡袋与炉具，出发前查天气，下雨则顺延。',
      keyPoints: ['夜间约 8 度，带厚睡袋', '气罐、炉头、头灯和常用药别漏', '出发前查天气，下雨改期'],
      entities: ['安吉', '露营'],
      createdAt: iso(5, 19, 15),
      updatedAt: iso(5, 19, 15),
    }),
    note({
      title: '十月复盘：注意力被切碎了',
      content:
        '这个月做了不少事，但注意力很碎。\n\n做得好的：\n- 每周至少三次记录，素材开始互相连接\n- 首页改版的方向终于收敛\n\n想改的：\n- 下午会议太多，深度工作被切成两段\n- 收藏了很多文章，真正读完的不到三分之一\n\n下个月想试试：上午 10 点前不看消息，每周只安排两次外部会议。',
      type: 'note',
      tags: ['复盘', '效率', '工作'],
      summary: '十月保持记录习惯并收敛了首页方向，但注意力被会议切碎，下月尝试上午深度工作与减少外部会议。',
      keyPoints: ['每周至少三次记录，素材开始互相连接', '下午会议过多，深度工作被打断', '下月上午 10 点前不看消息，每周最多两次外部会议'],
      entities: ['十月复盘', '深度工作'],
      createdAt: iso(6, 20, 0),
      updatedAt: iso(6, 20, 0),
    }),
  ];

  const todo = (text, dueOffset, priority, noteIndex, done = false, demo = true) => ({
    id: uid('t'),
    text,
    done,
    due: dueOffset === null ? null : fmtDate(addDays(new Date(), dueOffset)),
    priority,
    noteId: notes[noteIndex].id,
    remindAt: null,
    remindedAt: null,
    auto: true,
    createdAt: iso(3, 9, 0),
    completedAt: done ? iso(2, 18, 0) : null,
    demo,
  });

  const todos = [
    todo('预约牙医，最近刷牙有点酸', 0, 'high', 3),
    todo('续签护照，12 月出差前办好', 5, 'medium', 3),
    todo('给妈妈挑生日礼物（11 月 3 日）', 5, 'high', 3),
    todo('周五前把新版首页交互稿发给我', 1, 'high', 1),
    todo('预约下周二用户访谈，找 3 位重度记录用户', 4, 'medium', 1),
    todo('完成 BM25 + 向量混合检索的小实验', 7, 'medium', 4),
    todo('买露营气罐', -1, 'high', 5),
    todo('整理十月账单并报销', null, 'low', 3, true),
    todo('把首页改版结论同步给团队', -2, 'medium', 1, true),
  ];

  // 给两条示例待办预设提醒时间，打开即可看到「到点提醒」的样子。
  const withReminder = (text, time) => {
    const t = todos.find((x) => x.text === text);
    if (t && t.due) t.remindAt = `${t.due}T${time}`;
  };
  withReminder('周五前把新版首页交互稿发给我', '10:00');
  withReminder('预约下周二用户访谈，找 3 位重度记录用户', '09:30');

  s.notes = notes;
  s.todos = todos;
  s.meta.seeded = true;
  relateAll(notes);
  save();
  return true;
}
