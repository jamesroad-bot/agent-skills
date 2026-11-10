/**
 * 本地语义工具：中文分词（CJK bigram）、BM25 检索、启发式分类 / 摘要 / 待办抽取。
 * 所有能力在无大模型时也可独立工作，是「知屿」的兜底引擎。
 */

const STOP = new Set([
  '的', '了', '和', '是', '在', '我', '有', '就', '不', '人', '都', '一', '上', '也', '很',
  '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '这', '那', '与', '及',
  '或', '对', '为', '从', '被', '把', '让', '但', '而', '中', '下', '等', '可以', '需要',
  '一个', '我们', '他们', '自己', '什么', '怎么', '如果', '因为', '所以', '还是', '已经',
  'the', 'a', 'an', 'is', 'are', 'to', 'of', 'and', 'in', 'on', 'for', 'with', 'it', 'this',
]);

const TAG_RULES = [
  ['产品', /(产品|需求|用户|功能|体验|交互|原型|PRD|增长|留存|转化)/i],
  ['设计', /(设计|视觉|版式|字体|配色|Figma|界面|风格)/i],
  ['AI', /(AI|大模型|LLM|提示词|prompt|RAG|智能体|Agent|Ollama|模型)/i],
  ['技术', /(代码|开发|技术|架构|API|前端|后端|数据库|部署|性能|bug|接口)/i],
  ['学习', /(学习|课程|课程笔记|知识|概念|练习|复习|考试|读书笔记)/i],
  ['阅读', /(阅读|文章|书|书籍|摘录|论文|作者|章节|读后)/i],
  ['会议', /(会议|评审|讨论|纪要|同步|周会|例会|对齐|沟通)/i],
  ['工作', /(工作|项目|周报|汇报|客户|同事|老板|交付|里程碑|排期)/i],
  ['生活', /(生活|家里|家务|做饭|购物|快递|搬家|收纳)/i],
  ['健康', /(健康|运动|跑步|健身|睡眠|体检|牙医|医院|生病|饮食)/i],
  ['旅行', /(旅行|出游|露营|徒步|机票|酒店|行程|攻略|景点)/i],
  ['财务', /(财务|预算|记账|理财|报销|发票|账单|保险|房租)/i],
  ['人际', /(朋友|家人|妈妈|爸爸|生日|礼物|聚会|婚礼|孩子)/i],
  ['灵感', /(灵感|想法|点子|idea|或许|也许|如果|脑洞|设想)/i],
  ['效率', /(效率|流程|模板|自动化|清单|习惯|时间管理|复盘)/i],
  ['写作', /(写作|文章|稿子|文案|选题|发布|公众号|博客)/i],
];

const ACTION_VERBS = /(买|采购|预约|提交|完成|联系|回复|整理|准备|确认|更新|发给|发送|打电话|电话|查|查询|读|写|修|订|付|交|申请|报名|体检|续签|寄|取|参加|跟进|对接|评审|发版|上线|清空|备份|还|寄回|带|附上|附带|补充|提醒|安排|制定|研究|看|学|练|洗|换|缴|约)/;

const CHECKBOX = /^\s*(?:[-*+]\s*)?(?:\[[ xX]\]|□|☐|✓)\s*/;
const TODO_PREFIX = /^\s*(?:待办|TODO|Todo|todo|任务|记得|别忘(?:了)?|提醒)\s*[:：\-–]?\s*/;

export function fmtDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(base, n) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

export function startOfWeek(base = new Date()) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const wd = d.getDay() === 0 ? 7 : d.getDay();
  return addDays(d, 1 - wd);
}

export function normalizeText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+$/gm, '')
    .trim();
}

