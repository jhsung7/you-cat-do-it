import { create } from 'zustand';
import { HealthLog, Symptom, WeightLog, VetVisit, Prescription, MoodLog, HealthAnomaly } from '../types';
import { healthLogStorage, symptomStorage, weightLogStorage, vetVisitStorage, prescriptionStorage, moodLogStorage } from '../services/storage';
import { useCatStore } from './catStore';

const ROLLING_WINDOW_DAYS = 7;
const TOTAL_WINDOW_DAYS = ROLLING_WINDOW_DAYS * 2;

type DailyTotals = {
    date: string;
    food: number;
    water: number;
    litter: number;
};

const sumFood = (log: HealthLog) =>
    (log.foodAmount || 0) +
    (log.wetFoodAmount || 0) +
    (log.dryFoodAmount || 0) +
    (log.snackAmount || 0);

const WET_FOOD_WATER_RATIO = 0.75

const buildDailyTotals = (logs: HealthLog[]): Record<string, DailyTotals> => {
    return logs.reduce<Record<string, DailyTotals>>((acc, log) => {
        const date = log.date || new Date(log.timestamp).toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = { date, food: 0, water: 0, litter: 0 };
        }
        acc[date].food += sumFood(log);
        acc[date].water += (log.waterAmount || 0) + (log.wetFoodAmount || 0) * WET_FOOD_WATER_RATIO;
        acc[date].litter += log.litterCount || 0;
        return acc;
    }, {});
};

const windowedTotals = (logs: HealthLog[], totalDays: number): DailyTotals[] => {
    const map = buildDailyTotals(logs);
    const today = new Date();
    const result: DailyTotals[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const key = date.toISOString().split('T')[0];
        result.push(map[key] || { date: key, food: 0, water: 0, litter: 0 });
    }
    return result;
};

const averageMetric = (rows: DailyTotals[], metric: 'food' | 'water' | 'litter') => {
    if (rows.length === 0) return 0;
    const sum = rows.reduce((acc, row) => acc + row[metric], 0);
    return sum / rows.length;
};

const metricLabels: Record<'food' | 'water' | 'litter', string> = {
    food: 'Food intake',
    water: 'Water intake',
    litter: 'Litter box visits',
};

