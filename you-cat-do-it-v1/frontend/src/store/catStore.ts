import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cat } from '../types';

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
        
        console.log('✅ Cat added:', newCat.name);
      },

      updateCat: (id, updatedData) => {
        set((state) => ({
          cats: state.cats.map((cat) =>
            cat.id === id ? { ...cat, ...updatedData } : cat
          ),
          selectedCat:
            state.selectedCat?.id === id
              ? { ...state.selectedCat, ...updatedData }
              : state.selectedCat,
        }));
        
        console.log('✅ Cat updated:', id);
      },

      deleteCat: (id) => {
        set((state) => ({
          cats: state.cats.filter((cat) => cat.id !== id),
          selectedCat: state.selectedCat?.id === id ? null : state.selectedCat,
        }));
        
        console.log('🗑️ Cat deleted:', id);
      },

      selectCat: (id) => {
        const cat = get().cats.find((c) => c.id === id);
        if (cat) {
          set({ selectedCat: cat });
          console.log('🐱 Cat selected:', cat.name);
        } else {
          set({ selectedCat: null });
          console.log('⚠️ Cat not found:', id);
        }
      },
    }),
    {
      name: 'cat-storage',
    }
  )
);
