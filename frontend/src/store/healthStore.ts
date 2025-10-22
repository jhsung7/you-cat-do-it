import { create } from 'zustand';
import { HealthLog, Symptom } from '../types';
import { healthLogStorage, symptomStorage } from '../services/storage';

interface HealthStore {
    healthLogs: HealthLog[];
    symptoms: Symptom[];
    
    loadHealthLogs: (catId: string) => void;
    addHealthLog: (log: HealthLog) => void;
    loadSymptoms: (catId: string) => void;
    addSymptom: (symptom: Symptom) => void;
    getRecentLogs: (catId: string, days: number) => HealthLog[];
    }

    export const useHealthStore = create<HealthStore>((set, get) => ({
    healthLogs: [],
    symptoms: [],

    loadHealthLogs: (catId) => {
        const logs = healthLogStorage.getByCatId(catId);
        set({ healthLogs: logs });
    },

    addHealthLog: (log) => {
        healthLogStorage.add(log);
        set({ healthLogs: [...get().healthLogs, log] });
    },

    loadSymptoms: (catId) => {
        const symptoms = symptomStorage.getByCatId(catId);
        set({ symptoms });
    },

    addSymptom: (symptom) => {
        symptomStorage.add(symptom);
        set({ symptoms: [...get().symptoms, symptom] });
    },

    getRecentLogs: (catId, days) => {
        return healthLogStorage.getRecent(catId, days);
    },
}));
