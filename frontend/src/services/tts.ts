import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY
const proxyUrl = import.meta.env.VITE_GEMINI_PROXY_URL as string | undefined
const genAI = !proxyUrl && apiKey ? new GoogleGenerativeAI(apiKey) : null

const decodeBase64Audio = (base64: string, mimeType: string) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: mimeType })
  return URL.createObjectURL(blob)
}

export const synthesizeGeminiTTS = async (text: string, language: 'ko' | 'en') => {
  if (!genAI) {
    throw new Error('Gemini client not initialized for TTS. Add VITE_GEMINI_API_KEY or remove proxy URL override.')
  }
  const prompt = language === 'ko'
    ? `다음 문장을 자연스러운 한국어로 읽어줄 음성을 생성하세요:\n${text}`
    : `Create natural sounding speech audio for this text:\n${text}`

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }]}],
    generationConfig: {
      responseMimeType: 'audio/mp3',
      // Hint the language so Gemini picks an appropriate voice profile
      voiceConfig: { languageCode: language === 'ko' ? 'ko-KR' : 'en-US' },
    } as any,
  })

  const audioPart = result.response.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData?.mimeType?.startsWith('audio/'))
  const audioData = audioPart?.inlineData?.data as string | undefined
  const mimeType = audioPart?.inlineData?.mimeType || 'audio/mp3'

  if (!audioData) {
    throw new Error('Gemini TTS response did not include audio data')
  }

  return decodeBase64Audio(audioData, mimeType)
}
