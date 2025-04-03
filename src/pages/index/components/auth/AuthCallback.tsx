import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';

function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        console.log('Received JWT Token:', accessToken, refreshToken);
        if (accessToken && refreshToken) {
            console.log('Received JWT Token:', accessToken, refreshToken);
            localStorage.setItem('jwt-token:access', accessToken);
            localStorage.setItem('jwt-token:refresh', refreshToken);
            navigate('/tempPage');
        } else {
            console.log('No token received');
            navigate('/'); // 다시 로그인 페이지로 보내기
        }
    }, [searchParams, navigate]);

    return <div>인증 중입니다</div>; // pending 될 경우를 대비해 페이지 만들기
}

export default AuthCallback;
