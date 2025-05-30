import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './authStore';
import useBookmarkStore from './bookmarkStore';
import Job from '../types/job';
import { SERVER_IP } from '../../src/constants/env';

interface JobStore {
    jobList: Job[];
    filteredJobList: Job[] | null;
    selectedJob: Job | null;
    selectedJobDetail: Job | null;
    feedback: string;
    setSelectedJob: (job: Job) => void;
    setSelectedJobDetail: (job: Job) => void;
    getSelectedJob: () => Job | null;
    getSelectedJobDetail: () => Job | null;
    getFeedback: (jobId: number) => Promise<number>;
    setJobList: (list: Job[]) => void;
    setFilteredJobList: (list: Job[] | null) => void;
    getJobList: (count: number) => Promise<Job[]>;
    getJobListwithBookmark: (count: number) => Promise<Job[]>;
}

const useJobStore = create<JobStore>((set, get) => ({
    jobList: [],
    filteredJobList: [],
    selectedJob: null,
    selectedJobDetail: null,
    feedback: '',

    setSelectedJob: (job) => set({ selectedJob: job }),
    setSelectedJobDetail: (job) => set({ selectedJobDetail: job }),
    setFilteredJobList: (filteredJobList) => set({ filteredJobList }),

    getSelectedJob: () => {
        const { selectedJob } = get();

        return selectedJob;
    },
    getSelectedJobDetail: () => {
        const { selectedJobDetail } = get();

        return selectedJobDetail;
    },

    getFeedback: async (jobId) => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.post(`${SERVER_IP}/rec/feedback?jobId=${jobId}`, null, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                withCredentials: true,
            });
            set({ feedback: res.data });
            return res.status;
        } catch (error) {
            console.error('피드백 에러: ', error);
            throw error;
        }
    },

    setJobList: (jobList) => set({ jobList }),

    getJobList: async (count) => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.post(`${SERVER_IP}/rec/topk-list?topk=${count}`, null, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                withCredentials: true,
            });
            const jobList: Job[] = res.data || [];
            set({ jobList });
            return jobList;
        } catch (error) {
            console.error('잡 리스트 에러: ', error);
            throw error;
        }
    },

    getJobListwithBookmark: async (count) => {
        try {
            const { getJobList } = get();
            const getBookmark = useBookmarkStore.getState().getBookmark;

            const [topkRes, bookmarkRes] = await Promise.all([
                getJobList(count),
                getBookmark?.() || Promise.resolve([]),
            ]);

            const bookmarkedJob = Array.isArray(bookmarkRes) ? bookmarkRes : [];
            const bookmarkedIds = new Set<number>(bookmarkedJob.map((job: Job) => job.id));
            const bookmarkedJobs: Job[] = topkRes.map((job: Job) => ({
                ...job,
                isBookmarked: bookmarkedIds.has(job.id),
            }));

            return bookmarkedJobs;
        } catch (error) {
            console.error('북마크 포함 잡 리스트 에러: ', error);
            throw error;
        }
    },
}));

export default useJobStore;
