import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCatStore } from '../store/catStore'
import { useHealthStore } from '../store/healthStore'
import WeightChart from '../components/WeightChart'
import WeightLogger from '../components/WeightLogger'
import { HealthLog, WeightLog } from '../types'
import { findBrandCalories } from '../data/foodBrands'
import { weightLogStorage } from '../services/storage'
import { getDailySummary } from '../utils/calorieCalculator'

const formatLocalDate = (date: Date) => date.toLocaleDateString('en-CA')

function NutritionTracker() {
  const { t, i18n } = useTranslation()
  const { selectedCat } = useCatStore()
  const { getRecentLogs, addHealthLog, loadWeightLogs, getWeightLogs } = useHealthStore()

  const [showMealModal, setShowMealModal] = useState(false)
  const [brandInfo, setBrandInfo] = useState({
    wet: 'Gourmet Pate',
    dry: 'Premium Cat Kibble',
    treat: 'Favorite Treats',
  })
  const [calorieSettings, setCalorieSettings] = useState({
    wet: 85,
    dry: 375,
    treat: 320,
  })
  const [showFoodSettings, setShowFoodSettings] = useState(false)
  const [foodForm, setFoodForm] = useState({
    wetBrand: '',
    wetCalories: 85,
    dryBrand: '',
    dryCalories: 375,
    treatBrand: '',
    treatCalories: 320,
  })
  const [formData, setFormData] = useState({
    time: new Date().toTimeString().slice(0, 5),
    wetFoodAmount: '',
    dryFoodAmount: '',
    snackAmount: '',
    waterAmount: '',
    notes: '',
  })
  type NutritionGoals = { calories: number; water: number }
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals>(() => {
    const stored = localStorage.getItem('nutritionGoals')
    if (stored) return JSON.parse(stored)
    return { calories: 250, water: 200 }
  })
  const [showGoalEditor, setShowGoalEditor] = useState(false)
  const [goalDraft, setGoalDraft] = useState<NutritionGoals>(nutritionGoals)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [editingWeightLog, setEditingWeightLog] = useState<WeightLog | null>(null)
  const [showWeightManager, setShowWeightManager] = useState(false)

  useEffect(() => {
    if (selectedCat) {
      loadWeightLogs(selectedCat.id)
    }
  }, [selectedCat, loadWeightLogs])

  useEffect(() => {
    localStorage.setItem('nutritionGoals', JSON.stringify(nutritionGoals))
  }, [nutritionGoals])

  const weightLogs = selectedCat ? getWeightLogs(selectedCat.id) : []
  const catLogs = selectedCat ? getRecentLogs(selectedCat.id, 90) : []

  const todayStr = formatLocalDate(new Date())
  const todaysLogs = catLogs.filter((log) => log.date === todayStr)
  const openAddWeight = () => {
    if (!selectedCat) return
    setEditingWeightLog(null)
    setShowWeightModal(true)
  }

  useEffect(() => {
    const stored = localStorage.getItem('quickLogSettings')
    if (stored) {
      const parsed = JSON.parse(stored)
      const wetMatch = parsed.wetFoodBrand ? findBrandCalories(parsed.wetFoodBrand)?.wetCalories : null
      const dryMatch = parsed.dryFoodBrand ? findBrandCalories(parsed.dryFoodBrand)?.dryCalories : null
      const treatMatch = parsed.treatBrand ? findBrandCalories(parsed.treatBrand)?.treatCalories : null
      setBrandInfo({
        wet: parsed.wetFoodBrand || 'Gourmet Pate',
        dry: parsed.dryFoodBrand || 'Premium Cat Kibble',
        treat: parsed.treatBrand || 'Favorite Treats',
      })
      setCalorieSettings({
        wet: wetMatch ?? parsed.wetFoodCaloriesPer100g ?? 85,
        dry: dryMatch ?? parsed.dryFoodCaloriesPer100g ?? 375,
        treat: treatMatch ?? parsed.treatCaloriesPer100g ?? 320,
      })
      setFoodForm({
        wetBrand: parsed.wetFoodBrand || 'Gourmet Pate',
        wetCalories: wetMatch ?? parsed.wetFoodCaloriesPer100g ?? 85,
        dryBrand: parsed.dryFoodBrand || 'Premium Cat Kibble',
        dryCalories: dryMatch ?? parsed.dryFoodCaloriesPer100g ?? 375,
        treatBrand: parsed.treatBrand || 'Favorite Treats',
        treatCalories: treatMatch ?? parsed.treatCaloriesPer100g ?? 320,
      })
    }
  }, [])

  const dailySummary = useMemo(() => {
    if (!selectedCat) {
      return getDailySummary(
        { name: '', breed: '', birthDate: '', weight: 4, gender: 'male', neutered: true, id: '' },
        [],
        calorieSettings.wet,
        calorieSettings.dry,
        calorieSettings.treat
      )
    }
    return getDailySummary(
      selectedCat,
      todaysLogs,
      calorieSettings.wet,
      calorieSettings.dry,
      calorieSettings.treat
    )
  }, [selectedCat, todaysLogs, calorieSettings])

  const waterGoal = dailySummary.recommendedWater || nutritionGoals.water

  const summary = useMemo(() => {
    return {
      caloriesGoal: dailySummary.recommendedCalories || nutritionGoals.calories,
      totalCalories: dailySummary.estimatedCalories || 0,
      totalWater: dailySummary.totalWater || 0,
    }
  }, [dailySummary, nutritionGoals])

  const intakeBlocks = [
    {
      key: 'calories',
      label: t('nutrition.statLabels.calories'),
      value: `${Math.round(summary.totalCalories)} / ${summary.caloriesGoal} kcal`,
      percent: Math.min((summary.totalCalories / summary.caloriesGoal) * 100, 100),
      color: 'bg-indigo-600',
    },
    {
      key: 'water',
      label: t('nutrition.statLabels.water'),
      value: `${summary.totalWater} / ${waterGoal} ml`,
      percent: Math.min((summary.totalWater / waterGoal) * 100, 100),
      color: 'bg-cyan-500',
    },
  ]

  const smartInsights = useMemo(() => {
    const insights: string[] = []
    const calorieDiff = summary.totalCalories - summary.caloriesGoal
    const weight = selectedCat?.weight || 4
    const birthDate = selectedCat?.birthDate ? new Date(selectedCat.birthDate) : null
    const ageYears = birthDate ? Math.max(1, Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))) : 3
    const dietMode = weight >= 6
    const baseMeals = ageYears < 2 ? 3 : 2
    const mealsPerDay = dietMode ? baseMeals + 1 : baseMeals
    const perMealCalories = Math.max(30, Math.round(summary.caloriesGoal / mealsPerDay))
    const totalSnacks = todaysLogs.reduce((sum, log) => sum + (log.snackAmount || 0), 0)
    const snackLogs = todaysLogs.filter((log) => (log.snackAmount || 0) > 0).length
    const totalMealsLogged = todaysLogs.filter((log) => (log.wetFoodAmount || 0) + (log.dryFoodAmount || 0) > 0).length
    const totalWaterLogs = todaysLogs.filter((log) => log.waterAmount).length
    const hours = todaysLogs
      .map((log) => {
        const [h] = (log.time || '').split(':').map(Number)
        return Number.isFinite(h) ? h : null
      })
      .filter((h): h is number => h !== null)
    const periodCounts = hours.reduce(
      (acc, h) => {
        if (h < 12) acc.morning += 1
        else if (h < 18) acc.afternoon += 1
        else acc.evening += 1
        return acc
      },
      { morning: 0, afternoon: 0, evening: 0 }
    )
    const totalPeriods = periodCounts.morning + periodCounts.afternoon + periodCounts.evening
    const dominantPeriod =
      totalPeriods === 0
        ? null
        : (['morning', 'afternoon', 'evening'] as const).reduce((max, key) =>
            periodCounts[key] > periodCounts[max] ? key : max
          , 'morning')

    if (selectedCat) {
      const suggestedSchedule =
        mealsPerDay >= 4
          ? ['08:00', '12:30', '17:30', '21:00']
          : mealsPerDay === 3
          ? ['08:00', '13:00', '18:30']
          : ['08:00', '18:00']
      const mealText =
        i18n.language === 'ko'
          ? `${selectedCat.name}에게 하루 ${mealsPerDay}번, 식사당 약 ${perMealCalories}kcal · 권장 시간 ${suggestedSchedule.join(', ')}`
          : `Plan ${mealsPerDay} meals (~${perMealCalories} kcal each). Suggested times: ${suggestedSchedule.join(', ')}.`
      insights.push(mealText)
      if (dietMode) {
        insights.push(
          i18n.language === 'ko'
            ? '체중 감량이 필요해 보입니다. 간식은 저칼로리 동결건조 제품으로 교체하세요.'
            : 'Weight control mode: consider freeze-dried or low-calorie treats to support dieting.'
        )
      }
      const chronic = selectedCat.chronicConditions?.filter(Boolean)
      if (chronic && chronic.length > 0) {
        insights.push(
          i18n.language === 'ko'
            ? `만성 질환(${chronic.join(', ')})이 있어 수의사가 지정한 식단을 유지하세요.`
            : `Chronic conditions (${chronic.join(', ')}) detected. Keep meals consistent with vet guidelines.`
        )
      }
    }

    if (calorieDiff > 20) {
      insights.push(
        t('nutrition.smartTips.exceedCalories', {
          amount: Math.round(calorieDiff),
        })
      )
    } else if (calorieDiff < -20) {
      insights.push(
        t('nutrition.smartTips.needCalories', {
          amount: Math.round(Math.abs(calorieDiff)),
        })
      )
    } else {
      insights.push(t('nutrition.smartTips.calorieGoalMet'))
    }

    if (calorieDiff > 40 && totalSnacks >= 5 && snackLogs > 0) {
      insights.push(
        i18n.language === 'ko'
          ? '칼로리 초과는 간식 비중이 높아서일 수 있어요. 간식 양을 절반으로 줄여보세요.'
          : 'Likely treat-heavy day. Try cutting snack amounts in half to get back on track.'
      )
    } else if (calorieDiff < -40 && totalMealsLogged <= 1) {
      insights.push(
        i18n.language === 'ko'
          ? '오늘 식사 로그가 거의 없어요. 칼로리 부족 시 소량 추가 급여를 고려하세요.'
          : 'Few meals logged today; add a small extra portion if your cat seems hungry.'
      )
    }

    if (summary.totalWater >= waterGoal) {
      insights.push(t('nutrition.smartTips.hydrationGoalMet'))
    } else {
      insights.push(
        t('nutrition.smartTips.needWater', {
          amount: Math.max(0, Math.round(waterGoal - summary.totalWater)),
        })
      )
      if (totalWaterLogs === 0) {
        insights.push(
          i18n.language === 'ko'
            ? '물 로그가 없어 수분 섭취가 낮게 잡힐 수 있어요. 급수대 위치를 두 군데 이상 두는 것을 고려하세요.'
            : 'No water logs yet; hydration may be undercounted. Add a second water spot to encourage drinking.'
        )
      }
    }

    if (todaysLogs.length === 0) {
      insights.push(t('nutrition.smartTips.noLogs'))
    } else {
      const recent = [...todaysLogs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0]
      if (recent?.time) {
        insights.push(t('nutrition.smartTips.recentMeal', { time: recent.time }))
      }
    }

    if (dominantPeriod && totalPeriods >= 3 && periodCounts[dominantPeriod] / totalPeriods >= 0.6) {
      const periodLabel =
        dominantPeriod === 'morning'
          ? i18n.language === 'ko'
            ? '아침'
            : 'morning'
          : dominantPeriod === 'afternoon'
          ? i18n.language === 'ko'
            ? '오후'
            : 'afternoon'
          : i18n.language === 'ko'
          ? '저녁/밤'
          : 'evening'
      insights.push(
        i18n.language === 'ko'
          ? `${periodLabel}에만 편중된 기록이 많아요. 저녁분을 2회로 나눠 과식이나 공복을 줄여보세요.`
          : `Meals cluster in the ${periodLabel}. Split the evening portion into two smaller servings to avoid overeating or long fasts.`
      )
    }

    return insights
  }, [summary, todaysLogs, t, waterGoal, selectedCat, i18n.language])

  const handleMealSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCat) return
    const now = new Date()
    const dateStr = formatLocalDate(now)
    const log: HealthLog = {
      id: crypto.randomUUID(),
      catId: selectedCat.id,
      date: dateStr,
      time: formData.time || now.toTimeString().slice(0, 5),
      timestamp: now.getTime(),
      type: 'meal',
      wetFoodAmount: formData.wetFoodAmount ? Number(formData.wetFoodAmount) : undefined,
      dryFoodAmount: formData.dryFoodAmount ? Number(formData.dryFoodAmount) : undefined,
      snackAmount: formData.snackAmount ? Number(formData.snackAmount) : undefined,
      waterAmount: formData.waterAmount ? Number(formData.waterAmount) : undefined,
      notes: formData.notes,
    }
    addHealthLog(log)
    setShowMealModal(false)
    setFormData({
      time: new Date().toTimeString().slice(0, 5),
      wetFoodAmount: '',
      dryFoodAmount: '',
      snackAmount: '',
      waterAmount: '',
      notes: '',
    })
  }

  const saveFoodInfo = () => {
    setBrandInfo({
      wet: foodForm.wetBrand,
      dry: foodForm.dryBrand,
      treat: foodForm.treatBrand,
    })
    setCalorieSettings({
      wet: foodForm.wetCalories,
      dry: foodForm.dryCalories,
      treat: foodForm.treatCalories,
    })
    const stored = localStorage.getItem('quickLogSettings')
    const parsed = stored ? JSON.parse(stored) : {}
    const updated = {
      ...parsed,
      wetFoodBrand: foodForm.wetBrand,
      wetFoodCaloriesPer100g: foodForm.wetCalories,
      dryFoodBrand: foodForm.dryBrand,
      dryFoodCaloriesPer100g: foodForm.dryCalories,
      treatBrand: foodForm.treatBrand,
      treatCaloriesPer100g: foodForm.treatCalories,
    }
    localStorage.setItem('quickLogSettings', JSON.stringify(updated))
    if (typeof window !== 'undefined' && (window as any).scheduleSharedStateSave) {
      ;(window as any).scheduleSharedStateSave()
    }
    setShowFoodSettings(false)
  }

  const handleDeleteWeight = (id: string) => {
    if (!selectedCat) return
    weightLogStorage.delete(id)
    loadWeightLogs(selectedCat.id)
    if (editingWeightLog?.id === id) {
      setEditingWeightLog(null)
    }
    setShowWeightModal(false)
  }

  const handleSaveWeightLog = (log: WeightLog) => {
    if (!selectedCat) return
    if (editingWeightLog) {
      weightLogStorage.delete(editingWeightLog.id)
    }
    const nextLog: WeightLog = { ...log, catId: selectedCat.id }
    weightLogStorage.add(nextLog)
    loadWeightLogs(selectedCat.id)
    setShowWeightModal(false)
    setEditingWeightLog(null)
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{t('nutrition.title')}</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">{t('nutrition.subtitle')}</h1>
        </div>
        <button
          onClick={() => setShowMealModal(true)}
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
        >
          + {t('nutrition.logMeal')}
        </button>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">{t('nutrition.intakeTitle')}</p>
            </div>
            <div className="flex flex-col items-start gap-1 text-xs text-gray-500 sm:items-end">
              <button
                type="button"
                onClick={() => {
                  setGoalDraft(nutritionGoals)
                  setShowGoalEditor((prev) => !prev)
                }}
                className="font-semibold text-indigo-600"
              >
                {showGoalEditor ? t('catProfile.cancel') : i18n.language === 'ko' ? '목표 수정' : 'Edit goals'}
              </button>
            </div>
          </div>
          {showGoalEditor && (
            <div className="mt-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4 text-sm text-gray-600">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">{t('nutrition.statLabels.calories')} (kcal)</label>
                  <input
                    type="number"
                    value={goalDraft.calories}
                    onChange={(e) => setGoalDraft((prev) => ({ ...prev, calories: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">{t('nutrition.statLabels.water')} (ml)</label>
                  <input
                    type="number"
                    value={goalDraft.water}
                    onChange={(e) => setGoalDraft((prev) => ({ ...prev, water: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNutritionGoals(goalDraft)
                    setShowGoalEditor(false)
                  }}
                  className="flex-1 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  {t('catProfile.save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGoalEditor(false)
                    setGoalDraft(nutritionGoals)
                  }}
                  className="flex-1 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600"
                >
                  {t('catProfile.cancel')}
                </button>
              </div>
            </div>
          )}
          <div className="mt-4 grid gap-4">
            {intakeBlocks.map((block) => (
              <div key={block.key} className="rounded-2xl border border-gray-100 p-4">
                <p className="text-sm text-gray-500">{block.label}</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">{block.value}</p>
                <div className="mt-2 h-2 rounded-full bg-gray-100">
                  <div className={`h-2 rounded-full ${block.color}`} style={{ width: `${block.percent}%` }} />
                </div>
                <p className="mt-1 text-xs text-gray-500">{Math.round(block.percent)}%</p>
              </div>
            ))}
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-gray-600">
              <p className="text-xs uppercase tracking-wide text-gray-400">{t('nutrition.currentFood')}</p>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="font-semibold text-gray-900">{brandInfo.dry}</p>
                  <p className="text-xs text-gray-500">{Math.round(calorieSettings.dry)} kcal / 100g</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{brandInfo.wet}</p>
                  <p className="text-xs text-gray-500">{Math.round(calorieSettings.wet)} kcal / 100g</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{brandInfo.treat}</p>
                  <p className="text-xs text-gray-500">{Math.round(calorieSettings.treat)} kcal / 100g</p>
                </div>
              </div>
              <button
                onClick={() => setShowFoodSettings(true)}
                className="mt-4 w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600"
              >
                {t('nutrition.updateFoodInfo')}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">{t('nutrition.weightTrendTitle')}</p>
              <p className="text-sm text-gray-400">{t('nutrition.weightTrendSubtitle')}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {selectedCat && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowWeightManager(true)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    {i18n.language === 'ko' ? '기록 관리' : 'Manage weights'}
                  </button>
                  <button
                    onClick={openAddWeight}
                    className="rounded-full border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                  >
                    + {i18n.language === 'ko' ? '체중 추가' : 'Add weight'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6">
            {selectedCat && weightLogs.length > 0 ? (
              <div className="space-y-4">
                <WeightChart logs={weightLogs} />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                {t('dashboard.stats.noData')}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-500">{t('nutrition.smartInsightsTitle')}</p>
          </div>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            {smartInsights.map((tip, index) => (
              <div key={`${tip}-${index}`} className="flex gap-3 rounded-2xl border border-gray-100 p-3">
                <span className="text-indigo-500">•</span>
                <p>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500">{t('nutrition.mealsTitle')}</p>
            <p className="text-sm text-gray-400">{t('nutrition.mealsDescription')}</p>
          </div>
          <button
            onClick={() => setShowMealModal(true)}
            className="rounded-2xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600"
          >
            + {t('nutrition.logMeal')}
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {todaysLogs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
              {t('nutrition.mealsEmpty')}
            </div>
          )}
          {todaysLogs.map((log) => (
            <div key={log.id} className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-4 text-sm text-gray-600 sm:flex-row sm:items-center">
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-gray-700">{log.time}</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {(log.wetFoodAmount || 0) + (log.dryFoodAmount || 0) > 0
                    ? `${(log.wetFoodAmount || 0) + (log.dryFoodAmount || 0)} g`
                    : log.waterAmount
                    ? `${log.waterAmount} ml`
                    : t('nutrition.seeDetails')}
                </p>
                {log.notes && <p className="text-xs text-gray-500">{log.notes}</p>}
              </div>
              <span className="text-xs text-gray-400">{t('nutrition.seeDetails')}</span>
            </div>
          ))}
        </div>
      </section>

      {showMealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900">{t('nutrition.logMeal')}</h3>
            <form onSubmit={handleMealSubmit} className="mt-4 space-y-3 text-sm text-gray-600">
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400">Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-400">Wet Food (g)</label>
                  <input
                    type="number"
                    value={formData.wetFoodAmount}
                    onChange={(e) => setFormData({ ...formData, wetFoodAmount: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-400">Dry Food (g)</label>
                  <input
                    type="number"
                    value={formData.dryFoodAmount}
                    onChange={(e) => setFormData({ ...formData, dryFoodAmount: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-400">Snack (g)</label>
                  <input
                    type="number"
                    value={formData.snackAmount}
                    onChange={(e) => setFormData({ ...formData, snackAmount: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-400">Water (ml)</label>
                  <input
                    type="number"
                    value={formData.waterAmount}
                    onChange={(e) => setFormData({ ...formData, waterAmount: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMealModal(false)}
                  className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600"
                >
                  {t('catProfile.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  {t('catProfile.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWeightModal && selectedCat && (
        <WeightLogger
          catId={selectedCat.id}
          currentWeight={selectedCat.weight}
          initialLog={editingWeightLog ?? undefined}
          mode={editingWeightLog ? 'edit' : 'add'}
          onSave={handleSaveWeightLog}
          onClose={() => {
            setShowWeightModal(false)
            setEditingWeightLog(null)
          }}
          onDelete={editingWeightLog ? handleDeleteWeight : undefined}
        />
      )}

      {showWeightManager && selectedCat && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {i18n.language === 'ko' ? '체중 기록 관리' : 'Manage weight entries'}
              </h3>
              <button
                onClick={() => setShowWeightManager(false)}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700"
              >
                {i18n.language === 'ko' ? '닫기' : 'Close'}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {[...weightLogs]
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 text-sm text-gray-700">
                    <div>
                      <p className="font-semibold text-gray-900">{log.weight} kg</p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2 text-xs font-semibold">
                      <button
                        onClick={() => {
                          setEditingWeightLog(log)
                          setShowWeightModal(true)
                        }}
                        className="rounded-full border border-indigo-200 px-3 py-1 text-indigo-600 hover:bg-indigo-50"
                      >
                        {t('catProfile.edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteWeight(log.id)}
                        className="rounded-full border border-red-200 px-3 py-1 text-red-600 hover:bg-red-50"
                      >
                        {t('catProfile.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              {weightLogs.length === 0 && (
                <p className="text-sm text-gray-500">{i18n.language === 'ko' ? '체중 기록이 없습니다.' : 'No weight records yet.'}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showFoodSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900">{t('nutrition.updateFoodInfo')}</h3>
            <div className="mt-4 space-y-4 text-sm text-gray-600">
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400">{t('nutrition.foodLabels.primary')}</label>
                <input
                  type="text"
                  value={foodForm.dryBrand}
                  onChange={(e) => setFoodForm((prev) => ({ ...prev, dryBrand: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                />
                <input
                  type="number"
                  value={foodForm.dryCalories}
                  onChange={(e) => setFoodForm((prev) => ({ ...prev, dryCalories: Number(e.target.value) }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-2"
                  placeholder="kcal per 100g"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400">{t('nutrition.foodLabels.wet')}</label>
                <input
                  type="text"
                  value={foodForm.wetBrand}
                  onChange={(e) => setFoodForm((prev) => ({ ...prev, wetBrand: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                />
                <input
                  type="number"
                  value={foodForm.wetCalories}
                  onChange={(e) => setFoodForm((prev) => ({ ...prev, wetCalories: Number(e.target.value) }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-2"
                  placeholder="kcal per 100g"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400">{t('nutrition.foodLabels.treat')}</label>
                <input
                  type="text"
                  value={foodForm.treatBrand}
                  onChange={(e) => setFoodForm((prev) => ({ ...prev, treatBrand: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2"
                  placeholder="Treat brand"
                />
                <input
                  type="number"
                  value={foodForm.treatCalories}
                  onChange={(e) => setFoodForm((prev) => ({ ...prev, treatCalories: Number(e.target.value) }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-2"
                  placeholder="kcal per 100g"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowFoodSettings(false)}
                className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                {t('catProfile.cancel')}
              </button>
              <button
                onClick={saveFoodInfo}
                className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {t('catProfile.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NutritionTracker
