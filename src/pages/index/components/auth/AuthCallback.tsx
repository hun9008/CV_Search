import axios from 'axios';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../../store/authStore';

function AuthCallback() {
    const navigate = useNavigate();
    const { setTokens } = useAuthStore();

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

                setTokens(accessToken);
                console.log(accessToken);

                if (firstLogin) {
                    navigate('/signUp/detail');
                } else {
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
