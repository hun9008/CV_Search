import { create } from 'zustand';
import type feedback from '../types/feedback';
import axios from 'axios';
import useAuthStore from './authStore';
import { SERVER_IP } from '../../src/constants/env';

interface useUserFeedbackStore {
    feedbackList: feedback[];
    getFeedbackList: () => Promise<void>;
    getAverageFeedbackScore: () => Promise<number>;
    removeFeedback: (id: number) => Promise<number | undefined>;
}

const useUserFeedbackStore = create<useUserFeedbackStore>((set) => ({
    feedbackList: [],
    getFeedbackList: async () => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.get(`${SERVER_IP}/admin/feedback`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                withCredentials: true,
            });
            set({ feedbackList: res.data });
        } catch (error) {
            console.error('유저 피드백 가져오기 오류: ', error);
            throw error;
        }
    },
    getAverageFeedbackScore: async () => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.get(`${SERVER_IP}/admin/feedback/average`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                withCredentials: true,
            });
            return res.data;
        } catch (error) {
            console.error('유저 피드백 평균 점수 가져오기 오류: ', error);
            throw error;
        }
        return 0;
    },
    removeFeedback: async (id) => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.delete(`${SERVER_IP}/admin/feedback/${id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                withCredentials: true,
            });
            return res.status;
        } catch (error) {
            console.error('유저 피드백 삭제 도중 에러: ', error);
            throw error;
        }
    },
}));

export default useUserFeedbackStore;
