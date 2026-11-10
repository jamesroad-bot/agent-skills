import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DATA_DIR, DEFAULT_SETTINGS, clearDemo, exportData, flush, get, importData,
  load, persist, resetAll, save, STORE_FILE,
} from './store.js';
import {
  ackReminder, addTodo, answer, createNote, deleteNote, deleteTodo, dueReminders,
  freeChat, generateSummary, graphData, listTodos, reprocessNote, search, stats,
  summaryToNote, updateNote, updateTodo,
} from './pipeline.js';
import { aiConfig, aiStatus, invalidateStatus, testConnection } from './llm.js';
import { relateAll } from './nlp.js';
import { seedDemo } from './seed.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';

load();
seedDemo();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readBody(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new HttpError(413, '请求体过大'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, '请求 JSON 格式不正确'));
      }
    });
    req.on('error', reject);
  });
}

function maskSettings() {
  const s = get().settings;
  return { ...s, apiKey: '', hasApiKey: !!s.apiKey };
}

function statePayload() {
  const s = get();
  const st = stats();
  return {
    notes: [...s.notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    }).map(({ embedding, ...note }) => note),
    todos: listTodos(),
    summaries: s.summaries,
    chats: s.chats.slice(-30),
    chatThreads: s.chatThreads.slice(-20),
    settings: maskSettings(),
    stats: st,
    tags: st.tags,
    meta: s.meta,
    serverTime: new Date().toISOString(),
    storage: { file: 'data/store.json', dir: DATA_DIR },
    ai: { provider: s.settings.provider, model: s.settings.chatModel, embeddings: s.settings.useEmbeddings },
  };
}

