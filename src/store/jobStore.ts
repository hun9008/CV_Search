import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './authStore';
import useBookmarkStore from './bookmarkStore';
import Job from '../../types/job';

interface JobStore {
    jobList: Job[] | null;
    filteredJobList: Job[] | null;
    selectedJob: number;
    feedback: string;
    setSelectedJob: (jobId: number) => void;
    getSelectedJob: () => Job | null;
    getFeedback: (jobId: number) => Promise<number | undefined>;
    setJobList: (list: Job[] | null) => void;
    setFilteredJobList: (list: Job[] | null) => void;
    getJobList: (count: number) => Promise<Job[]>;
    getJobListwithBookmark: (count: number) => Promise<Job[]>;
}

const useJobStore = create<JobStore>((set, get) => ({
    jobList: [],
    filteredJobList: [],
    selectedJob: 0,
    feedback: '',
    setSelectedJob: (jobId) => set({ selectedJob: jobId }),
    setFilteredJobList: (filteredJobList) => set({ filteredJobList }),
    getSelectedJob: () => {
        const { jobList, selectedJob } = get();
        return jobList?.find((job) => job.id === selectedJob) ?? null;
    },
    getFeedback: async (jobId) => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.post(
                `https://be.goodjob.ai.kr/rec/feedback?jobId=${jobId}`,
                null,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    withCredentials: true,
                }
            );
            set({ feedback: res.data });

            return res.status;
        } catch (error) {
            console.error('피드백 에러: ', error);
        }
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
    getJobListwithBookmark: async (count) => {
        const { getJobList } = get();
        const getBookmark = useBookmarkStore.getState().getBookmark;
        const [topkRes, bookmarkRes] = await Promise.all([
            getJobList(count),
            getBookmark?.() || Promise.resolve([]),
        ]);

        const topkJob = topkRes;
        const bookmarkedJob = Array.isArray(bookmarkRes) ? bookmarkRes : []; // Ensure bookmarkRes is an array
        const bookmarkedIds = new Set<number>(bookmarkedJob.map((job: Job) => job.id));
        const bookmarkedJobs: Job[] = topkJob.map((job: Job) => ({
            ...job,
            isBookmarked: bookmarkedIds.has(job.id),
        }));

        return bookmarkedJobs;
    },
}));

export default useJobStore;
