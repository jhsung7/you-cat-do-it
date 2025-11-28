declare global {
  interface Window {
    scheduleSharedStateSave?: () => void
  }
}

export {}
