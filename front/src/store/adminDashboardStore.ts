import axios from 'axios';
import { create } from 'zustand';
import useAuthStore from './authStore';
import { persist } from 'zustand/middleware';
import { SERVER_IP } from '../../src/constants/env';

interface topKeyword {
    keyword: string;
    count: number;
}

interface adminDashboardStore {
    totalUserCount: number;
    weeklyUserChange: number;
    activeUserCount: number;
    activeUserChange: number;
    totalJobCount: number;
    weeklyJobChange: number;
    averageSatisfaction: number;
    weeklySatisfactionChange: number;
    topKeywords: topKeyword[];
    ctr: number;
    weeklyCtr: number[];
    getDashboardInfo?: () => Promise<void>;
}

const useAdminDashboardStore = create(
    persist<adminDashboardStore>(
        (set) => ({
            totalUserCount: 0,
            weeklyUserChange: 0,
            activeUserCount: 0,
            activeUserChange: 0,
            totalJobCount: 0,
            weeklyJobChange: 0,
            averageSatisfaction: 0,
            weeklySatisfactionChange: 0,
            topKeywords: [],
            ctr: 0,
            weeklyCtr: [],
            getDashboardInfo: async () => {
                try {
                    const accessToken = useAuthStore.getState().accessToken;
                    const res = await axios.get(`${SERVER_IP}/admin/dashboard`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        withCredentials: true,
                    });

                    const {
                        totalUserCount,
                        weeklyUserChange,
                        activeUserCount,
                        weeklyActiveUserChange,
                        ctr,
                        dailyCtrList,
                        totalJobCount,
                        weeklyJobChange,
                        averageSatisfaction,
                        weeklySatisfactionChange,
                        topKeywords,
                    } = res.data;

                    set({
                        totalUserCount: totalUserCount,
                        weeklyUserChange: weeklyUserChange,
                        activeUserCount: activeUserCount,
                        activeUserChange: weeklyActiveUserChange,
                        ctr: ctr,
                        weeklyCtr: dailyCtrList,
                        totalJobCount: totalJobCount,
                        weeklyJobChange: weeklyJobChange,
                        averageSatisfaction: averageSatisfaction,
                        weeklySatisfactionChange: weeklySatisfactionChange,
                        topKeywords: topKeywords,
                    });
                } catch (error) {
                    console.error('대시보드 데이터 불러오기 에러: ', error);
                    throw error;
                }
            },
        }),
        {
            name: 'admin-storage',
            partialize: (state) => ({
                totalUserCount: state.totalUserCount,
                weeklyUserChange: state.weeklyUserChange,
                activeUserCount: state.activeUserCount,
                activeUserChange: state.activeUserChange,
                ctr: state.ctr,
                weeklyCtr: state.weeklyCtr,
                totalJobCount: state.totalJobCount,
                weeklyJobChange: state.weeklyJobChange,
                averageSatisfaction: state.averageSatisfaction,
                weeklySatisfactionChange: state.weeklySatisfactionChange,
                topKeywords: state.topKeywords,
            }),
        }
    )
);

export default useAdminDashboardStore;
