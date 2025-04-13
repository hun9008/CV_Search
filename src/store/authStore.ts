import { create } from 'zustand';

interface AuthStore {
    accessToken: string | null;
    setTokens: (accessToken: string | null) => void;
    clearTokens: () => void;
}
const useAuthStore = create<AuthStore>((set) => ({
    accessToken: null,
    refreshToken: null,
    setTokens: (accessToken) => set({ accessToken }),
    clearTokens: () => set({ accessToken: null }),
}));

export default useAuthStore;
