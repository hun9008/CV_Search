import { GoogleLogin } from '@react-oauth/google';
import { GoogleOAuthProvider } from '@react-oauth/google';

function signIn() {
    const clientId =
        '358297823208-95g91po21fhrtk9u6olvu5ll1mgl3ivg.apps.googleusercontent.com';
    return (
        <GoogleOAuthProvider clientId={clientId}>
            <GoogleLogin
                onSuccess={(res) => {
                    console.log(res);
                }}
                onError={() => {
                    console.log('An error occurred');
                }}
            />
        </GoogleOAuthProvider>
    );
}

export default signIn;
