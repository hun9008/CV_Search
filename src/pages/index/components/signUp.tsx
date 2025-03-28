import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

function SignUp() {
    const clientId =
        '358297823208-95g91po21fhrtk9u6olvu5ll1mgl3ivg.apps.googleusercontent.com'; // 임시
    const navigate = useNavigate();

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <GoogleLogin
                onSuccess={(res) => {
                    console.log(res);
                    navigate('/tempPage');
                }}
                onError={() => {
                    console.log('로그인 에러');
                }}
            />
        </GoogleOAuthProvider>
    );
}

export default SignUp;