const detectAnomalies = (catId: string, logs: HealthLog[]): HealthAnomaly[] => {
    const totals = windowedTotals(logs, TOTAL_WINDOW_DAYS);

    const previous = totals.slice(0, ROLLING_WINDOW_DAYS);
    const current = totals.slice(ROLLING_WINDOW_DAYS);
    const latestDay = totals[totals.length - 1];

    const anomalies: HealthAnomaly[] = [];

    const absoluteHigh: Record<'food' | 'water' | 'litter', number> = {
        food: 600,      // grams per day
        water: 600,     // ml per day
        litter: 8,      // visits per day
    };

    (['food', 'water', 'litter'] as const).forEach((metric) => {
        const prevAvg = averageMetric(previous, metric);
        const currentAvg = averageMetric(current, metric);
        const changePercent = prevAvg ? Math.round(((currentAvg - prevAvg) / prevAvg) * 100) : 0;

        // Detect sharp drops (existing behaviour)
        if (prevAvg && currentAvg < prevAvg) {
            const dropRatio = (prevAvg - currentAvg) / prevAvg;
            const dropThreshold = metric === 'litter' ? 0.4 : metric === 'water' ? 0.4 : 0.3;
            if (dropRatio >= dropThreshold) {
                const severity: 'warning' | 'critical' = Math.abs(changePercent) >= 50 ? 'critical' : 'warning';
                const description = `${metricLabels[metric]} dropped ${Math.abs(changePercent)}% over the last ${ROLLING_WINDOW_DAYS} days (from ${prevAvg.toFixed(1)} to ${currentAvg.toFixed(1)}).`;
                const id = `${catId}-${metric}-drop-${current[current.length - 1]?.date || Date.now()}`;
                anomalies.push({
                    id,
                    catId,
                    metric,
                    severity,
                    description,
                    changePercent,
                    currentAverage: Number(currentAvg.toFixed(2)),
                    previousAverage: Number(prevAvg.toFixed(2)),
                    windowDays: ROLLING_WINDOW_DAYS,
                    detectedAt: Date.now(),
                });
            }
        }

        // Detect spikes (large increases) using rolling window
        if (prevAvg && currentAvg > prevAvg) {
            const spikeMultiplier = metric === 'food' ? 1.6 : metric === 'water' ? 1.8 : 1.8;
            if (currentAvg >= prevAvg * spikeMultiplier) {
                const severity: 'warning' | 'critical' = changePercent >= 100 ? 'critical' : 'warning';
                const description = `${metricLabels[metric]} spiked ${Math.abs(changePercent)}% over the last ${ROLLING_WINDOW_DAYS} days (from ${prevAvg.toFixed(1)} to ${currentAvg.toFixed(1)}).`;
                const id = `${catId}-${metric}-spike-${current[current.length - 1]?.date || Date.now()}`;
                anomalies.push({
                    id,
                    catId,
                    metric,
                    severity,
                    description,
                    changePercent,
                    currentAverage: Number(currentAvg.toFixed(2)),
                    previousAverage: Number(prevAvg.toFixed(2)),
                    windowDays: ROLLING_WINDOW_DAYS,
                    detectedAt: Date.now(),
                });
            }
        }

        // Single-day extreme outlier (works even with little history)
        if (latestDay && latestDay[metric] >= absoluteHigh[metric]) {
            const severity: 'warning' | 'critical' = metric === 'food' && latestDay[metric] >= absoluteHigh[metric] * 1.5 ? 'critical' : 'warning';
            const description = `${metricLabels[metric]} unusually high on ${latestDay.date}: ${latestDay[metric].toFixed(1)} (threshold ${absoluteHigh[metric]}).`;
            const id = `${catId}-${metric}-outlier-${latestDay.date || Date.now()}`;

            // avoid duplicate outlier & spike for same metric/date
            const alreadyExists = anomalies.some((a) => a.metric === metric && a.id === id);
            if (!alreadyExists) {
                anomalies.push({
                    id,
                    catId,
                    metric,
                    severity,
                    description,
                    changePercent: prevAvg ? changePercent : 0,
                    currentAverage: Number(currentAvg.toFixed(2)),
                    previousAverage: Number(prevAvg.toFixed(2)),
                    windowDays: ROLLING_WINDOW_DAYS,
                    detectedAt: Date.now(),
                });
            }
        }
    });

    return anomalies;
};

interface HealthStore {
    healthLogs: HealthLog[];
    symptoms: Symptom[];
    weightLogs: WeightLog[];
    vetVisits: VetVisit[];
    prescriptions: Prescription[];
    moodLogs: MoodLog[];
    anomaliesByCat: Record<string, HealthAnomaly[]>;

    loadHealthLogs: (catId: string) => void;
    addHealthLog: (log: HealthLog) => void;
    updateHealthLog: (id: string, updates: Partial<HealthLog>) => void;
    deleteHealthLog: (id: string) => void;
    loadSymptoms: (catId: string) => void;
    addSymptom: (symptom: Symptom) => void;
    deleteSymptom: (id: string) => void;
    getRecentLogs: (catId: string, days: number) => HealthLog[];

    loadWeightLogs: (catId: string) => void;
    addWeightLog: (log: WeightLog) => void;
    getWeightLogs: (catId: string) => WeightLog[];

    loadVetVisits: (catId: string) => void;
    addVetVisit: (visit: VetVisit) => void;
    deleteVetVisit: (id: string) => void;
    getVetVisits: (catId: string) => VetVisit[];

    addPrescription: (prescription: Prescription) => void;
    updatePrescription: (id: string, updates: Partial<Prescription>) => void;
    getPrescriptionsByVisit: (visitId: string) => Prescription[];

    loadMoodLogs: (catId: string) => void;
    addMoodLog: (log: MoodLog) => void;
    updateMoodLog: (id: string, updates: Partial<MoodLog>) => void;
    deleteMoodLog: (id: string) => void;
    getMoodLogs: (catId: string) => MoodLog[];
    getAnomalies: (catId: string) => HealthAnomaly[];
    recalcAnomalies: (catId: string) => void;
    }

