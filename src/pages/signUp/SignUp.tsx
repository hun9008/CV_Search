import { useNavigate } from 'react-router-dom';
import style from './styles/SignUp.module.scss';
import GoogleSignIn from '../index/components/auth/GoogleSignIn';
import KakaoSignIn from '../index/components/auth/KakaoSignIn';

function SignUp() {
    const navigate = useNavigate();

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

export default SignUp;
