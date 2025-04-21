import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './authStore';

interface jobStore {
    jobList: [] | null;
    count: number;
    setJobList: (list: [] | null) => void;
    getJobList: (count: number) => Promise<void>;
}

const useJobStore = create<jobStore>((set) => ({
    jobList: [],
    count: 15,
    setJobList: (jobList: [] | null) => set({ jobList }),
    getJobList: async (count) => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.post(
                `https://be.goodjob.ai.kr/rec/topk-list?topk=${count}`,
                null,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    withCredentials: true,
                }
            );
            return res.data;
        } catch (error) {
            console.log(error);
        }
    },
}));

export default useJobStore;
