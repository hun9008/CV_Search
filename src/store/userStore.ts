import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface UserStore {
    id: string | null;
    email: string | null;
    name: string | null;
    setId: (id: string) => void;
    setEmail: (email: string) => void;
    setName: (name: string) => void;
    fetchUserData: (accessToken: string) => Promise<void>;
}

const useUserStore = create<UserStore>()(
    persist(
        (set) => ({
            id: null,
            email: null,
            name: null,
            setId: (id: string) => set({ id }),
            setEmail: (email: string) => set({ email }),
            setName: (name: string) => set({ name }),
            fetchUserData: async (accessToken: string) => {
                try {
                    const res = await axios.get('https://be.goodjob.ai.kr/user/me', {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        withCredentials: true,
                    });
                    const { id, email, name } = res.data;
                    set({ id, email, name });
                } catch (error) {
                    console.log(error);
                }
            },
        }),
        {
            name: 'user-storage',
            partialize: (state) => ({
                id: state.id,
                email: state.email,
                name: state.name,
            }),
        }
    )
);

export default useUserStore;
