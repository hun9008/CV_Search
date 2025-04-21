import { create } from 'zustand';
import axios from 'axios';

interface s3Store {
    url: string;
    fileName: string;
    getPresignedURL: (fileName: string) => Promise<void>;
}

const useS3Store = create<s3Store>((set) => ({
    url: '',
    fileName: '',
    getPresignedURL: async (fileName) => {
        try {
            const res = await axios.get(
                `https://be.goodjob.ai.kr/s3/presigned-url?fileName=${fileName}`
            );
            const url = res.data;
            set({ url });
            return url;
        } catch (error) {
            console.log(error);
        }
    },
}));

export default useS3Store;
