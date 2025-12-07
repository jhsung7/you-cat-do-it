const ttsProxyUrl = (import.meta.env.VITE_TTS_PROXY_URL as string | undefined) || '/api/tts'

const decodeBase64ToBlob = (base64: string, contentType: string) => {
  const byteCharacters = atob(base64)
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
    const slice = byteCharacters.slice(offset, offset + 1024)
    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }
    byteArrays.push(new Uint8Array(byteNumbers))
  }

  return new Blob(byteArrays, { type: contentType })
}

type TtsResponse = { audio: string; contentType?: string }
type TtsErrorResponse = { error?: string; details?: string }

export const synthesizeTts = async (text: string, language: 'ko' | 'en') => {
  const res = await fetch(ttsProxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  })

  let data: TtsResponse | TtsErrorResponse
  try {
    data = (await res.json()) as TtsResponse | TtsErrorResponse
  } catch (error) {
    throw new Error(`TTS response parsing failed: ${error}`)
  }

  if (!res.ok) {
    const message = data && 'error' in data && data.error ? data.error : 'Unknown TTS error'
    const extra = data && 'details' in data && data.details ? ` (${data.details})` : ''
    throw new Error(`${message}${extra}`)
  }

  if (!('audio' in data) || !data.audio) {
    throw new Error('TTS response missing audio payload')
  }

  const blob = decodeBase64ToBlob(data.audio, data.contentType || 'audio/wav')
  return blob
}
