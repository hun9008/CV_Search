import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './authStore';
import type Job from '../../types/job';

interface bookmarkStore {
    bookmarkList: Job[] | null;
    setBookmarkList: (job: Job[]) => Promise<void>;
    addBookmark: (id: number) => Promise<number | undefined>;
    getBookmark: () => Promise<void>;
    removeBookmark: (id: number) => Promise<number | undefined>;
}

const useBookmarkStore = create<bookmarkStore>((set) => ({
    bookmarkList: null,
    setBookmarkList: async (bookmarkList: Job[] | null) => set({ bookmarkList }),
    addBookmark: async (id: number) => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.post(
                `https://be.goodjob.ai.kr/bookmark/add?JobId=${id}`,
                null,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    withCredentials: true,
                }
            );

            console.log(`Add bookmark: ${res.status}`);

            await useBookmarkStore.getState().getBookmark();

            return res.status;
        } catch (error) {
            console.log(`북마크 추가 에러: ${error}`);
        }
    },
    getBookmark: async () => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.get('https://be.goodjob.ai.kr/bookmark/me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                withCredentials: true,
            });
            console.log(`Get bookmark: ${res.data}`);
            set({ bookmarkList: res.data }); // 응답 데이터로 상태 업데이트
            return res.data;
        } catch (error) {
            console.log(`북마크 가져오기 에러: ${error}`);
            return [];
        }
    },
    removeBookmark: async (id: number) => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.delete(`https://be.goodjob.ai.kr/bookmark/remove?JobId=${id}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                withCredentials: true,
            });
            console.log(`Remove bookmark: ${res.status}`);

            // 북마크 삭제 후 상태 업데이트
            const currentBookmarks = useBookmarkStore.getState().bookmarkList || [];
            set({
                bookmarkList: currentBookmarks.filter((bookmark) => bookmark.id !== id),
            });

            return res.status;
        } catch (error) {
            console.log(`북마크 삭제 에러: ${error}`);
        }
    },
}));

export default useBookmarkStore;
