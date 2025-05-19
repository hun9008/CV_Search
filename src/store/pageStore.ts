import { create } from 'zustand';
type PageContent = '지원 관리' | '추천 공고' | '북마크' | '나의 CV';
type PageSubContent = '설정' | '도움말';

interface PageStore {
    activeContent: PageContent | PageSubContent;
    setActiveContent: (content: PageContent | PageSubContent) => void;
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
