import style from './styles/SignIn.module.scss';
import KakaoSignIn from '@pages/index/components/auth/KakaoSignIn';
import GoogleSignIn from '@pages/index/components/auth/GoogleSignIn';
import LandingPage from '../../pages/landing/index';

function SignIn() {
    return (
        <div className={style.page}>
            <h1 className={style.page__title}>goodJob</h1>
            <p className={style.page__subtitle}>
                goodJob이 찾아주는 당신만의 커리어, 지금 시작하세요.
            </p>

            <br />
            <GoogleSignIn />
            <KakaoSignIn />
            <br />
            <p>또는</p>
            <button>회원가입</button>
        </div>
    );
}

export default SignIn;
