const proxyUrl = import.meta.env.VITE_GEMINI_PROXY_URL as string | undefined
const stateUrl = proxyUrl?.replace(/\/api\/gemini$/, '/api/state')
const stateWriteToken = import.meta.env.VITE_STATE_WRITE_TOKEN as string | undefined

const shouldSync = Boolean(stateUrl)

const readJson = (key: string) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

const writeJson = (key: string, value: unknown) => {
  if (value === undefined) return
  localStorage.setItem(key, JSON.stringify(value))
}

const collectState = () => ({
  healthLogs: readJson('healthLogs') || [],
  symptoms: readJson('cat-symptoms') || [],
  weightLogs: readJson('cat-weight-logs') || [],
  vetVisits: readJson('cat-vet-visits') || [],
  prescriptions: readJson('cat-prescriptions') || [],
  moodLogs: readJson('cat-mood-logs') || [],
  quickLogSettings: readJson('quickLogSettings') || null,
  nutritionGoals: readJson('nutritionGoals') || null,
  chatHistory: readJson('chat-history') || [],
  catStorage: readJson('cat-storage') || null, // zustand persist state
})

export const loadSharedState = async () => {
  if (!shouldSync) return null
  try {
    const res = await fetch(stateUrl!, { method: 'GET' })
    if (!res.ok) return null
    const data = await res.json()
    const state = data?.state
    if (!state) return null

    const hasCats = Array.isArray(state.catStorage?.state?.cats) && state.catStorage.state.cats.length > 0

    if (!hasCats) {
      // 아무 고양이가 없으면 모든 상태를 비움 (초기 페이지가 비어있도록)
      writeJson('healthLogs', [])
      writeJson('cat-symptoms', [])
      writeJson('cat-weight-logs', [])
      writeJson('cat-vet-visits', [])
      writeJson('cat-prescriptions', [])
      writeJson('cat-mood-logs', [])
      writeJson('quickLogSettings', null)
      writeJson('nutritionGoals', null)
      writeJson('chat-history', [])
      writeJson('cat-storage', { state: { cats: [], selectedCat: null }, version: 0 })
      return state
    }

    writeJson('healthLogs', state.healthLogs ?? [])
    writeJson('cat-symptoms', state.symptoms ?? [])
    writeJson('cat-weight-logs', state.weightLogs ?? [])
    writeJson('cat-vet-visits', state.vetVisits ?? [])
    writeJson('cat-prescriptions', state.prescriptions ?? [])
    writeJson('cat-mood-logs', state.moodLogs ?? [])
    if (state.quickLogSettings) writeJson('quickLogSettings', state.quickLogSettings)
    if (state.nutritionGoals) writeJson('nutritionGoals', state.nutritionGoals)
    if (state.chatHistory) writeJson('chat-history', state.chatHistory)
    if (state.catStorage) writeJson('cat-storage', state.catStorage)
    return state
  } catch (err) {
    console.error('Failed to load shared state', err)
    return null
  }
}

export const saveSharedState = async () => {
  if (!shouldSync) return false
  try {
    const payload = collectState()
    await fetch(stateUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(stateWriteToken ? { 'X-State-Token': stateWriteToken } : {}),
      },
      body: JSON.stringify(payload),
    })
    return true
  } catch (err) {
    console.error('Failed to save shared state', err)
    return false
  }
}

let syncTimer: number | null = null

export const scheduleSharedStateSave = () => {
  if (!shouldSync) return
  if (syncTimer) return
  syncTimer = window.setTimeout(() => {
    syncTimer = null
    void saveSharedState()
  }, 500)
}

export const getStateEndpoint = () => stateUrl

// expose for inline calls without import
if (typeof window !== 'undefined') {
  ;(window as any).scheduleSharedStateSave = scheduleSharedStateSave
}
