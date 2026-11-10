/* ============================================================
   知屿 · 前端应用
   原生 ES Module，无构建步骤。状态集中在 S，视图按需重绘。
   ============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const TYPE_META = {
  note: { label: '随记', icon: 'file' },
  idea: { label: '想法', icon: 'bulb' },
  reference: { label: '资料', icon: 'book' },
  meeting: { label: '会议', icon: 'users' },
  todo: { label: '待办', icon: 'checkSquare' },
  link: { label: '链接', icon: 'link' },
};

const PRIORITY_META = {
  high: { label: '高', className: 'high' },
  medium: { label: '中', className: 'medium' },
  low: { label: '低', className: 'low' },
};

const GRAPH_COLORS = {
  note: '#8a8476',
  idea: '#b5542f',
  reference: '#5f719b',
  meeting: '#8b5f78',
  todo: '#3f7464',
  link: '#a97f37',
};

const ICONS = {
  inbox: '<path d="M4 13h4l2 3h4l2-3h4"/><path d="M5.5 5h13l2.5 8v5a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2v-5z"/>',
  check: '<path d="M4 7h9M4 12h6M4 17h9"/><path d="m14.5 15 2.2 2.2L21.5 12"/>',
  checkSquare: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="m8 12 2.7 2.7L16 9"/>',
  chat: '<path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-3.5 2 1-4.2A8 8 0 1 1 20 11.5Z"/><path d="M8.5 9.5h7M8.5 13h4.5"/>',
  spark: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="3.2"/>',
  graph: '<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="8" r="2.2"/><circle cx="11" cy="18" r="2.2"/><path d="m7.9 7.2 8.1.6M7 8.1l3 7.8M16.6 9.9l-4 6.2"/>',
  settings: '<path d="M4 7h9M18 7h2M4 17h2M11 17h9"/><circle cx="15.5" cy="7" r="2.1"/><circle cx="8" cy="17" r="2.1"/>',
  lock: '<rect x="4.5" y="10" width="15" height="10" rx="2.2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.2"/><path d="m15 15 5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  pin: '<path d="m14 4 6 6-3 .7-2.7 2.7-.8 3.8-5.4-5.4 3.7-.9L14.6 8 14 4Z"/><path d="m9.8 14.2-4.3 4.3"/>',
  trash: '<path d="M4 7h16M9 7V4.8h6V7M6.5 7l1 12.2h9L17.5 7M10 11v5M14 11v5"/>',
  refresh: '<path d="M20 7v5h-5"/><path d="M18.3 16a8 8 0 1 1 .9-7.2L20 12"/>',
  edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17l-1 3Z"/><path d="m14.5 7.5 2 2"/>',
  link: '<path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7L11.5 6.3"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 1 0 5.7 5.7l1.3-1.3"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.6M17.5 13.5a5.5 5.5 0 0 1 3 5"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M8 14.5A6 6 0 1 1 16 14.5c-.7.6-1 1.4-1 2.5H9c0-1.1-.3-1.9-1-2.5Z"/>',
  file: '<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5M9 12h6M9 16h6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  clock: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.5V12l3 2"/>',
  bell: '<path d="M18 15.5V10a6 6 0 1 0-12 0v5.5L4.5 18h15L18 15.5Z"/><path d="M10 21h4"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 19h14"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M5 19h14"/>',
  database: '<ellipse cx="12" cy="6" rx="7.5" ry="3"/><path d="M4.5 6v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6M4.5 12v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6"/>',
  wand: '<path d="m5 19 9-9M13 5l.8 2.2L16 8l-2.2.8L13 11l-.8-2.2L10 8l2.2-.8L13 5ZM18 13l.6 1.4L20 15l-1.4.6L18 17l-.6-1.4L16 15l1.4-.6L18 13Z"/>',
  alert: '<path d="M12 4 3.5 19h17L12 4Z"/><path d="M12 9v4.5M12 16.7v.1"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5H5V6h5"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  more: '<circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  quote: '<path d="M9 7H5v5h4v5H5M19 7h-4v5h4v5h-4"/>',
  save: '<path d="M5 4h11l3 3v13H5V4Z"/><path d="M8 4v6h7V4M8 16h8"/>',
};

function icon(name, cls = '') {
  const path = ICONS[name] || ICONS.file;
  return `<span class="nav-icon ${cls}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg></span>`;
}

function hydrateIcons(root = document) {
  $$('[data-icon]', root).forEach((el) => {
    if (el.dataset.hydrated) return;
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[el.dataset.icon] || ICONS.file}</svg>`;
    el.dataset.hydrated = '1';
  });
}

const S = {
  data: null,
  view: 'notes',
  selectedId: null,
  filterType: 'all',
  activeTag: null,
  sort: 'new',
  query: '',
  searchResults: null,
  searching: false,
  showDone: true,
  summaryRange: 'week',
  activeSummaryId: null,
  generatingSummary: false,
  messages: [],
  streaming: false,
  chatMessages: [],
  chatStreaming: false,
  chatThreadId: null,
  ai: null,
  mobileDetail: false,
  editingContent: false,
  tagEditing: false,
  addedActions: new Set(),
  remindTarget: null,
  graph: null,
};

/* ---------------- Utilities ---------------- */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/\n/g, '&#10;');
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function truncate(str, n = 40) {
  const s = String(str || '');
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function safeType(type) {
  return TYPE_META[type] ? type : 'note';
}

function fmtDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtShortDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function fmtRelative(iso) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (Number.isNaN(diff)) return '';
  const min = 60 * 1000;
  const hour = 60 * min;
  if (diff < min) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / min)} 分钟前`;
  if (diff < 6 * hour) return `${Math.floor(diff / hour)} 小时前`;
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (d.getTime() >= startToday) return `今天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (d.getTime() >= startToday - 86400000) return `昨天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)} 天前`;
  if (d.getFullYear() === today.getFullYear()) return fmtShortDate(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dueLabel(due) {
  if (!due) return '';
  const today = todayStr();
  if (due < today) {
    const days = Math.round((new Date(`${today}T00:00:00`) - new Date(`${due}T00:00:00`)) / 86400000);
    return days === 1 ? '昨天到期' : `已逾期 ${days} 天`;
  }
  if (due === today) return '今天到期';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const t = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  if (due === t) return '明天到期';
  const d = new Date(`${due}T00:00:00`);
  const diff = Math.round((d - new Date(`${today}T00:00:00`)) / 86400000);
  if (diff > 1 && diff <= 7) {
    return `${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]} · ${d.getMonth() + 1}/${d.getDate()}`;
  }
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function dueClass(due, done) {
  if (!due || done) return '';
  const today = todayStr();
  if (due < today) return 'overdue';
  if (due === today) return 'today';
  return '';
}

const WEEKDAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

// 提醒时间在前端统一用「本地钟点」字符串 YYYY-MM-DDTHH:mm，和服务端保持一致。
function toLocalInput(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function dayKeyOf(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function remindLabel(remindAt) {
  if (!remindAt) return '';
  const d = new Date(remindAt);
  if (Number.isNaN(d.getTime())) return '';
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const dayKey = dayKeyOf(d);
  const today = todayStr();
  if (dayKey === today) return `今天 ${time}`;
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  if (dayKey === dayKeyOf(tmr)) return `明天 ${time}`;
  const diffDays = Math.round((new Date(`${dayKey}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000);
  if (diffDays > 1 && diffDays <= 7) return `${WEEKDAY[d.getDay()]} ${time}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${time}`;
}

// '' | 'soon'（1 小时内）| 'past'（已到点但还没确认）
function remindState(remindAt, done) {
  if (!remindAt || done) return '';
  const diff = new Date(remindAt).getTime() - Date.now();
  if (Number.isNaN(diff)) return '';
  if (diff <= 0) return 'past';
  if (diff <= 60 * 60000) return 'soon';
  return '';
}

function highlight(text, query) {
  const escaped = escapeHtml(text);
  const q = String(query || '').trim();
  if (!q || /[&<>"']/.test(q)) return escaped;
  const terms = [q, ...q.split(/\s+/)].filter((t) => t.length >= 2).sort((a, b) => b.length - a.length).slice(0, 3);
  let out = escaped;
  for (const term of terms) {
    const safe = escapeRegExp(term).replace(/&/g, '&amp;');
    try {
      out = out.replace(new RegExp(`(${safe})`, 'gi'), '<mark>$1</mark>');
    } catch { /* 忽略特殊字符 */ }
  }
  return out;
}

function linkifyEscaped(escaped) {
  return escaped.replace(/(https?:\/\/[^\s<]+)/g, (url) => {
    const clean = url.replace(/[),.;，。；]+$/, '');
    const tail = url.slice(clean.length);
    return `<a href="${clean}" target="_blank" rel="noopener noreferrer">${clean}</a>${tail}`;
  });
}

function inlineMd(text) {
  let s = escapeHtml(text);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^\*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  s = s.replace(/\[(\d{1,2})\]/g, '<span class="cite-ref" data-cite="$1">[$1]</span>');
  return s;
}

function mdToHtml(markdown) {
  const text = String(markdown || '').replace(/\r\n/g, '\n').trim();
  if (!text) return '';
  const lines = text.split('\n');
  const out = [];
  let para = [];
  let list = null;
  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inlineMd(para.join('\n')).replace(/\n/g, '<br>')}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const tag = list.type === 'ol' ? 'ol' : 'ul';
      out.push(`<${tag}>${list.items.map((i) => `<li>${inlineMd(i)}</li>`).join('')}</${tag}>`);
      list = null;
    }
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line)) {
      flushPara(); flushList();
      const code = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
      out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }
    if (!line.trim()) { flushPara(); flushList(); continue; }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flushPara(); flushList();
      out.push(`<h${h[1].length}>${inlineMd(h[2])}</h${h[1].length}>`);
      continue;
    }
    if (/^([-*_]\s*){3,}$/.test(line.trim())) { flushPara(); flushList(); out.push('<hr>'); continue; }
    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ul) {
      flushPara();
      if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; }
      list.items.push(ul[1]);
      continue;
    }
    const ol = line.match(/^\s*\d+[.、)]\s+(.*)$/);
    if (ol) {
      flushPara();
      if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; }
      list.items.push(ol[1]);
      continue;
    }
    if (/^>\s?/.test(line)) {
      flushPara(); flushList();
      out.push(`<blockquote>${inlineMd(line.replace(/^>\s?/, ''))}</blockquote>`);
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara(); flushList();
  return out.join('');
}

async function api(path, options = {}) {
  const opts = { ...options, headers: { ...(options.headers || {}) } };
  if (opts.body && typeof opts.body !== 'string') {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(path, opts);
  const type = res.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.error || `请求失败（${res.status}）`);
  return data;
}

function debounce(fn, wait = 220) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

function toast(message, type = 'ok', duration = 3400) {
  const wrap = $('#toastWrap');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="dot"></span><span>${escapeHtml(message)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px)';
    el.style.transition = 'all .2s ease';
    setTimeout(() => el.remove(), 220);
  }, duration);
}

let procTimer = null;
let procIndex = 0;
let procSteps = [];
function startProcessing(title, steps) {
  procSteps = steps.length ? steps : ['读取内容…', '判断类型…', '生成摘要…', '建立关联…'];
  procIndex = 0;
  $('#processingTitle').textContent = title;
  $('#processingStep').textContent = procSteps[0];
  $('#processingCard').classList.remove('hidden');
  clearInterval(procTimer);
  procTimer = setInterval(() => {
    procIndex = Math.min(procIndex + 1, procSteps.length - 1);
    $('#processingStep').textContent = procSteps[procIndex];
  }, 950);
}
function stopProcessing() {
  clearInterval(procTimer);
  procTimer = null;
  $('#processingCard').classList.add('hidden');
}

let confirmResolver = null;
function confirmDialog({ title = '确认操作', message = '', okText = '确认', danger = true }) {
  $('#confirmTitle').textContent = title;
  $('#confirmMessage').textContent = message;
  const ok = $('#confirmOk');
  ok.textContent = okText;
  ok.className = `btn ${danger ? 'danger' : 'primary'}`;
  $('#confirmModal').classList.remove('hidden');
  return new Promise((resolve) => { confirmResolver = resolve; });
}
function settleConfirm(value) {
  $('#confirmModal').classList.add('hidden');
  if (confirmResolver) confirmResolver(value);
  confirmResolver = null;
}

/* ---------------- Data helpers ---------------- */

function activeNotes() {
  return (S.data?.notes || []).filter((n) => !n.archived);
}

function noteById(id) {
  return (S.data?.notes || []).find((n) => n.id === id) || null;
}

function searchVisible() {
  return S.query.trim() && Array.isArray(S.searchResults);
}

function visibleNotes() {
  let notes = searchVisible() ? [...S.searchResults] : activeNotes();
  if (!searchVisible()) {
    if (S.filterType !== 'all') notes = notes.filter((n) => n.type === S.filterType);
    if (S.activeTag) notes = notes.filter((n) => (n.tags || []).includes(S.activeTag));
    if (S.sort === 'old') notes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (S.sort === 'title') notes.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'));
    else notes.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }
  return notes;
}

const VIEW_META = {
  notes: { title: '全部记录', sub: '把零散的想法放进来，剩下的交给管家。' },
  todos: { title: '待办事项', sub: '把承诺从记录里捞出来，一件件放下。' },
  ask: { title: '智能问答', sub: '只基于你的记录回答，并给出出处。' },
  chat: { title: '自由聊天', sub: '和本地大模型随意聊聊，不检索你的记录。' },
  summary: { title: '阶段总结', sub: '回看一段时间，提炼模式，决定下一步。' },
  graph: { title: '关系图谱', sub: '让记录之间自己长出连接。' },
};

/* ---------------- Render: shell ---------------- */

function renderSidebar() {
  const stats = S.data.stats || {};
  $('#navCountNotes').textContent = stats.totalNotes ?? 0;
  $('#navCountTodos').textContent = stats.openTodos ?? 0;
  $$('#nav .nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === S.view));

  const tags = (S.data.tags || []).slice(0, 9);
  const list = $('#tagList');
  if (!tags.length) {
    list.innerHTML = '<span class="tag-empty">记录后会在这里生成主题</span>';
  } else {
    list.innerHTML = tags.map((t) => `
      <button class="tag-pill ${S.activeTag === t.name ? 'active' : ''}" data-tag="${escapeAttr(t.name)}" type="button">
        ${escapeHtml(t.name)} <b>${t.count}</b>
      </button>`).join('');
  }
  updateAIPill();
}

function updateAIPill() {
  const dot = $('#aiDot');
  const label = $('#aiLabel');
  const model = $('#aiModel');
  if (!S.ai) {
    dot.className = 'status-dot warn';
    label.textContent = '检测本地模型…';
    model.textContent = '本地规则可用';
    return;
  }
  if (S.ai.ok) {
    dot.className = 'status-dot ok';
    label.textContent = '本地模型已连接';
    model.textContent = S.ai.model || 'Ollama';
  } else {
    dot.className = 'status-dot warn';
    label.textContent = '本地规则模式';
    model.textContent = '未连接模型 · 点击设置';
  }
}

function renderHeader() {
  const meta = VIEW_META[S.view] || VIEW_META.notes;
  let title = meta.title;
  let sub = meta.sub;
  if (S.view === 'notes') {
    if (S.query.trim()) {
      title = '搜索结果';
      sub = `正在检索「${S.query.trim()}」`;
    } else if (S.activeTag) {
      title = `# ${S.activeTag}`;
      sub = '这个主题下的所有记录。';
    }
  }
  $('#viewTitle').textContent = title;
  $('#viewSub').textContent = sub;
  const searchWrap = $('#searchWrap');
  searchWrap.classList.toggle('hidden', S.view !== 'notes');
  const input = $('#searchInput');
  if (document.activeElement !== input) input.value = S.query || '';
  $('#searchClear').classList.toggle('hidden', !S.query || S.view !== 'notes');
}

function renderAll() {
  renderSidebar();
  renderHeader();
  renderCurrentView();
  hydrateIcons();
}

function renderCurrentView() {
  $$('.view').forEach((v) => v.classList.add('hidden'));
  const view = $(`#view${S.view[0].toUpperCase()}${S.view.slice(1)}`);
  view?.classList.remove('hidden');
  if (S.view === 'notes') renderNotes();
  if (S.view === 'todos') renderTodos();
  if (S.view === 'ask') renderAsk();
  if (S.view === 'chat') renderChat();
  if (S.view === 'summary') renderSummary();
  if (S.view === 'graph') setTimeout(startGraph, 30);
  hydrateIcons(view || document);
}

/* ---------------- Render: notes ---------------- */

function renderNotes() {
  const notes = visibleNotes();
  const list = $('#noteList');
  const hasDemo = activeNotes().some((n) => n.demo);
  $('#demoBanner').classList.toggle('hidden', !hasDemo);
  $('#listCount').textContent = searchVisible()
    ? `${notes.length} 条结果 · 按相关度`
    : `${notes.length} 条记录`;
  $('#typeFilters').querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.dataset.type === S.filterType));

  if (!notes.length) {
    if (S.query.trim()) {
      list.innerHTML = `<div class="list-empty"><div class="empty-glyph">∅</div><p>没有找到相关记录。<br>换个关键词，或把它记下来。</p><button class="btn ghost" data-open-capture type="button">记录一条</button></div>`;
    } else if (S.activeTag) {
      list.innerHTML = `<div class="list-empty"><div class="empty-glyph">#</div><p>这个主题下暂时没有记录。</p><button class="btn ghost" data-clear-tag type="button">查看全部</button></div>`;
    } else if (S.filterType !== 'all') {
      list.innerHTML = `<div class="list-empty"><div class="empty-glyph">·</div><p>这个分类还是空的。</p><button class="btn ghost" data-clear-filter type="button">查看全部</button></div>`;
    } else {
      list.innerHTML = `<div class="list-empty"><div class="empty-glyph">屿</div><p>这里还是一片空地。<br>记下第一个想法，它会慢慢长出连接。</p><button class="btn primary" data-open-capture type="button">写第一条记录</button></div>`;
    }
  } else {
    list.innerHTML = notes.map((n) => noteCard(n)).join('');
  }

  if (notes.length && (!S.selectedId || !notes.some((n) => n.id === S.selectedId))) {
    S.selectedId = notes[0].id;
  }
  const selected = noteById(S.selectedId);
  renderDetail(selected);
  $('#viewNotes').classList.toggle('show-detail', S.mobileDetail && !!selected);
  hydrateIcons($('#viewNotes'));
}

function noteCard(note) {
  const type = safeType(note.type);
  const meta = TYPE_META[type];
  const openTodos = (S.data.todos || []).filter((t) => t.noteId === note.id && !t.done).length;
  const summary = searchVisible() && note._snippet ? note._snippet : note.summary;
  return `
    <article class="note-card ${note.id === S.selectedId ? 'active' : ''}" data-note-id="${escapeAttr(note.id)}" tabindex="0">
      <div class="nc-top">
        <span class="nc-type ${type}">${icon(meta.icon)}${meta.label}</span>
        ${note.pinned ? `<span class="nc-pin">${icon('pin')}</span>` : ''}
        <span class="nc-time">${fmtRelative(note.createdAt)}</span>
      </div>
      <h3 class="nc-title">${highlight(note.title, searchVisible() ? S.query : '')}</h3>
      <p class="nc-summary">${highlight(summary || '（暂无摘要）', searchVisible() ? S.query : '')}</p>
      <div class="nc-foot">
        ${(note.tags || []).slice(0, 2).map((t) => `<span class="tag-mini">${escapeHtml(t)}</span>`).join('')}
        ${openTodos ? `<span class="nc-todo-flag">${icon('checkSquare')}${openTodos}</span>` : ''}
      </div>
    </article>`;
}

function renderDetail(note) {
  const pane = $('#detailPane');
  if (!note) {
    if (S.query.trim() && searchVisible() && !S.searchResults.length) {
      pane.innerHTML = `
        <div class="empty-detail">
          <div class="glyph">∅</div>
          <h2>没有找到「${escapeHtml(S.query.trim())}」</h2>
          <p>换个关键词试试，或者把它记录成一条新内容。搜索会同时匹配标题、摘要、标签和原文。</p>
          <button class="btn ghost" data-clear-search-all type="button">清空搜索</button>
        </div>`;
      return;
    }
    const stats = S.data.stats || {};
    pane.innerHTML = `
      <div class="empty-detail">
        <div class="glyph">屿</div>
        <h2>让信息在这里靠岸</h2>
        <p>记录想法、资料和待办。知屿会为你分类、摘要，并把彼此相关的部分连起来。</p>
        <div class="empty-detail-stats">
          <div class="empty-detail-stat"><b>${stats.totalNotes ?? 0}</b><span>条记录</span></div>
          <div class="empty-detail-stat"><b>${stats.openTodos ?? 0}</b><span>件待办</span></div>
          <div class="empty-detail-stat"><b>${stats.streak ?? 0}</b><span>天连续</span></div>
        </div>
        <button class="btn primary" data-open-capture type="button">${icon('plus')} 记录此刻</button>
      </div>`;
    return;
  }

  const meta = TYPE_META[safeType(note.type)] || TYPE_META.note;
  const related = (note.links || []).map(noteById).filter(Boolean);
  const todos = (S.data.todos || []).filter((t) => t.noteId === note.id);
  const aiMode = note.ai?.mode === 'llm'
    ? `${escapeHtml(note.ai.model || S.data.settings.chatModel)} 整理`
    : note.ai?.mode === 'demo' ? '示例数据'
      : '本地规则整理';
  const aiError = note.ai?.error ? `<span class="sep">·</span><span title="${escapeAttr(note.ai.error)}">模型未连接</span>` : '';

  pane.innerHTML = `
    <div class="detail-inner" data-id="${escapeAttr(note.id)}">
      <button class="mobile-back" data-action="back" type="button">${icon('arrowLeft')} 返回记录</button>
      <div class="detail-head">
        <div class="detail-head-left">
          <span class="type-badge ${safeType(note.type)}">${icon(meta.icon)}${meta.label}</span>
          <span class="detail-date">${fmtDateTime(note.createdAt)}</span>
        </div>
        <div class="detail-head-actions">
          <button class="icon-btn ${note.pinned ? 'pinned' : ''}" data-action="pin" title="${note.pinned ? '取消置顶' : '置顶'}" type="button">${icon('pin')}</button>
          <button class="icon-btn" data-action="delete" title="删除记录" type="button">${icon('trash')}</button>
        </div>
      </div>

      <div class="detail-title">
        <textarea id="detailTitle" rows="1" aria-label="记录标题" spellcheck="false">${escapeHtml(note.title)}</textarea>
      </div>

      <div class="detail-tags" id="detailTags">
        ${(note.tags || []).map((t) => `<span class="detail-tag">${escapeHtml(t)}<button data-remove-tag="${escapeAttr(t)}" title="移除标签" type="button">×</button></span>`).join('')}
        <button class="add-tag-btn" data-action="add-tag" type="button">+ 添加标签</button>
      </div>

      <div class="summary-card">
        <div class="summary-label">${icon('spark')} 管家摘要</div>
        <p class="summary-text">${escapeHtml(note.summary || '还没有摘要。点击下方「重新整理」生成。')}</p>
        <div class="ai-meta-line"><span>${aiMode}</span>${aiError}<span class="sep">·</span><span>${fmtRelative(note.ai?.at || note.updatedAt)}</span></div>
      </div>

      ${(note.keyPoints || []).length ? `
      <section class="detail-section">
        <div class="detail-section-head"><h3>关键信息 <span>${note.keyPoints.length}</span></h3></div>
        <ul class="kp-list">${note.keyPoints.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
        ${(note.entities || []).length ? `<div class="entity-row">${note.entities.map((e) => `<span class="entity-chip">${escapeHtml(e)}</span>`).join('')}</div>` : ''}
      </section>` : ''}

      ${todos.length ? `
      <section class="detail-section">
        <div class="detail-section-head"><h3>关联待办 <span>${todos.filter((t) => !t.done).length} 未完成</span></h3><button class="section-action" data-action="show-todos" type="button">查看全部</button></div>
        <div class="detail-todos">
          ${todos.map((t) => `
            <div class="detail-todo ${t.done ? 'done' : ''}">
              <button class="check ${t.done ? 'checked' : ''}" data-toggle-todo="${escapeAttr(t.id)}" aria-label="切换完成状态" type="button"></button>
              <span class="dt-text">${escapeHtml(t.text)}</span>
              <button class="dt-remind ${remindState(t.remindAt, t.done)}" data-remind-todo="${escapeAttr(t.id)}" title="${t.remindAt ? '修改提醒时间' : '设置提醒时间'}" type="button">${icon('clock')}${t.remindAt ? `<span>${remindLabel(t.remindAt)}</span>` : ''}</button>
              ${t.due ? `<span class="dt-due ${dueClass(t.due, t.done)}">${dueLabel(t.due)}</span>` : ''}
            </div>`).join('')}
        </div>
      </section>` : ''}

      <section class="detail-section">
        <div class="detail-section-head"><h3>相关记录 <span>${related.length}</span></h3></div>
        ${related.length ? `<div class="rel-grid">
          ${related.slice(0, 4).map((r) => {
            const rm = TYPE_META[r.type] || TYPE_META.note;
            return `<button class="rel-card" data-open-note="${escapeAttr(r.id)}" type="button">
              <div class="rel-type">${rm.label}</div>
              <div class="rel-title">${escapeHtml(r.title)}</div>
              <div class="rel-summary">${escapeHtml(r.summary || '')}</div>
            </button>`;
          }).join('')}
        </div>` : `<p class="rel-empty">还没有明显相关的记录。多写几条，或在设置中开启向量检索。</p>`}
      </section>

      <section class="detail-section">
        <div class="detail-section-head"><h3>原文</h3><button class="section-action" data-action="edit-content" type="button">${S.editingContent ? '取消编辑' : '编辑'}</button></div>
        ${S.editingContent ? `
          <textarea class="content-edit" id="contentEdit">${escapeHtml(note.content)}</textarea>
          <div style="display:flex;gap:7px;justify-content:flex-end;margin-top:9px">
            <button class="btn ghost small" data-action="cancel-content" type="button">取消</button>
            <button class="btn primary small" data-action="save-content" type="button">保存并重新整理</button>
          </div>` : `
          <div class="content-block">${linkifyEscaped(escapeHtml(note.content))}</div>`}
      </section>

      <div class="detail-footer">
        <div class="detail-footer-note">这条记录保存在本机 · ${(note.content || '').length} 字<br>标签和摘要可以随时修改，原文不会被上传。</div>
        <div class="footer-actions">
          <button class="btn ghost small" data-action="reprocess" type="button">${icon('refresh')} 重新整理</button>
        </div>
      </div>
    </div>`;
  requestAnimationFrame(autoGrowTitle);
}

function autoGrowTitle() {
  const el = $('#detailTitle');
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

/* ---------------- Render: todos ---------------- */

function renderTodos() {
  const todos = S.data.todos || [];
  const stats = S.data.stats || {};
  const open = todos.filter((t) => !t.done);
  const overdue = open.filter((t) => t.group === 'overdue');
  const today = open.filter((t) => t.group === 'today');
  const done = todos.filter((t) => t.done);
  const pct = todos.length ? Math.round((done.length / todos.length) * 100) : 0;

  const groups = [
    { key: 'overdue', title: '已逾期', items: overdue },
    { key: 'today', title: '今天', items: today },
    { key: 'week', title: '未来 7 天', items: open.filter((t) => t.group === 'week') },
    { key: 'later', title: '以后', items: open.filter((t) => t.group === 'later') },
  ];
  if (S.showDone) groups.push({ key: 'done', title: '已完成', items: done });

  const groupHtml = groups.filter((g) => g.items.length || g.key === 'today').map((g) => `
    <div class="todo-group">
      <div class="todo-group-head ${g.key}">
        <h3>${g.title}</h3><span class="count">${g.items.length}</span><span class="line"></span>
        ${g.key === 'done' ? `<button class="section-action" data-toggle-done type="button">收起</button>` : ''}
      </div>
      <div class="todo-rows">
        ${g.items.length ? g.items.map(todoRow).join('') : '<div class="todo-empty" style="padding:14px 10px">今天没有到期的事，享受一点空白。</div>'}
      </div>
    </div>`).join('');

  $('#todosInner').innerHTML = `
    <div class="todos-header">
      <div><h2>把事情放下</h2><p>从笔记里自动提取，也可以随时添加；设好时间，到点会来叫你。</p></div>
    </div>

    <div class="todo-stats">
      <div class="stat-card"><div class="stat-label">未完成</div><div class="stat-value"><b>${open.length}</b><span>件</span></div></div>
      <div class="stat-card ${overdue.length ? 'highlight' : ''}"><div class="stat-label">已逾期</div><div class="stat-value"><b class="${overdue.length ? 'danger' : ''}">${overdue.length}</b><span>件</span></div></div>
      <div class="stat-card"><div class="stat-label">今天到期</div><div class="stat-value"><b>${today.length}</b><span>件</span></div></div>
      <div class="stat-card"><div class="stat-label">本周完成</div><div class="stat-value"><b>${stats.doneThisWeek ?? 0}</b><span>件</span></div></div>
    </div>

    <div class="progress-card">
      <span class="progress-pct">${pct}%</span>
      <div class="progress-bar"><i style="width:${pct}%"></i></div>
      <span class="progress-text">已完成 ${done.length} / ${todos.length}</span>
    </div>

    <form class="todo-add" id="quickTodoForm">
      <span class="plus">+</span>
      <input type="text" id="quickTodoText" placeholder="添加一件待办，例如「周五前回复报价邮件」" autocomplete="off" />
      <div class="ta-time">
        <span class="ta-label">截止</span>
        <input type="date" id="quickTodoDue" aria-label="截止日期" title="截止日期（可选）" />
        <span class="ta-label">提醒</span>
        <input type="time" id="quickTodoTime" aria-label="提醒时间" title="提醒时间，到点会提醒你（可选）" />
      </div>
      <select id="quickTodoPriority" aria-label="优先级">
        <option value="medium">中优先级</option>
        <option value="high">高优先级</option>
        <option value="low">低优先级</option>
      </select>
      <button class="btn primary small" type="submit">加入</button>
    </form>

    ${groupHtml || '<div class="todo-empty"><div style="font-family:var(--serif);font-size:38px;color:var(--line-strong);margin-bottom:10px">空</div>还没有待办。写一条带「明天要…」的记录，或在上方直接添加。</div>'}

    <div class="todo-done-toggle">
      <button data-toggle-done type="button">${S.showDone ? '隐藏已完成' : `显示已完成（${done.length}）`}</button>
    </div>`;
}

function todoRow(t) {
  const p = PRIORITY_META[t.priority] || PRIORITY_META.medium;
  const rState = remindState(t.remindAt, t.done);
  return `
    <div class="todo-row ${t.done ? 'done' : ''}" data-todo-row="${escapeAttr(t.id)}">
      <button class="check ${t.done ? 'checked' : ''}" data-toggle-todo="${escapeAttr(t.id)}" aria-label="${t.done ? '标记未完成' : '标记完成'}" type="button"></button>
      <div class="tr-body">
        <div class="tr-text">${escapeHtml(t.text)}</div>
        <div class="tr-meta">
          <span class="prio ${p.className}"><i></i>${p.label}</span>
          ${t.due ? `<span class="due ${dueClass(t.due, t.done)}">${t.done ? '已完成' : dueLabel(t.due)}</span>` : '<span class="due">无截止日期</span>'}
          ${t.remindAt ? `<button class="remind-chip ${rState}" data-remind-todo="${escapeAttr(t.id)}" title="修改提醒时间" type="button">${icon('clock')}<span>${remindLabel(t.remindAt)}</span></button>` : ''}
          ${t.noteTitle ? `<button class="tr-source" data-open-note="${escapeAttr(t.noteId)}" type="button">来自《${escapeHtml(t.noteTitle)}》</button>` : ''}
        </div>
      </div>
      <button class="icon-btn tr-clock ${t.remindAt ? 'has-remind' : ''}" data-remind-todo="${escapeAttr(t.id)}" title="${t.remindAt ? '修改提醒时间' : '设置提醒时间'}" type="button">${icon('clock')}</button>
      <div class="tr-actions">
        <button class="icon-btn" data-del-todo="${escapeAttr(t.id)}" title="删除待办" type="button">${icon('trash')}</button>
      </div>
    </div>`;
}

/* ---------------- Render: ask ---------------- */

function suggestionList() {
  const tags = S.data?.stats?.tags || [];
  const notes = activeNotes();
  const out = [
    { q: '我最近在关注什么？', hint: '综合最近的记录' },
    { q: '有哪些待办快到期了？', hint: '结合本地待办清单' },
  ];
  if (tags[0]) out.push({ q: `关于「${tags[0].name}」，我积累了什么？`, hint: `主题 · ${tags[0].name}` });
  if (notes[0]) out.push({ q: `总结一下《${truncate(notes[0].title, 14)}》的要点`, hint: '单条记录的提炼' });
  if (out.length < 4) out.push({ q: '我反复提到但还没解决的事情是什么？', hint: '寻找悬而未决的线索' });
  return out.slice(0, 4);
}

function renderAsk() {
  const thread = $('#askThread');
  if (!S.messages.length) {
    const suggestions = suggestionList();
    const recent = (S.data.chats || []).slice(-3).reverse();
    thread.innerHTML = `
      <div class="ask-intro">
        <div class="ask-eyebrow">PRIVATE · GROUNDED · LOCAL</div>
        <h2>问问你的记录，<br><em>它们会回答。</em></h2>
        <p>知屿会先检索你的笔记与待办，再让本地模型基于材料作答。每个结论都能回到原文。</p>
        <div class="suggest-grid">
          ${suggestions.map((s) => `<button class="suggest-card" data-ask-q="${escapeAttr(s.q)}" type="button"><div class="q">${escapeHtml(s.q)}</div><div class="hint">${escapeHtml(s.hint)}</div></button>`).join('')}
        </div>
        <div class="ask-steps">
          <div class="ask-step"><b>01</b><span><strong>检索</strong>从笔记与待办中找依据</span></div>
          <div class="ask-step"><b>02</b><span><strong>回答</strong>让本地模型组织语言</span></div>
          <div class="ask-step"><b>03</b><span><strong>溯源</strong>每条结论都能回到原文</span></div>
        </div>
        ${recent.length ? `<div class="recent-asks"><span>最近问过</span>${recent.map((c) => `<button data-ask-q="${escapeAttr(c.question)}" type="button">${escapeHtml(truncate(c.question, 46))}</button>`).join('')}</div>` : ''}
      </div>`;
  } else {
    thread.innerHTML = S.messages.map((m, idx) => messageHtml(m, idx)).join('');
    const mode = S.ai?.ok ? `${S.ai.model} · 回答会标注引用` : '本地规则模式 · 未连接模型时使用检索结果';
    $('#askMode').textContent = mode;
  }
  hydrateIcons(thread);
  scrollAsk(false);
}

function messageHtml(m, idx) {
  if (m.role === 'user') {
    return `<div class="msg user"><div class="msg-bubble">${escapeHtml(m.content)}</div></div>`;
  }
  const streaming = m.streaming;
  const content = streaming
    ? `${escapeHtml(m.content).replace(/\n/g, '<br>')}<span class="streaming-cursor"></span>`
    : mdToHtml(m.content);
  const citations = (m.citations || []).length ? `
    <div class="citations" data-citations="${idx}">
      ${m.citations.map((c) => `<button class="citation-card" data-cite-open="${escapeAttr(c.id)}" data-cite-index="${c.index}" type="button">
        <span class="citation-idx">${c.index}</span>
        <span><span class="citation-title">${escapeHtml(c.title)}</span><span class="citation-date">${escapeHtml(c.date)} · ${(TYPE_META[c.type] || TYPE_META.note).label}</span></span>
      </button>`).join('')}
    </div>` : '';
  return `
    <div class="msg assistant" data-msg="${idx}">
      <div class="msg-head"><span class="spark-dot"></span> 知屿 ${streaming ? '正在回答' : '基于你的记录'}</div>
      <div class="msg-bubble"><div class="md ${streaming ? 'streaming-md' : ''}">${content || (streaming ? '<span class="typing"><i></i><i></i><i></i></span>' : '')}</div>${citations}</div>
      ${!streaming && m.content ? `<div class="msg-foot"><span>${m.mode === 'fallback' ? '本地检索' : '模型回答'} · ${(m.citations || []).length} 条依据</span><button data-copy-msg="${idx}" type="button">复制</button></div>` : ''}
    </div>`;
}

function scrollAsk(smooth = true) {
  const t = $('#askThread');
  if (!t) return;
  t.scrollTo({ top: t.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
}

async function sendQuestion(raw) {
  const q = String(raw || '').trim();
  if (!q || S.streaming) return;
  S.view = 'ask';
  S.messages.push({ role: 'user', content: q });
  const assistant = { role: 'assistant', content: '', streaming: true, citations: [], mode: S.ai?.ok ? 'llm' : 'fallback' };
  S.messages.push(assistant);
  S.streaming = true;
  renderAsk();
  hydrateIcons();
  const input = $('#askInput');
  input.value = '';
  input.style.height = 'auto';
  $('#askSend').disabled = true;

  const msgEl = () => $(`[data-msg="${S.messages.length - 1}"]`);
  let doneMeta = null;

  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '问答请求失败');
    }
    if (!res.body) throw new Error('浏览器不支持流式响应');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let lastPaint = 0;

    const handle = (block) => {
      const lines = block.split('\n');
      let event = 'message';
      const dataLines = [];
      for (const line of lines) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
      }
      if (!dataLines.length) return;
      let data;
      try { data = JSON.parse(dataLines.join('\n')); } catch { return; }
      if (event === 'meta') {
        assistant.citations = data.citations || [];
        assistant.mode = data.mode || assistant.mode;
      } else if (event === 'delta') {
        assistant.content += data.text || '';
        const now = performance.now();
        if (now - lastPaint > 45) {
          lastPaint = now;
          const el = msgEl()?.querySelector('.md');
          if (el) el.innerHTML = `${escapeHtml(assistant.content).replace(/\n/g, '<br>')}<span class="streaming-cursor"></span>`;
          scrollAsk(false);
        }
      } else if (event === 'done') {
        doneMeta = data;
        assistant.citations = data.citations || assistant.citations;
        assistant.mode = data.mode || assistant.mode;
      } else if (event === 'error') {
        throw new Error(data.message || '回答失败');
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';
      for (const block of blocks) {
        if (block.trim()) handle(block);
      }
    }
    if (buffer.trim()) handle(buffer);
    assistant.streaming = false;
    if (!assistant.content) assistant.content = '没有生成回答。可以换个问法，或检查本地模型设置。';
  } catch (err) {
    assistant.streaming = false;
    assistant.content = assistant.content || `回答失败：${err.message}`;
    assistant.mode = 'fallback';
    toast(err.message, 'error', 4500);
  } finally {
    S.streaming = false;
    $('#askSend').disabled = false;
    // 完整重绘，补上引用卡片与 Markdown 排版
    const thread = $('#askThread');
    thread.innerHTML = S.messages.map((m, idx) => messageHtml(m, idx)).join('');
    $('#askMode').textContent = S.ai?.ok ? `${S.ai.model} · 回答会标注引用` : '本地规则模式 · 未连接模型时使用检索结果';
    hydrateIcons(thread);
    scrollAsk(true);
  }
}

/* ---------------- Render: chat ---------------- */

function chatHistory() {
  // 供发送时使用的精简历史（role + content），不含流式占位。
  return S.chatMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }));
}

function chatMessageHtml(m, idx) {
  if (m.role === 'user') {
    return `<div class="msg user"><div class="msg-bubble">${escapeHtml(m.content)}</div></div>`;
  }
  const streaming = m.streaming;
  const content = streaming
    ? `${escapeHtml(m.content).replace(/\n/g, '<br>')}<span class="streaming-cursor"></span>`
    : mdToHtml(m.content);
  return `
    <div class="msg assistant" data-chat-msg="${idx}">
      <div class="msg-head"><span class="spark-dot"></span> 本地模型 ${streaming ? '正在回复' : ''}</div>
      <div class="msg-bubble"><div class="md ${streaming ? 'streaming-md' : ''}">${content || (streaming ? '<span class="typing"><i></i><i></i><i></i></span>' : '')}</div></div>
      ${!streaming && m.content ? `<div class="msg-foot"><span>自由聊天 · 不检索你的记录</span><button data-copy-chat="${idx}" type="button">复制</button></div>` : ''}
    </div>`;
}

function renderChat() {
  const thread = $('#chatThread');
  if (!S.chatMessages.length) {
    const suggestions = [
      { q: '帮我用一句话解释什么是「复利」', hint: '常识问答' },
      { q: '把这段文字润色得更有条理：……', hint: '写作润色' },
      { q: '给我三个可行的健身入门建议', hint: '出主意' },
      { q: '用英文翻译：今天天气不错，适合出门走走。', hint: '翻译' },
    ];
    thread.innerHTML = `
      <div class="ask-intro">
        <div class="ask-eyebrow">PRIVATE · LOCAL · OFF-RECORD</div>
        <h2>和本地模型<br><em>随便聊聊。</em></h2>
        <p>这里是纯聊天：不检索、不引用你的笔记，聊什么都不会被记进记录。多轮上下文只在本机内存里流转。</p>
        <div class="suggest-grid">
          ${suggestions.map((s) => `<button class="suggest-card" data-chat-q="${escapeAttr(s.q)}" type="button"><div class="q">${escapeHtml(s.q)}</div><div class="hint">${escapeHtml(s.hint)}</div></button>`).join('')}
        </div>
      </div>`;
  } else {
    thread.innerHTML = S.chatMessages.map((m, idx) => chatMessageHtml(m, idx)).join('');
    const mode = S.ai?.ok ? `${S.ai.model} · 自由对话` : '本地规则模式 · 未连接模型时聊天不可用';
    $('#chatMode').textContent = mode;
  }
  hydrateIcons(thread);
  scrollChat(false);
}

function scrollChat(smooth = true) {
  const t = $('#chatThread');
  if (!t) return;
  t.scrollTo({ top: t.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
}

async function sendChatMessage(raw) {
  const text = String(raw || '').trim();
  if (!text || S.chatStreaming) return;
  S.view = 'chat';
  S.chatMessages.push({ role: 'user', content: text });
  const assistant = { role: 'assistant', content: '', streaming: true };
  S.chatMessages.push(assistant);
  S.chatStreaming = true;
  renderChat();
  hydrateIcons();
  const input = $('#chatInput');
  input.value = '';
  input.style.height = 'auto';
  $('#chatSend').disabled = true;

  const msgEl = () => $(`[data-chat-msg="${S.chatMessages.length - 1}"]`);
  const history = chatHistory().slice(0, -1); // 去掉刚推入的空 assistant

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history, threadId: S.chatThreadId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '聊天请求失败');
    }
    if (!res.body) throw new Error('浏览器不支持流式响应');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let lastPaint = 0;

    const handle = (block) => {
      const lines = block.split('\n');
      let event = 'message';
      const dataLines = [];
      for (const line of lines) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
      }
      if (!dataLines.length) return;
      let data;
      try { data = JSON.parse(dataLines.join('\n')); } catch { return; }
      if (event === 'meta') {
        // 无需处理
      } else if (event === 'delta') {
        assistant.content += data.text || '';
        const now = performance.now();
        if (now - lastPaint > 45) {
          lastPaint = now;
          const el = msgEl()?.querySelector('.md');
          if (el) el.innerHTML = `${escapeHtml(assistant.content).replace(/\n/g, '<br>')}<span class="streaming-cursor"></span>`;
          scrollChat(false);
        }
      } else if (event === 'done') {
        if (data.threadId) S.chatThreadId = data.threadId;
      } else if (event === 'error') {
        throw new Error(data.message || '聊天失败');
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';
      for (const block of blocks) {
        if (block.trim()) handle(block);
      }
    }
    if (buffer.trim()) handle(buffer);
    assistant.streaming = false;
    if (!assistant.content) assistant.content = '（没有收到回复，请检查模型设置。）';
  } catch (err) {
    assistant.streaming = false;
    assistant.content = assistant.content || `聊天失败：${err.message}`;
    toast(err.message, 'error', 4500);
  } finally {
    S.chatStreaming = false;
    $('#chatSend').disabled = false;
    const thread = $('#chatThread');
    thread.innerHTML = S.chatMessages.map((m, idx) => chatMessageHtml(m, idx)).join('');
    $('#chatMode').textContent = S.ai?.ok ? `${S.ai.model} · 自由对话` : '本地规则模式 · 未连接模型时聊天不可用';
    hydrateIcons(thread);
    scrollChat(true);
  }
}

