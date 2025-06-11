import { create } from 'zustand';
import useAuthStore from './authStore';
import axios from 'axios';
import { SERVER_IP } from '../../src/constants/env';

interface PlanData {
    starter: number;      
    basic: number;        
    enterprise: number;   
}

interface AdminPlanStore {
    plan: PlanData;
    getPlan: () => Promise<void>;
}

const useAdminPlanStore = create<AdminPlanStore>((set) => ({
    plan: {
        starter: 0.00,
        basic: 0.00,
        enterprise: 0.00,
    },
    getPlan: async () => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.get(`${SERVER_IP}/admin/dashboard/plan`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                withCredentials: true,
            });
            set({ plan: res.data });
        } catch (error) {
            console.error('플랜 데이터 가져오기 오류: ', error);
            throw error;
        }
    },
}));

export default useAdminPlanStore;