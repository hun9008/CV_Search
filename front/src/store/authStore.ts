import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SERVER_IP } from '../../src/constants/env';

interface AuthStore {
    accessToken: string | null;
    isLoggedIn: boolean;
    setIsLoggedIn: (isLoggedIn: boolean) => void;
    setLogout: (accessToken: string | null) => Promise<void>;
    setTokens: (accessToken: string | null) => void;
    clearTokens: () => void;
    fetchAuthData: () => Promise<void>;
    withdraw: (accessToken: string | null) => Promise<void>;
}

const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            accessToken: null,
            isLoggedIn: false,
            setIsLoggedIn: (isLoggedIn: boolean) => set({ isLoggedIn }),
            setTokens: (accessToken) => set({ accessToken, isLoggedIn: !!accessToken }), // !! 사용으로 불리언 값으로 변경
            clearTokens: () => set({ accessToken: null, isLoggedIn: false }),
            // 수정 필요
            fetchAuthData: async () => {},
            setLogout: async (accessToken) => {
                const res = await axios.post(`${SERVER_IP}/auth/logout`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    withCredentials: true,
                });
                if (res.status === 200) {
                    set({ accessToken: null, isLoggedIn: false });
                    localStorage.removeItem('admin-job-storage');
                    localStorage.removeItem('admin-storage');
                    localStorage.removeItem('page-storage');
                    localStorage.removeItem('user-token');
                }
            },
            withdraw: async (accessToken) => {
                try {
                    const res = await axios.delete(`${SERVER_IP}/auth/withdraw`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        withCredentials: true,
                    });
                    console.log('탈퇴중');
                    if (res.status === 200) {
                        console.log('탈퇴완료');
                        localStorage.clear();
                    }
                } catch (error) {
                    console.log(error);
                }
            },
        }),
        {
            name: 'user-token',
            partialize: (state) => ({
                accessToken: state.accessToken,
            }),
            onRehydrateStorage: () => {
                return (state) => {
                    if (state && state.accessToken) {
                        state.isLoggedIn = true;
                    }
                };
            },
        }
    )
);

export default useAuthStore;
