import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cat } from '../types';
import { publishTelemetryEvent } from '../utils/telemetry';

type NewCatPayload = Omit<Cat, 'id'>;

interface CatStore {
  cats: Cat[];
  selectedCat: Cat | null;
  addCat: (cat: NewCatPayload) => void;
  updateCat: (id: string, cat: Partial<Cat>) => void;
  deleteCat: (id: string) => void;
  selectCat: (id: string) => void;
  loadCats: () => void;
}

export const useCatStore = create<CatStore>()(
  persist(
    (set, get) => ({
      cats: [],
      selectedCat: null,

      loadCats: () => {
        const { cats, selectedCat } = get();
        if (!cats.length) {
          set({ selectedCat: null });
          return;
        }

        if (!selectedCat) {
          set({ selectedCat: cats[0] });
          return;
        }

        const stillExists = cats.some((cat) => cat.id === selectedCat.id);
        if (!stillExists) {
          set({ selectedCat: cats[0] ?? null });
        }
      },

      addCat: (catData) => {
        const newCat: Cat = {
          ...catData,
          id: crypto.randomUUID(),
        };
        
        set((state) => ({
          cats: [...state.cats, newCat],
          selectedCat: newCat,
        }));
        
        publishTelemetryEvent({
          type: 'cat.added',
          severity: 'success',
          translationKey: 'notifications.catAdded',
          params: { name: newCat.name },
          metadata: { catId: newCat.id },
        });
      },

      updateCat: (id, updatedData) => {
        const currentCat = get().cats.find((cat) => cat.id === id);

        set((state) => ({
          cats: state.cats.map((cat) =>
            cat.id === id ? { ...cat, ...updatedData } : cat
          ),
          selectedCat:
            state.selectedCat?.id === id
              ? { ...state.selectedCat, ...updatedData }
              : state.selectedCat,
        }));

        const updatedName = (updatedData.name as string | undefined) ?? currentCat?.name ?? '';

        publishTelemetryEvent({
          type: 'cat.updated',
          severity: 'success',
          translationKey: 'notifications.catUpdated',
          params: { name: updatedName },
          metadata: { catId: id },
        });
      },

      deleteCat: (id) => {
        const deletedCat = get().cats.find((cat) => cat.id === id);

        set((state) => ({
          cats: state.cats.filter((cat) => cat.id !== id),
          selectedCat: state.selectedCat?.id === id ? null : state.selectedCat,
        }));

        publishTelemetryEvent({
          type: 'cat.deleted',
          severity: 'warning',
          translationKey: 'notifications.catDeleted',
          params: { name: deletedCat?.name ?? '' },
          metadata: { catId: id },
        });
      },

      selectCat: (id) => {
        const cat = get().cats.find((c) => c.id === id);
        if (cat) {
          set({ selectedCat: cat });
          publishTelemetryEvent({
            type: 'cat.selected',
            severity: 'info',
            translationKey: 'notifications.catSelected',
            params: { name: cat.name },
            metadata: { catId: cat.id },
          });
        } else {
          set({ selectedCat: null });
          publishTelemetryEvent({
            type: 'cat.missing',
            severity: 'warning',
            translationKey: 'notifications.catMissing',
            params: { id },
          });
        }
      },
    }),
    {
      name: 'cat-storage',
    }
  )
);
