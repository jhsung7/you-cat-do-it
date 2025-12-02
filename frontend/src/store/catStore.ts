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
  imageUrl?: string;
}

interface CatStore {
  cats: Cat[];
  selectedCat: Cat | null;
  selectedCatId: string | null;
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
      selectedCatId: null,

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
          selectedCatId: newCat.id,
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
          selectedCatId: state.selectedCatId,
        }));
        
        console.log('✅ Cat updated:', id);
      },

      deleteCat: (id) => {
        set((state) => {
          const remaining = state.cats.filter((cat) => cat.id !== id);
          const selectedCat = state.selectedCat?.id === id ? remaining[0] || null : state.selectedCat;
          const selectedCatId = selectedCat ? selectedCat.id : null;
          return {
            cats: remaining,
            selectedCat,
            selectedCatId,
          };
        });
        
        console.log('🗑️ Cat deleted:', id);
      },

      selectCat: (id) => {
        const cat = get().cats.find((c) => c.id === id);
        if (cat) {
          set({ selectedCat: cat, selectedCatId: id });
          console.log('🐱 Cat selected:', cat.name);
        } else {
          set({ selectedCat: null, selectedCatId: null });
          console.log('⚠️ Cat not found:', id);
        }
      },
    }),
    {
      name: 'cat-storage',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<CatStore> | undefined;
        const merged = { ...currentState, ...persisted };

        const cats = persisted?.cats ?? currentState.cats ?? [];
        const storedSelectedId =
          persisted?.selectedCatId || persisted?.selectedCat?.id || currentState.selectedCatId || currentState.selectedCat?.id;

        if (cats.length === 0) {
          return { ...merged, cats: [], selectedCat: null, selectedCatId: null };
        }

        const targetCat = storedSelectedId ? cats.find((c) => c.id === storedSelectedId) : null;
        const fallbackCat = targetCat || cats[0];

        return {
          ...merged,
          cats,
          selectedCat: fallbackCat,
          selectedCatId: fallbackCat?.id || null,
        };
      },
    }
  )
);
