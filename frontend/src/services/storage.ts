import { Cat, HealthLog, Symptom } from '../types';

// localStorage 키 상수
const KEYS = {
  CATS: 'cats',
  HEALTH_LOGS: 'healthLogs',
  SYMPTOMS: 'symptoms',
};

// 고양이 관련
export const catStorage = {
  // 모든 고양이 가져오기
  getAll: (): Cat[] => {
    const data = localStorage.getItem(KEYS.CATS);
    return data ? JSON.parse(data) : [];
  },

  // 고양이 추가
  add: (cat: Cat): void => {
    const cats = catStorage.getAll();
    cats.push(cat);
    localStorage.setItem(KEYS.CATS, JSON.stringify(cats));
  },

  // 고양이 수정
  update: (id: string, updates: Partial<Cat>): void => {
    const cats = catStorage.getAll();
    const index = cats.findIndex(c => c.id === id);
    if (index !== -1) {
      cats[index] = { ...cats[index], ...updates };
      localStorage.setItem(KEYS.CATS, JSON.stringify(cats));
    }
  },

  // 고양이 삭제
  delete: (id: string): void => {
    const cats = catStorage.getAll().filter(c => c.id !== id);
    localStorage.setItem(KEYS.CATS, JSON.stringify(cats));
  },

  // ID로 고양이 찾기
  getById: (id: string): Cat | undefined => {
    return catStorage.getAll().find(c => c.id === id);
  },
};

// 건강 기록 관련
export const healthLogStorage = {
  // 특정 고양이의 건강 기록 가져오기
  getByCatId: (catId: string): HealthLog[] => {
    const data = localStorage.getItem(KEYS.HEALTH_LOGS);
    const allLogs: HealthLog[] = data ? JSON.parse(data) : [];
    return allLogs.filter(log => log.catId === catId);
  },

  // 건강 기록 추가
  add: (log: HealthLog): void => {
    const data = localStorage.getItem(KEYS.HEALTH_LOGS);
    const logs: HealthLog[] = data ? JSON.parse(data) : [];
    logs.push(log);
    localStorage.setItem(KEYS.HEALTH_LOGS, JSON.stringify(logs));
  },

  // 최근 N일 기록 가져오기
  getRecent: (catId: string, days: number): HealthLog[] => {
    const logs = healthLogStorage.getByCatId(catId);
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);

    return logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startDate && logDate <= today;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
};

// 증상 기록 관련
export const symptomStorage = {
  // 특정 고양이의 증상 기록 가져오기
  getByCatId: (catId: string): Symptom[] => {
    const data = localStorage.getItem(KEYS.SYMPTOMS);
    const allSymptoms: Symptom[] = data ? JSON.parse(data) : [];
    return allSymptoms.filter(s => s.catId === catId);
  },

  // 증상 추가
  add: (symptom: Symptom): void => {
    const data = localStorage.getItem(KEYS.SYMPTOMS);
    const symptoms: Symptom[] = data ? JSON.parse(data) : [];
    symptoms.push(symptom);
    localStorage.setItem(KEYS.SYMPTOMS, JSON.stringify(symptoms));
  },
};

// 전체 데이터 내보내기/가져오기 (백업용)
export const backupStorage = {
  // 모든 데이터 내보내기
  exportAll: () => {
    return {
      cats: catStorage.getAll(),
      healthLogs: JSON.parse(localStorage.getItem(KEYS.HEALTH_LOGS) || '[]'),
      symptoms: JSON.parse(localStorage.getItem(KEYS.SYMPTOMS) || '[]'),
    };
  },

  // 데이터 가져오기
  importAll: (data: any) => {
    localStorage.setItem(KEYS.CATS, JSON.stringify(data.cats));
    localStorage.setItem(KEYS.HEALTH_LOGS, JSON.stringify(data.healthLogs));
    localStorage.setItem(KEYS.SYMPTOMS, JSON.stringify(data.symptoms));
  },

  // 모든 데이터 삭제
  clearAll: () => {
    localStorage.removeItem(KEYS.CATS);
    localStorage.removeItem(KEYS.HEALTH_LOGS);
    localStorage.removeItem(KEYS.SYMPTOMS);
  },
};



