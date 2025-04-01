import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';

function AuthCallback() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        // const token = searchParams.get('token');
        // if (token) {
        //     console.log('Authorization Code:', code);

        //     navigate('/tempPage');
        // } else {
        //     console.log('No code received');
        // }
        if (code) {
            console.log('Authorization Code:', code);

            navigate('/tempPage');
        } else {
            console.log('No code received');
        }
    }, [location, navigate]); // token 추가

    return <div>인증 중입니다</div>;
}

export default AuthCallback;
