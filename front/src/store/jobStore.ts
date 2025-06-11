import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import useAuthStore from './authStore';
import useBookmarkStore from './bookmarkStore';
import Job from '../types/job';
import { SERVER_IP } from '../../src/constants/env';
import { JobContent } from '../types/searchResult';

interface CvMe {
    id: number;
    userId: number;
    fileName: string;
    uploadedAt: Date;
}
interface JobStore {
    jobList: Job[];
    similarJobList: Job[];
    selectedCVId: number | null;
    filteredJobList: Job[] | null;
    selectedJob: Job | null;
    selectedJobDetail: Job | JobContent | null;
    feedback: string;
    jobListRefreshTrigger: number;
    setSelectedJob: (job: Job) => void;
    setSelectedCvId: (cvId: number) => void;
    setSelectedJobDetail: (job: Job | JobContent) => void;
    getSelectedJob: () => Job | null;
    getSelectedJobDetail: () => Job | JobContent | null;
    getFeedback: (jobId: number, cvId: number) => Promise<number>;
    setJobList: (list: Job[]) => void;
    setFilteredJobList: (list: Job[] | null) => void;
    getJobList: (count: number, cvId: number) => Promise<Job[]>;
    getSimilarJobList: (count: number, cvId: number) => Promise<Job[]>;
    getJobListwithBookmark: (count: number, cvId: number) => Promise<Job[]>;
    getSelectedCvId: () => Promise<number>;
}

const useJobStore = create<JobStore>()(
    persist(
        (set, get) => ({
            jobList: [],
            similarJobList: [],
            filteredJobList: [],
            selectedJob: null,
            selectedJobDetail: null,
            feedback: '',
            selectedCVId: null,
            jobListRefreshTrigger: Date.now(),
            setSelectedJob: (job) => set({ selectedJob: job }),
            setSelectedJobDetail: (job) => set({ selectedJobDetail: job }),
            setFilteredJobList: (filteredJobList) => set({ filteredJobList }),
            setSelectedCvId: (cvid) => set({ selectedCVId: cvid }),
            getSelectedJob: () => {
                const { selectedJob } = get();
                return selectedJob;
            },
            getSelectedJobDetail: () => {
                const { selectedJobDetail } = get();
                return selectedJobDetail;
            },

            getFeedback: async (jobId, cvId) => {
                try {
                    const accessToken = useAuthStore.getState().accessToken;
                    const res = await axios.post(
                        `${SERVER_IP}/rec/feedback?jobId=${jobId}&cvId=${cvId}`,
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
                    throw error;
                }
            },

            setJobList: (jobList) => set({ jobList }),

            getJobList: async (count, cvId) => {
                try {
                    const accessToken = useAuthStore.getState().accessToken;

                    const res = await axios.post(
                        `${SERVER_IP}/rec/topk-list?topk=${count}&cvId=${cvId}`,
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
                    console.error('잡 리스트 에러: ', error);
                    throw error;
                }
            },
            getSimilarJobList: async (count, cvId) => {
                try {
                    const accessToken = useAuthStore.getState().accessToken;

                    const res = await axios.post(
                        `${SERVER_IP}/rec/similar-jobs?jobId=${cvId}&topk=${count}`,
                        null,
                        {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                            },
                            withCredentials: true,
                        }
                    );
                    const jobList: Job[] = res.data || [];
                    set({ similarJobList: jobList });
                    return jobList;
                } catch (error) {
                    console.error('잡 리스트 에러: ', error);
                    throw error;
                }
            },

            getJobListwithBookmark: async (count, cvId) => {
                try {
                    const { getJobList } = get();
                    const getBookmark = useBookmarkStore.getState().getBookmark;

                    const [topkRes, bookmarkRes] = await Promise.all([
                        getJobList(count, cvId),
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
            getSelectedCvId: async () => {
                try {
                    const accessToken = useAuthStore.getState().accessToken;
                    const res = await axios.get(`${SERVER_IP}/cv/me`, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                        withCredentials: true,
                    });
                    // uploadedAt이 가장 최근인 CV 선택
                    const latestCV = res.data.reduce((latest: CvMe, current: CvMe) => {
                        return new Date(current.uploadedAt) > new Date(latest.uploadedAt)
                            ? current
                            : latest;
                    }, res.data[0]);
                    set({ selectedCVId: latestCV.id });
                    return latestCV.id;
                } catch (error) {
                    console.error('유저 CV 정보 가져오기 오류: ', error);
                    throw error;
                }
            },
        }),
        {
            name: 'cv-storage',
            partialize: (state) => ({
                selectedCVId: state.selectedCVId,
            }),
        }
    )
);

export default useJobStore;
