import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCatStore } from '../store/catStore'
import { useHealthStore } from '../store/healthStore'
import { HealthAnomaly, Medication } from '../types'
import { defaultMedications, loadMedicationsForCat, saveMedicationsForCat } from '../utils/medicationStorage'

const reminders = [
  { id: 'rem-1', title: 'Hairball Supplement Due', description: 'Today', color: 'bg-amber-50 border-amber-100 text-amber-900' },
  { id: 'rem-2', title: 'Flea Prevention', description: 'Due in 5 days', color: 'bg-blue-50 border-blue-100 text-blue-900' },
]

const medicationHistory = [
  {
    id: 'hist-1',
    name: 'Antibiotics (Amoxicillin)',
    dosage: '50mg',
    period: 'Oct 1, 2025 - Oct 14, 2025',
    reason: 'Upper respiratory infection',
  },
  {
    id: 'hist-2',
    name: 'Pain Relief (Meloxicam)',
    dosage: '0.5ml',
    period: 'Sep 15, 2025 - Sep 20, 2025',
    reason: 'Post-dental cleaning',
  },
]

const hospitalNotes = [
  {
    id: 'visit-1',
    title: 'Next Vet Visit',
    date: 'Dec 20, 2025',
    location: 'Happy Paws Animal Hospital',
    notes: 'Annual wellness exam and booster',
  },
  {
    id: 'visit-2',
    title: 'Dental Follow-up',
    date: 'Jan 05, 2026',
    location: 'Downtown Cat Clinic',
    notes: 'Check healing progress after cleaning',
  },
]

const anomalyMetricLabel = (metric: 'food' | 'water' | 'litter', language: string) => {
  switch (metric) {
    case 'food':
      return language === 'ko' ? '식사량' : 'Food intake'
    case 'water':
      return language === 'ko' ? '수분 섭취' : 'Water intake'
    case 'litter':
      return language === 'ko' ? '배변 활동' : 'Litter activity'
    default:
      return metric
  }
}

