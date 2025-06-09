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
    userCvError: string | null;
    getUserCvList: () => Promise<void>;
}

const useCvStore = create<cvStore>((set) => ({
    userCvList: [],
    userCvError: null,
    getUserCvList: async () => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.get(`${SERVER_IP}/cv/me`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                withCredentials: true,
            });
            set({
                userCvList: res.data,
                userCvError: null,
            });
        } catch (error) {
            set({ userCvError: '유저 CV 정보 가져오기 오류' });
            console.error('유저 CV 정보 가져오기 오류: ', error);
            throw error;
        }
    },
}));

export default useCvStore;
