import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './authStore';
import useUserStore from './userStore';
import { SERVER_IP } from '../../src/constants/env';

interface fileStore {
    file: File | null;
    hasFile: boolean;
    summary: string | null;
    setFile: (file: File | null) => void;
    setHasFile: (exists: boolean) => void;
    removeFile: (fileName: string) => Promise<number>;
    getSummary: (selectedCVId: number) => Promise<void>;
    uploadFile: (file: File | null, url: string, fileName: string) => Promise<void>;
    reUploadFile: (file: File | null, url: string) => Promise<void>;
}

const useFileStore = create<fileStore>((set) => ({
    file: null,
    summary: null,
    hasFile: false,
    setFile: (file: File | null) => set({ file }),
    setHasFile: (exists) => set({ hasFile: exists }),
    removeFile: async (fileName) => {
        const accessToken = useAuthStore.getState().accessToken;
        const res = await axios.delete(`${SERVER_IP}/cv/delete-cv?fileName=${fileName}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true,
        });
        return res.status;
    },
    getSummary: async (selectedCVId) => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.post(`${SERVER_IP}/cv/summary-cv?cvId=${selectedCVId}`, null, {
                headers: { Authorization: `Bearer ${accessToken}` },
                withCredentials: true,
            });

            set({ summary: res.data.summary });
        } catch (error) {
            console.error('CV 요약 가져오기 에러: ', error);
            throw error;
        }
    },
    uploadFile: async (file: File | null, url: string, fileName: string) => {
        if (!file) {
            console.log('파일이 비어있습니다');
            return;
        }
        try {
            console.time('⏱️ Upload to S3');
            const res = await axios.put(url, file, {
                // S3에 파일 업로드
                headers: { 'Content-Type': file.type },
            });
            console.timeEnd('⏱️ Upload to S3');
            if (res.status === 200) {
                const accessToken = useAuthStore.getState().accessToken;

                console.time('⏱️ confirm-upload');
                // confirm 후에 로딩해야함
                const confirm = await axios.post(
                    `${SERVER_IP}/s3/confirm-upload?fileName=${fileName}`,
                    null,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                        withCredentials: true,
                    }
                );
                console.timeEnd('⏱️ confirm-upload');
                console.log(confirm);
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    reUploadFile: async (file: File | null, url: string) => {
        if (!file) {
            console.log('파일이 비어있습니다');
            return;
        }
        try {
            console.time('⏱️ Upload to S3');
            const res = await axios.put(url, file, {
                // S3에 파일 업로드
                headers: { 'Content-Type': file.type },
            });
            console.timeEnd('⏱️ Upload to S3');
            if (res.status === 200) {
                const accessToken = useAuthStore.getState().accessToken;
                const userEmail = useUserStore.getState().email;
                const userId = useUserStore.getState().id;
                const fileName = userEmail.split('@')[0];

                console.time('⏱️ confirm-re-upload');
                // confirm 후에 로딩해야함
                const confirm = await axios.post(
                    `${SERVER_IP}/s3/confirm-re-upload?fileName=${fileName}_${userId}`,
                    null,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                        withCredentials: true,
                    }
                );
                console.timeEnd('⏱️ confirm-re-upload');
                console.log(confirm);
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
}));

export default useFileStore;