function HealthRecords() {
  const { t, i18n } = useTranslation()
  const { selectedCat } = useCatStore()
  const {
    loadSymptoms,
    symptoms,
    deleteSymptom,
    loadVetVisits,
    vetVisits,
    addVetVisit,
    deleteVetVisit,
  } = useHealthStore()

  const [medications, setMedications] = useState<Medication[]>(defaultMedications)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Medication | null>(null)
  const [showAddMedication, setShowAddMedication] = useState(false)
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    instructions: '',
    nextDose: '',
    lastGiven: '',
  })
  const [appointmentForm, setAppointmentForm] = useState({
    date: '',
    hospitalName: '',
    visitReason: '',
  })

  useEffect(() => {
    if (selectedCat) {
      loadSymptoms(selectedCat.id)
      loadVetVisits(selectedCat.id)
      setMedications(loadMedicationsForCat(selectedCat.id))
    } else {
      setMedications(defaultMedications)
    }
  }, [selectedCat, loadSymptoms, loadVetVisits])

  useEffect(() => {
    if (selectedCat) {
      saveMedicationsForCat(selectedCat.id, medications)
    }
  }, [medications, selectedCat])

  const catSymptoms = selectedCat ? symptoms : []
  const storeAnomalies = useHealthStore((state) => (selectedCat ? state.anomaliesByCat[selectedCat.id] : undefined))
  const anomalies: HealthAnomaly[] = storeAnomalies || []
  const healthLogTitle = selectedCat
    ? i18n.language === 'ko'
      ? `${selectedCat.name} ${t('healthLog.title')}`
      : `${selectedCat.name}'s Health Log`
    : t('healthLog.title')
  const sortedVisits = [...vetVisits].sort((a, b) => a.timestamp - b.timestamp)
  const noMedicationText = t('medicationsPage.none', {
    defaultValue: i18n.language === 'ko' ? '등록된 약이 없습니다.' : 'No medications yet.',
  })

  const formatDate = (date: Date) =>
    date.toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  const startEditing = (med: Medication) => {
    setEditingId(med.id)
    setEditingData({ ...med })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingData(null)
  }

  const saveEditing = () => {
    if (!editingId || !editingData) return
    setMedications((prev) => prev.map((med) => (med.id === editingId ? editingData : med)))
    setEditingId(null)
    setEditingData(null)
  }

  const handleFieldChange = (field: keyof Medication, value: string) => {
    setEditingData((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dosage) return
    const entry: Medication = {
      id: crypto.randomUUID(),
      name: newMedication.name,
      dosage: newMedication.dosage,
      frequency: newMedication.frequency || (i18n.language === 'ko' ? '1일 1회' : 'Once daily'),
      instructions: newMedication.instructions || '',
      nextDose: newMedication.nextDose || new Date().toLocaleDateString(),
      lastGiven: newMedication.lastGiven || '-',
    }
    setMedications((prev) => [...prev, entry])
    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      instructions: '',
      nextDose: '',
      lastGiven: '',
    })
    setShowAddMedication(false)
  }

  const handleDeleteMedication = (id: string) => {
    setMedications((prev) => prev.filter((med) => med.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setEditingData(null)
    }
  }

  const markMedicationAsGiven = (id: string) => {
    const today = new Date()
    setMedications((prev) =>
      prev.map((med) => {
        if (med.id !== id) return med
        const nextDate = new Date(today)
        if (med.frequency.toLowerCase().includes('month')) {
          nextDate.setMonth(nextDate.getMonth() + 1)
        } else {
          nextDate.setDate(nextDate.getDate() + 1)
        }
        return {
          ...med,
          lastGiven: formatDate(today),
          nextDose: formatDate(nextDate),
        }
      })
    )
  }

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCat || !appointmentForm.date || !appointmentForm.hospitalName) return
    const timestamp = new Date(appointmentForm.date).getTime()
    addVetVisit({
      id: crypto.randomUUID(),
      catId: selectedCat.id,
      date: appointmentForm.date,
      timestamp,
      hospitalName: appointmentForm.hospitalName,
      visitReason: appointmentForm.visitReason,
    })
    setAppointmentForm({
      date: '',
      hospitalName: '',
      visitReason: '',
    })
  }

  const handleDeleteAppointment = (id: string) => {
    deleteVetVisit(id)
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{t('nav.healthRecords')}</p>
          <h1 className="text-3xl font-bold text-gray-900">{selectedCat ? selectedCat.name : t('healthLog.selectCatFirst')}</h1>
          <p className="text-sm text-gray-500">{t('healthLog.selectCatDescription')}</p>
        </div>
      </header>

      {selectedCat && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-500">{i18n.language === 'ko' ? '최근 이상 징후' : 'Recent anomalies'}</p>
          </div>
          {anomalies.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">{i18n.language === 'ko' ? '현재 감지된 이상 패턴이 없습니다.' : 'No rolling-window anomalies detected right now.'}</p>
          ) : (
            <div className="mt-3 space-y-3">
              {anomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className={`rounded-2xl border p-4 text-sm ${
                    anomaly.severity === 'critical'
                      ? 'border-red-200 bg-red-50 text-red-800'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                  }`}
                >
                  <p className="font-semibold">
                    {i18n.language === 'ko'
                      ? `${anomalyMetricLabel(anomaly.metric, i18n.language)} 이상`
                      : `${anomalyMetricLabel(anomaly.metric, i18n.language)} anomaly`}
                  </p>
                  <p className="mt-1 text-sm">{anomaly.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section id="medications" className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">{t('medicationsPage.activeSection')}</p>
              <p className="text-sm text-gray-400">{t('medicationsPage.subtitle')}</p>
            </div>
            <button
              onClick={() => setShowAddMedication((prev) => !prev)}
              className="rounded-full border border-indigo-200 px-4 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              {showAddMedication ? t('catProfile.cancel') : `+ ${t('medicationsPage.addMedication')}`}
            </button>
          </div>

          {showAddMedication && (
            <div className="mt-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4 text-sm text-gray-600">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Name</label>
                  <input
                    value={newMedication.name}
                    onChange={(e) => setNewMedication((prev) => ({ ...prev, name: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Dosage</label>
                  <input
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication((prev) => ({ ...prev, dosage: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Frequency</label>
                  <input
                    value={newMedication.frequency}
                    onChange={(e) => setNewMedication((prev) => ({ ...prev, frequency: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">{t('medicationsPage.nextDose')}</label>
                  <input
                    value={newMedication.nextDose}
                    onChange={(e) => setNewMedication((prev) => ({ ...prev, nextDose: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 mt-3">
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">{t('medicationsPage.lastGiven')}</label>
                  <input
                    value={newMedication.lastGiven}
                    onChange={(e) => setNewMedication((prev) => ({ ...prev, lastGiven: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Instructions</label>
                  <input
                    value={newMedication.instructions}
                    onChange={(e) => setNewMedication((prev) => ({ ...prev, instructions: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleAddMedication}
                  className="flex-1 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  {t('catProfile.save')}
                </button>
                <button
                  onClick={() => setShowAddMedication(false)}
                  className="flex-1 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600"
                >
                  {t('catProfile.cancel')}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {medications.map((med) => (
              <div key={med.id} className="rounded-2xl border border-gray-100 p-5">
                {editingId === med.id && editingData ? (
                  <div className="space-y-3 text-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs uppercase tracking-wide text-gray-400">Name</label>
                        <input
                          value={editingData.name}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-gray-400">Dosage</label>
                        <input
                          value={editingData.dosage}
                          onChange={(e) => handleFieldChange('dosage', e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs uppercase tracking-wide text-gray-400">Frequency</label>
                        <input
                          value={editingData.frequency}
                          onChange={(e) => handleFieldChange('frequency', e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-gray-400">Next dose</label>
                        <input
                          value={editingData.nextDose}
                          onChange={(e) => handleFieldChange('nextDose', e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs uppercase tracking-wide text-gray-400">Last given</label>
                        <input
                          value={editingData.lastGiven}
                          onChange={(e) => handleFieldChange('lastGiven', e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-gray-400">Instructions</label>
                        <input
                          value={editingData.instructions}
                          onChange={(e) => handleFieldChange('instructions', e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={cancelEditing}
                        className="flex-1 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600"
                      >
                        {t('catProfile.cancel')}
                      </button>
                      <button
                        onClick={saveEditing}
                        className="flex-1 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        {t('catProfile.save')}
                      </button>
                      <button
                        onClick={() => handleDeleteMedication(med.id)}
                        className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        {t('catProfile.delete')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{med.name}</p>
                        <p className="text-sm text-gray-500">
                          {med.dosage} · {med.frequency}
                        </p>
                        <p className="mt-2 text-sm text-gray-500">{med.instructions}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          {t('medicationsPage.statusActive')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 text-sm text-gray-600 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">{t('medicationsPage.nextDose')}</p>
                        <p className="mt-1 font-semibold text-gray-900">{med.nextDose}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">{t('medicationsPage.lastGiven')}</p>
                        <p className="mt-1 font-semibold text-gray-900">{med.lastGiven}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => startEditing(med)}
                        className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-indigo-200 hover:text-indigo-600"
                      >
                        {t('catProfile.edit')}
                      </button>
                      <button
                        onClick={() => markMedicationAsGiven(med.id)}
                        className="rounded-2xl border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
                      >
                        {t('medicationsPage.markAsGiven')}
                      </button>
                      <button
                        onClick={() => handleDeleteMedication(med.id)}
                        className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        {t('catProfile.delete')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {medications.length === 0 && (
              <p className="text-sm text-gray-500">{noMedicationText}</p>
            )}
          </div>
        </div>

        <div className="space-y-4" id="appointments">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">{t('nav.appointments')}</p>
            <form onSubmit={handleAddAppointment} className="mt-4 space-y-3 text-sm text-gray-600">
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400">{t('healthLog.date')}</label>
                <input
                  type="date"
                  value={appointmentForm.date}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400">
                  {i18n.language === 'ko' ? '병원' : 'Clinic'}
                </label>
                <input
                  value={appointmentForm.hospitalName}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, hospitalName: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  placeholder="Happy Paws Clinic"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400">
                  {i18n.language === 'ko' ? '방문 목적' : 'Visit reason'}
                </label>
                <input
                  value={appointmentForm.visitReason}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, visitReason: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  placeholder={i18n.language === 'ko' ? '예: 예방접종' : 'e.g., Vaccine follow-up'}
                />
              </div>
              <button className="w-full rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                + {i18n.language === 'ko' ? '예약 추가' : 'Add appointment'}
              </button>
            </form>
            <div className="mt-4 space-y-3">
              {sortedVisits.length === 0 && (
                <p className="text-xs text-gray-500">{i18n.language === 'ko' ? '예정된 진료가 없습니다.' : 'No appointments scheduled.'}</p>
              )}
              {sortedVisits.map((visit) => (
                <div key={visit.id} className="rounded-2xl border border-gray-100 p-3 text-xs text-gray-600">
                  <p className="font-semibold text-gray-900">{visit.hospitalName}</p>
                  <p>{visit.date}</p>
                  <p className="italic">{visit.visitReason}</p>
                  <button
                    onClick={() => handleDeleteAppointment(visit.id)}
                    className="mt-2 text-red-600 underline"
                  >
                    {t('catProfile.delete')}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">{t('medicationsPage.reminders')}</p>
            <div className="mt-4 space-y-3">
              {reminders.map((rem) => (
                <div key={rem.id} className={`rounded-2xl border p-4 ${rem.color}`}>
                  <p className="text-sm font-semibold">{rem.title}</p>
                  <p className="text-xs text-gray-600">{rem.description}</p>
                </div>
              ))}
              {hospitalNotes.map((note) => (
                <div key={note.id} className="rounded-2xl border border-gray-100 p-4">
                  <p className="text-sm font-semibold text-gray-900">{note.title}</p>
                  <p className="text-xs text-gray-500">{note.date}</p>
                  <p className="text-sm text-gray-600">{note.location}</p>
                  <p className="text-xs text-gray-500">{note.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500">{healthLogTitle}</p>
            <p className="text-sm text-gray-400">{i18n.language === 'ko' ? '저장된 증상 기록' : 'Logged symptoms from Symptom Checker'}</p>
          </div>
        </div>
        {catSymptoms.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">{i18n.language === 'ko' ? '증상 기록이 없습니다.' : 'No symptoms logged yet.'}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {catSymptoms.map((symptom) => (
              <div key={symptom.id} className="rounded-2xl border border-gray-100 p-4 text-sm text-gray-600">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">
                    {symptom.date} · {symptom.symptomType}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-700">{symptom.severity}</span>
                </div>
                <p className="mt-2 text-gray-700">{symptom.description}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{i18n.language === 'ko' ? `긴급도: ${symptom.urgency}` : `Urgency: ${symptom.urgency}`}</span>
                  <button
                    onClick={() => deleteSymptom(symptom.id)}
                    className="text-red-600 underline"
                  >
                    {t('catProfile.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="medications" className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500">{t('medicationsPage.history')}</p>
            <p className="text-sm text-gray-400">{t('medicationsPage.subtitle')}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {medicationHistory.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-100 p-5">
              <p className="text-base font-semibold text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-600">{item.dosage}</p>
              <p className="text-xs text-gray-500">{item.period}</p>
              <p className="text-xs text-gray-500">{item.reason}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HealthRecords
