import { create } from 'zustand';
interface PageStore {
    isCompactMenu: boolean;
    isDarkMode: boolean;
    setDarkMode: (isDarkMode: boolean) => void;
    setCompactMenu: (isCompactMenu: boolean) => void;
}

const usePageStore = create<PageStore>((set) => ({
    isCompactMenu: false,
    isDarkMode: false,

    setCompactMenu: (isCompactMenu) => set({ isCompactMenu }),
    setDarkMode: (isDarkMode) => set({ isDarkMode }),
}));

export default usePageStore;
