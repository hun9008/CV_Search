import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// import axios from 'axios';

function SignIn() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const SPRING_IP = process.env.SPRING_IP;

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        if (accessToken && refreshToken) {
            console.log('Received JWT Token:', accessToken, refreshToken);
            localStorage.setItem('jwt-token:access', accessToken);
            localStorage.setItem('jwt-token:refresh', refreshToken);
            navigate('/tempPage');
        } else {
            console.log('No token received');
            // navigate('/login');
        }
    }, [searchParams, navigate]);

    const handleGoogleLogin = () => {
        window.location.href = `http://${SPRING_IP}/auth/login?provider=google`;
    };

    return <button onClick={handleGoogleLogin}>Google로 로그인</button>;
}

export default SignIn;
