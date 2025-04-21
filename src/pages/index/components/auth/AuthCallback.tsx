import axios from 'axios';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../../store/authStore';
import useUserStore from '../../../../store/userStore';

function AuthCallback() {
    const navigate = useNavigate();
    const { setTokens, setIsLoggedIn } = useAuthStore();
    const { fetchUserData } = useUserStore();

    useEffect(() => {
        axios
            .get('https://be.goodjob.ai.kr/auth/callback-endpoint', {
                withCredentials: true,
            })
            .then((res) => {
                const { accessToken, firstLogin } = res.data;

                if (!accessToken) {
                    console.error('Access token이 없습니다');
                    navigate('/signIn');
                    return;
                }

                setTokens(accessToken); // 토큰 저장
                setIsLoggedIn(true); // 로그인 처리
                fetchUserData(accessToken); // 유저 데이터 불러오기

                if (firstLogin) {
                    // +이력서를 올리지 않았다면
                    navigate('/signUp/detail', { replace: true });
                } else {
                    // navigate('/main', { replace: true });
                    navigate('/main');
                }
            })
            .catch((err) => {
                console.error('콜백 처리 중 오류', err);
                navigate('/signIn');
            });
    }, [navigate, setTokens]);

    return <div>로그인 처리 중입니다...</div>; // pending UI 만들기
}

export default AuthCallback;
