import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function KakaoSignIn() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const SPRING_IP = import.meta.env.VITE_SPRING_IP;

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        console.log('Received JWT Token:', accessToken, refreshToken);
    }, [searchParams, navigate]);

    const handleKakaoLogin = () => {
        window.location.href = `http://${SPRING_IP}/auth/login?provider=kakao`;
    };

    return <button onClick={handleKakaoLogin}>카카오 로그인</button>;
}

export default KakaoSignIn;
