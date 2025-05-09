import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './authStore';
import Job from '../pages/index/types/job';

interface JobStore {
    jobList: Job[] | null;
    filteredJobList: Job[] | null;
    selectedJob: number;
    setSelectedJob: (jobId: number) => void;
    getSelectedJob: () => Job | null;
    setJobList: (list: Job[] | null) => void;
    setFilteredJobList: (list: Job[] | null) => void;
    getJobList: (count: number) => Promise<Job[]>;
}

const useJobStore = create<JobStore>((set, get) => ({
    jobList: [],
    filteredJobList: [],
    selectedJob: 0,
    setSelectedJob: (jobId) => set({ selectedJob: jobId }),
    setFilteredJobList: (filteredJobList) => set({ filteredJobList }),
    getSelectedJob: () => {
        const { jobList, selectedJob } = get();
        return jobList?.find((job) => job.id === selectedJob) ?? null;
    },

    setJobList: (jobList) => set({ jobList }),

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

            const jobList: Job[] = res.data || [];
            set({ jobList });
            return jobList;
        } catch (error) {
            console.error(error);
            return [];
        }
    },
}));

export default useJobStore;
