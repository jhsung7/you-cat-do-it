// Minimal Gemini proxy to hide the API key from the frontend.
// Usage:
//   GEMINI_API_KEY=... PORT=8787 node server/proxy.mjs
// Deploy on Render/Vercel/Netlify function; keep the key in env vars.

import http from 'http'

const PORT = process.env.PORT || 8787
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is missing. Set it in your environment.')
  process.exit(1)
}

const respond = (res, status, data) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(data))
}

const handler = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    return res.end()
  }

  if (req.method !== 'POST' || req.url !== '/api/gemini') {
    return respond(res, 404, { error: 'Not found' })
  }

  try {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
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
  } catch (err) {
    console.error('Proxy error', err)
    return respond(res, 500, { error: 'Proxy failed' })
  }
}

http.createServer(handler).listen(PORT, () => {
  console.log(`Gemini proxy running on http://localhost:${PORT}/api/gemini`)
})
