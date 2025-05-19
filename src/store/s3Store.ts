import { create } from 'zustand';
import axios from 'axios';
import useUserStore from './userStore';

interface s3Store {
    url: string;
    getUploadPresignedURL: () => Promise<void>;
    getDownloadPresignedURL: () => Promise<void>;
}

const useS3Store = create<s3Store>((set) => ({
    url: '',
    getUploadPresignedURL: async () => {
        try {
            const userId = useUserStore.getState().id;
            const userEmail = useUserStore.getState().email;
            const fileName = userEmail.split('@')[0];
            console.log(fileName);
            console.log(userId);
            const res = await axios.get(
                `https://be.goodjob.ai.kr/s3/presigned-url/upload?fileName=${fileName}_${userId}`
            );
            const url = res.data;
            set({ url });
            return url;
        } catch (error) {
            console.log(`Presigned URL 에러: ${error}`);
        }
    },
    getDownloadPresignedURL: async () => {
        try {
            const userId = useUserStore.getState().id;
            const userEmail = useUserStore.getState().email;
            const fileName = userEmail.split('@')[0];
            console.log(fileName);
            const res = await axios.get(
                `https://be.goodjob.ai.kr/s3/presigned-url/download?fileName=${fileName}_${userId}`
            );
            const url = res.data;
            set({ url });
            return url;
        } catch (error) {
            console.log(`Presigned URL 에러: ${error}`);
        }
    },
}));

export default useS3Store;
