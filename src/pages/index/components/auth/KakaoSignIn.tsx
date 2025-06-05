import style from './styles/KakaoSignIn.module.scss';
import { SERVER_IP } from '../../../../constants/env';
function KakaoSignIn() {
    const handleKakaoLogin = () => {
        const redirectUri = `${SERVER_IP}/auth/callback`;
        const state = btoa(redirectUri);
        window.location.href = `${SERVER_IP}/oauth2/authorization/kakao?state=${state}`;
    };

    return (
        <button onClick={handleKakaoLogin} className={style.kakaoButton}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="currentColor"
                className={style.kakaoButton__icon}>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.48 2 2 5.98 2 10.77c0 3.39 2.29 6.38 5.6 8.02-.23.84-.84 3.05-.95 3.52 0 0-.02.17.09.24.11.07.24 0 .24 0 .32-.05 3.69-2.56 4.14-2.9.28.02.56.03.84.03 5.52 0 10-3.98 10-8.77C22 5.98 17.52 2 12 2z"
                    fill="#3C1E1E"
                />
            </svg>
            <span className={style.kakaoButton__text}>카카오로 계속하기</span>
        </button>
    );
}

export default KakaoSignIn;
