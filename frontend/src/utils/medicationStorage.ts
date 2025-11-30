import { Medication } from '../types/medication'

// No seeded meds; always start empty until user saves data
export const defaultMedications: Medication[] = []

const getMedicationStorageKey = (catId?: string) => (catId ? `cat-medications-${catId}` : 'cat-medications')

export const loadMedicationsForCat = (catId?: string): Medication[] => {
  if (!catId) return defaultMedications
  const stored = localStorage.getItem(getMedicationStorageKey(catId))
  return stored ? (JSON.parse(stored) as Medication[]) : defaultMedications
}

export const saveMedicationsForCat = (catId: string, medications: Medication[]) => {
  localStorage.setItem(getMedicationStorageKey(catId), JSON.stringify(medications))
}
