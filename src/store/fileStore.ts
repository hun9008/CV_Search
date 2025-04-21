import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './authStore';

interface fileStore {
    file: File | null;
    setFile: (file: File | null) => void;
    uploadFile: (file: File | null, url: string) => Promise<void>;
}

const useFileStore = create<fileStore>((set) => ({
    file: null,
    setFile: (file: File | null) => set({ file }),
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
                const confirm = await axios.post(
                    `https://be.goodjob.ai.kr/s3/confirm-upload?fileName=${file.name}`,
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
        }
    },
}));

export default useFileStore;
