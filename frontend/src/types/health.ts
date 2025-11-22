// 일일 건강 기록
export interface HealthLog {
    id: string;
    catId: string;
    date: string; // YYYY-MM-DD
    time?: string; // HH:MM (선택적, 추가됨)
    timestamp: number; // Unix timestamp (정렬용, 추가됨)

    // 사료 관련 (개선: 습식/건식 구분)
    foodAmount?: number; // 사료 섭취량 (g) - 하위 호환성 유지, wetFood + dryFood 합계로 자동 계산
    wetFoodAmount?: number; // 습식 사료 (g)
    dryFoodAmount?: number; // 건식 사료 (g)
    snackAmount?: number; // 간식 (g)
    snackType?: string; // 간식 종류 (선택)

    waterAmount?: number; // 물 섭취량 (ml)
    litterCount?: number; // 배변 횟수
    activityLevel?: 'active' | 'normal' | 'lazy';
    mood?: 'happy' | 'normal' | 'sad' | 'angry';
    playType?: 'toys' | 'catWheel';
    playDurationMinutes?: number;
    brushedTeeth?: boolean;
    dentalCareProduct?: string;
    notes?: string;

    // 새로운 필드 - 항목 타입 구분
    type?: 'meal' | 'water' | 'litter' | 'weight' | 'symptom' | 'general' | 'play' | 'grooming';
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

// 병원 기록
export interface VetVisit {
    id: string;
    catId: string;
    date: string;
    timestamp: number;
    hospitalName: string;
    veterinarianName?: string;
    visitReason: string; // 주 증상
    diagnosis?: string; // 진단명
    treatment?: string; // 치료 내용
    nextVisitDate?: string; // 재진 날짜
    cost?: number; // 진료비
    notes?: string;
}

// 처방약 기록
export interface Prescription {
    id: string;
    catId: string;
    visitId?: string; // 연관된 병원 방문
    medicationName: string;
    dosage: string; // 용량
    frequency: string; // 복용 빈도 (하루 1-3회)
    startDate: string;
    endDate: string;
    completed: boolean; // 복용 완료 여부
    notes?: string;
}

// 기분 기록 (HealthLog에서 분리)
export interface MoodLog {
    id: string;
    catId: string;
    date: string;
    timestamp: number;
    mood: 'happy' | 'normal' | 'sad' | 'angry';
    intensity?: 'low' | 'medium' | 'high'; // 감정 강도
    triggers?: string; // 기분 변화 원인 (예: 손님 방문, 놀이 시간 등)
    notes?: string;
}

export interface HealthAnomaly {
    id: string;
    catId: string;
    metric: 'food' | 'water' | 'litter';
    severity: 'warning' | 'critical';
    description: string;
    changePercent: number;
    currentAverage: number;
    previousAverage: number;
    windowDays: number;
    detectedAt: number;
}
