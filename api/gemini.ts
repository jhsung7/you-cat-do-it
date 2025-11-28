// Vercel serverless function for Gemini proxy
import type { VercelRequest, VercelResponse } from '@vercel/node'

const send = (res: VercelResponse, status: number, data: any) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.status(status).send(JSON.stringify(data))
}

const parseBody = async (req: VercelRequest) => {
  if (req.body) return req.body
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return send(res, 500, { error: 'GEMINI_API_KEY is missing' })
  }

  try {
    const body = await parseBody(req)
    const prompt = body?.prompt
    const model = body?.model || 'gemini-2.5-flash'
    if (!prompt) return send(res, 400, { error: 'prompt is required' })

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }]}] }),
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      return send(res, upstream.status, { error: 'Upstream error', details: text })
    }

    const data = await upstream.json()
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n').trim() ||
      data?.candidates?.[0]?.output ||
      ''

    return send(res, 200, { text, raw: data })
  } catch (err: any) {
    console.error('Gemini proxy error', err)
    return send(res, 500, { error: 'Proxy failed' })
  }
}