async function clearChat() {
  if (!S.chatMessages.length) return;
  try {
    if (S.chatThreadId) {
      await api('/api/chat/clear', { method: 'POST', body: { threadId: S.chatThreadId } });
    }
    S.chatMessages = [];
    S.chatThreadId = null;
    renderChat();
    toast('对话已清空');
  } catch (err) { toast(err.message, 'error'); }
}

/* ---------------- Render: summary ---------------- */

function summaryForRange() {
  const list = S.data.summaries || [];
  if (S.activeSummaryId) {
    const found = list.find((x) => x.id === S.activeSummaryId);
    if (found) return found;
  }
  return list.find((x) => x.range === S.summaryRange) || null;
}

function renderSummary() {
  const active = summaryForRange();
  const list = S.data.summaries || [];
  const rangeLabels = { week: '本周', month: '近 30 天', all: '全部时间' };

  let main = '';
  if (S.generatingSummary) {
    main = `<div class="summary-loading">
      <div class="processing-ring" style="margin:0 auto"><span></span></div>
      <p>正在回看这段时间的记录，提炼主题与下一步…</p>
      <div class="loading-steps">
        ${['整理记录', '识别主题', '对照待办', '生成行动'].map((s, i) => `<span class="loading-step ${i === 0 ? 'active' : ''}"><i></i>${s}</span>`).join('')}
      </div>
    </div>`;
  } else if (active) {
    const d = active.data;
    const st = d.stats || {};
    const tags = st.tags || [];
    main = `
      <div class="summary-hero">
        <div class="eyebrow">阶段性回看 · ${escapeHtml(active.label || rangeLabels[active.range])}</div>
        <h2>${escapeHtml(d.headline || '这段时间的记录')}</h2>
        <p>${escapeHtml(d.overview || '')}</p>
        <div class="summary-hero-foot">
          <span class="summary-period">${escapeHtml(active.startISO)} — ${escapeHtml(active.endISO)}</span>
          <span class="summary-period">${active.noteCount} 条记录</span>
          <span class="summary-period">${d.mode === 'llm' ? '模型生成' : '本地规则生成'}</span>
        </div>
      </div>

      <div class="summary-stats">
        <div class="ss-card"><b>${st.notes ?? active.noteCount}</b><span>条记录</span></div>
        <div class="ss-card"><b>${st.days ?? 0}</b><span>个记录日</span></div>
        <div class="ss-card"><b>${st.todosDone ?? 0}</b><span>件已完成</span></div>
        <div class="ss-card"><b>${st.todosOpen ?? 0}</b><span>件待推进</span></div>
      </div>

      ${(d.themes || []).length ? `<div class="summary-block"><h3>在关注什么 <span class="line"></span></h3>
        <div class="theme-grid">${d.themes.map((t, i) => `<div class="theme-card"><span class="theme-index">0${i + 1}</span><h4>${escapeHtml(t.title)}</h4><p>${escapeHtml(t.insight)}</p></div>`).join('')}</div>
      </div>` : ''}

      ${(d.progress || []).length ? `<div class="summary-block"><h3>已经推进 <span class="line"></span></h3><ul class="mini-list">${d.progress.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>` : ''}
      ${(d.openLoops || []).length ? `<div class="summary-block"><h3>悬而未决 <span class="line"></span></h3><ul class="mini-list loops">${d.openLoops.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>` : ''}
      ${(d.actions || []).length ? `<div class="summary-block"><h3>下一步行动 <span class="line"></span></h3>
        <div class="action-list">${d.actions.map((a, i) => {
          const added = S.addedActions.has(`${active.id}:${i}`);
          return `<div class="action-card ${added ? 'added' : ''}">
            <span class="action-num">0${i + 1}</span>
            <div class="action-body">
              <div class="action-text">${escapeHtml(a.text)}</div>
              <div class="action-meta">
                ${a.due ? `<span class="due">${escapeHtml(dueLabel(a.due))}</span>` : ''}
                <span>${(PRIORITY_META[a.priority] || PRIORITY_META.medium).label}优先级</span>
                ${a.reason ? `<span>· ${escapeHtml(a.reason)}</span>` : ''}
              </div>
            </div>
            <button class="btn ghost small" data-add-action="${i}" ${added ? 'disabled' : ''} type="button">${added ? '已加入' : '+ 待办'}</button>
          </div>`;
        }).join('')}</div>
      </div>` : ''}

      <div class="summary-block" style="display:flex;gap:7px;flex-wrap:wrap">
        <button class="btn ghost small" data-save-summary type="button">${icon('save')} 保存为笔记</button>
        <button class="btn ghost small" data-delete-summary type="button">${icon('trash')} 删除这份总结</button>
      </div>`;
  } else {
    main = `
      <div class="summary-hero">
        <div class="eyebrow">STAGE REVIEW</div>
        <h2>让一段时间的记录，<br>自己讲出它的重点。</h2>
        <p>知屿会整理这段时间的笔记、已完成与未完成的待办，提炼主题、指出悬而未决的事，并给出具体下一步。总结只保存在本地。</p>
        <div class="summary-hero-foot">
          <button class="btn primary" id="generateSummaryBtn" data-generate-summary type="button">${icon('spark')} 生成${rangeLabels[S.summaryRange]}总结</button>
          <span class="summary-period">需要至少一条记录</span>
        </div>
      </div>
      <div class="summary-stats">
        <div class="ss-card"><b>${S.data.stats.totalNotes ?? 0}</b><span>条记录可回看</span></div>
        <div class="ss-card"><b>${S.data.stats.notesThisWeek ?? 0}</b><span>本周新增</span></div>
        <div class="ss-card"><b>${S.data.stats.doneThisWeek ?? 0}</b><span>本周完成待办</span></div>
        <div class="ss-card"><b>${S.data.stats.streak ?? 0}</b><span>天连续记录</span></div>
      </div>`;
  }

  const history = list.slice(0, 8).map((x) => `
    <button class="history-item ${active?.id === x.id ? 'active' : ''}" data-summary-id="${escapeAttr(x.id)}" type="button">
      <div class="h-range">${escapeHtml(x.label || rangeLabels[x.range] || '')} · ${fmtShortDate(x.createdAt)}</div>
      <div class="h-title">${escapeHtml(x.data?.headline || '阶段总结')}</div>
    </button>`).join('') || '<p class="aside-note">还没有历史总结。生成第一份后，会在这里留档。</p>';

  $('#summaryInner').innerHTML = `
    <div class="summary-main">
      <div class="summary-top">
        <div class="segmented" id="summaryRange">
          ${['week', 'month', 'all'].map((r) => `<button data-range="${r}" class="${S.summaryRange === r ? 'active' : ''}" type="button">${rangeLabels[r]}</button>`).join('')}
        </div>
        <div class="summary-actions">
          ${active ? `<button class="btn ghost small" data-regenerate type="button" ${S.generatingSummary ? 'disabled' : ''}>${icon('refresh')} 重新生成</button>` : ''}
        </div>
      </div>
      ${main}
    </div>
    <aside class="summary-aside">
      <div class="aside-card">
        <h4>历史总结</h4>
        ${history}
      </div>
      <div class="aside-card">
        <h4>关于阶段总结</h4>
        <p class="aside-note">总结由本地模型基于笔记生成，不会上传到云端。没有连接模型时，会用本地规则生成基础版本。你可以把总结保存为一条新笔记，或把行动直接加入待办。</p>
      </div>
    </aside>`;
  hydrateIcons($('#viewSummary'));
}

async function generateSummary(range = S.summaryRange) {
  if (S.generatingSummary) return;
  S.summaryRange = range;
  S.generatingSummary = true;
  renderSummary();
  try {
    const res = await api('/api/summary', { method: 'POST', body: { range } });
    S.data.summaries = res.summaries;
    S.activeSummaryId = res.summary.id;
    S.summaryRange = res.summary.range;
    S.generatingSummary = false;
    renderSummary();
    toast(res.summary.data?.mode === 'llm' ? '阶段总结已生成' : '已用本地规则生成总结', res.summary.data?.mode === 'llm' ? 'ok' : 'warn');
  } catch (err) {
    S.generatingSummary = false;
    renderSummary();
    toast(err.message, 'error', 4600);
  }
}

/* ---------------- Render: settings ---------------- */

function renderSettings() {
  const st = S.data.settings;
  const ai = S.ai;
  const stats = S.data.stats;
  $('#settingsBody').innerHTML = `
    <section class="setting-section">
      <h3>本地模型</h3>
      <p class="setting-desc">知屿通过 Ollama 或 OpenAI 兼容接口调用本地模型。推荐 Ollama + qwen2.5:7b；不连接模型也能使用本地规则整理与检索。</p>
      <div class="field">
        <label>接入方式</label>
        <div class="segmented full" id="setProvider">
          <button data-provider="ollama" class="${st.provider === 'ollama' ? 'active' : ''}" type="button">Ollama</button>
          <button data-provider="openai" class="${st.provider === 'openai' ? 'active' : ''}" type="button">OpenAI 兼容</button>
        </div>
      </div>
      <div class="field">
        <label>服务地址</label>
        <input class="input" id="setBaseUrl" value="${escapeAttr(st.baseUrl)}" spellcheck="false" />
        <div class="help">Ollama 默认 http://127.0.0.1:11434；LM Studio 等通常以 /v1 结尾。</div>
      </div>
      <div class="field-row">
        <div class="field"><label>对话模型</label><input class="input" id="setChatModel" value="${escapeAttr(st.chatModel)}" spellcheck="false" /></div>
        <div class="field"><label>向量模型</label><input class="input" id="setEmbedModel" value="${escapeAttr(st.embedModel)}" spellcheck="false" /></div>
      </div>
      <div class="field">
        <label>API Key（可选）</label>
        <input class="input" id="setApiKey" type="password" placeholder="${st.hasApiKey ? '已保存，留空则不修改' : '本地服务通常不需要'}" />
        <div class="help">仅保存在本机 data/store.json；也可以通过环境变量 ZHIYU_API_KEY 提供。</div>
      </div>
      <div class="field">
        <label>回答温度 <span id="tempValue" style="color:var(--faint)">${st.temperature}</span></label>
        <input type="range" id="setTemperature" min="0" max="1" step="0.1" value="${st.temperature}" style="width:100%;accent-color:var(--accent)" />
      </div>
      <div class="setting-toggle">
        <div><div class="label">向量混合检索</div><div class="sub">需要向量模型；开启后语义检索更准，首次会计算向量。</div></div>
        <label class="switch-line"><input type="checkbox" id="setEmbeddings" ${st.useEmbeddings ? 'checked' : ''} /><span class="switch"></span></label>
      </div>
      <div class="setting-toggle">
        <div><div class="label">自动整理新记录</div><div class="sub">关闭后仅用本地规则分类与摘要，不调用模型。</div></div>
        <label class="switch-line"><input type="checkbox" id="setAutoClassify" ${st.autoClassify ? 'checked' : ''} /><span class="switch"></span></label>
      </div>
      <div class="test-row">
        <button class="btn ghost small" id="testConnection" type="button">测试连接</button>
        <button class="btn primary small" id="saveSettings" type="button">保存设置</button>
      </div>
      <div class="conn-box ${ai?.ok ? 'ok' : ''}" id="aiStatusBox">
        ${ai ? (ai.ok ? `已连接 · ${escapeHtml(ai.provider)} · ${escapeHtml(ai.model)} · ${ai.latency}ms` : escapeHtml(ai.message || '尚未连接本地模型')) : '正在检测本地模型…'}
      </div>
      <div class="model-chips" id="modelChips">${(ai?.models || []).slice(0, 14).map((m) => `<button class="model-chip" data-model="${escapeAttr(m)}" type="button">${escapeHtml(m)}</button>`).join('')}</div>
    </section>

    <section class="setting-section">
      <h3>到点提醒</h3>
      <p class="setting-desc">给待办设一个提醒时间，到点会在右下角弹出提醒卡片。提醒由页面内的定时检查触发，所以需要让知屿保持打开（可以最小化或放在后台标签页）。</p>
      <div class="storage-stats">
        <div class="storage-stat"><b>${stats.reminders ?? 0}</b><span>待提醒</span></div>
        <div class="storage-stat"><b>${stats.remindersToday ?? 0}</b><span>今天</span></div>
        <div class="storage-stat"><b>30s</b><span>检查间隔</span></div>
      </div>
      <div class="setting-toggle">
        <div><div class="label">系统通知</div><div class="sub">${notifyPermissionText()}</div></div>
        <button class="btn ghost small" id="notifyBtn" type="button" ${'Notification' in window && Notification.permission === 'granted' ? 'disabled' : ''}>${'Notification' in window && Notification.permission === 'granted' ? '已开启' : '开启通知'}</button>
      </div>
    </section>

    <section class="setting-section">
      <h3>本地数据</h3>
      <p class="setting-desc">所有笔记、待办与总结保存在本机 JSON 文件中。默认路径 <code>data/store.json</code>，启动时自动保留最近 7 天备份。</p>
      <div class="storage-stats">
        <div class="storage-stat"><b>${stats.totalNotes}</b><span>记录</span></div>
        <div class="storage-stat"><b>${stats.totalTodos}</b><span>待办</span></div>
        <div class="storage-stat"><b>${stats.summaries}</b><span>总结</span></div>
      </div>
      <div class="data-actions">
        <a class="btn ghost small" href="/api/export" download>${icon('download')} 导出备份</a>
        <button class="btn ghost small" id="importBtn" type="button">${icon('upload')} 导入备份</button>
        <input type="file" id="importFile" accept=".json,application/json" hidden />
      </div>
      <div class="danger-zone">
        <button class="btn ghost small" id="clearDemoBtn" type="button">清除示例数据</button>
        <button class="btn ghost small" id="resetBtn" type="button" style="color:var(--danger)">清空全部数据</button>
      </div>
    </section>

    <section class="setting-section">
      <h3>关于知屿</h3>
      <p class="setting-desc">本地优先的个人信息管家。记录会自动分类、摘要、提取待办，并在笔记之间建立关联。问答、总结与检索都在这台电脑上完成。</p>
      <p class="setting-desc" style="margin-bottom:0">数据文件：${escapeHtml(S.data.storage.file)}<br>界面版本：1.0.0 · 本地 Node 服务</p>
    </section>`;
  hydrateIcons($('#settingsBody'));
}

/* ---------------- Graph ---------------- */

function stopGraph() {
  if (!S.graph) return;
  if (S.graph.raf) cancelAnimationFrame(S.graph.raf);
  if (S.graph.resizeObserver) S.graph.resizeObserver.disconnect();
  if (S.graph.cleanup) S.graph.cleanup();
  $('#graphTip')?.style.setProperty('opacity', '0');
  S.graph = null;
}

async function startGraph() {
  stopGraph();
  let data;
  try { data = await api('/api/graph'); } catch (err) { toast(err.message, 'error'); return; }
  if (S.view !== 'graph') return;
  const canvas = $('#graphCanvas');
  const stage = $('#graphStage');
  const empty = $('#graphEmpty');
  if (!data.nodes.length) {
    empty.classList.remove('hidden');
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  empty.classList.add('hidden');

  const rect = stage.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const nodes = data.nodes.map((n, i) => {
    const angle = (i / data.nodes.length) * Math.PI * 2;
    const radius = Math.min(W, H) * (0.26 + (i % 4) * 0.055);
    return {
      ...n,
      x: W / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
      y: H / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
      vx: 0,
      vy: 0,
      r: Math.min(17, 5.5 + (n.degree || 0) * 2.2),
    };
  });
  const map = new Map(nodes.map((n) => [n.id, n]));
  const edges = data.edges.map((e) => ({ ...e, a: map.get(e.source), b: map.get(e.target) })).filter((e) => e.a && e.b);
  const neighbors = new Map();
  for (const e of edges) {
    if (!neighbors.has(e.a.id)) neighbors.set(e.a.id, new Set());
    if (!neighbors.has(e.b.id)) neighbors.set(e.b.id, new Set());
    neighbors.get(e.a.id).add(e.b.id);
    neighbors.get(e.b.id).add(e.a.id);
  }

  let hover = null;
  let alpha = 1;
  let frame = 0;

  const tick = () => {
    const cx = W / 2;
    const cy = H / 2;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.vx += (cx - a.x) * 0.00045;
      a.vy += (cy - a.y) * 0.00045;
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist2 = dx * dx + dy * dy;
        if (dist2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; dist2 = 1; }
        if (dist2 > 560 * 560) continue;
        const force = Math.min(4.5, 7200 / dist2);
        const dist = Math.sqrt(dist2);
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
        b.vx -= (dx / dist) * force;
        b.vy -= (dy / dist) * force;
      }
    }
    for (const e of edges) {
      const dx = e.b.x - e.a.x;
      const dy = e.b.y - e.a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const target = 138;
      const strength = 0.008 * (0.5 + e.score);
      const force = (dist - target) * strength;
      e.a.vx += (dx / dist) * force;
      e.a.vy += (dy / dist) * force;
      e.b.vx -= (dx / dist) * force;
      e.b.vy -= (dy / dist) * force;
    }
    for (const n of nodes) {
      n.vx *= 0.86;
      n.vy *= 0.86;
      n.x += n.vx * alpha;
      n.y += n.vy * alpha;
      const pad = n.r + 44;
      n.x = Math.max(pad, Math.min(W - pad, n.x));
      n.y = Math.max(pad + 10, Math.min(H - pad, n.y));
    }
    alpha = Math.max(0.22, alpha * 0.997);
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    frame++;
    if (frame < 600) tick();

    // 背景微光
    const grad = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.65);
    grad.addColorStop(0, 'rgba(255,253,248,.5)');
    grad.addColorStop(1, 'rgba(247,244,237,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    for (const e of edges) {
      const active = hover && (e.a.id === hover.id || e.b.id === hover.id);
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.strokeStyle = active ? 'rgba(181,84,47,.38)' : `rgba(116,104,85,${0.1 + e.score * 0.22})`;
      ctx.lineWidth = active ? 1.3 : 0.8;
      ctx.stroke();
    }

    for (const n of nodes) {
      const color = GRAPH_COLORS[n.type] || GRAPH_COLORS.note;
      const dim = hover && hover.id !== n.id && !(neighbors.get(hover.id)?.has(n.id));
      ctx.globalAlpha = dim ? 0.28 : 1;
      if (hover?.id === n.id) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 8, 0, Math.PI * 2);
        ctx.fillStyle = `${color}18`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = hover?.id === n.id ? color : `${color}${n.degree ? 'e6' : 'b0'}`;
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(255,253,248,.9)';
      ctx.stroke();

      if (n.degree > 0 || nodes.length <= 14 || hover?.id === n.id) {
        ctx.globalAlpha = dim ? 0.25 : 1;
        ctx.font = `${hover?.id === n.id ? '600 ' : ''}12px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.fillStyle = '#4d4639';
        ctx.textAlign = 'center';
        ctx.fillText(truncate(n.title, 16), n.x, n.y + n.r + 15);
      }
      ctx.globalAlpha = 1;
    }
    S.graph.raf = requestAnimationFrame(draw);
  };

  const findNode = (x, y) => {
    let best = null;
    let bestDist = Infinity;
    for (const n of nodes) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < n.r + 8 && d < bestDist) { best = n; bestDist = d; }
    }
    return best;
  };

  const onMove = (ev) => {
    const r = canvas.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    const n = findNode(x, y);
    hover = n;
    canvas.style.cursor = n ? 'pointer' : 'grab';
    const tip = $('#graphTip');
    if (n) {
      tip.textContent = `${n.title} · ${(TYPE_META[n.type] || TYPE_META.note).label}`;
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
      tip.style.opacity = '1';
    } else {
      tip.style.opacity = '0';
    }
  };

  const onClick = (ev) => {
    const r = canvas.getBoundingClientRect();
    const n = findNode(ev.clientX - r.left, ev.clientY - r.top);
    if (!n) return;
    stopGraph();
    S.view = 'notes';
    S.selectedId = n.id;
    S.mobileDetail = true;
    S.query = '';
    S.searchResults = null;
    S.activeTag = null;
    S.filterType = 'all';
    $('#searchInput').value = '';
    renderAll();
  };

  const onLeave = () => { hover = null; $('#graphTip').style.opacity = '0'; };
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('mouseleave', onLeave);

  const ro = new ResizeObserver(() => { /* 画布尺寸变化时重载视图 */ });
  ro.observe(stage);
  S.graph = { nodes, edges, raf: null, resizeObserver: ro, cleanup: () => {
    canvas.removeEventListener('mousemove', onMove);
    canvas.removeEventListener('click', onClick);
    canvas.removeEventListener('mouseleave', onLeave);
  } };
  draw();
}

/* ---------------- Settings actions ---------------- */

async function checkAI(force = false) {
  updateAIPill();
  try {
    const result = await api(`/api/ai/status${force ? '?force=1' : ''}`);
    S.ai = result;
    updateAIPill();
    if ($('#aiStatusBox')) {
      const box = $('#aiStatusBox');
      box.className = `conn-box ${result.ok ? 'ok' : ''}`;
      box.textContent = result.ok
        ? `已连接 · ${result.provider} · ${result.model} · ${result.latency}ms`
        : result.message;
      const chips = $('#modelChips');
      if (chips) chips.innerHTML = (result.models || []).slice(0, 14).map((m) => `<button class="model-chip" data-model="${escapeAttr(m)}" type="button">${escapeHtml(m)}</button>`).join('');
    }
  } catch (err) {
    S.ai = { ok: false, message: err.message, model: '', models: [] };
    updateAIPill();
  }
}

async function saveSettings() {
  const provider = $('#setProvider')?.querySelector('.active')?.dataset.provider || 'ollama';
  const body = {
    provider,
    baseUrl: $('#setBaseUrl').value.trim(),
    chatModel: $('#setChatModel').value.trim(),
    embedModel: $('#setEmbedModel').value.trim(),
    useEmbeddings: $('#setEmbeddings').checked,
    autoClassify: $('#setAutoClassify').checked,
    temperature: Number($('#setTemperature').value),
  };
  const key = $('#setApiKey').value;
  if (key) body.apiKey = key;
  try {
    const res = await api('/api/settings', { method: 'PUT', body });
    S.data.settings = res.settings;
    if (res.ai) S.ai = res.ai;
    updateAIPill();
    renderSettings();
    toast('设置已保存');
    checkAI(true);
  } catch (err) {
    toast(err.message, 'error', 4500);
  }
}

async function testAIConnection() {
  const btn = $('#testConnection');
  const box = $('#aiStatusBox');
  btn.disabled = true;
  btn.textContent = '测试中…';
  box.className = 'conn-box';
  box.textContent = '正在连接本地模型服务…';
  try {
    const res = await api('/api/settings/test', {
      method: 'POST',
      body: {
        provider: $('#setProvider')?.querySelector('.active')?.dataset.provider || 'ollama',
        baseUrl: $('#setBaseUrl').value.trim(),
        chatModel: $('#setChatModel').value.trim(),
        embedModel: $('#setEmbedModel').value.trim(),
        apiKey: $('#setApiKey').value,
      },
    });
    box.className = `conn-box ${res.ok ? 'ok' : 'err'}`;
    box.textContent = res.ok ? `${res.message}（${res.latency}ms）` : res.message;
    if (res.ok) {
      $('#modelChips').innerHTML = (res.models || []).slice(0, 18).map((m) => `<button class="model-chip" data-model="${escapeAttr(m)}" type="button">${escapeHtml(m)}</button>`).join('');
      toast('模型服务连接成功');
    } else {
      toast('连接失败', 'error');
    }
  } catch (err) {
    box.className = 'conn-box err';
    box.textContent = err.message;
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '测试连接';
  }
}

/* ---------------- Actions ---------------- */

async function refresh() {
  const prev = S.selectedId;
  try {
    S.data = await api('/api/state');
    if (prev && noteById(prev)) S.selectedId = prev;
    else S.selectedId = activeNotes()[0]?.id || null;
    renderAll();
    if (S.view === 'graph') setTimeout(startGraph, 30);
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function saveNotePatch(id, patch, { rerender = true } = {}) {
  try {
    const res = await api(`/api/notes/${id}`, { method: 'PATCH', body: patch });
    const idx = S.data.notes.findIndex((n) => n.id === id);
    if (idx >= 0) S.data.notes[idx] = res.note;
    if (rerender) {
      renderNotes();
      renderSidebar();
    }
    return res.note;
  } catch (err) {
    toast(err.message, 'error');
    return null;
  }
}

function openCapture(prefill = '') {
  $('#captureModal').classList.remove('hidden');
  const ta = $('#captureText');
  ta.value = prefill;
  $('#captureCount').textContent = `${prefill.length} 字`;
  $('#captureAI').checked = S.data?.settings?.autoClassify !== false;
  setTimeout(() => ta.focus(), 80);
}

function closeCapture() {
  $('#captureModal').classList.add('hidden');
}

async function submitCapture() {
  const text = $('#captureText').value.trim();
  if (!text) { toast('先写点什么吧', 'warn'); $('#captureText').focus(); return; }
  const useAI = $('#captureAI').checked;
  const btn = $('#captureSubmit');
  btn.disabled = true;
  closeCapture();
  startProcessing('正在整理这条记录', useAI ? ['读取内容…', '判断类型与主题…', '生成摘要与要点…', '提取待办并建立关联…'] : ['读取内容…', '本地分类…', '提取要点与待办…']);
  try {
    const res = await api('/api/notes', { method: 'POST', body: { text, useAI } });
    const note = res.note;
    S.query = '';
    S.searchResults = null;
    S.activeTag = null;
    S.filterType = 'all';
    $('#searchInput').value = '';
    S.selectedId = note.id;
    S.view = 'notes';
    S.mobileDetail = true;
    await refresh();
    const todoCount = (S.data.todos || []).filter((t) => t.noteId === note.id && !t.done).length;
    const modeNote = note.ai?.mode === 'llm' ? '已由模型整理' : '已用本地规则整理';
    toast(`${modeNote}${todoCount ? ` · 提取 ${todoCount} 个待办` : ''}`, note.ai?.error ? 'warn' : 'ok', 3800);
  } catch (err) {
    toast(err.message, 'error', 5000);
    openCapture(text);
    $('#captureAI').checked = useAI;
  } finally {
    stopProcessing();
    btn.disabled = false;
  }
}

async function deleteCurrentNote() {
  const note = noteById(S.selectedId);
  if (!note) return;
  const ok = await confirmDialog({
    title: '删除这条记录？',
    message: `《${note.title}》及其自动提取的待办会被删除。\n这个操作无法撤销。`,
    okText: '删除',
  });
  if (!ok) return;
  try {
    await api(`/api/notes/${note.id}`, { method: 'DELETE' });
    S.selectedId = null;
    S.mobileDetail = false;
    await refresh();
    toast('记录已删除');
  } catch (err) { toast(err.message, 'error'); }
}

async function reprocessCurrent() {
  const note = noteById(S.selectedId);
  if (!note) return;
  startProcessing('正在重新整理', ['重新读取原文…', '更新分类与摘要…', '核对关键信息…', '重新建立关联…']);
  try {
    const res = await api(`/api/notes/${note.id}/reprocess`, { method: 'POST' });
    const idx = S.data.notes.findIndex((n) => n.id === note.id);
    if (idx >= 0) S.data.notes[idx] = res.note;
    await refresh();
    toast(res.note.ai?.mode === 'llm' ? '已用模型重新整理' : '已用本地规则重新整理', res.note.ai?.error ? 'warn' : 'ok');
  } catch (err) {
    toast(err.message, 'error', 4800);
  } finally {
    stopProcessing();
  }
}

async function saveContent() {
  const note = noteById(S.selectedId);
  const area = $('#contentEdit');
  if (!note || !area) return;
  const content = area.value.trim();
  if (!content) { toast('原文不能为空', 'warn'); return; }
  startProcessing('正在保存并重新整理', ['保存原文…', '更新摘要…', '重新提取待办…', '更新关联…']);
  try {
    await api(`/api/notes/${note.id}`, { method: 'PATCH', body: { content } });
    await api(`/api/notes/${note.id}/reprocess`, { method: 'POST' });
    S.editingContent = false;
    await refresh();
    toast('原文已保存，摘要与待办已更新');
  } catch (err) {
    toast(err.message, 'error', 4800);
  } finally {
    stopProcessing();
  }
}

async function addTodoQuick(e) {
  e.preventDefault();
  const text = $('#quickTodoText').value.trim();
  if (!text) return;
  const due = $('#quickTodoDue').value || null;
  const time = $('#quickTodoTime').value || '';
  try {
    await api('/api/todos', {
      method: 'POST',
      body: { text, due, priority: $('#quickTodoPriority').value, remindAt: remindFromInputs(due, time) },
    });
    await refresh();
    toast(time ? `已加入待办，${remindLabel(remindFromInputs(due, time))}提醒你` : '已加入待办');
    setTimeout(() => $('#quickTodoText')?.focus(), 50);
  } catch (err) { toast(err.message, 'error'); }
}

// 只填了时间没填日期时：默认今天，今天这个点已过就顺延到明天。
function remindFromInputs(due, time) {
  if (!time) return null;
  if (due) return `${due}T${time}`;
  const now = new Date();
  const todayCandidate = `${todayStr()}T${time}`;
  if (todayCandidate > toLocalInput(now)) return todayCandidate;
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  return `${dayKeyOf(tmr)}T${time}`;
}

async function toggleTodo(id) {
  const todo = (S.data.todos || []).find((t) => t.id === id);
  if (!todo) return;
  try {
    await api(`/api/todos/${id}`, { method: 'PATCH', body: { done: !todo.done } });
    await refresh();
    if (!todo.done) toast('完成一件，很好');
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteTodo(id) {
  try {
    await api(`/api/todos/${id}`, { method: 'DELETE' });
    await refresh();
    toast('待办已删除');
  } catch (err) { toast(err.message, 'error'); }
}

/* ---------------- 到点提醒 ---------------- */

const reminders = { timer: null, shown: new Set(), polling: false };

function notifyPermissionText() {
  if (!('Notification' in window)) return '当前浏览器不支持系统通知，页面内提醒仍然有效';
  if (Notification.permission === 'granted') return '已开启，到点会同时弹出系统通知';
  if (Notification.permission === 'denied') return '已被浏览器拒绝，可在地址栏左侧的站点设置里重新允许';
  return '未开启，目前只在页面右下角提醒';
}

async function requestNotifyPermission() {
  if (!('Notification' in window)) { toast('当前浏览器不支持系统通知', 'warn'); return; }
  try {
    const res = await Notification.requestPermission();
    toast(res === 'granted' ? '系统通知已开启' : '未开启系统通知，页面内提醒仍然有效', res === 'granted' ? 'ok' : 'warn');
  } catch { toast('无法申请通知权限', 'warn'); }
  renderSettings();
}

function startReminderWatch() {
  if (reminders.timer) return;
  checkDueReminders();
  reminders.timer = setInterval(checkDueReminders, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkDueReminders();
  });
}

async function checkDueReminders() {
  if (reminders.polling || !S.data) return;
  reminders.polling = true;
  try {
    const res = await api('/api/reminders');
    const due = res.due || [];
    // 同时最多展示 3 张，剩下的留到下一轮（不 ack，所以不会丢）。
    const room = Math.max(0, 3 - $$('#reminderStack .reminder-card').length);
    for (const t of due.slice(0, room)) {
      if (reminders.shown.has(t.id)) continue;
      reminders.shown.add(t.id);
      showReminderCard(t);
    }
  } catch { /* 服务暂时不可用时静默，下一轮再试 */ }
  finally { reminders.polling = false; }
}

function showReminderCard(t) {
  const stack = $('#reminderStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'reminder-card';
  el.dataset.reminderId = t.id;
  el.innerHTML = `
    <div class="rc-head">${icon('bell')}<span>到点提醒</span>
      <button class="rc-close" data-rc-close type="button" aria-label="关闭">×</button>
    </div>
    <div class="rc-text">${escapeHtml(t.text)}</div>
    <div class="rc-meta">
      <span>${t.lateMinutes >= 1 ? `已过 ${t.lateMinutes} 分钟` : '刚刚到点'}</span>
      ${t.due ? `<span class="sep">·</span><span>截止 ${escapeHtml(t.due)}</span>` : ''}
      ${t.noteTitle ? `<span class="sep">·</span><span>来自《${escapeHtml(truncate(t.noteTitle, 14))}》</span>` : ''}
    </div>
    <div class="rc-actions">
      <button class="btn ghost small" data-rc-snooze type="button">10 分钟后</button>
      <button class="btn primary small" data-rc-done type="button">标记完成</button>
      <button class="rc-ack" data-rc-ack type="button">知道了</button>
    </div>`;
  stack.appendChild(el);
  hydrateIcons(el);
  notifyDesktop(t);
  ackTodoReminder(t.id);
}

function dismissCard(card) {
  if (!card) return;
  card.classList.add('out');
  setTimeout(() => card.remove(), 220);
}

async function ackTodoReminder(id) {
  try {
    const res = await api(`/api/reminders/${id}/ack`, { method: 'POST' });
    if (res?.todos) S.data.todos = res.todos;
    if (res?.stats) S.data.stats = res.stats;
  } catch { /* 忽略 */ }
}

function notifyDesktop(t) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification('知屿 · 到点提醒', { body: truncate(t.text, 80), tag: `zhiyu-${t.id}` });
    n.onclick = () => {
      window.focus();
      n.close();
      if (S.view !== 'todos') { S.view = 'todos'; S.mobileDetail = false; renderAll(); }
    };
  } catch { /* 部分浏览器要求 Service Worker，忽略 */ }
}

function openRemindPop(todoId, anchor) {
  const todo = (S.data.todos || []).find((t) => t.id === todoId);
  if (!todo) return;
  S.remindTarget = todo.id;
  const pop = $('#remindPop');
  $('#rpTitle').textContent = truncate(todo.text, 22);
  $('#rpInput').value = todo.remindAt || toLocalInput(new Date(Date.now() + 3600000));
  $('#rpClear').classList.toggle('hidden', !todo.remindAt);

  const now = Date.now();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monday = new Date();
  monday.setDate(monday.getDate() + ((8 - monday.getDay()) % 7 || 7));
  const quick = [
    { label: '30 分钟后', value: toLocalInput(new Date(now + 30 * 60000)) },
    { label: '1 小时后', value: toLocalInput(new Date(now + 60 * 60000)) },
    { label: '3 小时后', value: toLocalInput(new Date(now + 180 * 60000)) },
    { label: '明天 09:00', value: `${dayKeyOf(tomorrow)}T09:00` },
    { label: '下周一 09:00', value: `${dayKeyOf(monday)}T09:00` },
  ];
  $('#rpQuick').innerHTML = quick
    .map((q) => `<button class="rp-chip" data-rp-value="${q.value}" type="button">${q.label}</button>`)
    .join('');

  pop.classList.remove('hidden');
  positionRemindPop(anchor);
  setTimeout(() => $('#rpInput')?.focus(), 40);
}

function positionRemindPop(anchor) {
  const pop = $('#remindPop');
  if (!pop || !anchor) return;
  const rect = anchor.getBoundingClientRect();
  const w = pop.offsetWidth || 268;
  const h = pop.offsetHeight || 190;
  let left = Math.min(Math.max(12, rect.right - w), window.innerWidth - w - 12);
  let top = rect.bottom + 8;
  if (top + h > window.innerHeight - 12) top = Math.max(12, rect.top - h - 8);
  pop.style.left = `${Math.round(left)}px`;
  pop.style.top = `${Math.round(top)}px`;
}

function closeRemindPop() {
  $('#remindPop')?.classList.add('hidden');
  S.remindTarget = null;
}

async function setReminder(id, value) {
  if (!id) return;
  try {
    const res = await api(`/api/todos/${id}`, { method: 'PATCH', body: { remindAt: value } });
    applyTodoPayload(res);
    closeRemindPop();
    if (value) {
      reminders.shown.delete(id);
      toast(`已设置提醒 · ${remindLabel(value)}`);
      if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => requestNotifyPermission(), 400);
      }
    } else {
      toast('已清除提醒');
    }
  } catch (err) { toast(err.message, 'error'); }
}

// 局部同步待办数据，避免整页重绘打断正在编辑的内容。
function applyTodoPayload(res) {
  if (!res) return;
  if (res.todos) S.data.todos = res.todos;
  if (res.stats) S.data.stats = res.stats;
  renderSidebar();
  if (S.view === 'todos') {
    renderTodos();
    hydrateIcons($('#viewTodos'));
  } else if (S.view === 'notes' && !S.editingContent) {
    renderDetail(noteById(S.selectedId));
    hydrateIcons($('#detailPane'));
  }
}

async function addSummaryAction(summaryId, index) {
  const summary = (S.data.summaries || []).find((x) => x.id === summaryId);
  const action = summary?.data?.actions?.[index];
  if (!action) return;
  try {
    await api('/api/todos', {
      method: 'POST',
      body: { text: action.text, due: action.due || null, priority: action.priority || 'medium' },
    });
    S.addedActions.add(`${summaryId}:${index}`);
    renderSummary();
    toast('已加入待办');
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteSummary(id) {
  const ok = await confirmDialog({ title: '删除这份总结？', message: '只会删除总结本身，原始记录与待办不受影响。', okText: '删除' });
  if (!ok) return;
  try {
    const res = await api(`/api/summaries/${id}`, { method: 'DELETE' });
    S.data.summaries = res.summaries;
    S.activeSummaryId = null;
    renderSummary();
    toast('总结已删除');
  } catch (err) { toast(err.message, 'error'); }
}

async function saveSummaryAsNote() {
  const summary = summaryForRange();
  if (!summary) return;
  try {
    const res = await api(`/api/summaries/${summary.id}/to-note`, { method: 'POST' });
    S.view = 'notes';
    S.selectedId = res.note.id;
    S.query = '';
    S.activeTag = null;
    S.filterType = 'all';
    await refresh();
    toast('总结已保存为笔记');
  } catch (err) { toast(err.message, 'error'); }
}

async function importBackup(file) {
  if (!file) return;
  const text = await file.text();
  let payload;
  try { payload = JSON.parse(text); } catch { toast('文件不是有效的 JSON', 'error'); return; }
  const ok = await confirmDialog({
    title: '导入备份？',
    message: `将用「${file.name}」替换当前所有数据（${S.data.stats.totalNotes} 条记录）。\n建议先导出当前数据备份。`,
    okText: '导入并替换',
  });
  if (!ok) return;
  try {
    const res = await api('/api/import', { method: 'POST', body: payload });
    S.data = res.state;
    S.selectedId = activeNotes()[0]?.id || null;
    S.view = 'notes';
    S.activeSummaryId = null;
    S.messages = [];
    S.chatMessages = [];
    S.chatThreadId = null;
    S.addedActions.clear();
    closeSettings();
    renderAll();
    toast('数据已导入');
  } catch (err) { toast(err.message, 'error', 4600); }
}

async function clearDemoData() {
  const ok = await confirmDialog({
    title: '清除示例数据？',
    message: '会删除所有带有「示例」标记的记录、待办与总结，你自己写的内容不受影响。',
    okText: '清除示例',
  });
  if (!ok) return;
  try {
    const res = await api('/api/demo/clear', { method: 'POST' });
    S.data = res.state;
    S.selectedId = activeNotes()[0]?.id || null;
    S.messages = [];
    S.chatMessages = [];
    S.chatThreadId = null;
    S.activeSummaryId = null;
    S.addedActions.clear();
    closeSettings();
    renderAll();
    toast('示例数据已清除');
  } catch (err) { toast(err.message, 'error'); }
}

function closeSettings() {
  $('#settingsLayer').classList.add('hidden');
}

/* ---------------- Events ---------------- */

function switchView(view) {
  if (!VIEW_META[view]) return;
  if (S.view === 'graph') stopGraph();
  S.view = view;
  S.mobileDetail = false;
  if (view === 'summary' && !S.activeSummaryId) {
    const existing = (S.data.summaries || []).find((x) => x.range === S.summaryRange) || (S.data.summaries || [])[0];
    if (existing) {
      S.activeSummaryId = existing.id;
      S.summaryRange = existing.range;
    }
  }
  renderSidebar();
  renderHeader();
  renderCurrentView();
  if (view === 'ask') setTimeout(() => $('#askInput')?.focus(), 120);
  if (view === 'chat') setTimeout(() => $('#chatInput')?.focus(), 120);
}

function bindEvents() {
  // 导航
  $('#nav').addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (btn) switchView(btn.dataset.view);
  });

  // 快速记录
  ['#captureBtn', '#topCapture'].forEach((sel) => $(sel).addEventListener('click', () => openCapture()));
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-capture]')) openCapture();
    if (e.target.closest('[data-close-capture]')) closeCapture();
  });

  // 记录弹窗
  $('#captureText').addEventListener('input', (e) => {
    $('#captureCount').textContent = `${e.target.value.length} 字`;
  });
  $('#captureSubmit').addEventListener('click', submitCapture);
  $$('#captureModal [data-example]').forEach((b) => b.addEventListener('click', () => {
    $('#captureText').value = b.dataset.example;
    $('#captureCount').textContent = `${b.dataset.example.length} 字`;
    $('#captureText').focus();
  }));
  $('#captureModal').addEventListener('click', (e) => {
    if (e.target === $('#captureModal')) closeCapture();
  });

  // 搜索
  const runSearch = debounce(async () => {
    const q = S.query.trim();
    if (!q) { S.searchResults = null; S.searching = false; renderNotes(); return; }
    const seq = ++S.searchSeq;
    S.searching = true;
    try {
      const params = new URLSearchParams({ q });
      if (S.filterType !== 'all') params.set('type', S.filterType);
      if (S.activeTag) params.set('tag', S.activeTag);
      const res = await api(`/api/search?${params}`);
      if (seq !== S.searchSeq) return;
      S.searchResults = res.results;
    } catch (err) {
      if (seq === S.searchSeq) toast(err.message, 'error');
    } finally {
      if (seq === S.searchSeq) { S.searching = false; renderNotes(); }
    }
  }, 230);
  S.searchSeq = 0;

  $('#searchInput').addEventListener('input', (e) => {
    S.query = e.target.value;
    $('#searchClear').classList.toggle('hidden', !S.query);
    renderHeader();
    if (!S.query.trim()) { S.searchResults = null; renderNotes(); return; }
    runSearch();
  });
  $('#searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.target.value = '';
      S.query = '';
      S.searchResults = null;
      renderHeader();
      renderNotes();
      e.target.blur();
    }
  });
  $('#searchClear').addEventListener('click', () => {
    S.query = '';
    S.searchResults = null;
    $('#searchInput').value = '';
    $('#searchClear').classList.add('hidden');
    renderHeader();
    renderNotes();
    $('#searchInput').focus();
  });

  // 分类 / 排序 / 标签
  $('#typeFilters').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    S.filterType = chip.dataset.type;
    if (S.query.trim()) runSearch(); else renderNotes();
    renderHeader();
  });
  $('#sortSelect').addEventListener('change', (e) => { S.sort = e.target.value; renderNotes(); });
  $('#tagList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tag]');
    if (!btn) return;
    S.activeTag = S.activeTag === btn.dataset.tag ? null : btn.dataset.tag;
    S.filterType = 'all';
    S.query = '';
    S.searchResults = null;
    $('#searchInput').value = '';
    if (S.view !== 'notes') switchView('notes');
    renderAll();
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-clear-tag]')) { S.activeTag = null; renderAll(); }
    if (e.target.closest('[data-clear-filter]')) { S.filterType = 'all'; renderAll(); }
    if (e.target.closest('[data-clear-search-all]')) {
      S.query = '';
      S.searchResults = null;
      $('#searchInput').value = '';
      renderAll();
    }
    if (e.target.closest('[data-clear-demo]')) clearDemoData();
  });

  // 记录列表
  $('#noteList').addEventListener('click', (e) => {
    const card = e.target.closest('[data-note-id]');
    if (!card) return;
    S.selectedId = card.dataset.noteId;
    S.mobileDetail = true;
    S.editingContent = false;
    S.tagEditing = false;
    renderNotes();
    $('.detail-pane')?.scrollTo({ top: 0 });
  });
  $('#noteList').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.closest('[data-note-id]')) e.target.click();
  });

  // 详情：委托
  $('#detailPane').addEventListener('click', async (e) => {
    const actionEl = e.target.closest('[data-action]');
    const openNote = e.target.closest('[data-open-note]');
    const toggle = e.target.closest('[data-toggle-todo]');
    const removeTag = e.target.closest('[data-remove-tag]');

    if (openNote) {
      S.selectedId = openNote.dataset.openNote;
      S.editingContent = false;
      renderNotes();
      $('.detail-pane')?.scrollTo({ top: 0 });
      return;
    }
    if (toggle) { toggleTodo(toggle.dataset.toggleTodo); return; }
    const remindEl = e.target.closest('[data-remind-todo]');
    if (remindEl) { openRemindPop(remindEl.dataset.remindTodo, remindEl); return; }
    if (removeTag) {
      const note = noteById(S.selectedId);
      if (!note) return;
      const tags = (note.tags || []).filter((t) => t !== removeTag.dataset.removeTag);
      saveNotePatch(note.id, { tags });
      return;
    }
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'back') { S.mobileDetail = false; renderNotes(); return; }
    if (action === 'pin') {
      const note = noteById(S.selectedId);
      if (note) saveNotePatch(note.id, { pinned: !note.pinned });
    }
    if (action === 'delete') deleteCurrentNote();
    if (action === 'reprocess') reprocessCurrent();
    if (action === 'show-todos') switchView('todos');
    if (action === 'edit-content') {
      S.editingContent = !S.editingContent;
      renderDetail(noteById(S.selectedId));
      hydrateIcons($('#detailPane'));
      if (S.editingContent) setTimeout(() => $('#contentEdit')?.focus(), 50);
    }
    if (action === 'cancel-content') { S.editingContent = false; renderDetail(noteById(S.selectedId)); hydrateIcons($('#detailPane')); }
    if (action === 'save-content') saveContent();
    if (action === 'add-tag') {
      const wrap = $('#detailTags');
      const btn = wrap?.querySelector('[data-action="add-tag"]');
      if (!btn) return;
      const input = document.createElement('input');
      input.className = 'tag-input';
      input.placeholder = '标签名';
      btn.replaceWith(input);
      input.focus();
      const commit = async () => {
        const tag = input.value.trim().replace(/^#/, '').slice(0, 10);
        const note = noteById(S.selectedId);
        if (!tag || !note) { renderDetail(noteById(S.selectedId)); hydrateIcons($('#detailPane')); return; }
        await saveNotePatch(note.id, { tags: [...(note.tags || []), tag] });
        renderDetail(noteById(S.selectedId));
        hydrateIcons($('#detailPane'));
      };
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
        if (ev.key === 'Escape') { renderDetail(noteById(S.selectedId)); hydrateIcons($('#detailPane')); }
      });
      input.addEventListener('blur', commit, { once: true });
    }
  });

  // 标题编辑
  $('#detailPane').addEventListener('input', (e) => {
    if (e.target.id === 'detailTitle') autoGrowTitle();
  });
  $('#detailPane').addEventListener('keydown', (e) => {
    if (e.target.id === 'detailTitle' && e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
    }
    if (e.target.id === 'contentEdit' && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      saveContent();
    }
  });
  $('#detailPane').addEventListener('blur', async (e) => {
    if (e.target.id !== 'detailTitle') return;
    const note = noteById(S.selectedId);
    if (!note) return;
    const value = e.target.value.trim();
    if (!value || value === note.title) { e.target.value = note.title; return; }
    const updated = await saveNotePatch(note.id, { title: value });
    if (updated) { renderDetail(updated); hydrateIcons($('#detailPane')); }
  }, true);

  // 待办
  $('#todosInner').addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-toggle-todo]');
    if (toggle) { toggleTodo(toggle.dataset.toggleTodo); return; }
    const remind = e.target.closest('[data-remind-todo]');
    if (remind) { openRemindPop(remind.dataset.remindTodo, remind); return; }
    const del = e.target.closest('[data-del-todo]');
    if (del) { deleteTodo(del.dataset.delTodo); return; }
    if (e.target.closest('[data-toggle-done]')) { S.showDone = !S.showDone; renderTodos(); hydrateIcons($('#viewTodos')); return; }
    const open = e.target.closest('[data-open-note]');
    if (open) {
      S.selectedId = open.dataset.openNote;
      S.view = 'notes';
      S.mobileDetail = true;
      S.query = '';
      S.searchResults = null;
      S.activeTag = null;
      S.filterType = 'all';
      renderAll();
    }
  });
  $('#todosInner').addEventListener('submit', (e) => {
    if (e.target.id === 'quickTodoForm') addTodoQuick(e);
  });

  // 提醒浮层
  $('#remindPop').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-rp-value]');
    if (chip) { setReminder(S.remindTarget, chip.dataset.rpValue); return; }
    if (e.target.closest('#rpSave')) {
      const value = $('#rpInput').value;
      if (!value) { toast('先选一个提醒时间', 'warn'); return; }
      if (value <= toLocalInput()) { toast('这个时间已经过去了，换一个吧', 'warn'); return; }
      setReminder(S.remindTarget, value);
      return;
    }
    if (e.target.closest('#rpClear')) { setReminder(S.remindTarget, null); return; }
    if (e.target.closest('[data-remind-close]')) closeRemindPop();
  });

  // 到点提醒卡片
  $('#reminderStack').addEventListener('click', async (e) => {
    const card = e.target.closest('.reminder-card');
    if (!card) return;
    const id = card.dataset.reminderId;
    if (e.target.closest('[data-rc-close]') || e.target.closest('[data-rc-ack]')) { dismissCard(card); return; }
    if (e.target.closest('[data-rc-snooze]')) {
      const next = toLocalInput(new Date(Date.now() + 10 * 60000));
      try {
        await api(`/api/todos/${id}`, { method: 'PATCH', body: { remindAt: next } });
        reminders.shown.delete(id);
        dismissCard(card);
        toast(`已推迟到 ${remindLabel(next)}`);
        await refresh();
      } catch (err) { toast(err.message, 'error'); }
      return;
    }
    if (e.target.closest('[data-rc-done]')) {
      try {
        await api(`/api/todos/${id}`, { method: 'PATCH', body: { done: true } });
        dismissCard(card);
        toast('完成一件，很好');
        await refresh();
      } catch (err) { toast(err.message, 'error'); }
    }
  });

  document.addEventListener('click', (e) => {
    if ($('#remindPop').classList.contains('hidden')) return;
    if (e.target.closest('#remindPop') || e.target.closest('[data-remind-todo]')) return;
    closeRemindPop();
  });
  window.addEventListener('scroll', () => closeRemindPop(), true);

  // 问答
  $('#askForm').addEventListener('submit', (e) => {
    e.preventDefault();
    sendQuestion($('#askInput').value);
  });
  $('#askInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(e.target.value);
    }
  });
  $('#askInput').addEventListener('input', (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(140, e.target.scrollHeight)}px`;
  });
  $('#askThread').addEventListener('click', (e) => {
    const q = e.target.closest('[data-ask-q]');
    if (q) { sendQuestion(q.dataset.askQ); return; }
    const cite = e.target.closest('[data-cite-open]');
    if (cite) {
      S.selectedId = cite.dataset.citeOpen;
      S.view = 'notes';
      S.mobileDetail = true;
      S.query = '';
      S.searchResults = null;
      S.activeTag = null;
      S.filterType = 'all';
      renderAll();
      return;
    }
    const copy = e.target.closest('[data-copy-msg]');
    if (copy) {
      const idx = Number(copy.dataset.copyMsg);
      const msg = S.messages[idx];
      if (msg) {
        navigator.clipboard?.writeText(msg.content).then(() => toast('回答已复制')).catch(() => toast('复制失败', 'error'));
      }
    }
    const ref = e.target.closest('.cite-ref');
    if (ref) {
      const msgEl = ref.closest('[data-msg]');
      const idx = ref.dataset.cite;
      const card = msgEl?.querySelector(`[data-cite-index="${idx}"]`);
      if (card) {
        card.classList.add('flash');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => card.classList.remove('flash'), 1200);
      }
    }
  });

  // 自由聊天
  $('#chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    sendChatMessage($('#chatInput').value);
  });
  $('#chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage(e.target.value);
    }
  });
  $('#chatInput').addEventListener('input', (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(140, e.target.scrollHeight)}px`;
  });
  $('#chatClear').addEventListener('click', clearChat);
  $('#chatThread').addEventListener('click', (e) => {
    const q = e.target.closest('[data-chat-q]');
    if (q) { sendChatMessage(q.dataset.chatQ); return; }
    const copy = e.target.closest('[data-copy-chat]');
    if (copy) {
      const idx = Number(copy.dataset.copyChat);
      const msg = S.chatMessages[idx];
      if (msg) {
        navigator.clipboard?.writeText(msg.content).then(() => toast('回复已复制')).catch(() => toast('复制失败', 'error'));
      }
    }
  });

  // 总结
  $('#summaryInner').addEventListener('click', (e) => {
    const rangeBtn = e.target.closest('[data-range]');
    if (rangeBtn) {
      S.summaryRange = rangeBtn.dataset.range;
      S.activeSummaryId = null;
      renderSummary();
      const existing = (S.data.summaries || []).find((x) => x.range === S.summaryRange);
      if (existing) { S.activeSummaryId = existing.id; renderSummary(); }
      return;
    }
    if (e.target.closest('[data-generate-summary]') || e.target.closest('[data-regenerate]')) {
      generateSummary(S.summaryRange);
      return;
    }
    const add = e.target.closest('[data-add-action]');
    if (add) {
      const summary = summaryForRange();
      if (summary) addSummaryAction(summary.id, Number(add.dataset.addAction));
      return;
    }
    if (e.target.closest('[data-save-summary]')) { saveSummaryAsNote(); return; }
    if (e.target.closest('[data-delete-summary]')) {
      const summary = summaryForRange();
      if (summary) deleteSummary(summary.id);
      return;
    }
    const hist = e.target.closest('[data-summary-id]');
    if (hist) {
      const found = (S.data.summaries || []).find((x) => x.id === hist.dataset.summaryId);
      if (found) {
        S.activeSummaryId = found.id;
        S.summaryRange = found.range;
        renderSummary();
      }
    }
  });

  // 设置
  $('#settingsBtn').addEventListener('click', () => {
    renderSettings();
    $('#settingsLayer').classList.remove('hidden');
  });
  $('#topSettings').addEventListener('click', () => {
    renderSettings();
    $('#settingsLayer').classList.remove('hidden');
  });
  $$('#settingsLayer [data-close-settings]').forEach((el) => el.addEventListener('click', closeSettings));
  $('#settingsBody').addEventListener('click', (e) => {
    const provider = e.target.closest('[data-provider]');
    if (provider) {
      $$('#setProvider button').forEach((b) => b.classList.toggle('active', b === provider));
      const base = $('#setBaseUrl');
      if (provider.dataset.provider === 'ollama' && /:1234/.test(base.value)) base.value = 'http://127.0.0.1:11434';
      if (provider.dataset.provider === 'openai' && /:11434/.test(base.value)) base.value = 'http://127.0.0.1:1234/v1';
      return;
    }
    const model = e.target.closest('[data-model]');
    if (model) {
      $('#setChatModel').value = model.dataset.model;
      toast(`已填入模型 ${model.dataset.model}`, 'ok', 2200);
      return;
    }
    if (e.target.closest('#testConnection')) { testAIConnection(); return; }
    if (e.target.closest('#notifyBtn')) { requestNotifyPermission(); return; }
    if (e.target.closest('#saveSettings')) { saveSettings(); return; }
    if (e.target.closest('#importBtn')) { $('#importFile').click(); return; }
    if (e.target.closest('#clearDemoBtn')) { clearDemoData(); return; }
    if (e.target.closest('#resetBtn')) {
      confirmDialog({ title: '清空全部数据？', message: '所有记录、待办、总结将被永久删除，设置会保留。\n请确认你已经导出备份。', okText: '永久清空' })
        .then(async (ok) => {
          if (!ok) return;
          try {
            const res = await api('/api/reset', { method: 'POST', body: { confirm: 'RESET' } });
            S.data = res.state;
            S.selectedId = null;
            S.messages = [];
            S.chatMessages = [];
            S.chatThreadId = null;
            closeSettings();
            renderAll();
            toast('数据已清空');
          } catch (err) { toast(err.message, 'error'); }
        });
    }
  });
  $('#settingsBody').addEventListener('input', (e) => {
    if (e.target.id === 'setTemperature') $('#tempValue').textContent = e.target.value;
  });
  $('#settingsBody').addEventListener('change', (e) => {
    if (e.target.id === 'importFile') {
      const file = e.target.files?.[0];
      importBackup(file).finally(() => { e.target.value = ''; });
    }
  });

  // 确认框
  $('#confirmCancel').addEventListener('click', () => settleConfirm(false));
  $('#confirmOk').addEventListener('click', () => settleConfirm(true));
  $('#confirmModal').addEventListener('click', (e) => { if (e.target === $('#confirmModal')) settleConfirm(false); });

  // 键盘
  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (S.view !== 'notes') switchView('notes');
      setTimeout(() => $('#searchInput')?.focus(), 30);
      return;
    }
    if (mod && e.key === 'Enter') {
      if (!$('#captureModal').classList.contains('hidden')) {
        e.preventDefault();
        submitCapture();
        return;
      }
      if (document.activeElement?.id === 'askInput') return;
      e.preventDefault();
      openCapture();
      return;
    }
    if (e.key === 'Escape') {
      if (!$('#remindPop').classList.contains('hidden')) { closeRemindPop(); return; }
      if (!$('#confirmModal').classList.contains('hidden')) { settleConfirm(false); return; }
      if (!$('#captureModal').classList.contains('hidden')) { closeCapture(); return; }
      if (!$('#settingsLayer').classList.contains('hidden')) { closeSettings(); return; }
      if (S.view === 'notes' && S.mobileDetail) { S.mobileDetail = false; renderNotes(); }
    }
  });

  window.addEventListener('resize', debounce(() => {
    if (S.view === 'graph' && S.data) startGraph();
  }, 280));
}

/* ---------------- Boot ---------------- */

async function init() {
  hydrateIcons();
  bindEvents();
  try {
    S.data = await api('/api/state');
    S.selectedId = activeNotes()[0]?.id || null;
    renderAll();
    hydrateIcons();
    checkAI();
    startReminderWatch();
  } catch (err) {
    document.body.innerHTML = `<div style="padding:60px;font-family:var(--sans);line-height:1.8"><h2>知屿未能启动</h2><p>${escapeHtml(err.message)}</p><p>请确认本地服务已运行：<code>npm start</code></p></div>`;
  }
}

init();
