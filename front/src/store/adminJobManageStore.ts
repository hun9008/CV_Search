import axios from 'axios';
import { create } from 'zustand';
import useAuthStore from './authStore';
import { JobBrief } from '../types/jobBrief';
import { SERVER_IP } from '../../src/constants/env';

interface CreateJobDto {
    companyName: string;
    title: string;
    department: string | null;
    requireExperience: string | null;
    jobType: string | null;
    requirements: string | null;
    preferredQualifications: string | null;
    idealCandidate: string | null;
    jobDescription: string;
    jobRegions:
        | {
              id: number | null;
          }[]
        | null;
    applyStartDate: string | null;
    applyEndDate: string | null;
    isPublic: boolean | null;
    rawJobsText: string | null;
    url: string | null;
    favicon: string | null;
    regionText: string | null;
    jobVaildType: number | null;
}

interface adminJobManageStore {
    totalJob: JobBrief[];
    totalPage: number;
    currentPage: number;
    isFirstPage: boolean;
    isLastPage: boolean;
    addJob: (jobInfo: CreateJobDto | null) => Promise<void>;
    removeJob: (jobId: number, vaildType: number | null) => Promise<number>;
    getTotalJob: (page: number, size: number, sort: string) => Promise<void>;
    jobSearch: (page: number, size: number, query: string, sort: string) => Promise<void>;
    goToNextPage: () => void;
    goToPrevPage: () => void;
    setCurrentPage: (pageNum: number) => void;
}

const useAdminJobManageStore = create<adminJobManageStore>((set) => ({
    totalJob: [],
    totalPage: 0,
    currentPage: 0,
    isFirstPage: true,
    isLastPage: false,
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
    getTotalJob: async (page, size, sort) => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.get(
                `${SERVER_IP}/admin/dashboard/job-valid-type?page=${page}&size=${size}&sort=${sort}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    withCredentials: true,
                }
            );
            set({
                totalJob: res.data.content,
                totalPage: res.data.totalPages,
                currentPage: res.data.pageable.pageNumber,
                isFirstPage: res.data.first,
                isLastPage: res.data.last,
            });
        } catch (error) {
            console.error('관리자 공고 리스트 불러오기 에러: ', error);
        }
    },
    jobSearch: async (page, size, query, sort) => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.get(
                `${SERVER_IP}/admin/dashboard/job-valid-type?keyword=${query}&page=${page}&size=${size}&sort=${sort}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    withCredentials: true,
                }
            );
            set({
                totalJob: res.data.content,
                totalPage: res.data.totalPages,
                currentPage: res.data.pageable.pageNumber,
                isFirstPage: res.data.first,
                isLastPage: res.data.last,
            });
        } catch (error) {
            console.error('관리자 공고 검색: ', error);
            throw error;
        }
    },
    goToNextPage: () => set((state) => ({ currentPage: state.currentPage + 1 })),
    goToPrevPage: () => set((state) => ({ currentPage: state.currentPage - 1 })),
    setCurrentPage: (pageNum) => set({ currentPage: pageNum }),
}));

export default useAdminJobManageStore;
