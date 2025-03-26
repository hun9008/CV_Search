import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

function signUp() {
    return (
        <GoogleOAuthProvider clientId="clientID">
            <GoogleLogin
                onSuccess={(res) => {
                    console.log(res);
                }}
                onError={() => {
                    console.log('An error occurred');
                }}
            ></GoogleLogin>
        </GoogleOAuthProvider>
    );
}

export default signUp;
