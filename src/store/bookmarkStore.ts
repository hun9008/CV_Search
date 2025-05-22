import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './authStore';
import type Job from '../../types/job';
import useJobStore from './jobStore';

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

            // 낙관적 업데이트: API 호출 전에 상태 업데이트
            const currentBookmarks = useBookmarkStore.getState().bookmarkList || [];
            const jobToAdd = useJobStore.getState().jobList?.find((job) => job.id === id);

            if (jobToAdd && !currentBookmarks.some((bookmark) => bookmark.id === id)) {
                // 북마크 목록에 추가 (임시)
                set({
                    bookmarkList: [...currentBookmarks, { ...jobToAdd, isBookmarked: true }],
                });
            }

            // API 호출
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

            // 성공 시 전체 북마크 목록 갱신 (선택적)
            if (res.status === 200 || res.status === 201) {
                // 이미 낙관적으로 업데이트했으므로 전체 목록 갱신은 필요 없음
                // await useBookmarkStore.getState().getBookmark();
            }

            return res.status;
        } catch (error) {
            // 오류 발생 시 이전 상태로 복원
            console.log(`북마크 추가 에러: ${error}`);
            await useBookmarkStore.getState().getBookmark();
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

            // 낙관적 업데이트: API 호출 전에 상태 업데이트
            const currentBookmarks = useBookmarkStore.getState().bookmarkList || [];

            // 북마크 목록에서 제거 (임시)
            set({
                bookmarkList: currentBookmarks.filter((bookmark) => bookmark.id !== id),
            });

            // API 호출
            const res = await axios.delete(`https://be.goodjob.ai.kr/bookmark/remove?JobId=${id}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                withCredentials: true,
            });

            console.log(`Remove bookmark: ${res.status}`);

            return res.status;
        } catch (error) {
            // 오류 발생 시 이전 상태로 복원
            console.log(`북마크 삭제 에러: ${error}`);
            await useBookmarkStore.getState().getBookmark();
        }
    },
}));

export default useBookmarkStore;
