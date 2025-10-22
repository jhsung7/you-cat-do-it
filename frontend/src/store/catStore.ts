import { create } from 'zustand';
import { Cat } from '../types';
import { catStorage } from '../services/storage';

interface CatStore {
    cats: Cat[];
    selectedCat: Cat | null;
    
    loadCats: () => void;
    addCat: (cat: Cat) => void;
    updateCat: (id: string, updates: Partial<Cat>) => void;
    deleteCat: (id: string) => void;
    selectCat: (id: string) => void;
}

export const useCatStore = create<CatStore>((set, get) => ({
    cats: [],
    selectedCat: null,

    loadCats: () => {
        const cats = catStorage.getAll();
        set({ cats });
    },

    addCat: (cat) => {
        catStorage.add(cat);
        set({ cats: [...get().cats, cat] });
    },

    updateCat: (id, updates) => {
        catStorage.update(id, updates);
        const cats = get().cats.map(c => 
        c.id === id ? { ...c, ...updates } : c
        );
        set({ cats });
    },

    deleteCat: (id) => {
        catStorage.delete(id);
        set({ 
        cats: get().cats.filter(c => c.id !== id),
        selectedCat: get().selectedCat?.id === id ? null : get().selectedCat
        });
    },

    selectCat: (id) => {
        const cat = get().cats.find(c => c.id === id);
        set({ selectedCat: cat || null });
    },
}));