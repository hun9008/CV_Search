import { create } from 'zustand';
type PageContent = '지원 관리' | '추천 공고' | '북마크' | '나의 CV';

interface PageStore {
    activeContent: PageContent;
    setActiveContent: (content: PageContent) => void;
    isCompactMenu: boolean;
    setCompactMenu: (isCompactMenu: boolean) => void;
}

const usePageStore = create<PageStore>((set) => ({
    isCompactMenu: false,
    activeContent: '추천 공고',
    setCompactMenu: (isCompactMenu) => set({ isCompactMenu }),
    setActiveContent: (content) => set({ activeContent: content }),
}));

export default usePageStore;
