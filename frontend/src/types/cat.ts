// 고양이 기본 정보
export interface Cat {
    id: string;
    name: string;
    birthDate: string;        // "2020-05-15" 형식
    breed: string;            // 품종
    gender: 'male' | 'female' | 'unknown';
    neutered: boolean;        // 중성화 여부
    weight: number;           // 현재 체중 (kg)
    photoUrl?: string;        // 사진 URL (선택)
    allergies?: string[];     // 알레르기
    medicalHistory?: string[]; // 병력
    chronicConditions?: string[]; // 만성질환
}