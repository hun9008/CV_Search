import { create } from 'zustand';
import { persist } from 'zustand/middleware';
interface PageStore {
    isCompactMenu: boolean;
    isDarkMode: boolean;
    previousPage: string;
    setPreviousPage: (pagePath: string) => void;
    setDarkMode: (isDarkMode: boolean) => void;
    setCompactMenu: (isCompactMenu: boolean) => void;
}

const usePageStore = create<PageStore>()(
    persist(
        (set) => ({
            isCompactMenu: false,
            isDarkMode: false,
            previousPage: '',
            setPreviousPage: (pagePath) => set({ previousPage: pagePath }),
            setCompactMenu: (isCompactMenu) => set({ isCompactMenu }),
            setDarkMode: (isDarkMode) => set({ isDarkMode }),
        }),
        {
            name: 'page-storage',
            partialize: (state) => ({
                previousPage: state.previousPage,
            }),
        }
    )
);

export default usePageStore;
