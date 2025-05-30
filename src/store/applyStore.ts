import axios from 'axios';
import application from '../types/application';
import { create } from 'zustand';
import useAuthStore from './authStore';
import { SERVER_IP } from '../../src/constants/env';

interface applyStore {
    applications: application[] | null;
    setApplications: (jobId: number) => Promise<number>;
    getApplications: () => Promise<void>;
    editApplications: (jobId: number, status: string, note: string) => Promise<number>;
    deleteApplications: (jobId: number) => Promise<number>;
}

const useApplyStore = create<applyStore>((set) => ({
    applications: null,
    setApplications: async (jobId) => {
        const accessToken = useAuthStore.getState().accessToken;
        const res = await axios.post(`${SERVER_IP}/applications/apply?jobId=${jobId}`, null, {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
        });
        return res.status;
    },
    getApplications: async () => {
        const accessToken = useAuthStore.getState().accessToken;
        const res = await axios.get(`${SERVER_IP}/applications`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
        });
        set({ applications: res.data });
    },
    editApplications: async (jobId, status, note) => {
        const accessToken = useAuthStore.getState().accessToken;
        const res = await axios.put(
            `${SERVER_IP}/applications?jobId=${jobId}`,
            {
                applyStatus: status,
                note: note,
            },
            { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
        );
        return res.status;
    },
    deleteApplications: async (jobId) => {
        const accessToken = useAuthStore.getState().accessToken;
        const res = await axios.delete(`${SERVER_IP}/applications?jobId=${jobId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
        });
        return res.status;
    },
}));

export default useApplyStore;
