import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA_DIR = process.env.ZHIYU_DATA_DIR
  ? path.resolve(process.env.ZHIYU_DATA_DIR)
  : path.join(ROOT, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

export const DEFAULT_SETTINGS = {
  provider: 'ollama',
  baseUrl: 'http://127.0.0.1:11434',
  chatModel: 'qwen2.5:7b',
  embedModel: 'bge-m3',
  useEmbeddings: false,
  temperature: 0.3,
  autoClassify: true,
  apiKey: '',
};

const EMPTY = {
  version: 1,
  createdAt: new Date().toISOString(),
  notes: [],
  todos: [],
  summaries: [],
  chats: [],
  chatThreads: [],
  settings: { ...DEFAULT_SETTINGS },
  meta: { seeded: false },
};

let state = null;

export function uid(prefix = 'x') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function sanitize(raw) {
  const base = structuredClone(EMPTY);
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    notes: Array.isArray(raw.notes) ? raw.notes : [],
    todos: Array.isArray(raw.todos) ? raw.todos : [],
    summaries: Array.isArray(raw.summaries) ? raw.summaries : [],
    chats: Array.isArray(raw.chats) ? raw.chats.slice(-100) : [],
    chatThreads: Array.isArray(raw.chatThreads) ? raw.chatThreads.slice(-50) : [],
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings || {}) },
    meta: { ...base.meta, ...(raw.meta || {}) },
  };
}

export function load() {
  ensureDirs();
  if (fs.existsSync(STORE_FILE)) {
    try {
      state = sanitize(JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')));
      backupDaily();
    } catch (err) {
      const broken = path.join(DATA_DIR, `store.broken-${Date.now()}.json`);
      try { fs.copyFileSync(STORE_FILE, broken); } catch { /* ignore */ }
      console.error('[store] 数据文件损坏，已备份至', broken);
      state = structuredClone(EMPTY);
    }
  } else {
    state = structuredClone(EMPTY);
    persist();
  }
  return state;
}

export function get() {
  if (!state) load();
  return state;
}

let writeTimer = null;

/** 同步原子写入：临时文件 + rename，避免进程中断造成半截 JSON。 */
export function persist() {
  ensureDirs();
  const tmp = `${STORE_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmp, STORE_FILE);
}

/** 合并短时间内的多次写入，降低磁盘 IO。 */
export function save() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeTimer = null;
    try { persist(); } catch (err) { console.error('[store] 写入失败', err); }
  }, 60);
}

export function flush() {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  if (state) persist();
}

function backupDaily() {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const target = path.join(BACKUP_DIR, `store-${day}.json`);
    if (fs.existsSync(STORE_FILE) && !fs.existsSync(target)) {
      fs.copyFileSync(STORE_FILE, target);
    }
    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.json')).sort();
    while (files.length > 7) {
      const old = files.shift();
      fs.unlinkSync(path.join(BACKUP_DIR, old));
    }
  } catch (err) {
    console.warn('[store] 自动备份跳过：', err.message);
  }
}

export function exportData() {
  return {
    app: 'zhiyu',
    exportedAt: new Date().toISOString(),
    ...get(),
    settings: { ...get().settings, apiKey: '' },
  };
}

export function importData(payload) {
  if (!payload || !Array.isArray(payload.notes)) {
    throw new Error('导入文件格式不正确：缺少 notes 数组');
  }
  const next = sanitize(payload);
  next.settings = { ...next.settings, apiKey: get().settings.apiKey };
  next.meta = { ...next.meta, seeded: true };
  state = next;
  persist();
  return state;
}

export function resetAll({ keepSettings = true } = {}) {
  const settings = keepSettings ? { ...get().settings } : { ...DEFAULT_SETTINGS };
  state = structuredClone(EMPTY);
  state.settings = settings;
  state.meta.seeded = true;
  persist();
  return state;
}

export function clearDemo() {
  const s = get();
  const seedIds = new Set(s.notes.filter((n) => n.demo).map((n) => n.id));
  s.notes = s.notes.filter((n) => !n.demo);
  s.todos = s.todos.filter((t) => !seedIds.has(t.noteId) && !t.demo);
  s.summaries = s.summaries.filter((x) => !x.demo);
  s.chats = [];
  s.chatThreads = [];
  s.meta.demoCleared = true;
  persist();
  return state;
}

export { STORE_FILE, BACKUP_DIR, ROOT };
