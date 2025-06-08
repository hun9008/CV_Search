import axios from 'axios';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import useAuthStore from './authStore';
import { JobBrief } from '../types/jobBrief';
import { SERVER_IP } from '../../src/constants/env';

interface adminJobManageStore {
    totalJob: JobBrief[];
    addJob: () => Promise<void>;
    removeJob: (jobId: number, vaildType: number | null) => Promise<number>;
    getTotalJob: () => Promise<void>;
}

const useAdminJobManageStore = create<adminJobManageStore>()(
    persist(
        (set) => ({
            totalJob: [],
            addJob: async () => {},
            removeJob: async (jobId, vaildType) => {
                try {
                    const accessToken = useAuthStore.getState().accessToken;
                    const res = await axios.delete(
                        `${SERVER_IP}/admin/dashboard/delete-one-job-valid-type?jobId=${jobId}&validType=${vaildType}`,
                        {
                            headers: { Authorization: `Bearer ${accessToken}` },
                            withCredentials: true,
                        }
                    );
                    return res.status;
                } catch (error) {
                    console.error('관리자 공고 삭제 에러: ', error);
                    throw error;
                }
            },
            getTotalJob: async () => {
                try {
                    const accessToken = useAuthStore.getState().accessToken;
                    const res = await axios.get(`${SERVER_IP}/admin/dashboard/job-valid-type`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        withCredentials: true,
                    });
                    set({ totalJob: res.data });
                } catch (error) {
                    console.error('관리자 공고 리스트 불러오기 에러: ', error);
                }
            },
        }),
        {
            name: 'admin-job-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                totalJob: state.totalJob,
            }),
        }
    )
);

export default useAdminJobManageStore;
