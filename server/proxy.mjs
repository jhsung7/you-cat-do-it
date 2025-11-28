// Minimal Gemini proxy to hide the API key from the frontend.
// Also hosts a tiny shared state API for demo data.
// Usage:
//   GEMINI_API_KEY=... PORT=8787 node server/proxy.mjs
// Optional:
//   STATE_FILE=./state.json
//   STATE_WRITE_TOKEN=secret   (set to require a token for writes)
// Deploy on Render/Vercel/Netlify function; keep secrets in env vars.

import http from 'http'
import { promises as fs } from 'fs'
import path from 'path'

const PORT = process.env.PORT || 8787
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const STATE_FILE = process.env.STATE_FILE || path.join(path.dirname(new URL(import.meta.url).pathname), 'state.json')
const STATE_WRITE_TOKEN = process.env.STATE_WRITE_TOKEN || ''
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY
const STATE_ID = process.env.STATE_ID || 'global'

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is missing. Set it in your environment.')
  process.exit(1)
}

const respond = (res, status, data) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-State-Token',
  })
  res.end(JSON.stringify(data))
}

const supabaseHeaders = SUPABASE_KEY
  ? {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    }
  : null

const readState = async () => {
  if (SUPABASE_URL && supabaseHeaders) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_state?id=eq.${STATE_ID}&select=data`, {
        method: 'GET',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      })
      if (!res.ok) throw new Error(`Supabase read failed: ${res.status}`)
      const rows = await res.json()
      return rows[0]?.data || { message: 'empty', updatedAt: new Date().toISOString() }
    } catch (err) {
      console.error('Supabase read error, falling back to file:', err)
    }
  }
  try {
    const buf = await fs.readFile(STATE_FILE, 'utf8')
    return JSON.parse(buf)
  } catch (err) {
    return { message: 'demo state', updatedAt: new Date().toISOString() }
  }
}

const writeState = async (state) => {
  if (SUPABASE_URL && supabaseHeaders) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_state?on_conflict=id`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify([
          {
            id: STATE_ID,
            data: state,
            updated_at: new Date().toISOString(),
          },
        ]),
      })
      if (!res.ok) throw new Error(`Supabase write failed: ${res.status} ${await res.text()}`)
      return
    } catch (err) {
      console.error('Supabase write error, falling back to file:', err)
    }
  }
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8')
}

const parseJsonBody = async (req) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

const handler = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-State-Token',
    })
    return res.end()
  }

  try {
    // Shared state API (GET/POST)
    if (req.url === '/api/state' && req.method === 'GET') {
      const state = await readState()
      return respond(res, 200, { state })
    }
    if (req.url === '/api/state' && req.method === 'POST') {
      if (STATE_WRITE_TOKEN) {
        const token = req.headers['x-state-token']
        if (!token || token !== STATE_WRITE_TOKEN) {
          return respond(res, 401, { error: 'Unauthorized' })
        }
      }
      const body = await parseJsonBody(req)
      if (!body || typeof body !== 'object') {
        return respond(res, 400, { error: 'Invalid JSON' })
      }
      const nextState = { ...body, updatedAt: new Date().toISOString() }
      await writeState(nextState)
      return respond(res, 200, { ok: true, state: nextState })
    }

    // Gemini proxy
    if (req.url === '/api/gemini' && req.method === 'POST') {
      const body = await parseJsonBody(req)
      const { prompt, model = 'gemini-2.5-flash' } = body || {}
      if (!prompt) return respond(res, 400, { error: 'prompt is required' })

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
      const upstream = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }]}],
        }),
      })

      if (!upstream.ok) {
        const text = await upstream.text()
        return respond(res, upstream.status, { error: 'Upstream error', details: text })
      }

      const data = await upstream.json()
      const text =
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n').trim() ||
        data?.candidates?.[0]?.output || ''

      return respond(res, 200, { text, raw: data })
    }

    return respond(res, 404, { error: 'Not found' })
  } catch (err) {
    console.error('Proxy error', err)
    return respond(res, 500, { error: 'Proxy failed' })
  }
}

http.createServer(handler).listen(PORT, () => {
  console.log(`Gemini proxy running on http://localhost:${PORT}/api/gemini`)
})
