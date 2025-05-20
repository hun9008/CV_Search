import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './authStore';
import useUserStore from './userStore';

interface fileStore {
    file: File | null;
    summary: string | null;
    setFile: (file: File | null) => void;
    removeFile: () => Promise<number>;
    getSummary: () => Promise<void>;
    uploadFile: (file: File | null, url: string) => Promise<void>;
}

const useFileStore = create<fileStore>((set) => ({
    file: null,
    summary: null,
    setFile: (file: File | null) => set({ file }),
    removeFile: async () => {
        const userId = useUserStore.getState().id;
        const accessToken = useAuthStore.getState().accessToken;
        const userEmail = useUserStore.getState().email;
        const fileName = userEmail.split('@')[0];
        const res = await axios.delete(
            `https://be.goodjob.ai.kr/cv/delete-cv?fileName=${fileName}_${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                withCredentials: true,
            }
        );
        return res.status;
    },
    getSummary: async () => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.get('https://be.goodjob.ai.kr/cv/summary-cv', {
                headers: { Authorization: `Bearer ${accessToken}` },
                withCredentials: true,
            });

            set({ summary: res.data.summary });
        } catch (error) {
            console.error('CV 요약 가져오기 에러: ', error);
            throw error;
        }
    },
    uploadFile: async (file: File | null, url: string) => {
        if (!file) {
            console.log('파일이 비어있습니다');
            return;
        }
        try {
            const res = await axios.put(url, file, {
                // S3에 파일 업로드
                headers: { 'Content-Type': file.type },
            });
            if (res.status === 200) {
                const accessToken = useAuthStore.getState().accessToken;
                const userEmail = useUserStore.getState().email;
                const userId = useUserStore.getState().id;
                const fileName = userEmail.split('@')[0];

                // confirm 후에 로딩해야함
                const confirm = await axios.post(
                    `https://be.goodjob.ai.kr/s3/confirm-upload?fileName=${fileName}_${userId}`,
                    null,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                        withCredentials: true,
                    }
                );
                console.log(confirm);
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
}));

export default useFileStore;
