const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const fs = require('fs');
const path = require('path');

require('dotenv').config(); // load environment variables

const app = new Hono();

app.get('/data', (c) => {
  try {
    const dataPath = path.join(__dirname, 'data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to read data' }, 500);
  }
});

app.post('/data', async (c) => {
  try {
    const dataPath = path.join(__dirname, 'data.json');
    const newEntry = await c.req.json();
    
    // Read current data
    const currentData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Generate new ID
    const maxId = currentData.length > 0 ? Math.max(...currentData.map(item => item.id)) : 0;
    newEntry.id = maxId + 1;
    
    // Add new entry
    currentData.push(newEntry);
    
    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(currentData, null, 2));
    
    return c.json({ message: 'Entry added successfully', entry: newEntry }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to add entry' }, 500);
  }
});

// --- CORS Middleware (allow local dev dashboard) -------------------------------------------
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }
  return await next();
});

// Lazy-load AI SDK (ESM) from CommonJS context once and cache the promise
let _aiModulesPromise = null;
async function getAIModules() {
  if (!_aiModulesPromise) {
    _aiModulesPromise = Promise.all([
      import('ai'),
      import('@ai-sdk/openai'),
    ]).then(([aiCore, openaiMod]) => ({ generateText: aiCore.generateText, openai: openaiMod.openai }));
  }
  return _aiModulesPromise;
}

// Utility: safe JSON parse of model output possibly wrapped in text
function extractJSONArray(text) {
  if (!text) return [];
  try {
    return JSON.parse(text);
  } catch (_) {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (__) {
        return [];
      }
    }
    return [];
  }
}

// OPENAI_API_KEY must be supplied via environment (.env file / deployment secret).
// POST /ai/pr-suggestions
// Body: { diffUrl: string, vitals?: {...}, bundleSize?: {...}, shipScore?, health?, performance?, title?, description?, prNumber? }
// Returns: { suggestions: [{ id, priority, description }] }
app.post('/ai/pr-suggestions', async (c) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return c.json({ error: 'Server missing OPENAI_API_KEY' }, 500);
    }
    const payload = await c.req.json();
    const { diffUrl } = payload || {};
    if (!diffUrl || typeof diffUrl !== 'string') {
      return c.json({ error: 'diffUrl required' }, 400);
    }

    // Fetch diff (GitHub style .diff) ---------------------------------------------------------
    let diffText = '';
    try {
      const diffRes = await fetch(diffUrl, {
        headers: { 'Accept': 'application/vnd.github.v3.diff, text/plain' },
      });
      diffText = await diffRes.text();
    } catch (err) {
      diffText = '[Failed to fetch diff – proceeding with metrics only]';
    }
    if (diffText.length > 30000) {
      diffText = diffText.slice(0, 30000) + '\n...[TRUNCATED]';
    }

    const metricsSummary = {
      shipScore: payload.shipScore,
      health: payload.health,
      performance: payload.performance,
      vitals: payload.vitals,
      bundleSize: payload.bundleSize,
      title: payload.title,
      description: (payload.description || '').slice(0, 2000),
      prNumber: payload.prNumber,
    };

    const prompt = `You are an engineering assistant. Given a pull request GIT DIFF and quality metrics (web vitals, bundle size, health heuristics), produce a concise JSON array of improvement suggestions. Each suggestion should:
- Focus on actionable changes to improve performance, accessibility, maintainability, test coverage, or bundle efficiency.
- Include a priority classification: High | Medium | Low (High = prevents regression / major perf issue, Medium = worthwhile optimization, Low = polish / nice-to-have).
Return ONLY a JSON array with objects: {"id": "kebab-case-id", "priority": "High|Medium|Low", "description": "Actionable recommendation"}.
Avoid duplicating existing info, be specific (e.g. "Defer hydration of Sidebar until viewport visible" not "Optimize sidebar").

<PR_META>${JSON.stringify(metricsSummary, null, 2)}</PR_META>
<DIFF>${diffText}</DIFF>`;

    const { generateText, openai } = await getAIModules();
    const model = openai(process.env.OPENAI_MODEL || 'gpt-4o'); // Default model; override via OPENAI_MODEL

    const result = await generateText({
      model,
      prompt,
      temperature: 0.3,
      maxOutputTokens: 900,
    });

    const raw = result.text;
    const parsed = extractJSONArray(raw)
      .filter((s) => s && typeof s === 'object' && s.description)
      .map((s, idx) => ({
        id: typeof s.id === 'string' ? s.id : `suggestion-${idx + 1}`,
        priority: ['High', 'Medium', 'Low'].includes(s.priority) ? s.priority : 'Medium',
        description: String(s.description).slice(0, 500),
      }));

    if (!parsed.length) {
      return c.json({
        suggestions: [
          {
            id: 'no-ai-output',
            priority: 'Low',
            description: 'Model returned no structured suggestions. Try again or refine the diff.',
          },
        ],
        raw,
      });
    }

    return c.json({ suggestions: parsed, raw });
  } catch (error) {
    console.error('[ai] generation failed', error);
    return c.json({ error: 'Failed to generate AI suggestions' }, 500);
  }
});

const port = process.env.PORT || 3000;
serve({
  fetch: app.fetch,
  port: port,
});

console.log(`Server running on port ${port}`);