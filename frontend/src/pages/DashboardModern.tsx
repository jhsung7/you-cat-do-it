import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCatStore } from '../store/catStore'
import { useHealthStore } from '../store/healthStore'
import WeightLogger from '../components/WeightLogger'
import SymptomChecker from '../components/SymptomChecker'
import DailySummary from '../components/DailySummary'
import { startVoiceRecognition, stopVoiceRecognition } from '../services/speech'
import { parseHealthLogFromVoice } from '../services/gemini'
import { HealthLog, Symptom, WeightLog, HealthAnomaly, Cat, Medication } from '../types'
import { calculateDER, calculateRecommendedWater, estimateFoodCalories } from '../utils/calorieCalculator'
import { defaultMedications, loadMedicationsForCat, saveMedicationsForCat } from '../utils/medicationStorage'

type QuickLogSettings = {
  mealType: 'wet' | 'dry' | 'both'
  wetFoodBrand?: string
  wetFoodAmount: number
  wetFoodCaloriesPer100g: number
  dryFoodBrand?: string
  dryFoodAmount: number
  dryFoodCaloriesPer100g: number
  treatBrand?: string
  treatType: 'chewy' | 'crunchy' | 'freeze-dried'
  treatCount: number
  treatCaloriesPer100g: number
  waterAmount: number
  urineCount: number
  fecesCount: number
  playDurationToys: number
  playDurationWheel: number
  dentalProduct?: string
}

type DisplayEntry = { kind: 'health'; log: HealthLog } | { kind: 'weight'; log: WeightLog }

const fallbackAvatar =
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=200&q=60'

const DAY_IN_MS = 1000 * 60 * 60 * 24

type AiSummary = {
  headline: string
  subline: string
  highlights: string[]
  mode: 'alert' | 'default'
}

const buildAiSummary = (
  params: {
    cat?: Cat | null
    logs: HealthLog[]
    anomalies: HealthAnomaly[]
    lang: 'ko' | 'en'
    wetFoodCaloriesPer100g: number
    dryFoodCaloriesPer100g: number
    snackCaloriesPer100g: number
  }
): AiSummary => {
  const { cat, logs, anomalies, lang, wetFoodCaloriesPer100g, dryFoodCaloriesPer100g, snackCaloriesPer100g } = params

  if (!cat) {
    return {
      headline: lang === 'ko' ? '고양이를 선택해주세요' : 'Select a cat profile',
      subline: lang === 'ko' ? 'AI 코칭을 확인하려면 고양이를 선택하세요.' : 'Choose a cat to see AI guidance.',
      highlights: [],
      mode: 'default',
    }
  }

  const now = Date.now()
  const recentLogs = logs.filter((log) => now - log.timestamp <= DAY_IN_MS)
  const recentThreeDayLogs = logs.filter((log) => now - log.timestamp <= DAY_IN_MS * 3)

  const totals = recentLogs.reduce(
    (acc, log) => {
      acc.wet += log.wetFoodAmount || 0
      acc.dry += log.dryFoodAmount || 0
      acc.snack += log.snackAmount || 0
      acc.water += log.waterAmount || 0
      return acc
    },
    { wet: 0, dry: 0, snack: 0, water: 0 }
  )

  const calories = estimateFoodCalories(
    totals.wet,
    totals.dry,
    totals.snack,
    wetFoodCaloriesPer100g,
    dryFoodCaloriesPer100g,
    snackCaloriesPer100g
  )
  const recommendedCalories = cat.weight ? calculateDER(cat.weight, cat.neutered, 'normal') : 0
  const recommendedWater = cat.weight ? calculateRecommendedWater(cat.weight) : 0

  const caloriePercent = recommendedCalories ? Math.round((calories / recommendedCalories) * 100) : 0
  const waterPercent = recommendedWater ? Math.round((totals.water / recommendedWater) * 100) : 0

  const totalPlayMinutes = recentThreeDayLogs.reduce((sum, log) => sum + (log.playDurationMinutes || 0), 0)
  const avgDailyPlay = Math.round(totalPlayMinutes / 3)
  const lastPlay = recentThreeDayLogs.find((log) => log.playDurationMinutes)
  const brushedLog = recentThreeDayLogs.find((log) => log.brushedTeeth)
  const hoursSinceBrush = brushedLog ? (now - brushedLog.timestamp) / (1000 * 60 * 60) : null
  const daysSinceBrush = hoursSinceBrush != null ? Math.floor(hoursSinceBrush / 24) : null

  const highlights: string[] = []

  if (anomalies.length) {
    const target = anomalies[0]
    const metricLabel =
      target.metric === 'food'
        ? lang === 'ko'
          ? '식사량'
          : 'Food intake'
        : target.metric === 'water'
        ? lang === 'ko'
          ? '수분 섭취'
          : 'Water intake'
        : lang === 'ko'
        ? '화장실 활동'
        : 'Litter activity'
    highlights.push(
      lang === 'ko' ? `${metricLabel} 이상 감지: ${target.description}` : `${metricLabel} alert: ${target.description}`
    )
  }

  if (!recentLogs.length) {
    highlights.push(
      lang === 'ko'
        ? '최근 24시간 기록이 없습니다. 식사, 놀이, 칫솔질을 기록하면 더 정확한 인사이트를 받을 수 있어요.'
        : 'No logs in the last 24 hours—track meals, play, or brushing to unlock richer insights.'
    )
  } else if (recommendedCalories) {
    if (caloriePercent < 85) {
      const deficit = Math.max(0, recommendedCalories - calories)
      highlights.push(
        lang === 'ko'
          ? `칼로리가 권장량의 ${caloriePercent}% 수준입니다. 오늘 약 ${deficit} kcal를 추가 급여해 보세요.`
          : `Calories are about ${caloriePercent}% of goal—offer roughly ${deficit} kcal more today.`
      )
    } else if (caloriePercent > 125) {
      const surplus = Math.max(0, calories - recommendedCalories)
      highlights.push(
        lang === 'ko'
          ? `칼로리가 권장량보다 ${surplus} kcal 많습니다. 간식이나 사료량을 조금 줄여보세요.`
          : `Calories exceed target by ~${surplus} kcal. Trim treats or portions a bit.`
      )
    } else {
      highlights.push(
        lang === 'ko'
          ? '칼로리 섭취가 안정적으로 유지되고 있어요.'
          : 'Calorie intake sits comfortably within the healthy range.'
      )
    }
  }

  if (recommendedWater) {
    if (waterPercent < 70) {
      const needed = Math.max(0, recommendedWater - totals.water)
      highlights.push(
        lang === 'ko'
          ? `수분 섭취가 목표치의 ${waterPercent}%입니다. 약 ${needed}ml 더 마실 수 있게 도와주세요.`
          : `Water intake is ~${waterPercent}% of goal. Encourage another ${needed}ml today.`
      )
    } else if (waterPercent > 140) {
      highlights.push(
        lang === 'ko'
          ? '수분 섭취가 평소보다 높습니다. 요로 증상이나 당뇨 징후가 없는지 확인하세요.'
          : 'Water intake is higher than usual—watch for urinary or diabetes signs.'
      )
    } else {
      highlights.push(
        lang === 'ko'
          ? '수분 섭취도 건강 범위 안에 있어요.'
          : 'Hydration looks balanced today.'
      )
    }
  }

  if (totalPlayMinutes > 0) {
    const playLabel =
      lastPlay?.playType === 'catWheel'
        ? lang === 'ko'
          ? '캣휠'
          : 'wheel'
        : lang === 'ko'
        ? '장난감'
        : 'toy'
    highlights.push(
      lang === 'ko'
        ? `${playLabel} 놀이로 최근 3일간 하루 평균 ${avgDailyPlay}분 활동했습니다.`
        : `A ${playLabel} session kept activity at about ${avgDailyPlay} min/day over the last 3 days.`
    )
  } else {
    highlights.push(
      lang === 'ko'
        ? '최근 3일간 놀이 기록이 없습니다. 짧은 장난감 놀이로 활동량을 채워주세요.'
        : 'No play sessions logged in the last 3 days—add a short toy or wheel workout.'
    )
  }

  if (brushedLog) {
    const productNote = brushedLog.dentalCareProduct
      ? lang === 'ko'
        ? ` (${brushedLog.dentalCareProduct})`
        : ` (${brushedLog.dentalCareProduct})`
      : ''
    highlights.push(
      lang === 'ko'
        ? `치아는 ${daysSinceBrush === 0 ? '오늘' : `${daysSinceBrush}일 전`} 양치했습니다${productNote}.`
        : `Teeth were brushed ${daysSinceBrush === 0 ? 'today' : `${daysSinceBrush} day(s) ago`}${productNote}.`
    )
  } else {
    highlights.push(
      lang === 'ko'
        ? '최근 3일간 칫솔질 기록이 없습니다. 구강 케어를 추가하면 치석 예방에 도움이 됩니다.'
        : 'No toothbrushing logged in the last 3 days—regular care keeps tartar at bay.'
    )
  }

  const hasAlert =
    anomalies.some((a) => a.severity === 'critical') || caloriePercent < 80 || waterPercent < 70

  return {
    headline: hasAlert
      ? lang === 'ko'
        ? '📋 AI 권장 요약'
        : '⚠️ AI Health Alert'
      : lang === 'ko'
      ? `${cat.name} 맞춤 코칭`
      : `Coaching for ${cat.name}`,
    subline:
      lang === 'ko'
        ? '최근 데이터를 기반으로 한 AI 추천입니다.'
        : 'AI-generated notes based on your latest activity logs.',
    highlights: highlights.slice(0, 4),
    mode: hasAlert ? 'alert' : 'default',
  }
}

