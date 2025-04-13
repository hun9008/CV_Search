import { create } from 'zustand';
import axios from 'axios';

const fileName = 'yoyoyo';

interface s3Store {
    url: string;
    fileName: string;
    getPresignedURL: () => Promise<void>;
}

const useS3Store = create<s3Store>((set, get) => ({
    url: '',
    fileName: '',
    getPresignedURL: async () => {
        const { fileName } = get(); // 파일 이름 받아오는 코드 재작성 필요
        try {
            const res = await axios.get(
                `https://be.goodjob.ai.kr/s3/presigned-url?fileName=${fileName}`
            );
            set({ url: res.data });
        } catch (error) {
            console.log(error);
        }
    },
}));

export default useS3Store;
