import axios from 'axios';
import useAuthStore from '../store/authStore';
import { SERVER_IP } from '../../src/constants/env';

const axiosInstance = axios.create({
    baseURL: `${SERVER_IP}`,
    withCredentials: true, // 쿠키로 refreshToken 전달
});

axiosInstance.interceptors.request.use(
    (config) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const res = await axiosInstance.get('/auth/token/refresh');
                const { accessToken } = res.data;
                useAuthStore.getState().setTokens(accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return axiosInstance(originalRequest); // 재요청
            } catch (refreshError) {
                useAuthStore.getState().clearTokens();
                window.location.href = '/signIn'; // 새 로그인 유도
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
