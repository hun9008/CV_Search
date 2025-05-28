import { create } from 'zustand';
import { JobContent } from '../types/searchResult';
import axios from 'axios';
import useAuthStore from './authStore';

interface searchStore {
    query: string;
    searchList: JobContent[];
    totalPage: number;
    currentPage: number;
    isFirstPage: boolean;
    isLastPage: boolean;
    setQuery: (queryWord: string) => void;
    setSearchList: (jobs: JobContent[]) => void;
    getSearchList: (keyword: string, page: number, size: number) => Promise<void>;
    goToNextPage: () => void;
    goToPrevPage: () => void;
    setCurrentPage: (pageNum: number) => void;
}

const useSearchStore = create<searchStore>((set) => ({
    query: '',
    searchList: [],
    totalPage: 0,
    currentPage: 0,
    isFirstPage: true,
    isLastPage: false,
    setQuery: (queryWord) => set({ query: queryWord }),
    setSearchList: (jobs) => set({ searchList: jobs }),
    getSearchList: async (keyword, page, size) => {
        const accessToken = useAuthStore.getState().accessToken;
        const res = await axios.get(
            `https://be.goodjob.ai.kr/jobs/search?keyword=${keyword}&page=${page}&size=${size}&sort=createdAt%2CDESC`,
            { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
        );
        set({
            searchList: res.data.content,
            totalPage: res.data.totalPages,
            currentPage: res.data.pageable.pageNumber,
            isFirstPage: res.data.first,
            isLastPage: res.data.last,
        });
    },
    goToNextPage: () => set((state) => ({ currentPage: state.currentPage + 1 })),
    goToPrevPage: () => set((state) => ({ currentPage: state.currentPage - 1 })),
    setCurrentPage: (pageNum) => set({ currentPage: pageNum }),
}));

export default useSearchStore;
