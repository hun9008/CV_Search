function KakaoSignIn() {
    const handleKakaoLogin = () => {
        const REDIRECT_URI = 'http://localhost:5173/auth/callback';
        const REST_API_KEY = `4a013aec886221e5c3c457d8cd170162`; // 보안 처리할 것
        const authUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}`;
        window.location.href = authUrl;
    };

    return <button onClick={handleKakaoLogin}>카카오 로그인</button>;
}

export default KakaoSignIn;
