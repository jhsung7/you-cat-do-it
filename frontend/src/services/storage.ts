import { HealthLog, Symptom } from '../types';

// localStorage 키
const HEALTH_LOGS_KEY = 'cat-health-logs';
const SYMPTOMS_KEY = 'cat-symptoms';

// HealthLog Storage
export const healthLogStorage = {
  getAll(): HealthLog[] {
    const data = localStorage.getItem(HEALTH_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getByCatId(catId: string): HealthLog[] {
    return this.getAll().filter(log => log.catId === catId);
  },

  getRecent(catId: string, days: number): HealthLog[] {
    const logs = this.getByCatId(catId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return logs
      .filter(log => new Date(log.date) >= startDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  add(log: HealthLog): void {
    const logs = this.getAll();
    logs.push(log);
    localStorage.setItem(HEALTH_LOGS_KEY, JSON.stringify(logs));
  },

  update(id: string, updatedLog: Partial<HealthLog>): void {
    const logs = this.getAll();
    const index = logs.findIndex(log => log.id === id);
    if (index !== -1) {
      logs[index] = { ...logs[index], ...updatedLog };
      localStorage.setItem(HEALTH_LOGS_KEY, JSON.stringify(logs));
    }
  },

  delete(id: string): void {
    const logs = this.getAll().filter(log => log.id !== id);
    localStorage.setItem(HEALTH_LOGS_KEY, JSON.stringify(logs));
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
  },

  delete(id: string): void {
    const symptoms = this.getAll().filter(symptom => symptom.id !== id);
    localStorage.setItem(SYMPTOMS_KEY, JSON.stringify(symptoms));
  },
};