import { GoogleLogin } from '@react-oauth/google';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

function SignIn() {
    const navigate = useNavigate();
    const clientId =
        '358297823208-95g91po21fhrtk9u6olvu5ll1mgl3ivg.apps.googleusercontent.com'; // 임시
    return (
        <GoogleOAuthProvider clientId={clientId}>
            <GoogleLogin
                onSuccess={(res) => {
                    console.log(res);
                    navigate('/tempPage');
                }}
                onError={() => {
                    console.log('error');
                }}
            />
        </GoogleOAuthProvider>
    );
}
export default SignIn;
