import { useEffect, useRef } from 'react';
import axios from 'axios';
import { SERVER_IP } from '../constants/env'; // 실제 서버 주소 import 경로로 수정
import useAuthStore from '../store/authStore';

const sentSet = new Set<number>();

export function useImpression(jobId: number) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (sentSet.has(jobId)) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // 한 번만 전송
                    axios
                        .post(`${SERVER_IP}/log/event?jobId=${jobId}&event=impression`, null, {
                            headers: {
                                Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
                                'Content-Type': 'application/json',
                            },
                            withCredentials: true,
                        })
                        .catch((err) => {
                            console.error('impression 전송 실패:', err);
                        });

                    sentSet.add(jobId);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [jobId]);

    return ref;
}
