// Vercel serverless function for shared state (Supabase backed, file fallback disabled)
import type { VercelRequest, VercelResponse } from '@vercel/node'

const send = (res: VercelResponse, status: number, data: any) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-State-Token')
  res.status(status).send(JSON.stringify(data))
}

const parseBody = async (req: VercelRequest) => {
  if (req.body) return req.body
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY
const STATE_ID = process.env.STATE_ID || 'global'
const STATE_WRITE_TOKEN = process.env.STATE_WRITE_TOKEN || ''

const supabaseHeaders = SUPABASE_KEY
  ? {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    }
  : null

const readState = async () => {
  if (!SUPABASE_URL || !supabaseHeaders) throw new Error('Supabase env missing')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_state?id=eq.${STATE_ID}&select=data`, {
    method: 'GET',
    headers: supabaseHeaders,
  })
  if (!res.ok) throw new Error(`Supabase read failed: ${res.status}`)
  const rows = await res.json()
  return rows[0]?.data || {}
}

const writeState = async (state: any) => {
  if (!SUPABASE_URL || !supabaseHeaders) throw new Error('Supabase env missing')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_state?on_conflict=id`, {
    method: 'POST',
    headers: { ...supabaseHeaders, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([
      {
        id: STATE_ID,
        data: state,
        updated_at: new Date().toISOString(),
      },
    ]),
  })
  if (!res.ok) throw new Error(`Supabase write failed: ${res.status} ${await res.text()}`)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-State-Token')
    return res.status(204).end()
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return send(res, 500, { error: 'Supabase env missing' })
  }

  try {
    if (req.method === 'GET') {
      const state = await readState()
      return send(res, 200, { state })
    }

    if (req.method === 'POST') {
      if (STATE_WRITE_TOKEN) {
        const token = (req.headers['x-state-token'] as string | undefined) || ''
        if (token !== STATE_WRITE_TOKEN) {
          return send(res, 401, { error: 'Unauthorized' })
        }
      }
      const body = await parseBody(req)
      if (!body || typeof body !== 'object') {
        return send(res, 400, { error: 'Invalid JSON' })
      }
      const nextState = { ...body, updatedAt: new Date().toISOString() }
      await writeState(nextState)
      return send(res, 200, { ok: true, state: nextState })
    }

    return send(res, 405, { error: 'Method not allowed' })
  } catch (err: any) {
    console.error('State handler error', err)
    return send(res, 500, { error: 'State handler failed' })
  }
}
