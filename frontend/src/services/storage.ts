import { HealthLog, Symptom } from '../types';

// localStorage 키
const HEALTH_LOGS_KEY = 'healthLogs'; // ✅ 수정
const SYMPTOMS_KEY = 'cat-symptoms';

// HealthLog Storage
export const healthLogStorage = {
  getAll(): HealthLog[] {
    const stored = localStorage.getItem(HEALTH_LOGS_KEY); // ✅ 수정
    if (!stored) return [];
    
    const logs: HealthLog[] = JSON.parse(stored);
    
    // ✅ 마이그레이션: timestamp가 없는 기록에 자동 추가
    return logs.map(log => {
      if (!log.timestamp) {
        const dateTime = new Date(`${log.date}T${log.time || '12:00'}`);
        return {
          ...log,
          timestamp: dateTime.getTime(),
          type: log.type || 'general', // type도 없으면 기본값
        };
      }
      return log;
    });
  },

  getByCatId(catId: string): HealthLog[] {
    const logs = this.getAll().filter(log => log.catId === catId);
    console.log(`📋 Logs for cat ${catId}:`, logs); // 디버깅용
    return logs;
  },

  getRecent(catId: string, days: number): HealthLog[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTimestamp = cutoffDate.getTime();

    const logs = this.getByCatId(catId)
      .filter(log => log.timestamp >= cutoffTimestamp)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    console.log(`📋 Recent logs (${days} days) for cat ${catId}:`, logs); // 디버깅용
    return logs;
  },
  
  add(log: HealthLog): void {
    const logs = this.getAll();
    logs.push(log);
    localStorage.setItem(HEALTH_LOGS_KEY, JSON.stringify(logs));
    console.log('✅ Health log saved:', log); // 디버깅용
    console.log('📋 Total logs now:', logs.length); // 디버깅용
  },

  update(id: string, updatedLog: Partial<HealthLog>): void {
    const logs = this.getAll();
    const index = logs.findIndex(log => log.id === id);
    if (index !== -1) {
      logs[index] = { ...logs[index], ...updatedLog };
      localStorage.setItem(HEALTH_LOGS_KEY, JSON.stringify(logs));
      console.log('✅ Health log updated:', logs[index]); // 디버깅용
    }
  },

  delete(id: string): void {
    const logs = this.getAll().filter(log => log.id !== id);
    localStorage.setItem(HEALTH_LOGS_KEY, JSON.stringify(logs));
    console.log('✅ Health log deleted:', id); // 디버깅용
  },
};

// Symptom Storage
export const symptomStorage = {
  getAll(): Symptom[] {
    const data = localStorage.getItem(SYMPTOMS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getByCatId(catId: string): Symptom[] {
    return this.getAll().filter(symptom => symptom.catId === catId);
  },

  add(symptom: Symptom): void {
    const symptoms = this.getAll();
    symptoms.push(symptom);
    localStorage.setItem(SYMPTOMS_KEY, JSON.stringify(symptoms));
    console.log('✅ Symptom saved:', symptom); // 디버깅용
  },

  delete(id: string): void {
    const symptoms = this.getAll().filter(symptom => symptom.id !== id);
    localStorage.setItem(SYMPTOMS_KEY, JSON.stringify(symptoms));
    console.log('✅ Symptom deleted:', id); // 디버깅용
  },
};
