import { HealthLog, Symptom, WeightLog, VetVisit, Prescription, MoodLog } from '../types';
import { scheduleSharedStateSave } from './stateSync';

// localStorage 키
const HEALTH_LOGS_KEY = 'healthLogs'; // ✅ 수정
const SYMPTOMS_KEY = 'cat-symptoms';
const WEIGHT_LOGS_KEY = 'cat-weight-logs';
const VET_VISITS_KEY = 'cat-vet-visits';
const PRESCRIPTIONS_KEY = 'cat-prescriptions';
const MOOD_LOGS_KEY = 'cat-mood-logs';
const CHAT_HISTORY_KEY = 'chat-history';

const persist = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
  scheduleSharedStateSave();
};

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
    persist(HEALTH_LOGS_KEY, logs);
    console.log('✅ Health log saved:', log); // 디버깅용
    console.log('📋 Total logs now:', logs.length); // 디버깅용
  },

  update(id: string, updatedLog: Partial<HealthLog>): void {
    const logs = this.getAll();
    const index = logs.findIndex(log => log.id === id);
    if (index !== -1) {
      logs[index] = { ...logs[index], ...updatedLog };
      persist(HEALTH_LOGS_KEY, logs);
      console.log('✅ Health log updated:', logs[index]); // 디버깅용
    }
  },

  delete(id: string): void {
    const logs = this.getAll().filter(log => log.id !== id);
    persist(HEALTH_LOGS_KEY, logs);
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
    persist(SYMPTOMS_KEY, symptoms);
    console.log('✅ Symptom saved:', symptom); // 디버깅용
  },

  delete(id: string): void {
    const symptoms = this.getAll().filter(symptom => symptom.id !== id);
    persist(SYMPTOMS_KEY, symptoms);
    console.log('✅ Symptom deleted:', id); // 디버깅용
  },
};

// WeightLog Storage
export const weightLogStorage = {
  getAll(): WeightLog[] {
    const data = localStorage.getItem(WEIGHT_LOGS_KEY);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data) as WeightLog[];
      let mutated = false;

      const normalized = parsed
        .map((log) => {
          const timestamp =
            typeof log.timestamp === 'number' && Number.isFinite(log.timestamp)
              ? log.timestamp
              : log.date
              ? new Date(`${log.date}T12:00:00`).getTime()
              : undefined;
          if (!timestamp || Number.isNaN(timestamp)) return null;
          const date = log.date || new Date(timestamp).toISOString().split('T')[0];
          if (log.timestamp !== timestamp || log.date !== date) mutated = true;
          return { ...log, timestamp, date };
        })
        .filter((log): log is WeightLog => log !== null)
        .sort((a, b) => a.timestamp - b.timestamp);

      if (mutated) {
        persist(WEIGHT_LOGS_KEY, normalized);
      }

      return normalized;
    } catch {
      return [];
    }
  },

  getByCatId(catId: string): WeightLog[] {
    return this.getAll()
      .filter(log => log.catId === catId)
      .sort((a, b) => a.timestamp - b.timestamp); // 날짜순 정렬
  },

  add(log: WeightLog): void {
    const logs = this.getAll();
    logs.push(log);
    persist(WEIGHT_LOGS_KEY, logs);
    console.log('✅ Weight log saved:', log);
  },

  delete(id: string): void {
    const logs = this.getAll().filter(log => log.id !== id);
    persist(WEIGHT_LOGS_KEY, logs);
    console.log('✅ Weight log deleted:', id);
    // Remove mirrored health log (if any) to keep calendar clean
    healthLogStorage.delete(id);
  },
};

// VetVisit Storage
export const vetVisitStorage = {
  getAll(): VetVisit[] {
    const data = localStorage.getItem(VET_VISITS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getByCatId(catId: string): VetVisit[] {
    return this.getAll()
      .filter(visit => visit.catId === catId)
      .sort((a, b) => b.timestamp - a.timestamp); // 최신순
  },

  add(visit: VetVisit): void {
    const visits = this.getAll();
    visits.push(visit);
    persist(VET_VISITS_KEY, visits);
    console.log('✅ Vet visit saved:', visit);
  },

  delete(id: string): void {
    const visits = this.getAll().filter(visit => visit.id !== id);
    persist(VET_VISITS_KEY, visits);
    console.log('✅ Vet visit deleted:', id);
  },
};

// Prescription Storage
export const prescriptionStorage = {
  getAll(): Prescription[] {
    const data = localStorage.getItem(PRESCRIPTIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getByCatId(catId: string): Prescription[] {
    return this.getAll().filter(p => p.catId === catId);
  },

  getByVisitId(visitId: string): Prescription[] {
    return this.getAll().filter(p => p.visitId === visitId);
  },

  add(prescription: Prescription): void {
    const prescriptions = this.getAll();
    prescriptions.push(prescription);
    persist(PRESCRIPTIONS_KEY, prescriptions);
    console.log('✅ Prescription saved:', prescription);
  },

  update(id: string, updates: Partial<Prescription>): void {
    const prescriptions = this.getAll();
    const index = prescriptions.findIndex(p => p.id === id);
    if (index !== -1) {
      prescriptions[index] = { ...prescriptions[index], ...updates };
      persist(PRESCRIPTIONS_KEY, prescriptions);
      console.log('✅ Prescription updated:', prescriptions[index]);
    }
  },

  delete(id: string): void {
    const prescriptions = this.getAll().filter(p => p.id !== id);
    persist(PRESCRIPTIONS_KEY, prescriptions);
    console.log('✅ Prescription deleted:', id);
  },
};

// MoodLog Storage
export const moodLogStorage = {
  getAll(): MoodLog[] {
    const data = localStorage.getItem(MOOD_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getByCatId(catId: string): MoodLog[] {
    return this.getAll()
      .filter(log => log.catId === catId)
      .sort((a, b) => b.timestamp - a.timestamp); // 최신순
  },

  add(log: MoodLog): void {
    const logs = this.getAll();
    logs.push(log);
    persist(MOOD_LOGS_KEY, logs);
    console.log('✅ Mood log saved:', log);
  },

  update(id: string, updates: Partial<MoodLog>): void {
    const logs = this.getAll();
    const index = logs.findIndex(log => log.id === id);
    if (index !== -1) {
      logs[index] = { ...logs[index], ...updates };
      persist(MOOD_LOGS_KEY, logs);
      console.log('✅ Mood log updated:', logs[index]);
    }
  },

  delete(id: string): void {
    const logs = this.getAll().filter(log => log.id !== id);
    persist(MOOD_LOGS_KEY, logs);
    console.log('✅ Mood log deleted:', id);
  },
};

// ChatHistory Storage
export interface ChatMessage {
  id: string;
  catId?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const chatHistoryStorage = {
  getAll(): ChatMessage[] {
    const data = localStorage.getItem(CHAT_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  },

  getByCatId(catId?: string): ChatMessage[] {
    const allMessages = this.getAll();
    if (!catId) {
      return allMessages.filter(msg => !msg.catId);
    }
    return allMessages.filter(msg => msg.catId === catId);
  },

  add(message: ChatMessage): void {
    const messages = this.getAll();
    messages.push(message);
    // 최근 100개 메시지만 저장
    const recent = messages.slice(-100);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(recent));
    console.log('✅ Chat message saved:', message);
  },

  clear(catId?: string): void {
    if (!catId) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify([]));
      console.log('✅ All chat history cleared');
    } else {
      const messages = this.getAll().filter(msg => msg.catId !== catId);
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
      console.log('✅ Chat history cleared for cat:', catId);
    }
  },
};
