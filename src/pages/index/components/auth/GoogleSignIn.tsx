import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function SignIn() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const SPRING_IP = process.env.SPRING_IP;

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            console.log('Received JWT Token:', token);
            localStorage.setItem('jwt-token', token);
            navigate('/tempPage');
        } else {
            console.log('No token received');
            // navigate('/login');
        }
    }, [searchParams, navigate]);

    const handleGoogleLogin = () => {
        axios
            .get(`http://${{ SPRING_IP }}/auth/login`)
            .then((response) => {
                if (response.status === 200) {
                    console.log('moved');
                    window.location.href = `http://${{
                        SPRING_IP,
                    }}/auth/login?provider=google`;
                }
            })
            .catch((error) => console.log(error)); // 에러 페이지 만들기
    };

    return <button onClick={handleGoogleLogin}>Google로 로그인</button>;
}

export default SignIn;