function notePayload(id) {
  const s = get();
  const note = s.notes.find((n) => n.id === id);
  if (!note) throw new HttpError(404, '记录不存在');
  const related = (note.links || [])
    .map((lid) => s.notes.find((n) => n.id === lid))
    .filter(Boolean)
    .map((n) => ({ id: n.id, title: n.title, type: n.type, summary: n.summary, tags: n.tags }));
  return {
    note,
    related,
    todos: listTodos().filter((t) => t.noteId === id),
  };
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.join(PUBLIC, path.normalize(rel).replace(/^([/\\])+/, ''));
  if (filePath !== PUBLIC && !filePath.startsWith(`${PUBLIC}${path.sep}`)) {
    return json(res, 403, { error: '禁止访问' });
  }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      if (path.extname(filePath)) return json(res, 404, { error: '资源不存在' });
      return serveStatic(req, res, '/index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

function sseSend(res, event, data) {
  if (res.writableEnded) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function handleAsk(req, res) {
  const body = await readBody(req);
  const question = String(body.question || '').trim();
  if (question.length < 2) throw new HttpError(400, '问题太短了');
  if (question.length > 500) throw new HttpError(400, '问题请控制在 500 字以内');

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');

  const s = get();
  const chatId = `c_${Date.now().toString(36)}`;
  let full = '';
  let meta = null;
  let citations = [];
  try {
    const gen = answer(question, (m) => {
      meta = m;
      citations = m.citations;
      sseSend(res, 'meta', m);
    });
    while (true) {
      const { value, done } = await gen.next();
      if (done) {
        citations = value || citations;
        break;
      }
      full += value;
      sseSend(res, 'delta', { text: value });
    }
    const chat = {
      id: chatId,
      question,
      answer: full,
      citations,
      mode: meta?.mode || 'llm',
      createdAt: new Date().toISOString(),
    };
    s.chats.push(chat);
    s.chats = s.chats.slice(-100);
    save();
    sseSend(res, 'done', { id: chatId, citations, mode: chat.mode });
  } catch (err) {
    sseSend(res, 'error', { message: err.message || '回答失败' });
  } finally {
    res.end();
  }
}

async function handleChat(req, res) {
  const body = await readBody(req);
  const message = String(body.message || '').trim();
  if (message.length < 1) throw new HttpError(400, '消息不能为空');
  if (message.length > 4000) throw new HttpError(400, '消息请控制在 4000 字以内');

  const s = get();
  let history = Array.isArray(body.history) ? body.history : [];
  history = history
    .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
    .map((h) => ({ role: h.role, content: h.content.slice(0, 4000) }))
    .slice(-24);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');

  const threadId = body.threadId && /^[\w-]{1,64}$/.test(body.threadId) ? body.threadId : null;
  const chatId = `fc_${Date.now().toString(36)}`;
  let full = '';
  let meta = null;
  try {
    const gen = freeChat([...history, { role: 'user', content: message }], (m) => {
      meta = m;
      sseSend(res, 'meta', m);
    });
    while (true) {
      const { value, done } = await gen.next();
      if (done) break;
      full += value;
      sseSend(res, 'delta', { text: value });
    }
    // 持久化会话：追加到对应 thread（无则新建）。
    if (threadId) {
      let thread = s.chatThreads.find((t) => t.id === threadId);
      if (!thread) {
        thread = { id: threadId, title: '', messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        s.chatThreads.push(thread);
      }
      thread.messages.push(
        { role: 'user', content: message, at: new Date().toISOString() },
        { role: 'assistant', content: full, at: new Date().toISOString() },
      );
      if (!thread.title && thread.messages.length <= 2) {
        thread.title = message.slice(0, 24) || '新对话';
      }
      thread.updatedAt = new Date().toISOString();
      s.chatThreads = s.chatThreads.slice(-50);
      save();
    }
    sseSend(res, 'done', { id: chatId, threadId, mode: meta?.ok ? 'llm' : 'offline' });
  } catch (err) {
    sseSend(res, 'error', { message: err.message || '聊天失败' });
  } finally {
    res.end();
  }
}

async function routeApi(req, res, url) {
  const p = url.pathname;
  const m = req.method;
  const s = get();

  if (p === '/api/health' && m === 'GET') {
    return json(res, 200, { ok: true, version: 1, notes: s.notes.length, time: new Date().toISOString() });
  }

  if (p === '/api/state' && m === 'GET') {
    return json(res, 200, statePayload());
  }

  if (p === '/api/notes' && m === 'POST') {
    const body = await readBody(req);
    const note = await createNote({
      text: body.text,
      source: body.source || 'quick',
      useAI: body.useAI !== false,
    });
    return json(res, 201, { ...notePayload(note.id), state: { stats: stats(), tags: stats().tags } });
  }

  const noteMatch = p.match(/^\/api\/notes\/([\w-]+)$/);
  if (noteMatch) {
    const id = noteMatch[1];
    if (m === 'GET') return json(res, 200, notePayload(id));
    if (m === 'PATCH') {
      const body = await readBody(req);
      const note = updateNote(id, body);
      return json(res, 200, notePayload(note.id));
    }
    if (m === 'DELETE') {
      deleteNote(id);
      return json(res, 200, { ok: true, stats: stats() });
    }
  }

  const reprocessMatch = p.match(/^\/api\/notes\/([\w-]+)\/reprocess$/);
  if (reprocessMatch && m === 'POST') {
    const note = await reprocessNote(reprocessMatch[1]);
    return json(res, 200, notePayload(note.id));
  }

  if (p === '/api/search' && m === 'GET') {
    const q = url.searchParams.get('q') || '';
    if (!q.trim()) return json(res, 200, { results: [], query: q });
    const results = search(q, {
      type: url.searchParams.get('type') || '',
      tag: url.searchParams.get('tag') || '',
      range: url.searchParams.get('range') || 'all',
    });
    return json(res, 200, { results, query: q, count: results.length });
  }

  if (p === '/api/ask' && m === 'POST') {
    return handleAsk(req, res);
  }

  if (p === '/api/chat' && m === 'POST') {
    return handleChat(req, res);
  }
  if (p === '/api/chat/threads' && m === 'GET') {
    return json(res, 200, { threads: get().chatThreads });
  }
  if (p === '/api/chat/clear' && m === 'POST') {
    const body = await readBody(req);
    if (body.threadId && /^[\w-]{1,64}$/.test(body.threadId)) {
      get().chatThreads = get().chatThreads.filter((t) => t.id !== body.threadId);
    } else {
      get().chatThreads = [];
    }
    save();
    return json(res, 200, { ok: true, threads: get().chatThreads });
  }

  if (p === '/api/todos' && m === 'GET') {
    return json(res, 200, { todos: listTodos(), stats: stats() });
  }
  if (p === '/api/todos' && m === 'POST') {
    const body = await readBody(req);
    const todo = addTodo(body);
    save();
    return json(res, 201, { todo, todos: listTodos(), stats: stats() });
  }
  const todoMatch = p.match(/^\/api\/todos\/([\w-]+)$/);
  if (todoMatch) {
    if (m === 'PATCH') {
      const body = await readBody(req);
      const todo = updateTodo(todoMatch[1], body);
      return json(res, 200, { todo, todos: listTodos(), stats: stats() });
    }
    if (m === 'DELETE') {
      deleteTodo(todoMatch[1]);
      return json(res, 200, { ok: true, todos: listTodos(), stats: stats() });
    }
  }

  if (p === '/api/reminders' && m === 'GET') {
    const due = dueReminders();
    return json(res, 200, {
      due,
      count: due.length,
      now: new Date().toISOString(),
      stats: stats(),
    });
  }
  const ackMatch = p.match(/^\/api\/reminders\/([\w-]+)\/ack$/);
  if (ackMatch && m === 'POST') {
    ackReminder(ackMatch[1]);
    return json(res, 200, { ok: true, todos: listTodos(), stats: stats() });
  }

  if (p === '/api/summary' && m === 'POST') {
    const body = await readBody(req);
    const range = ['week', 'month', 'all'].includes(body.range) ? body.range : 'week';
    const record = await generateSummary(range, { useAI: body.useAI !== false });
    return json(res, 201, { summary: record, summaries: get().summaries });
  }
  if (p === '/api/summaries' && m === 'GET') {
    return json(res, 200, { summaries: get().summaries });
  }
  const summaryMatch = p.match(/^\/api\/summaries\/([\w-]+)$/);
  if (summaryMatch && m === 'DELETE') {
    s.summaries = s.summaries.filter((x) => x.id !== summaryMatch[1]);
    save();
    return json(res, 200, { ok: true, summaries: s.summaries });
  }
  const toNoteMatch = p.match(/^\/api\/summaries\/([\w-]+)\/to-note$/);
  if (toNoteMatch && m === 'POST') {
    const note = summaryToNote(toNoteMatch[1]);
    return json(res, 201, { note });
  }

  if (p === '/api/graph' && m === 'GET') {
    return json(res, 200, graphData());
  }

  if (p === '/api/settings' && m === 'PUT') {
    const body = await readBody(req);
    const current = get().settings;
    const next = { ...current };
    if (['ollama', 'openai'].includes(body.provider)) next.provider = body.provider;
    if (typeof body.baseUrl === 'string' && body.baseUrl.trim()) {
      if (!/^https?:\/\//i.test(body.baseUrl.trim())) throw new HttpError(400, '服务地址必须以 http:// 或 https:// 开头');
      next.baseUrl = body.baseUrl.trim().replace(/\/+$/, '');
    }
    if (typeof body.chatModel === 'string' && body.chatModel.trim()) next.chatModel = body.chatModel.trim().slice(0, 100);
    if (typeof body.embedModel === 'string') next.embedModel = body.embedModel.trim().slice(0, 100);
    if (typeof body.useEmbeddings === 'boolean') next.useEmbeddings = body.useEmbeddings;
    if (typeof body.autoClassify === 'boolean') next.autoClassify = body.autoClassify;
    if (typeof body.temperature === 'number' && body.temperature >= 0 && body.temperature <= 1.5) {
      next.temperature = body.temperature;
    }
    if (typeof body.apiKey === 'string') next.apiKey = body.apiKey.trim().slice(0, 300);
    s.settings = { ...DEFAULT_SETTINGS, ...next };
    save();
    invalidateStatus();
    return json(res, 200, { settings: maskSettings() });
  }

  if (p === '/api/settings/test' && m === 'POST') {
    const body = await readBody(req);
    const cfg = aiConfig();
    const result = await testConnection({
      provider: body.provider || cfg.provider,
      baseUrl: body.baseUrl || cfg.baseUrl,
      chatModel: body.chatModel || cfg.chatModel,
      embedModel: body.embedModel || cfg.embedModel,
      apiKey: typeof body.apiKey === 'string' && body.apiKey ? body.apiKey : cfg.apiKey,
    });
    return json(res, 200, result);
  }

  if (p === '/api/ai/status' && m === 'GET') {
    const force = url.searchParams.get('force') === '1';
    return json(res, 200, await aiStatus(force));
  }

  if (p === '/api/export' && m === 'GET') {
    const data = exportData();
    const body = JSON.stringify(data, null, 2);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="zhiyu-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      'Content-Length': Buffer.byteLength(body),
    });
    return res.end(body);
  }

  if (p === '/api/import' && m === 'POST') {
    const body = await readBody(req, 20 * 1024 * 1024);
    importData(body);
    relateAll(get().notes.filter((n) => !n.archived));
    persist();
    return json(res, 200, { ok: true, state: statePayload() });
  }

  if (p === '/api/demo/clear' && m === 'POST') {
    const state = clearDemo();
    relateAll(state.notes.filter((n) => !n.archived));
    save();
    return json(res, 200, { ok: true, state: statePayload() });
  }

  if (p === '/api/reset' && m === 'POST') {
    const body = await readBody(req);
    if (body.confirm !== 'RESET') throw new HttpError(400, '需要确认参数 confirm=RESET');
    resetAll({ keepSettings: true });
    return json(res, 200, { ok: true, state: statePayload() });
  }

  throw new HttpError(404, '接口不存在');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      await routeApi(req, res, url);
    } else {
      serveStatic(req, res, url.pathname);
    }
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error('[server]', err);
    if (!res.headersSent) json(res, status, { error: err.message || '服务器内部错误' });
    else res.end();
  }
});

server.timeout = 0;
server.requestTimeout = 0;

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  知屿 · 个人信息管家');
  console.log(`  → http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}`);
  console.log(`  → 数据文件：${STORE_FILE}`);
  const cfg = aiConfig();
  console.log(`  → 模型：${cfg.provider} / ${cfg.chatModel} @ ${cfg.baseUrl}`);
  console.log('  → 提示：未启动 Ollama 时会自动使用本地规则引擎');
  console.log('');
});

function shutdown() {
  console.log('\n[server] 正在保存数据并退出…');
  flush();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1200);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
