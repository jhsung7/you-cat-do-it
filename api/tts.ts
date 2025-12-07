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

  const apiKey = process.env.HUGGING_FACE_API_KEY || process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    return send(res, 500, { error: 'HUGGING_FACE_API_KEY is missing' })
  }

  try {
    const body = await parseBody(req)
    const text = body?.text
    const language = body?.language || 'ko'

    if (!text || typeof text !== 'string') {
      return send(res, 400, { error: 'text is required' })
    }

    const upstream = await fetch('https://api-inference.huggingface.co/models/microsoft/VibeVoice-Realtime-0.5B', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'audio/wav',
      },
      body: JSON.stringify({ inputs: text, parameters: { language } }),
    })

    if (!upstream.ok) {
      const details = await upstream.text()
      return send(res, upstream.status, { error: 'TTS upstream error', details })
    }

    const buffer = Buffer.from(await upstream.arrayBuffer())
    const contentType = upstream.headers.get('content-type') || 'audio/wav'

    return send(res, 200, { audio: buffer.toString('base64'), contentType })
  } catch (err) {
    console.error('TTS handler error', err)
    return send(res, 500, { error: 'TTS handler failed' })
  }
}
