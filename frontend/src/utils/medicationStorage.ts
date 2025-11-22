import { Medication } from '../types/medication'

export const defaultMedications: Medication[] = [
  {
    id: 'med-1',
    name: 'Flea & Tick Prevention',
    dosage: '1 tablet',
    frequency: 'Monthly',
    instructions: 'Apply between shoulder blades',
    nextDose: 'Dec 10, 2025',
    lastGiven: 'Nov 10, 2025',
  },
  {
    id: 'med-2',
    name: 'Hairball Control Supplement',
    dosage: '1 tsp',
    frequency: 'Daily',
    instructions: 'Mix with wet food',
    nextDose: 'Nov 19, 2025 (Today)',
    lastGiven: 'Nov 18, 2025',
  },
]

const getMedicationStorageKey = (catId?: string) => (catId ? `cat-medications-${catId}` : 'cat-medications')

export const loadMedicationsForCat = (catId?: string): Medication[] => {
  if (!catId) return defaultMedications
  const stored = localStorage.getItem(getMedicationStorageKey(catId))
  return stored ? (JSON.parse(stored) as Medication[]) : defaultMedications
}

export const saveMedicationsForCat = (catId: string, medications: Medication[]) => {
  localStorage.setItem(getMedicationStorageKey(catId), JSON.stringify(medications))
}
