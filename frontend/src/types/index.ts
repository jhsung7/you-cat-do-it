export interface Cat {
  id: string;
  name: string;
  breed: string;
  birthDate: string;
  weight: number;
  gender: 'male' | 'female';
  neutered: boolean;
}

export interface HealthLog {
  id: string;
  catId: string;
  date: string;
  foodAmount: number;
  waterAmount: number;
  litterCount: number;
  activityLevel: 'active' | 'normal' | 'lazy';
  mood: 'happy' | 'normal' | 'sad' | 'angry';
  notes: string;
}

export interface Symptom {
  id: string;
  catId: string;
  date: string;
  symptomType: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
}