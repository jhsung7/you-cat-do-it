import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Cat {
  id: string;
  name: string;
  breed: string;
  birthDate: string;
  weight: number;
  gender: 'male' | 'female';
  neutered: boolean;
  chronicConditions?: string[];
}

interface CatStore {
  cats: Cat[];
  selectedCat: Cat | null;
  addCat: (cat: Omit<Cat, 'id'>) => void;
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
        // persist 미들웨어가 자동으로 로드하므로 여기서는 아무것도 안 함
        console.log('📦 Cats loaded from storage:', get().cats.length);
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