const initialCatForm = {
  name: '',
  breed: '',
  birthDate: '',
  weight: '',
  gender: 'male' as 'male' | 'female',
  neutered: false,
  chronicConditions: '',
  imageUrl: '',
}

const createInitialDetailedLog = () => ({
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  wetFoodAmount: '',
  dryFoodAmount: '',
  snackAmount: '',
  waterAmount: '',
  litterCount: '',
  mood: 'normal' as 'happy' | 'normal' | 'sad' | 'angry',
  playType: 'toys' as 'toys' | 'catWheel',
  playDurationMinutes: '',
  brushedTeeth: false,
  dentalCareProduct: '',
  notes: '',
})

const convertFileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })

function DashboardModern() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language === 'ko' ? 'ko' : 'en') as 'ko' | 'en'
  const { addCat, updateCat, deleteCat, selectedCat } = useCatStore()
  const {
    weightLogs,
    loadWeightLogs,
    addWeightLog,
    getRecentLogs,
    addHealthLog,
    updateHealthLog,
    deleteHealthLog,
    addVetVisit,
    getVetVisits,
  } = useHealthStore()

  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [catFormData, setCatFormData] = useState(initialCatForm)
  const [showWeightLogger, setShowWeightLogger] = useState(false)
  const [showSymptomChecker, setShowSymptomChecker] = useState(false)
  const [showMoodModal, setShowMoodModal] = useState(false)
  const [showQuickSettings, setShowQuickSettings] = useState(false)
  const [voiceMessage, setVoiceMessage] = useState('')
  const [isReadingSummary, setIsReadingSummary] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showDetailedLog, setShowDetailedLog] = useState(false)
  const [detailedLogData, setDetailedLogData] = useState(createInitialDetailedLog())
  const [editingHealthLog, setEditingHealthLog] = useState<HealthLog | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [showMedicationModal, setShowMedicationModal] = useState(false)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [managedMedications, setManagedMedications] = useState<Medication[]>(defaultMedications)
  const [newMedicationForm, setNewMedicationForm] = useState({
    name: '',
    dosage: '',
    frequency: '',
    nextDose: '',
    instructions: '',
  })
  const [appointmentForm, setAppointmentForm] = useState({
    date: '',
    time: '',
    hospitalName: '',
    visitReason: '',
    notes: '',
  })
  const recognitionRef = useRef<ReturnType<typeof startVoiceRecognition>>(null)

  const [quickLogSettings, setQuickLogSettings] = useState<QuickLogSettings>(() => {
    const saved = localStorage.getItem('quickLogSettings')
    const base = {
      mealType: 'both' as QuickLogSettings['mealType'],
      wetFoodBrand: '',
      wetFoodAmount: 50,
      wetFoodCaloriesPer100g: 85,
      dryFoodBrand: '',
      dryFoodAmount: 30,
      dryFoodCaloriesPer100g: 375,
      treatBrand: '',
      treatType: 'chewy' as QuickLogSettings['treatType'],
      treatCount: 1,
      treatCaloriesPer100g: 320,
      waterAmount: 50,
      urineCount: 1,
      fecesCount: 1,
      playDurationToys: 15,
      playDurationWheel: 10,
      dentalProduct: '',
    }
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...base, ...parsed, treatType: parsed.treatType || 'chewy' }
    }
    return base
  })

  useEffect(() => {
    if (selectedCat) {
      loadWeightLogs(selectedCat.id)
    }
  }, [selectedCat, loadWeightLogs])

  useEffect(() => {
    if (selectedCat) {
      setManagedMedications(loadMedicationsForCat(selectedCat.id))
    } else {
      setManagedMedications(defaultMedications)
    }
  }, [selectedCat])

  useEffect(() => {
    if (selectedCat) {
      saveMedicationsForCat(selectedCat.id, managedMedications)
    }
  }, [managedMedications, selectedCat])

  useEffect(() => {
    return () => {
      stopVoiceRecognition(recognitionRef.current)
      recognitionRef.current = null
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    const modalParam = searchParams.get('modal')
    if (!modalParam || showCatModal) return
    if (modalParam === 'addCat') {
      openCatModal(undefined, 'external')
    } else if (modalParam === 'editCat' && selectedCat) {
      openCatModal(selectedCat.id, 'external')
    }
  }, [searchParams, selectedCat, showCatModal])

  const catLogs = selectedCat ? getRecentLogs(selectedCat.id, 365).sort((a, b) => b.timestamp - a.timestamp) : []
  const storeAnomalies = useHealthStore((state) => (selectedCat ? state.anomaliesByCat[selectedCat.id] : undefined))
  const anomalies: HealthAnomaly[] = storeAnomalies || []
  const anomalyMetricLabels: Record<'food' | 'water' | 'litter', string> = {
    food: i18n.language === 'ko' ? '식사량' : 'Food intake',
    water: i18n.language === 'ko' ? '수분' : 'Water intake',
    litter: i18n.language === 'ko' ? '화장실' : 'Litter activity',
  }
  const aiSummary = useMemo(
    () =>
      buildAiSummary({
        cat: selectedCat,
        logs: catLogs,
        anomalies,
        lang,
        wetFoodCaloriesPer100g: quickLogSettings.wetFoodCaloriesPer100g,
        dryFoodCaloriesPer100g: quickLogSettings.dryFoodCaloriesPer100g,
        snackCaloriesPer100g: quickLogSettings.treatCaloriesPer100g,
      }),
    [
      selectedCat,
      catLogs,
      anomalies,
      lang,
      quickLogSettings.wetFoodCaloriesPer100g,
      quickLogSettings.dryFoodCaloriesPer100g,
      quickLogSettings.treatCaloriesPer100g,
    ]
  )
  const weightHistory = selectedCat ? weightLogs : []
  const latestWeightLog = weightHistory.length ? weightHistory[weightHistory.length - 1] : null
  const baselineWeight = latestWeightLog?.weight ?? selectedCat?.weight ?? 0
  const displayEntries = useMemo<DisplayEntry[]>(() => {
    if (!selectedCat) return []
    const entries: DisplayEntry[] = [
      ...catLogs.map((log) => ({ kind: 'health' as const, log })),
      ...weightHistory.map((log) => ({ kind: 'weight' as const, log })),
    ]
    return entries.sort((a, b) => b.log.timestamp - a.log.timestamp)
  }, [selectedCat, catLogs, weightHistory])

  const logsByDate = useMemo(() => {
    return displayEntries.reduce<Record<string, DisplayEntry[]>>((acc, entry) => {
      const date = entry.log.date
      if (!acc[date]) acc[date] = []
      acc[date].push(entry)
      return acc
    }, {})
  }, [displayEntries])

  const selectedDateStr = selectedDate.toISOString().split('T')[0]
  const selectedDateEntries = logsByDate[selectedDateStr] || []
  const selectedDateHealthLogs = selectedDateEntries
    .filter((entry) => entry.kind === 'health')
    .map((entry) => entry.log)
  const upcomingVisits = useMemo(() => {
    if (!selectedCat) return []
    const visits = [...getVetVisits(selectedCat.id)]
    return visits.sort((a, b) => a.timestamp - b.timestamp)
  }, [selectedCat, getVetVisits])
  const isFilteredByDate = Boolean(selectedCat && selectedDateEntries.length > 0)
  const displayedEntries = isFilteredByDate ? selectedDateEntries : displayEntries
  const summarySpeechRef = useRef<SpeechSynthesisUtterance | null>(null)

  const saveSettings = () => {
    localStorage.setItem('quickLogSettings', JSON.stringify(quickLogSettings))
    setShowQuickSettings(false)
    setVoiceMessage(i18n.language === 'ko' ? '설정이 저장되었습니다!' : 'Settings saved!')
    setTimeout(() => setVoiceMessage(''), 2000)
  }

  const addLog = (partial: Partial<HealthLog>) => {
    if (!selectedCat) return
    const now = new Date()
    const log: HealthLog = {
      id: crypto.randomUUID(),
      catId: selectedCat.id,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      timestamp: now.getTime(),
      type: partial.type || 'general',
      ...partial,
    }
    addHealthLog(log)
    setVoiceMessage(i18n.language === 'ko' ? '✅ 기록 완료!' : '✅ Logged!')
    setTimeout(() => setVoiceMessage(''), 2000)
  }

  const startEditingLog = (log: HealthLog) => {
    setEditingHealthLog(log)
    const derivedTime =
      log.time ||
      new Date(log.timestamp).toLocaleTimeString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    setDetailedLogData({
      date: log.date,
      time: derivedTime,
      wetFoodAmount: log.wetFoodAmount != null ? String(log.wetFoodAmount) : '',
      dryFoodAmount: log.dryFoodAmount != null ? String(log.dryFoodAmount) : '',
      snackAmount: log.snackAmount != null ? String(log.snackAmount) : '',
      waterAmount: log.waterAmount != null ? String(log.waterAmount) : '',
      litterCount: log.litterCount != null ? String(log.litterCount) : '',
      mood: log.mood || 'normal',
      playType: log.playType || 'toys',
      playDurationMinutes: log.playDurationMinutes != null ? String(log.playDurationMinutes) : '',
      brushedTeeth: Boolean(log.brushedTeeth),
      dentalCareProduct: log.dentalCareProduct || '',
      notes: log.notes || '',
    })
    setShowDetailedLog(true)
  }

  const ensureCatSelected = () => {
    if (!selectedCat) {
      alert(t('healthLog.selectCatFirst'))
      return false
    }
    return true
  }

  const jumpToLogDate = (date: string) => {
    const target = new Date(`${date}T00:00:00`)
    setSelectedDate(target)
    setCurrentMonth(new Date(target.getFullYear(), target.getMonth(), 1))
  }

  const handleReadSummary = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert(lang === 'ko' ? '이 브라우저에서는 음성 안내를 지원하지 않습니다.' : 'Speech is not supported in this browser.')
      return
    }
    if (isReadingSummary) {
      window.speechSynthesis.cancel()
      setIsReadingSummary(false)
      return
    }
    const sentences = [aiSummary.headline, aiSummary.subline, ...aiSummary.highlights]
    const utterance = new SpeechSynthesisUtterance(sentences.filter(Boolean).join('. '))
    utterance.lang = lang === 'ko' ? 'ko-KR' : 'en-US'
    utterance.rate = 1
    utterance.onend = () => {
      setIsReadingSummary(false)
      summarySpeechRef.current = null
    }
    utterance.onerror = () => {
      setIsReadingSummary(false)
      summarySpeechRef.current = null
    }
    summarySpeechRef.current = utterance
    setIsReadingSummary(true)
    window.speechSynthesis.speak(utterance)
  }

  const quickLogMeal = () => {
    if (!ensureCatSelected()) return
    addLog({
      type: 'meal',
      wetFoodAmount:
        quickLogSettings.mealType === 'wet' || quickLogSettings.mealType === 'both'
          ? quickLogSettings.wetFoodAmount
          : undefined,
      dryFoodAmount:
        quickLogSettings.mealType === 'dry' || quickLogSettings.mealType === 'both'
          ? quickLogSettings.dryFoodAmount
          : undefined,
      notes:
        i18n.language === 'ko'
          ? `${quickLogSettings.wetFoodBrand || ''} ${quickLogSettings.wetFoodAmount}g`
          : `${quickLogSettings.dryFoodBrand || ''} ${quickLogSettings.dryFoodAmount}g`,
    })
  }

  const quickLogTreat = () => {
    if (!ensureCatSelected()) return
    addLog({
      type: 'meal',
      snackAmount: quickLogSettings.treatCount * 5,
      notes:
        i18n.language === 'ko'
          ? `${quickLogSettings.treatType} 간식`
          : `${quickLogSettings.treatType.replace(/-/g, ' ')} treat`,
    })
  }

  const quickLogWater = () => {
    if (!ensureCatSelected()) return
    addLog({ type: 'water', waterAmount: quickLogSettings.waterAmount })
  }

  const quickLogUrine = () => {
    if (!ensureCatSelected()) return
    addLog({ type: 'litter', litterCount: quickLogSettings.urineCount, notes: 'Urine log' })
  }

  const quickLogFeces = () => {
    if (!ensureCatSelected()) return
    addLog({ type: 'litter', litterCount: quickLogSettings.fecesCount, notes: 'Feces log' })
  }

  const openMedicationManager = () => {
    if (!ensureCatSelected()) return
    setShowMedicationModal(true)
  }

  const openAppointmentScheduler = () => {
    if (!ensureCatSelected()) return
    setShowAppointmentModal(true)
  }

  const handleMedicationFormChange = (field: keyof typeof newMedicationForm, value: string) => {
    setNewMedicationForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleQuickMedicationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMedicationForm.name || !newMedicationForm.dosage) return
    const entry: Medication = {
      id: crypto.randomUUID(),
      name: newMedicationForm.name,
      dosage: newMedicationForm.dosage,
      frequency: newMedicationForm.frequency || (i18n.language === 'ko' ? '1일 1회' : 'Once daily'),
      instructions: newMedicationForm.instructions || '',
      nextDose:
        newMedicationForm.nextDose ||
        new Date().toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
          month: 'short',
          day: 'numeric',
        }),
      lastGiven: '-',
    }
    setManagedMedications((prev) => [...prev, entry])
    setNewMedicationForm({
      name: '',
      dosage: '',
      frequency: '',
      nextDose: '',
      instructions: '',
    })
  }

  const markMedicationAsGiven = (id: string) => {
    const today = new Date().toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
    setManagedMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, lastGiven: today } : med))
    )
  }

  const removeMedication = (id: string) => {
    setManagedMedications((prev) => prev.filter((med) => med.id !== id))
  }

  const handleAppointmentFieldChange = (field: keyof typeof appointmentForm, value: string) => {
    setAppointmentForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCat || !appointmentForm.date || !appointmentForm.hospitalName) return
    const timestamp = new Date(`${appointmentForm.date}T${appointmentForm.time || '09:00'}:00`).getTime()
    addVetVisit({
      id: crypto.randomUUID(),
      catId: selectedCat.id,
      date: appointmentForm.date,
      timestamp,
      hospitalName: appointmentForm.hospitalName,
      visitReason: appointmentForm.visitReason || (i18n.language === 'ko' ? '일반 진료' : 'General care'),
      notes: appointmentForm.notes,
    })
    setAppointmentForm({
      date: '',
      time: '',
      hospitalName: '',
      visitReason: '',
      notes: '',
    })
    setShowAppointmentModal(false)
    setVoiceMessage(i18n.language === 'ko' ? '📅 예약이 추가되었습니다!' : '📅 Appointment scheduled!')
    setTimeout(() => setVoiceMessage(''), 2500)
  }

  const quickLogBrushing = () => {
    if (!ensureCatSelected()) return
    addLog({
      type: 'grooming',
      brushedTeeth: true,
      dentalCareProduct: quickLogSettings.dentalProduct || undefined,
      notes:
        i18n.language === 'ko'
          ? '칫솔질 완료'
          : 'Toothbrushing session logged',
    })
  }

  const quickLogMood = (mood: 'happy' | 'normal' | 'sad' | 'angry') => {
    if (!ensureCatSelected()) return
    addLog({ mood, notes: 'Mood log' })
    setShowMoodModal(false)
  }

  const handleVoiceInput = () => {
    if (!ensureCatSelected()) return

    setIsListening(true)
    setVoiceMessage(i18n.language === 'ko' ? '🎤 듣고 있습니다...' : '🎤 Listening...')

    const recognition = startVoiceRecognition(
      async (transcript) => {
        setIsListening(false)
        setIsProcessing(true)
        setVoiceMessage(
          i18n.language === 'ko'
            ? `📝 "${transcript}" - AI가 분석 중입니다...`
            : `📝 "${transcript}" - AI is analyzing...`
        )

        const parsed = await parseHealthLogFromVoice(
          transcript,
          selectedCat!.name,
          i18n.language as 'ko' | 'en'
        )

        setIsProcessing(false)

        if (parsed.success) {
          addLog({
            type: 'general',
            foodAmount: parsed.foodAmount,
            waterAmount: parsed.waterAmount,
            litterCount: parsed.litterCount,
            activityLevel: parsed.activityLevel || 'normal',
            mood: parsed.mood || 'normal',
            notes: parsed.notes || transcript,
          })

          if (parsed.symptom) {
            const symptom: Symptom = {
              id: crypto.randomUUID(),
              catId: selectedCat!.id,
              date: new Date().toISOString().split('T')[0],
              timestamp: Date.now(),
              symptomType: parsed.symptom.type,
              severity: parsed.symptom.severity,
              description: parsed.symptom.description,
              urgency:
                parsed.symptom.severity === 'severe'
                  ? 'emergency'
                  : parsed.symptom.severity === 'moderate'
                  ? 'warning'
                  : 'mild',
            }
            useHealthStore.getState().addSymptom(symptom)
          }
          const summaryParts: string[] = []
          if (parsed.foodAmount) summaryParts.push(`${t('healthLog.food')}: ${parsed.foodAmount}g`)
          if (parsed.waterAmount) summaryParts.push(`${t('healthLog.water')}: ${parsed.waterAmount}ml`)
          if (parsed.litterCount) summaryParts.push(`${t('healthLog.litter')}: ${parsed.litterCount}`)
          if (parsed.symptom) {
            summaryParts.push(
              lang === 'ko'
                ? `증상: ${parsed.symptom.type}`
                : `Symptom: ${parsed.symptom.type}`
            )
          }
          const summaryText = summaryParts.length ? summaryParts.join(' · ') : transcript
          setVoiceMessage(
            lang === 'ko'
              ? `✅ 음성 기록 완료: ${summaryText}`
              : `✅ Voice log saved: ${summaryText}`
          )
          setTimeout(() => setVoiceMessage(''), 3500)
        } else {
          setVoiceMessage(i18n.language === 'ko' ? '❌ 음성을 이해하지 못했습니다.' : '❌ Unable to understand.')
          setTimeout(() => setVoiceMessage(''), 3000)
        }
      },
      (error) => {
        setIsListening(false)
        setVoiceMessage(error)
        setTimeout(() => setVoiceMessage(''), 3000)
      },
      lang
    )

    if (!recognition) {
      setIsProcessing(false)
      setIsListening(false)
      return
    }

    recognition.onend = () => {
      setIsListening(false)
      setIsProcessing(false)
      recognitionRef.current = null
    }
    recognitionRef.current = recognition
  }

  const handleStopListening = () => {
    stopVoiceRecognition(recognitionRef.current)
    recognitionRef.current = null
    setIsListening(false)
    setIsProcessing(false)
  }

  const syncModalParam = (value?: 'addCat' | 'editCat') => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (value) {
        params.set('modal', value)
      } else {
        params.delete('modal')
      }
      return params
    })
  }

  const openCatModal = (catId?: string, source: 'internal' | 'external' = 'internal') => {
    if (catId && selectedCat && selectedCat.id === catId) {
      setEditingCatId(catId)
      setCatFormData({
        name: selectedCat.name,
        breed: selectedCat.breed,
        birthDate: selectedCat.birthDate,
        weight: String(selectedCat.weight),
        gender: selectedCat.gender,
        neutered: selectedCat.neutered,
        chronicConditions: selectedCat.chronicConditions?.join(', ') || '',
        imageUrl: selectedCat.imageUrl || '',
      })
    } else {
      setEditingCatId(null)
      setCatFormData(initialCatForm)
    }
    setShowCatModal(true)
    if (source === 'internal') {
      syncModalParam(catId ? 'editCat' : 'addCat')
    }
  }

  const handleCatFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCatId) {
      updateCat(editingCatId, {
        name: catFormData.name,
        breed: catFormData.breed,
        birthDate: catFormData.birthDate,
        weight: Number(catFormData.weight),
        gender: catFormData.gender,
        neutered: catFormData.neutered,
        chronicConditions: catFormData.chronicConditions
          ? catFormData.chronicConditions.split(',').map((c) => c.trim()).filter(Boolean)
          : undefined,
        imageUrl: catFormData.imageUrl || undefined,
      })
    } else {
      addCat({
        name: catFormData.name,
        breed: catFormData.breed,
        birthDate: catFormData.birthDate,
        weight: Number(catFormData.weight),
        gender: catFormData.gender,
        neutered: catFormData.neutered,
        chronicConditions: catFormData.chronicConditions
          ? catFormData.chronicConditions.split(',').map((c) => c.trim()).filter(Boolean)
          : undefined,
        imageUrl: catFormData.imageUrl || undefined,
      })
    }
    setShowCatModal(false)
    setEditingCatId(null)
    setCatFormData(initialCatForm)
    syncModalParam(undefined)
  }

  const handleDeleteCatProfile = () => {
    if (!editingCatId) return
    deleteCat(editingCatId)
    setShowCatModal(false)
    setEditingCatId(null)
    setCatFormData(initialCatForm)
    syncModalParam(undefined)
  }

  const handleCatFileChange = async (file: File | null) => {
    if (!file) return
    const base64 = await convertFileToBase64(file)
    setCatFormData((prev) => ({ ...prev, imageUrl: base64 }))
  }

  const handleDetailedLogSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ensureCatSelected()) return
    const timestamp = new Date(`${detailedLogData.date}T${detailedLogData.time || '00:00'}:00`).getTime()
    const payload = {
      date: detailedLogData.date,
      time: detailedLogData.time,
      timestamp,
      type: 'general' as const,
      wetFoodAmount: detailedLogData.wetFoodAmount ? Number(detailedLogData.wetFoodAmount) : undefined,
      dryFoodAmount: detailedLogData.dryFoodAmount ? Number(detailedLogData.dryFoodAmount) : undefined,
      snackAmount: detailedLogData.snackAmount ? Number(detailedLogData.snackAmount) : undefined,
      waterAmount: detailedLogData.waterAmount ? Number(detailedLogData.waterAmount) : undefined,
      litterCount: detailedLogData.litterCount ? Number(detailedLogData.litterCount) : undefined,
      mood: detailedLogData.mood,
      playType: detailedLogData.playDurationMinutes ? (detailedLogData.playType as 'toys' | 'catWheel') : undefined,
      playDurationMinutes: detailedLogData.playDurationMinutes ? Number(detailedLogData.playDurationMinutes) : undefined,
      brushedTeeth: detailedLogData.brushedTeeth || undefined,
      dentalCareProduct:
        detailedLogData.brushedTeeth && detailedLogData.dentalCareProduct
          ? detailedLogData.dentalCareProduct
          : undefined,
      notes: detailedLogData.notes,
    }

    if (editingHealthLog) {
      updateHealthLog(editingHealthLog.id, payload)
    } else {
      addHealthLog({
        id: crypto.randomUUID(),
        catId: selectedCat!.id,
        ...payload,
      })
    }
    setDetailedLogData(createInitialDetailedLog())
    setEditingHealthLog(null)
    setShowDetailedLog(false)
  }

  const getDayBadges = (dayEntries: DisplayEntry[]) => {
    if (!dayEntries.length) return []
    const badges: string[] = []
    const healthEntries = dayEntries.filter((entry) => entry.kind === 'health').map((entry) => entry.log)
    if (
      healthEntries.some(
        (log) =>
          (log.wetFoodAmount || 0) + (log.dryFoodAmount || 0) + (log.snackAmount || 0) > 0
      )
    ) {
      badges.push('🍽️')
    }
    if (healthEntries.some((log) => (log.waterAmount || 0) > 0)) {
      badges.push('💧')
    }
    if (healthEntries.some((log) => (log.litterCount || 0) > 0)) {
      badges.push('💩')
    }
    if (healthEntries.some((log) => (log.playDurationMinutes || 0) > 0)) {
      badges.push('🎾')
    }
    if (healthEntries.some((log) => log.brushedTeeth)) {
      badges.push('🪥')
    }
    if (dayEntries.some((entry) => entry.kind === 'weight')) {
      badges.push('⚖️')
    }
    return badges.slice(0, 4)
  }

  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDay = firstDay.getDay()

    const days: JSX.Element[] = []
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`blank-${i}`} />)
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      const isSelected = selectedDateStr === dateStr
      const dayEntries = logsByDate[dateStr] || []
      const dayBadges = getDayBadges(dayEntries)

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`rounded-2xl p-2 text-left text-sm transition ${
            isSelected
              ? 'bg-indigo-600 text-white shadow-lg'
              : dayEntries.length > 0
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-500 hover:bg-slate-50'
          }`}
        >
          <span className="font-semibold">{day}</span>
          {dayBadges.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-indigo-900">
              {dayBadges.map((icon, idx) => (
                <span
                  key={`${dateStr}-${icon}-${idx}`}
                  className="rounded-full bg-white/70 px-1.5 py-0.5 shadow-sm"
                >
                  {icon}
                </span>
              ))}
            </div>
          )}
        </button>
      )
    }

    return days
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={selectedCat?.imageUrl || fallbackAvatar}
                className="h-20 w-20 rounded-3xl object-cover"
                alt={selectedCat?.name || 'Cat'}
              />
              {selectedCat && (
                <button
                  onClick={() => openCatModal(selectedCat.id)}
                  className="absolute bottom-1 right-1 rounded-2xl bg-white/80 px-2 py-1 text-xs font-semibold text-gray-700 shadow"
                >
                  ✏️
                </button>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{t('dashboard.title')}</p>
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedCat ? selectedCat.name : t('dashboard.currentProfile')}
              </h1>
              <p className="text-sm text-gray-500">
                {t('dashboard.overviewSubtitle', { catName: selectedCat?.name || 'Cat' })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/ai-chat"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100"
            >
              🤖 {t('dashboard.aiChat')}
            </Link>
            {selectedCat && (
              <>
                <button
                  onClick={() => setShowSymptomChecker(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  ⚠️ {i18n.language === 'ko' ? '증상 기록' : 'Log Symptom'}
                </button>
                <button
                  onClick={isListening ? handleStopListening : handleVoiceInput}
                  disabled={isProcessing}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white ${
                    isListening ? 'bg-gray-500' : isProcessing ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {isListening ? '⏹️' : '🎤'}{' '}
                  {isListening ? (i18n.language === 'ko' ? '중지' : 'Stop') : i18n.language === 'ko' ? '음성 기록' : 'Voice Log'}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {selectedCat && (
        <section
          className={`rounded-3xl border p-6 shadow-sm ${
            aiSummary.mode === 'alert' ? 'border-rose-200 bg-rose-50' : 'border-indigo-100 bg-white'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${
                aiSummary.mode === 'alert' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'
              }`}
              aria-hidden="true"
            >
              🤖
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('dashboard.aiSummary.title')}
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900">{aiSummary.headline}</h2>
                </div>
                <div className="flex flex-col gap-2 text-sm text-gray-500 md:text-right">
                  <p>{aiSummary.subline}</p>
                  <button
                    type="button"
                    onClick={handleReadSummary}
                    className="inline-flex items-center justify-end gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    {isReadingSummary ? '⏹️' : '🔊'}{' '}
                    {isReadingSummary ? t('dashboard.aiSummary.stop') : t('dashboard.aiSummary.read')}
                  </button>
                </div>
              </div>
              {aiSummary.highlights.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700">
                  {aiSummary.highlights.map((item, idx) => (
                    <li key={`${item}-${idx}`} className="flex items-start gap-2">
                      <span className="text-indigo-500">•</span>
                      <span className="flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">{t('dashboard.aiSummary.empty')}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {selectedCat && anomalies.length > 0 && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">{i18n.language === 'ko' ? '건강 알림' : 'Health Alerts'}</p>
              <p className="text-sm text-gray-400">
                {i18n.language === 'ko' ? '최근 3일간 비정상 패턴이 감지되었습니다.' : 'Recent rolling-window anomalies detected.'}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {anomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className={`rounded-2xl border p-4 text-sm ${
                  anomaly.severity === 'critical'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold uppercase text-xs tracking-wide">{anomalyMetricLabels[anomaly.metric]}</span>
                  <span className="rounded-full border border-white/40 px-2 py-0.5 text-[11px] font-semibold">
                    {anomaly.severity === 'critical'
                      ? i18n.language === 'ko'
                        ? '주의 요망'
                        : 'Critical'
                      : i18n.language === 'ko'
                      ? '주의'
                      : 'Warning'}
                  </span>
                </div>
                <p className="mt-2 text-sm">{anomaly.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500">{t('dashboard.quickActionsTitle')}</p>
            <p className="text-sm text-gray-400">{t('dashboard.quickActionsDescription')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDetailedLogData(createInitialDetailedLog())
                setShowDetailedLog(true)
              }}
              className="inline-flex items-center rounded-full border border-purple-200 px-3 py-1 text-xs font-semibold text-purple-700 hover:border-purple-300"
            >
              📝 {i18n.language === 'ko' ? '상세 기록' : 'Detailed Log'}
            </button>
            <button
              onClick={() => setShowQuickSettings(true)}
              className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-indigo-200 hover:text-indigo-600"
            >
              ⚙️ {t('dashboard.quickActionSettings')}
            </button>
          </div>
        </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <button
              onClick={quickLogMeal}
              className="rounded-2xl border border-orange-200 px-4 py-3 text-sm font-semibold text-orange-700"
            >
              🍽️ {i18n.language === 'ko' ? '식사' : 'Meal'}
            </button>
            <button
              onClick={quickLogTreat}
              className="rounded-2xl border border-pink-200 px-4 py-3 text-sm font-semibold text-pink-700"
            >
              🍖 {i18n.language === 'ko' ? '간식' : 'Treat'}
            </button>
            <button
              onClick={quickLogWater}
              className="rounded-2xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              💧 {i18n.language === 'ko' ? '물' : 'Water'}
            </button>
          </div>

          <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-4">
            <button
              onClick={() => setShowMoodModal(true)}
              className="rounded-2xl border border-yellow-200 px-4 py-3 text-sm font-semibold text-yellow-700"
            >
              😊 {i18n.language === 'ko' ? '기분' : 'Mood'}
            </button>
            <button
              onClick={quickLogUrine}
              className="rounded-2xl border border-cyan-200 px-4 py-3 text-sm font-semibold text-cyan-700"
            >
              💦 {i18n.language === 'ko' ? '소변' : 'Urine'}
            </button>
            <button
              onClick={quickLogFeces}
              className="rounded-2xl border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-700"
            >
              💩 {i18n.language === 'ko' ? '대변' : 'Feces'}
            </button>
            <button
              onClick={quickLogBrushing}
              className="rounded-2xl border border-green-200 px-4 py-3 text-sm font-semibold text-green-700"
            >
              🪥 {t('dashboard.quickActionsBrushTeeth')}
            </button>
            <button
              onClick={() => setShowWeightLogger(true)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              ⚖️ {i18n.language === 'ko' ? '체중' : 'Weight'}
            </button>
            <button
              onClick={openMedicationManager}
              className="rounded-2xl border border-rose-100 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              💊 {i18n.language === 'ko' ? '약 관리' : 'Medications'}
            </button>
            <button
              onClick={openAppointmentScheduler}
              className="rounded-2xl border border-teal-100 px-4 py-3 text-sm font-semibold text-teal-600 hover:bg-teal-50"
            >
              📅 {i18n.language === 'ko' ? '예약' : 'Appointments'}
            </button>
          </div>

        {voiceMessage && (
          <div className="mt-4 rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">{voiceMessage}</div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">{t('dashboard.calendarTitle')}</p>
              <p className="text-sm text-gray-400">{t('dashboard.calendarSubtitle')}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="rounded-full border border-gray-200 px-2"
              >
                ←
              </button>
              <span>
                {currentMonth.toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                })}
              </span>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="rounded-full border border-gray-200 px-2"
              >
                →
              </button>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-7 gap-2 text-xs text-gray-500">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <span key={day} className="text-center font-semibold">
                {day}
              </span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">{renderCalendar()}</div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          {selectedCat && selectedDateHealthLogs.length > 0 ? (
            <DailySummary
              cat={selectedCat}
              dailyLogs={selectedDateHealthLogs}
              date={selectedDate}
              wetFoodCaloriesPer100g={quickLogSettings.wetFoodCaloriesPer100g}
              dryFoodCaloriesPer100g={quickLogSettings.dryFoodCaloriesPer100g}
              snackCaloriesPer100g={quickLogSettings.treatCaloriesPer100g}
            />
          ) : (
            <div className="text-sm text-gray-500">{t('dashboard.calendarEmpty')}</div>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500">{i18n.language === 'ko' ? '전체 기록' : 'All Logs'}</p>
            <p className="text-sm text-gray-400">
              {isFilteredByDate
                ? t('dashboard.allLogsFiltered', { date: selectedDateStr })
                : i18n.language === 'ko'
                ? '최근 활동을 모두 확인하세요.'
                : 'Review every activity log.'}
            </p>
          </div>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-xs font-semibold text-indigo-600"
          >
            {i18n.language === 'ko' ? '오늘로 이동' : 'Jump to today'}
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm text-gray-600">
          {displayedEntries.length === 0 && (
            <p className="text-gray-500">{t('dashboard.calendarEmpty')}</p>
          )}
          {displayedEntries.map((entry) => {
            if (entry.kind === 'weight') {
              const weightLog = entry.log
              const logDate = new Date(weightLog.timestamp)
              return (
                <div
                  key={`weight-${weightLog.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => jumpToLogDate(weightLog.date)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      jumpToLogDate(weightLog.date)
                    }
                  }}
                  className="rounded-2xl border border-gray-100 p-4 outline-none transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">
                      {logDate.toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <span className="text-xs uppercase tracking-wide text-gray-500">weight</span>
                  </div>
                  <p className="mt-2 text-gray-600">
                    {`${t('healthLog.weight')}: ${weightLog.weight}kg`}
                    {weightLog.notes ? ` · ${weightLog.notes}` : ''}
                  </p>
                </div>
              )
            }

            const log = entry.log
            const logDate = new Date(log.timestamp)
            const parts: string[] = []
            if (log.wetFoodAmount) parts.push(`${t('nutrition.foodLabels.wet')} ${log.wetFoodAmount}g`)
            if (log.dryFoodAmount) parts.push(`${t('nutrition.foodLabels.primary')} ${log.dryFoodAmount}g`)
            if (log.snackAmount) parts.push(`${t('nutrition.foodLabels.treat')} ${log.snackAmount}g`)
            if (log.waterAmount) parts.push(`${t('nutrition.statLabels.water')} ${log.waterAmount}ml`)
            if (log.litterCount) parts.push(`${t('healthLog.litter')} ${log.litterCount}`)
            if (log.playDurationMinutes) {
              const playLabel =
                log.playType === 'catWheel'
                  ? i18n.language === 'ko'
                    ? '휠 놀이'
                    : 'cat wheel'
                  : i18n.language === 'ko'
                  ? '장난감 놀이'
                  : 'toy play'
              parts.push(`${t('healthLog.play')}: ${playLabel} ${log.playDurationMinutes}m`)
            }
            if (log.brushedTeeth) {
              parts.push(
                log.dentalCareProduct
                  ? `${t('healthLog.brushedTeeth')} (${log.dentalCareProduct})`
                  : t('healthLog.brushedTeeth')
              )
            }
            if (log.mood) parts.push(`${t('healthLog.mood')}: ${log.mood}`)
            if (log.notes) parts.push(log.notes)
            const summary = parts.length > 0 ? parts.join(' · ') : t('dashboard.stats.noData')
            const isActive = selectedDateStr === log.date
            return (
              <div
                key={log.id}
                role="button"
                tabIndex={0}
                onClick={() => jumpToLogDate(log.date)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    jumpToLogDate(log.date)
                  }
                }}
                className={`rounded-2xl border p-4 outline-none transition ${
                  isActive
                    ? 'border-indigo-200 bg-indigo-50 ring-2 ring-indigo-100'
                    : 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">
                    {logDate.toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {log.time && ` · ${log.time}`}
                  </p>
                  <span className="text-xs uppercase tracking-wide text-gray-500">{log.type || 'general'}</span>
                </div>
                <p className="mt-2 text-gray-600">{summary}</p>
                <div className="mt-3 flex gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      startEditingLog(log)
                    }}
                    className="text-indigo-600 hover:underline"
                  >
                    {t('catProfile.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      deleteHealthLog(log.id)
                    }}
                    className="text-red-600 hover:underline"
                  >
                    {t('catProfile.delete')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {selectedCat && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">{t('dashboard.weightHistoryTitle')}</p>
              <p className="text-sm text-gray-400">
                {latestWeightLog
                  ? lang === 'ko'
                    ? `마지막 기록: ${latestWeightLog.weight}kg · ${new Date(latestWeightLog.timestamp).toLocaleDateString('ko-KR')}`
                    : `Last entry: ${latestWeightLog.weight}kg · ${new Date(latestWeightLog.timestamp).toLocaleDateString('en-US')}`
                  : t('dashboard.weightHistoryEmpty')}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            {weightHistory.length === 0 && (
              <p className="text-gray-500">{t('dashboard.weightHistoryEmpty')}</p>
            )}
            {weightHistory
              .slice()
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((log) => (
                <div key={`history-${log.id}`} className="rounded-2xl border border-gray-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">
                      {new Date(log.timestamp).toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <span className="text-xs uppercase tracking-wide text-gray-500">{t('healthLog.weight')}</span>
                  </div>
                  <p className="mt-2 text-gray-600">
                    {log.weight}kg{log.notes ? ` · ${log.notes}` : ''}
                  </p>
                </div>
              ))}
          </div>
        </section>
      )}

      {showWeightLogger && selectedCat && (
        <WeightLogger
          catId={selectedCat.id}
          currentWeight={baselineWeight || selectedCat.weight}
          onSave={(log: WeightLog) => {
            addWeightLog(log)
            updateCat(selectedCat.id, { weight: log.weight })
          }}
          onClose={() => setShowWeightLogger(false)}
        />
      )}

      {showSymptomChecker && selectedCat && (
        <SymptomChecker
          catId={selectedCat.id}
          catName={selectedCat.name}
          onSave={(symptom) => {
            useHealthStore.getState().addSymptom(symptom)
            setVoiceMessage(i18n.language === 'ko' ? '증상이 저장되었습니다!' : 'Symptom saved!')
            setTimeout(() => setVoiceMessage(''), 3000)
          }}
          onClose={() => setShowSymptomChecker(false)}
        />
      )}

      {showMoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">{t('healthLog.mood')}</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { value: 'happy', emoji: '😊', label: t('healthLog.moodHappy') },
                { value: 'normal', emoji: '😐', label: t('healthLog.moodNormal') },
                { value: 'sad', emoji: '😢', label: t('healthLog.moodSad') },
                { value: 'angry', emoji: '😠', label: t('healthLog.moodAngry') },
              ].map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => quickLogMood(mood.value as 'happy' | 'normal' | 'sad' | 'angry')}
                  className="rounded-2xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600"
                >
                  {mood.emoji} {mood.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMoodModal(false)}
              className="mt-4 w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-gray-300"
            >
              {t('catProfile.cancel')}
            </button>
          </div>
        </div>
      )}

      {showQuickSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">⚙️ {t('dashboard.quickActionSettings')}</h3>
              <button onClick={() => setShowQuickSettings(false)}>✖️</button>
            </div>
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <h4 className="text-base font-semibold text-gray-800">🍽️ {i18n.language === 'ko' ? '식사 기본량' : 'Meal Defaults'}</h4>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { value: 'wet', label: i18n.language === 'ko' ? '습식' : 'Wet' },
                    { value: 'dry', label: i18n.language === 'ko' ? '건식' : 'Dry' },
                    { value: 'both', label: i18n.language === 'ko' ? '둘 다' : 'Both' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setQuickLogSettings((prev) => ({ ...prev, mealType: option.value as QuickLogSettings['mealType'] }))}
                      className={`rounded-2xl border px-3 py-2 text-sm ${
                        quickLogSettings.mealType === option.value
                          ? 'border-indigo-500 bg-white text-indigo-600'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm text-gray-500">Wet Food (g)</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                      value={quickLogSettings.wetFoodAmount}
                      onChange={(e) => setQuickLogSettings((prev) => ({ ...prev, wetFoodAmount: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Dry Food (g)</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                      value={quickLogSettings.dryFoodAmount}
                      onChange={(e) => setQuickLogSettings((prev) => ({ ...prev, dryFoodAmount: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <h4 className="text-base font-semibold text-gray-800">💧 {i18n.language === 'ko' ? '물 & 배변' : 'Water & Litter'}</h4>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-sm text-gray-500">{i18n.language === 'ko' ? '물 (ml)' : 'Water (ml)'}</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                      value={quickLogSettings.waterAmount}
                      onChange={(e) => setQuickLogSettings((prev) => ({ ...prev, waterAmount: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{i18n.language === 'ko' ? '소변' : 'Urine'}</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                      value={quickLogSettings.urineCount}
                      onChange={(e) => setQuickLogSettings((prev) => ({ ...prev, urineCount: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{i18n.language === 'ko' ? '대변' : 'Feces'}</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                      value={quickLogSettings.fecesCount}
                      onChange={(e) => setQuickLogSettings((prev) => ({ ...prev, fecesCount: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-pink-100 bg-pink-50 p-4">
                <h4 className="text-base font-semibold text-gray-800">🍖 {i18n.language === 'ko' ? '간식 설정' : 'Treat Preferences'}</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { value: 'chewy', label: i18n.language === 'ko' ? '쫄깃' : 'Chewy' },
                    { value: 'crunchy', label: i18n.language === 'ko' ? '바삭' : 'Crunchy' },
                    { value: 'freeze-dried', label: i18n.language === 'ko' ? '동결 건조' : 'Freeze-dried' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setQuickLogSettings((prev) => ({ ...prev, treatType: option.value as QuickLogSettings['treatType'] }))}
                      className={`rounded-2xl border px-3 py-1 text-sm ${
                        quickLogSettings.treatType === option.value ? 'border-pink-400 bg-white text-pink-600' : 'border-pink-100 text-pink-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-sm text-gray-500">{i18n.language === 'ko' ? '간식 브랜드' : 'Treat brand'}</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                      value={quickLogSettings.treatBrand || ''}
                      onChange={(e) => setQuickLogSettings((prev) => ({ ...prev, treatBrand: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{i18n.language === 'ko' ? '간식 개수' : 'Treat count'}</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                      value={quickLogSettings.treatCount}
                      onChange={(e) => setQuickLogSettings((prev) => ({ ...prev, treatCount: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">kcal / 100g</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                      value={quickLogSettings.treatCaloriesPer100g}
                      onChange={(e) => setQuickLogSettings((prev) => ({ ...prev, treatCaloriesPer100g: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <h4 className="text-base font-semibold text-gray-800">🎯 {i18n.language === 'ko' ? '놀이 기본값' : 'Play Defaults'}</h4>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm text-gray-500">{i18n.language === 'ko' ? '장난감 (분)' : 'Toys (min)'}</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                      value={quickLogSettings.playDurationToys}
                      onChange={(e) => setQuickLogSettings((prev) => ({ ...prev, playDurationToys: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{i18n.language === 'ko' ? '러닝휠 (분)' : 'Cat wheel (min)'}</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                      value={quickLogSettings.playDurationWheel}
                      onChange={(e) => setQuickLogSettings((prev) => ({ ...prev, playDurationWheel: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <h4 className="text-base font-semibold text-gray-800">🪥 {i18n.language === 'ko' ? '구강 케어' : 'Dental Care'}</h4>
                <div className="mt-3">
                  <label className="text-sm text-gray-500">{i18n.language === 'ko' ? '사용 제품' : 'Product / Paste'}</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                    value={quickLogSettings.dentalProduct || ''}
                    onChange={(e) => setQuickLogSettings((prev) => ({ ...prev, dentalProduct: e.target.value }))}
                    placeholder={i18n.language === 'ko' ? '예: 덴탈젤, 치약 등' : 'e.g., dental gel or toothpaste'}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowQuickSettings(false)}
                className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                {t('catProfile.cancel')}
              </button>
              <button
                onClick={saveSettings}
                className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {t('catProfile.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMedicationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">💊 {t('dashboard.medManagerTitle')}</h3>
              <button onClick={() => setShowMedicationModal(false)}>✖️</button>
            </div>
            {selectedCat ? (
              <>
                <div className="mt-4 space-y-3">
                  {managedMedications.length === 0 && (
                    <p className="text-sm text-gray-500">{t('dashboard.medManagerEmpty')}</p>
                  )}
                  {managedMedications.map((med) => (
                    <div key={med.id} className="rounded-2xl border border-rose-100 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{med.name}</p>
                          <p className="text-sm text-gray-500">
                            {med.dosage} · {med.frequency}
                          </p>
                          {med.instructions && <p className="mt-1 text-xs text-gray-500">{med.instructions}</p>}
                          <div className="mt-3 text-xs text-gray-500">
                            <p>
                              {t('dashboard.medNextDose')}:{' '}
                              <span className="font-semibold text-gray-800">{med.nextDose || '-'}</span>
                            </p>
                            <p>
                              {t('dashboard.medLastGiven')}:{' '}
                              <span className="font-semibold text-gray-800">{med.lastGiven || '-'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => markMedicationAsGiven(med.id)}
                            className="rounded-xl border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-50"
                          >
                            {t('dashboard.medMarkGiven')}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMedication(med.id)}
                            className="rounded-xl border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            {t('dashboard.remove')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleQuickMedicationSubmit} className="mt-5 space-y-3">
                  <p className="text-sm font-semibold text-gray-600">{t('dashboard.medManagerFormTitle')}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-gray-500">{t('dashboard.medicationName')}</label>
                      <input
                        type="text"
                        value={newMedicationForm.name}
                        onChange={(e) => handleMedicationFormChange('name', e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t('dashboard.medicationDosage')}</label>
                      <input
                        type="text"
                        value={newMedicationForm.dosage}
                        onChange={(e) => handleMedicationFormChange('dosage', e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t('dashboard.medicationFrequency')}</label>
                      <input
                        type="text"
                        value={newMedicationForm.frequency}
                        onChange={(e) => handleMedicationFormChange('frequency', e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t('dashboard.medicationNextDose')}</label>
                      <input
                        type="text"
                        value={newMedicationForm.nextDose}
                        onChange={(e) => handleMedicationFormChange('nextDose', e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                        placeholder={new Date().toLocaleDateString()}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t('dashboard.medicationInstruction')}</label>
                    <textarea
                      value={newMedicationForm.instructions}
                      onChange={(e) => handleMedicationFormChange('instructions', e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                      rows={2}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    {t('dashboard.medManagerAdd')}
                  </button>
                </form>
              </>
            ) : (
              <p className="mt-4 text-sm text-gray-500">{t('healthLog.selectCatFirst')}</p>
            )}
          </div>
        </div>
      )}

      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">📅 {t('dashboard.appointmentModalTitle')}</h3>
              <button onClick={() => setShowAppointmentModal(false)}>✖️</button>
            </div>
            {selectedCat ? (
              <>
                <form onSubmit={handleAppointmentSubmit} className="mt-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-gray-500">{t('dashboard.appointmentFormDate')}</label>
                      <input
                        type="date"
                        value={appointmentForm.date}
                        onChange={(e) => handleAppointmentFieldChange('date', e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t('dashboard.appointmentFormTime')}</label>
                      <input
                        type="time"
                        value={appointmentForm.time}
                        onChange={(e) => handleAppointmentFieldChange('time', e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t('dashboard.appointmentFormHospital')}</label>
                    <input
                      type="text"
                      value={appointmentForm.hospitalName}
                      onChange={(e) => handleAppointmentFieldChange('hospitalName', e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t('dashboard.appointmentFormReason')}</label>
                    <input
                      type="text"
                      value={appointmentForm.visitReason}
                      onChange={(e) => handleAppointmentFieldChange('visitReason', e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                      placeholder={i18n.language === 'ko' ? '예: 예방 접종' : 'e.g., vaccination'}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t('dashboard.appointmentFormNotes')}</label>
                    <textarea
                      value={appointmentForm.notes}
                      onChange={(e) => handleAppointmentFieldChange('notes', e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    {t('dashboard.appointmentSave')}
                  </button>
                </form>
                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-600">{t('dashboard.upcomingAppointments')}</p>
                  <div className="mt-2 space-y-2">
                    {upcomingVisits.length === 0 && (
                      <p className="text-xs text-gray-500">{t('dashboard.appointmentEmpty')}</p>
                    )}
                    {upcomingVisits.slice(0, 3).map((visit) => (
                      <div key={visit.id} className="rounded-2xl border border-teal-100 p-3 text-xs text-gray-600">
                        <p className="font-semibold text-gray-800">
                          {new Date(visit.timestamp).toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p>{visit.hospitalName}</p>
                        <p className="text-gray-500">{visit.visitReason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-gray-500">{t('healthLog.selectCatFirst')}</p>
            )}
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-2xl font-semibold text-gray-900">
              {editingCatId ? t('catProfile.edit') : t('nav.addCat')}
            </h3>
            <form onSubmit={handleCatFormSubmit} className="mt-4 space-y-4">
              {['name', 'breed', 'birthDate', 'weight'].map((field) => (
                <div key={field}>
                  <label className="text-sm text-gray-600">{t(`catProfile.${field}`)}</label>
                  <input
                    type={field === 'birthDate' ? 'date' : field === 'weight' ? 'number' : 'text'}
                    value={(catFormData as any)[field]}
                    onChange={(e) => setCatFormData((prev) => ({ ...prev, [field]: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                    required
                  />
                </div>
              ))}
              <div>
                <label className="text-sm text-gray-600">Image URL</label>
                <input
                  type="url"
                  placeholder="https://"
                  value={catFormData.imageUrl}
                  onChange={(e) => setCatFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                />
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 w-full text-sm"
                  onChange={(e) => handleCatFileChange(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">{t('catProfile.gender')}</label>
                <select
                  value={catFormData.gender}
                  onChange={(e) => setCatFormData((prev) => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                >
                  <option value="male">{t('catProfile.male')}</option>
                  <option value="female">{t('catProfile.female')}</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={catFormData.neutered}
                  onChange={(e) => setCatFormData((prev) => ({ ...prev, neutered: e.target.checked }))}
                />
                <span className="text-sm text-gray-600">{t('catProfile.neutered')}</span>
              </div>
              <div>
                <label className="text-sm text-gray-600">{t('catProfile.chronicConditions')}</label>
                <input
                  type="text"
                  value={catFormData.chronicConditions}
                  onChange={(e) => setCatFormData((prev) => ({ ...prev, chronicConditions: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                  placeholder="Diabetes, Kidney disease"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCatModal(false)
                    setEditingCatId(null)
                    setCatFormData(initialCatForm)
                    syncModalParam(undefined)
                  }}
                  className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600"
                >
                  {t('catProfile.cancel')}
                </button>
                <button type="submit" className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">
                  {t('catProfile.save')}
                </button>
              </div>
              {editingCatId && (
                <button
                  type="button"
                  onClick={handleDeleteCatProfile}
                  className="mt-3 w-full rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  🗑️ {t('catProfile.delete')}
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {showDetailedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900">{t('healthLog.addTodayLog')}</h3>
            <form onSubmit={handleDetailedLogSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-gray-600">{t('healthLog.date')}</label>
                <input
                  type="date"
                  value={detailedLogData.date}
                  onChange={(e) => setDetailedLogData((prev) => ({ ...prev, date: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">{t('healthLog.time')}</label>
                <input
                  type="time"
                  value={detailedLogData.time}
                  onChange={(e) => setDetailedLogData((prev) => ({ ...prev, time: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Wet (g)</label>
                <input
                  type="number"
                  value={detailedLogData.wetFoodAmount}
                  onChange={(e) => setDetailedLogData((prev) => ({ ...prev, wetFoodAmount: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Dry (g)</label>
                <input
                  type="number"
                  value={detailedLogData.dryFoodAmount}
                  onChange={(e) => setDetailedLogData((prev) => ({ ...prev, dryFoodAmount: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Snack (g)</label>
                <input
                  type="number"
                  value={detailedLogData.snackAmount}
                  onChange={(e) => setDetailedLogData((prev) => ({ ...prev, snackAmount: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">{t('healthLog.water')}</label>
                <input
                  type="number"
                  value={detailedLogData.waterAmount}
                  onChange={(e) => setDetailedLogData((prev) => ({ ...prev, waterAmount: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">{t('healthLog.litter')}</label>
                <input
                  type="number"
                  value={detailedLogData.litterCount}
                  onChange={(e) => setDetailedLogData((prev) => ({ ...prev, litterCount: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">{t('healthLog.playDuration')}</label>
                <input
                  type="number"
                  value={detailedLogData.playDurationMinutes}
                  onChange={(e) => setDetailedLogData((prev) => ({ ...prev, playDurationMinutes: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                  placeholder="15"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">{t('healthLog.playType')}</label>
                <select
                  value={detailedLogData.playType}
                  onChange={(e) => setDetailedLogData((prev) => ({ ...prev, playType: e.target.value as 'toys' | 'catWheel' }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                >
                  <option value="toys">{t('healthLog.playToy')}</option>
                  <option value="catWheel">{t('healthLog.playWheel')}</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">{t('healthLog.mood')}</label>
                <select
                  value={detailedLogData.mood}
                  onChange={(e) => setDetailedLogData((prev) => ({ ...prev, mood: e.target.value as 'happy' | 'normal' | 'sad' | 'angry' }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                >
                  <option value="happy">{t('healthLog.moodHappy')}</option>
                  <option value="normal">{t('healthLog.moodNormal')}</option>
                  <option value="sad">{t('healthLog.moodSad')}</option>
                  <option value="angry">{t('healthLog.moodAngry')}</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600">{t('healthLog.brushedTeeth')}</label>
                <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-gray-200 p-3 sm:flex-row sm:items-center">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={detailedLogData.brushedTeeth}
                      onChange={(e) => setDetailedLogData((prev) => ({ ...prev, brushedTeeth: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {i18n.language === 'ko' ? '오늘 칫솔질 완료' : 'Brushed today'}
                  </label>
                  <input
                    type="text"
                    value={detailedLogData.dentalCareProduct}
                    onChange={(e) => setDetailedLogData((prev) => ({ ...prev, dentalCareProduct: e.target.value }))}
                    disabled={!detailedLogData.brushedTeeth}
                    placeholder={t('healthLog.dentalProductPlaceholder')}
                    className={`flex-1 rounded-2xl border px-4 py-2 text-sm ${
                      detailedLogData.brushedTeeth ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 text-gray-400'
                    }`}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600">{t('healthLog.memo')}</label>
                <textarea
                  value={detailedLogData.notes}
                  onChange={(e) => setDetailedLogData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                  rows={3}
                />
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailedLog(false)
                    setEditingHealthLog(null)
                    setDetailedLogData(createInitialDetailedLog())
                  }}
                  className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600"
                >
                  {t('catProfile.cancel')}
                </button>
                <button type="submit" className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">
                  {t('catProfile.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardModern
