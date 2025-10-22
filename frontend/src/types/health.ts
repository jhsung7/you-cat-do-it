// 일일 건강 기록
export interface HealthLog {
    id: string;
    catId: string;
    date: string;             // "2025-10-21" 형식
    foodAmount: number;       // 사료 섭취량 (g)
    waterAmount: number;      // 물 섭취량 (ml)
    litterCount: number;      // 배변 횟수
    activityLevel: 'active' | 'normal' | 'lazy';
    mood: 'happy' | 'normal' | 'sad' | 'angry';
    notes?: string;           // 메모
}

// 증상 기록
export interface Symptom {
    id: string;
    catId: string;
    date: string;
    symptomType: string;      // 증상 종류 (구토, 설사 등)
    severity: number;         // 심각도 1-10
    description: string;      // 상세 설명
    urgency: 'emergency' | 'warning' | 'mild'; // 긴급도
}