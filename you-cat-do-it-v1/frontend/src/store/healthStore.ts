import { create } from 'zustand';
import { HealthLog, Symptom, WeightLog, VetVisit, Prescription, MoodLog } from '../types';
import { healthLogStorage, symptomStorage, weightLogStorage, vetVisitStorage, prescriptionStorage, moodLogStorage } from '../services/storage';

interface HealthStore {
    healthLogs: HealthLog[];
    symptoms: Symptom[];
    weightLogs: WeightLog[];
    vetVisits: VetVisit[];
    prescriptions: Prescription[];
    moodLogs: MoodLog[];

    loadHealthLogs: (catId: string) => void;
    addHealthLog: (log: HealthLog) => void;
    updateHealthLog: (id: string, updates: Partial<HealthLog>) => void;
    deleteHealthLog: (id: string) => void;
    loadSymptoms: (catId: string) => void;
    addSymptom: (symptom: Symptom) => void;
    getRecentLogs: (catId: string, days: number) => HealthLog[];

    loadWeightLogs: (catId: string) => void;
    addWeightLog: (log: WeightLog) => void;
    getWeightLogs: (catId: string) => WeightLog[];

    loadVetVisits: (catId: string) => void;
    addVetVisit: (visit: VetVisit) => void;
    getVetVisits: (catId: string) => VetVisit[];

    addPrescription: (prescription: Prescription) => void;
    updatePrescription: (id: string, updates: Partial<Prescription>) => void;
    getPrescriptionsByVisit: (visitId: string) => Prescription[];

    loadMoodLogs: (catId: string) => void;
    addMoodLog: (log: MoodLog) => void;
    updateMoodLog: (id: string, updates: Partial<MoodLog>) => void;
    deleteMoodLog: (id: string) => void;
    getMoodLogs: (catId: string) => MoodLog[];
    }

    export const useHealthStore = create<HealthStore>((set, get) => ({
    healthLogs: [],
    symptoms: [],
    weightLogs: [],
    vetVisits: [],
    prescriptions: [],
    moodLogs: [],

    loadHealthLogs: (catId) => {
        const logs = healthLogStorage.getByCatId(catId);
        set({ healthLogs: logs });
    },

    addHealthLog: (log) => {
        healthLogStorage.add(log);
        set({ healthLogs: [...get().healthLogs, log] });
    },

    updateHealthLog: (id, updates) => {
        healthLogStorage.update(id, updates);
        const healthLogs = get().healthLogs.map(log =>
            log.id === id ? { ...log, ...updates } : log
        );
        set({ healthLogs });
    },

    deleteHealthLog: (id) => {
        healthLogStorage.delete(id);
        const healthLogs = get().healthLogs.filter(log => log.id !== id);
        set({ healthLogs });
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

    loadWeightLogs: (catId) => {
        const logs = weightLogStorage.getByCatId(catId);
        set({ weightLogs: logs });
    },

    addWeightLog: (log) => {
        weightLogStorage.add(log);
        set({ weightLogs: [...get().weightLogs, log] });
    },

    getWeightLogs: (catId) => {
        return weightLogStorage.getByCatId(catId);
    },

    loadVetVisits: (catId) => {
        const visits = vetVisitStorage.getByCatId(catId);
        set({ vetVisits: visits });
    },

    addVetVisit: (visit) => {
        vetVisitStorage.add(visit);
        set({ vetVisits: [...get().vetVisits, visit] });
    },

    getVetVisits: (catId) => {
        return vetVisitStorage.getByCatId(catId);
    },

    addPrescription: (prescription) => {
        prescriptionStorage.add(prescription);
        set({ prescriptions: [...get().prescriptions, prescription] });
    },

    updatePrescription: (id, updates) => {
        prescriptionStorage.update(id, updates);
        const prescriptions = get().prescriptions.map(p =>
            p.id === id ? { ...p, ...updates } : p
        );
        set({ prescriptions });
    },

    getPrescriptionsByVisit: (visitId) => {
        return prescriptionStorage.getByVisitId(visitId);
    },

    loadMoodLogs: (catId) => {
        const logs = moodLogStorage.getByCatId(catId);
        set({ moodLogs: logs });
    },

    addMoodLog: (log) => {
        moodLogStorage.add(log);
        set({ moodLogs: [...get().moodLogs, log] });
    },

    updateMoodLog: (id, updates) => {
        moodLogStorage.update(id, updates);
        const moodLogs = get().moodLogs.map(log =>
            log.id === id ? { ...log, ...updates } : log
        );
        set({ moodLogs });
    },

    deleteMoodLog: (id) => {
        moodLogStorage.delete(id);
        const moodLogs = get().moodLogs.filter(log => log.id !== id);
        set({ moodLogs });
    },

    getMoodLogs: (catId) => {
        return moodLogStorage.getByCatId(catId);
    },
}));
