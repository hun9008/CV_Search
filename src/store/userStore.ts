import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { SERVER_IP } from '../../src/constants/env';

interface UserStore {
    id: string;
    email: string;
    name: string;
    plan: string;
    isAdmin: boolean;
    good: number;
    setId: (id: string) => void;
    setEmail: (email: string) => void;
    setName: (name: string) => void;
    setIsAdmin: (isAdmin: boolean) => void;
    setGood: () => void;
    fetchUserData: (accessToken: string | null) => Promise<boolean>;
}

const useUserStore = create<UserStore>()(
    persist(
        (set) => ({
            id: '',
            email: '',
            name: '',
            plan: '',
            good: 0,
            isAdmin: false,
            setId: (id: string) => set({ id: id }),
            setEmail: (email: string) => set({ email: email }),
            setName: (name: string) => set({ name: name }),
            setIsAdmin: (isAdmin: boolean) => set({ isAdmin: isAdmin }),
            setGood: () => set((state) => ({ good: state.good + 1 })),
            fetchUserData: async (accessToken) => {
                try {
                    const res = await axios.get(`${SERVER_IP}/user/me`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        withCredentials: true,
                    });
                    const { id, email, name, role, plan } = res.data;
                    set({
                        id: id,
                        email: email,
                        name: name,
                        plan: plan,
                        isAdmin: role === 'ADMIN',
                    });
                    return role === 'ADMIN';
                } catch (error) {
                    console.error('유저 정보 불러오기 에러: ', error);
                    throw error;
                }
            },
        }),
        {
            name: 'user-storage',
            partialize: (state) => ({
                id: state.id,
                email: state.email,
                name: state.name,
                good: state.good,
            }),
        }
    )
);

export default useUserStore;
