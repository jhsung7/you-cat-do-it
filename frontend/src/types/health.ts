// 일일 건강 기록
export interface HealthLog {
    id: string;
    catId: string;
    date: string; // YYYY-MM-DD
    time?: string; // HH:MM (선택적, 추가됨)
    timestamp: number; // Unix timestamp (정렬용, 추가됨)
    foodAmount?: number; // 사료 섭취량 (g)
    waterAmount?: number; // 물 섭취량 (ml)
    litterCount?: number; // 배변 횟수
    activityLevel?: 'active' | 'normal' | 'lazy';
    mood?: 'happy' | 'normal' | 'sad' | 'angry';
    notes?: string;

    // 새로운 필드 - 항목 타입 구분
    type?: 'meal' | 'water' | 'litter' | 'weight' | 'symptom' | 'general';
}


// 증상 기록
export interface Symptom {
    id: string;
    catId: string;
    date: string;
    timestamp: number;
    symptomType: string; // 증상 종류 (구토, 설사 등)
    severity: 'mild' | 'moderate' | 'severe'; // 심각도 1-10
    description: string; // 상세설명
    urgency: 'emergency' | 'warning' | 'mild'; // 긴급도
    photos?: string[];
}

// 체중 기록
export interface WeightLog {
    id: string;
    catId: string;
    date: string;
    timestamp: number;
    weight: number; // kg
    notes?: string;
}