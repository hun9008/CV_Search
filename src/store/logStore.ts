import axios from 'axios';
import { create } from 'zustand';
import { SERVER_IP } from '../constants/env';
import useAuthStore from './authStore';

interface logStore {
    sendClickEvent: (jobId: number) => void;
}

const useLogStore = create<logStore>(() => ({
    sendClickEvent: (jobId) => {
        axios
            .post(`${SERVER_IP}/log/event?jobId=${jobId}&event=click`, null, {
                headers: {
                    Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
                    'Content-Type': 'application/json',
                },
                withCredentials: true,
            })
            .catch((err) => {
                console.error('click 전송 실패:', err);
            });
    },
}));

export default useLogStore;
