/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_GEMINI_PROXY_URL?: string
  readonly VITE_STATE_WRITE_TOKEN?: string
  readonly VITE_TTS_PROXY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
