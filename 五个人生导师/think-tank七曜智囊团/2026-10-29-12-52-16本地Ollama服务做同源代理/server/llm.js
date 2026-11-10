import { get } from './store.js';

const AI_TIMEOUT = Number(process.env.ZHIYU_AI_TIMEOUT || 120000);
let statusCache = { at: 0, result: null };

export function aiConfig() {
  const s = get().settings;
  return {
    ...s,
    apiKey: s.apiKey || process.env.ZHIYU_API_KEY || '',
  };
}

function trimBase(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function openAIEndpoint(base, suffix) {
  const b = trimBase(base);
  if (/\/v\d+$/.test(b)) return `${b}${suffix}`;
  return `${b}/v1${suffix}`;
}

function friendlyError(err, cfg) {
  const msg = String(err?.message || err);
  if (/ECONNREFUSED|fetch failed|ENOTFOUND|EACCES/.test(msg)) {
    return `无法连接 ${cfg.baseUrl}。请确认本地模型服务已启动（Ollama: ollama serve），或在设置中修改服务地址。`;
  }
  if (/401|403|unauthorized/i.test(msg)) return '模型服务拒绝了请求，请检查 API Key 或访问权限。';
  if (/404|not found/i.test(msg)) return `模型或接口不存在，请检查模型名称「${cfg.chatModel}」及服务地址。`;
  if (/aborted|timeout/i.test(msg)) return '模型响应超时，请检查模型是否已加载，或换用更小的模型。';
  return `模型调用失败：${msg}`;
}

async function request(url, options, timeout = AI_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${text.slice(0, 300)}`);
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function chat(messages, opts = {}) {
  const cfg = aiConfig();
  const temperature = opts.temperature ?? cfg.temperature ?? 0.3;
  if (cfg.provider === 'openai') {
    const body = {
      model: opts.model || cfg.chatModel,
      messages,
      temperature,
      stream: false,
    };
    if (opts.json) body.response_format = { type: 'json_object' };
    const res = await request(openAIEndpoint(cfg.baseUrl, '/chat/completions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    }).catch((err) => { throw new Error(friendlyError(err, cfg)); });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  const body = {
    model: opts.model || cfg.chatModel,
    messages,
    stream: false,
    options: { temperature },
  };
  if (opts.json) body.format = 'json';
  const res = await request(`${trimBase(cfg.baseUrl)}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch((err) => { throw new Error(friendlyError(err, cfg)); });
  const data = await res.json();
  return data.message?.content?.trim() || '';
}

export async function* chatStream(messages, opts = {}) {
  const cfg = aiConfig();
  const temperature = opts.temperature ?? cfg.temperature ?? 0.3;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT * 2);
  try {
    let res;
    let url;
    let body;
    if (cfg.provider === 'openai') {
      url = openAIEndpoint(cfg.baseUrl, '/chat/completions');
      body = JSON.stringify({
        model: opts.model || cfg.chatModel,
        messages,
        temperature,
        stream: true,
      });
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
        },
        body,
        signal: controller.signal,
      });
    } else {
      url = `${trimBase(cfg.baseUrl)}/api/chat`;
      body = JSON.stringify({
        model: opts.model || cfg.chatModel,
        messages,
        stream: true,
        options: { temperature },
      });
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
      });
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${text.slice(0, 300)}`);
    }
    if (!res.body) throw new Error('模型服务未返回流式内容');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      if (cfg.provider === 'openai') {
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch { /* 忽略半截 SSE */ }
        }
      } else {
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const json = JSON.parse(trimmed);
            if (json.message?.content) yield json.message.content;
            if (json.error) throw new Error(json.error);
          } catch (err) {
            if (err instanceof SyntaxError) continue;
            throw err;
          }
        }
      }
    }
  } catch (err) {
    throw new Error(friendlyError(err, cfg));
  } finally {
    clearTimeout(timer);
  }
}

export function parseJSON(text) {
  let s = String(text || '').trim();
  if (!s) return null;
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try { return JSON.parse(s); } catch { /* 继续尝试截取 */ }
  const start = s.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(s.slice(start, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

export async function testConnection(custom, timeout = 12000) {
  const cfg = { ...aiConfig(), ...(custom || {}) };
  const started = Date.now();
  try {
    if (cfg.provider === 'openai') {
      const res = await request(openAIEndpoint(cfg.baseUrl, '/models'), {
        headers: cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {},
      }, timeout);
      const data = await res.json();
      const models = (data.data || []).map((m) => m.id).slice(0, 40);
      return {
        ok: true,
        latency: Date.now() - started,
        models,
        message: `连接成功，发现 ${models.length} 个可用模型`,
      };
    }
    const res = await request(`${trimBase(cfg.baseUrl)}/api/tags`, {}, timeout);
    const data = await res.json();
    const models = (data.models || []).map((m) => m.name).slice(0, 40);
    const hasChat = models.some((m) => m === cfg.chatModel || m.startsWith(`${cfg.chatModel}:`));
    return {
      ok: true,
      latency: Date.now() - started,
      models,
      message: models.length
        ? `连接成功，发现 ${models.length} 个模型${hasChat ? '' : `（未找到 ${cfg.chatModel}，请先 ollama pull）`}`
        : '服务已连接，但还没有下载任何模型',
    };
  } catch (err) {
    return { ok: false, latency: Date.now() - started, models: [], message: friendlyError(err, cfg) };
  }
}

export async function aiStatus(force = false) {
  const now = Date.now();
  if (!force && statusCache.result && now - statusCache.at < 20000) return statusCache.result;
  const cfg = aiConfig();
  const res = await testConnection({}, 3500);
  const result = {
    ok: res.ok,
    provider: cfg.provider,
    model: cfg.chatModel,
    models: res.models || [],
    latency: res.latency,
    message: res.message,
    checkedAt: new Date().toISOString(),
    embeddings: !!(cfg.useEmbeddings && cfg.embedModel),
  };
  statusCache = { at: now, result };
  return result;
}

export function invalidateStatus() {
  statusCache = { at: 0, result: null };
}

export async function embed(texts) {
  const cfg = aiConfig();
  if (!cfg.useEmbeddings || !texts.length) return null;
  const input = texts.map((t) => String(t || '').slice(0, 4000));
  try {
    if (cfg.provider === 'openai') {
      const res = await request(openAIEndpoint(cfg.baseUrl, '/embeddings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
        },
        body: JSON.stringify({ model: cfg.embedModel, input }),
      }, 10000);
      const data = await res.json();
      return (data.data || []).map((x) => x.embedding);
    }
    const res = await request(`${trimBase(cfg.baseUrl)}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: cfg.embedModel, input }),
    }, 10000);
    const data = await res.json();
    return data.embeddings || null;
  } catch (err) {
    console.warn('[llm] 向量计算失败，回退 BM25：', err.message);
    return null;
  }
}

export function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