export function stripMarkdown(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/[*_~>]/g, '')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text) {
  const s = String(text || '').toLowerCase();
  if (!s) return [];
  const tokens = [];
  const latin = s.match(/[a-z0-9][a-z0-9+#._-]*/g) || [];
  for (const w of latin) {
    if (w.length > 1 && !STOP.has(w)) tokens.push(w);
  }
  const cjkRuns = s.match(/[\u3400-\u9fff]+/g) || [];
  for (const run of cjkRuns) {
    if (run.length === 1) {
      if (!STOP.has(run)) tokens.push(run);
      continue;
    }
    for (let i = 0; i < run.length - 1; i++) {
      const bg = run.slice(i, i + 2);
      if (!STOP.has(bg) && !/^[的了和是在有就不人都一上也]$/.test(bg)) tokens.push(bg);
    }
  }
  return tokens;
}

function termFreq(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

export function buildIndex(notes) {
  const docs = new Map();
  const df = new Map();
  let totalLen = 0;
  for (const note of notes) {
    const weighted = [
      ...tokenize(note.title || ''),
      ...tokenize(note.title || ''),
      ...tokenize(note.title || ''),
      ...tokenize((note.tags || []).join(' ')),
      ...tokenize((note.tags || []).join(' ')),
      ...tokenize(note.summary || ''),
      ...tokenize(note.summary || ''),
      ...tokenize((note.keyPoints || []).join(' ')),
      ...tokenize(note.content || ''),
    ];
    const tf = termFreq(weighted);
    docs.set(note.id, { tf, len: weighted.length || 1 });
    totalLen += weighted.length || 1;
    for (const term of tf.keys()) df.set(term, (df.get(term) || 0) + 1);
  }
  const N = notes.length || 1;
  const avgLen = totalLen / N;
  const idf = new Map();
  for (const [term, n] of df) idf.set(term, Math.log(1 + (N - n + 0.5) / (n + 0.5)));
  return { docs, df, idf, N, avgLen };
}

export function bm25(query, note, index) {
  const doc = index.docs.get(note.id);
  if (!doc) return 0;
  const qTokens = [...new Set(tokenize(query))];
  if (!qTokens.length) return 0;
  const k1 = 1.4;
  const b = 0.72;
  let score = 0;
  for (const term of qTokens) {
    const tf = doc.tf.get(term) || 0;
    if (!tf) continue;
    const idf = index.idf.get(term) || 0.4;
    score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * doc.len) / index.avgLen)));
  }
  const q = String(query).trim().toLowerCase();
  if (q.length >= 2 && String(note.title || '').toLowerCase().includes(q)) score += 2.2;
  if (q.length >= 2 && (note.tags || []).some((t) => t.toLowerCase().includes(q))) score += 1.4;
  if (q.length >= 2 && String(note.summary || '').toLowerCase().includes(q)) score += 0.5;
  return score;
}

