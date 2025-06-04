import { create } from 'zustand';
import axios from 'axios';
import { SERVER_IP } from '../../src/constants/env';
import useAuthStore from './authStore';

interface s3Store {
    url: string;
    getUploadPresignedURL: (fileName: string) => Promise<void>;
    getDownloadPresignedURL: (fileName: string) => Promise<void>;
    reNameCv: (oldFileName: string, newFileName: string) => Promise<string>;
}

const useS3Store = create<s3Store>((set) => ({
    url: '',
    getUploadPresignedURL: async (fileName) => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.get(
                `${SERVER_IP}/s3/presigned-url/upload?fileName=${fileName}`,
                { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
            );
            const url = res.data;
            set({ url });
            return url;
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 409) {
                    // 409 에러 처리
                    throw new Error('409 Conflict: 이미 존재하는 별명입니다.');
                }
                throw new Error(`Axios error: ${error.message}`);
            } else {
                throw error;
            }
        }
    },
    getDownloadPresignedURL: async (fileName) => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.get(
                `${SERVER_IP}/s3/presigned-url/download?fileName=${fileName}`,
                { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
            );
            const url = res.data;
            set({ url });
            return url;
        } catch (error) {
            console.log(`Presigned URL 에러: ${error}`);
            throw error;
        }
    },
    reNameCv: async (oldFileName, newFileName) => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            const res = await axios.post(
                `${SERVER_IP}/s3/rename-cv?oldFileName=${oldFileName}&newFileName=${newFileName}`,
                null,
                { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
            );
            return res.data;
        } catch (error) {
            console.error('CV 수정 PresignedUrl 가져오기 오류: ', error);
            throw error;
        }
    },
}));

export default useS3Store;