export const useHealthStore = create<HealthStore>((set, get) => {
    const recalcAnomaliesForCat = (catId: string) => {
        if (!catId) return;
        const logsForCat = healthLogStorage.getByCatId(catId);
        const anomalies = detectAnomalies(catId, logsForCat);
        set((state) => ({ anomaliesByCat: { ...state.anomaliesByCat, [catId]: anomalies } }));
    };

    return {
    healthLogs: [],
    symptoms: [],
    weightLogs: [],
    vetVisits: [],
    prescriptions: [],
    moodLogs: [],
    anomaliesByCat: {},

    loadHealthLogs: (catId) => {
        const logs = healthLogStorage.getByCatId(catId);
        set({ healthLogs: logs });
        recalcAnomaliesForCat(catId);
    },

    addHealthLog: (log) => {
        healthLogStorage.add(log);
        set({ healthLogs: [...get().healthLogs, log] });
        recalcAnomaliesForCat(log.catId);
    },

    updateHealthLog: (id, updates) => {
        const existing = get().healthLogs.find(log => log.id === id) || healthLogStorage.getAll().find(log => log.id === id);
        healthLogStorage.update(id, updates);
        const healthLogs = get().healthLogs.map(log =>
            log.id === id ? { ...log, ...updates } : log
        );
        set({ healthLogs });
        if (existing?.catId) {
            recalcAnomaliesForCat(existing.catId);
        }
    },

    deleteHealthLog: (id) => {
        const existing = get().healthLogs.find(log => log.id === id) || healthLogStorage.getAll().find(log => log.id === id);
        healthLogStorage.delete(id);
        const healthLogs = get().healthLogs.filter(log => log.id !== id);
        set({ healthLogs });
        if (existing?.catId) {
            recalcAnomaliesForCat(existing.catId);
        }
    },

    loadSymptoms: (catId) => {
        const symptoms = symptomStorage.getByCatId(catId);
        set({ symptoms });
    },

    addSymptom: (symptom) => {
        symptomStorage.add(symptom);
        set({ symptoms: [...get().symptoms, symptom] });
    },

    deleteSymptom: (id) => {
        symptomStorage.delete(id);
        set({ symptoms: get().symptoms.filter((symptom) => symptom.id !== id) });
    },

    getRecentLogs: (catId, days) => {
        return healthLogStorage.getRecent(catId, days);
    },

    loadWeightLogs: (catId) => {
        const logs = weightLogStorage.getByCatId(catId);
        set({ weightLogs: logs });
    },

    addWeightLog: (log) => {
        if (!log.catId) {
            console.warn('Weight log missing catId; skipping save.', log);
            return;
        }

        const timestamp = log.timestamp ?? new Date(`${log.date}T12:00:00`).getTime();
        const date = log.date || new Date(timestamp).toISOString().split('T')[0];
        const normalized: WeightLog = { ...log, timestamp, date };

        // Persist weight log
        weightLogStorage.add(normalized);
        set({
            weightLogs: [
                ...get().weightLogs.filter((existing) => existing.id !== normalized.id),
                normalized,
            ],
        });

        // Mirror into health logs so calendar/feed show the entry
        const weightHealthLog: HealthLog = {
            id: normalized.id,
            catId: normalized.catId,
            date,
            time: new Date(timestamp).toTimeString().slice(0, 5),
            timestamp,
            type: 'weight',
            weight: normalized.weight,
            notes: normalized.notes,
        };

        const existingHealthLogs = get().healthLogs;
        const exists = existingHealthLogs.some((entry) => entry.id === weightHealthLog.id);
        if (exists) {
            healthLogStorage.update(weightHealthLog.id, weightHealthLog);
            set({
                healthLogs: existingHealthLogs.map((entry) =>
                    entry.id === weightHealthLog.id ? { ...entry, ...weightHealthLog } : entry
                ),
            });
        } else {
            healthLogStorage.add(weightHealthLog);
            set({ healthLogs: [...existingHealthLogs, weightHealthLog] });
        }

        // Keep cat profile weight in sync
        useCatStore.getState().updateCat(normalized.catId, { weight: normalized.weight });
        recalcAnomaliesForCat(normalized.catId);
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

    deleteVetVisit: (id) => {
        vetVisitStorage.delete(id);
        set({ vetVisits: get().vetVisits.filter((visit) => visit.id !== id) });
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

    getAnomalies: (catId) => {
        return get().anomaliesByCat[catId] || [];
    },

    recalcAnomalies: recalcAnomaliesForCat,
  }
})
