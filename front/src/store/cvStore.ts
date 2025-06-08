import axios from 'axios';
import { create } from 'zustand';
import { SERVER_IP } from '../../src/constants/env';
import useAuthStore from './authStore';

// Add export to CvMe
export interface CvMe {
    // Added export
    id: number;
    userId: number;
    fileName: string;
    uploadedAt: Date;
}

interface cvStore {
    userCvList: CvMe[];
    getUserCvList: () => Promise<void>;
}

const useCvStore = create<cvStore>((set) => ({
    userCvList: [],
    getUserCvList: async () => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.get(`${SERVER_IP}/cv/me`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                withCredentials: true,
            });
            set({ userCvList: res.data });
        } catch (error) {
            console.error('유저 CV 정보 가져오기 오류: ', error);
            throw error;
        }
    },
}));

export default useCvStore;