export function searchNotes(notes, query, index = buildIndex(notes)) {
  const q = String(query || '').trim();
  if (!q) return [];
  const scored = notes
    .map((note) => ({ note, score: bm25(q, note, index) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 24);
  return scored.map(({ note, score }) => ({
    ...note,
    _score: Number(score.toFixed(3)),
    _snippet: snippet(note.content || note.summary || '', q),
  }));
}

export function snippet(text, query, width = 90) {
  const clean = stripMarkdown(text);
  if (!clean) return '';
  const q = String(query || '').trim();
  let idx = q ? clean.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (idx < 0) {
    const terms = [...new Set(tokenize(q))].sort((a, b) => b.length - a.length);
    for (const t of terms) {
      const i = clean.toLowerCase().indexOf(t);
      if (i >= 0 && (idx < 0 || i < idx)) idx = i;
    }
  }
  if (idx < 0) return clean.slice(0, width) + (clean.length > width ? '…' : '');
  const start = Math.max(0, idx - Math.floor(width * 0.35));
  const end = Math.min(clean.length, start + width);
  return `${start > 0 ? '…' : ''}${clean.slice(start, end)}${end < clean.length ? '…' : ''}`;
}

export function extractTitle(text, fallback = '未命名记录') {
  const lines = normalizeText(text).split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return fallback;
  let first = lines[0]
    .replace(CHECKBOX, '')
    .replace(/^#{1,6}\s*/, '')
    .replace(/^[>\-*+]\s+/, '')
    .trim();
  if (/^https?:\/\//.test(first)) {
    try {
      const u = new URL(first);
      const tail = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || '');
      return (tail ? `${u.hostname.replace(/^www\./, '')} · ${tail}` : u.hostname).slice(0, 44);
    } catch {
      return first.slice(0, 44);
    }
  }
  if (first.length > 42) {
    const sentence = first.split(/[。！？!?；;]/)[0];
    first = (sentence.length > 8 ? sentence : first).slice(0, 42);
  }
  if (first.length < 6 && lines[1]) {
    const second = stripMarkdown(lines[1]);
    if (second) first = `${first} · ${second.slice(0, 24)}`;
  }
  return first || fallback;
}

export function splitSentences(text) {
  return stripMarkdown(text)
    .split(/(?<=[。！？!?；;])|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

export function heuristicSummary(text, max = 92, title = '') {
  let sentences = splitSentences(text);
  if (title && sentences.length > 1) {
    const norm = (v) => String(v).replace(/\s+/g, '');
    const first = norm(sentences[0]);
    const t = norm(title).replace(/…$/, '');
    const anchor = t.slice(0, Math.min(12, t.length));
    if (anchor.length >= 6 && (first.startsWith(anchor) || anchor.startsWith(first.slice(0, Math.min(10, first.length))))) {
      sentences = sentences.slice(1);
    }
  }
  if (!sentences.length) return '';
  let out = '';
  for (const s of sentences) {
    if ((out + s).length > max) break;
    out += s;
    if (out.length >= 32) break;
  }
  if (!out) out = sentences[0].slice(0, max);
  return out.length > max ? `${out.slice(0, max)}…` : out;
}

export function detectType(text) {
  const s = String(text || '');
  const urls = s.match(/https?:\/\/\S+/g) || [];
  const withoutUrls = s.replace(/https?:\/\/\S+/g, '').trim();
  if (urls.length && withoutUrls.length < 160) return 'link';
  if (/(会议|评审|纪要|讨论|同步会|周会|例会)/.test(s)) return 'meeting';
  if (/(待办|todo|TODO|记得|别忘|截止|deadline|任务清单)/.test(s)) return 'todo';
  if (/(灵感|想法|点子|idea|或许|也许|可以考虑|如果做)/i.test(s)) return 'idea';
  if (/(资料|参考|摘录|文章|书|课程|论文|阅读|笔记)/.test(s)) return 'reference';
  return 'note';
}

export function extractTags(text, type) {
  const s = String(text || '');
  const tags = [];
  const push = (t) => {
    const tag = String(t).replace(/^#/, '').trim().slice(0, 10);
    if (tag && !tags.includes(tag) && tags.length < 4) tags.push(tag);
  };
  for (const m of s.matchAll(/#([\u4e00-\u9fa5A-Za-z0-9_-]{1,12})/g)) push(m[1]);
  for (const [tag, re] of TAG_RULES) {
    if (re.test(s)) push(tag);
    if (tags.length >= 4) break;
  }
  if (!tags.length) push(type === 'todo' ? '待办' : type === 'idea' ? '灵感' : '随手记');
  return tags;
}

export function extractKeyPoints(text, max = 4) {
  const lines = normalizeText(text).split('\n').map((l) => l.trim()).filter(Boolean);
  const points = [];
  const seen = new Set();
  const add = (v) => {
    const clean = stripMarkdown(v)
      .replace(CHECKBOX, '')
      .replace(TODO_PREFIX, '')
      .replace(/^[\d]+[.、)]\s*/, '')
      .trim();
    if (clean.length < 5 || clean.length > 120) return;
    const key = clean.slice(0, 30);
    if (seen.has(key)) return;
    seen.add(key);
    points.push(clean);
  };
  for (const line of lines) {
    if (/^([-*+]|\d+[.、)]|#{2,6})\s+/.test(line) || CHECKBOX.test(line)) add(line);
    if (points.length >= max) break;
  }
  if (points.length < 2) {
    for (const s of splitSentences(text)) {
      if (/(重点|关键|结论|核心|记住|注意|决定|确认)/.test(s)) add(s);
      if (points.length >= max) break;
    }
  }
  if (points.length < 2) {
    for (const s of splitSentences(text)) {
      add(s);
      if (points.length >= max) break;
    }
  }
  return points.slice(0, max);
}

export function parseDue(text, base = new Date()) {
  const s = String(text || '');
  if (!s) return null;
  let m;
  if ((m = s.match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/))) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : fmtDate(d);
  }
  if ((m = s.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?/))) {
    let d = new Date(base.getFullYear(), Number(m[1]) - 1, Number(m[2]));
    if (d < addDays(base, -1)) d = new Date(base.getFullYear() + 1, Number(m[1]) - 1, Number(m[2]));
    return fmtDate(d);
  }
  if ((m = s.match(/(\d{1,3})\s*天后/))) return fmtDate(addDays(base, Number(m[1])));
  const offsets = [
    [/今天|今日|today/i, 0],
    [/明天|明日|tomorrow/i, 1],
    [/后天/, 2],
    [/大后天/, 3],
  ];
  for (const [re, n] of offsets) if (re.test(s)) return fmtDate(addDays(base, n));
  if (/这?周[末天]/.test(s)) {
    const start = startOfWeek(base);
    return fmtDate(addDays(start, 6));
  }
  if (/下周[末天]/.test(s)) {
    const start = startOfWeek(base);
    return fmtDate(addDays(start, 13));
  }
  const weekMap = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7 };
  if ((m = s.match(/(下周|下星期|本周|这周|周|星期)\s*([一二三四五六日天])/))) {
    const target = weekMap[m[2]];
    const start = startOfWeek(base);
    let offset = target - 1;
    if (/下周|下星期/.test(m[1])) offset += 7;
    else if (!/本周|这周/.test(m[1])) {
      const today = base.getDay() === 0 ? 7 : base.getDay();
      if (target < today) offset += 7;
    }
    return fmtDate(addDays(start, offset));
  }
  if (/月底|月末/.test(s)) {
    return fmtDate(new Date(base.getFullYear(), base.getMonth() + 1, 0));
  }
  if (/下个?月/.test(s)) {
    return fmtDate(new Date(base.getFullYear(), base.getMonth() + 1, 15));
  }
  return null;
}

export function extractTodos(text, base = new Date()) {
  const lines = normalizeText(text).split('\n').map((l) => l.trim()).filter(Boolean);
  const out = [];
  const seen = new Set();
  const push = (raw, hint = '') => {
    let clean = String(raw)
      .replace(CHECKBOX, '')
      .replace(TODO_PREFIX, '')
      .replace(/^[-*+]\s+/, '')
      .replace(/^[\d]+[.、)]\s*/, '')
      .trim();
    if (!clean || clean.length < 3 || clean.length > 90) return;
    clean = clean.replace(/[；;。]$/, '');
    const key = clean.slice(0, 24).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const due = parseDue(`${clean} ${hint}`, base);
    const priority = /(紧急|尽快|马上|立刻|重要|今天|明天|截止)/.test(`${clean} ${hint}`)
      ? 'high'
      : /(有空|不急|以后|哪天|闲时)/.test(clean)
        ? 'low'
        : 'medium';
    out.push({ text: clean, due, priority });
  };

  for (const line of lines) {
    if (CHECKBOX.test(line)) { push(line); continue; }
    if (TODO_PREFIX.test(line)) { push(line); continue; }
    const sentences = line.split(/[。；;！？!?]/).map((x) => x.trim()).filter(Boolean);
    for (const sentence of sentences) {
      const clauses = /(记得|别忘|还有|另外|待办)/.test(sentence)
        ? sentence.split(/[，,]/).map((x) => x.trim()).filter(Boolean)
        : [sentence];
      for (const clause of clauses) {
        if (/(记得|别忘|待办|截止|deadline|之前要|需要做|要做|记得要)/i.test(clause) && ACTION_VERBS.test(clause)) {
          push(clause);
          continue;
        }
        if (parseDue(clause, base) && ACTION_VERBS.test(clause) && clause.length < 80) push(clause);
      }
    }
    if (out.length >= 6) break;
  }
  return out.slice(0, 5);
}

export function extractEntities(text, max = 6) {
  const s = String(text || '');
  const out = [];
  const add = (v) => {
    const clean = String(v).trim();
    if (clean.length < 2 || clean.length > 24) return;
    if (!out.includes(clean) && out.length < max) out.push(clean);
  };
  for (const m of s.matchAll(/《([^》]{1,24})》/g)) add(m[1]);
  for (const m of s.matchAll(/["“]([^"”]{2,18})["”]/g)) add(m[1]);
  for (const m of s.matchAll(/#([\u4e00-\u9fa5A-Za-z0-9_-]{2,12})/g)) add(m[1]);
  for (const m of s.matchAll(/\b([A-Z][A-Za-z0-9.+-]{2,18})\b/g)) add(m[1]);
  return out.slice(0, max);
}

export function similarity(a, b, idf) {
  const ta = new Set(tokenize(`${a.title} ${(a.tags || []).join(' ')} ${a.summary || ''} ${String(a.content || '').slice(0, 400)}`));
  const tb = new Set(tokenize(`${b.title} ${(b.tags || []).join(' ')} ${b.summary || ''} ${String(b.content || '').slice(0, 400)}`));
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  let wa = 0;
  let wb = 0;
  for (const t of ta) wa += idf.get(t) || 0.4;
  for (const t of tb) wb += idf.get(t) || 0.4;
  for (const t of ta) if (tb.has(t)) shared += idf.get(t) || 0.4;
  const cosine = shared / Math.sqrt(wa * wb || 1);
  const tagsA = new Set(a.tags || []);
  const tagsB = new Set(b.tags || []);
  let inter = 0;
  for (const t of tagsA) if (tagsB.has(t)) inter++;
  const jaccard = inter / Math.max(1, new Set([...tagsA, ...tagsB]).size);
  return Math.min(1, cosine * 0.85 + jaccard * 0.3);
}

export function relateAll(notes) {
  const index = buildIndex(notes);
  const map = new Map();
  for (const note of notes) {
    const scored = notes
      .filter((n) => n.id !== note.id && !n.archived)
      .map((n) => ({ id: n.id, score: similarity(note, n, index.idf) }))
      .filter((x) => x.score >= 0.08)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
    map.set(note.id, scored);
    note.links = scored.map((x) => x.id);
    note.linkScores = Object.fromEntries(scored.map((x) => [x.id, Number(x.score.toFixed(2))]));
  }
  return map;
}
