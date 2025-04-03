import style from './styles/SignIn.module.scss';
import KakaoSignIn from '../../pages/index/components/auth/KakaoSignIn';
import GoogleSignIn from '../../pages/index/components/auth/GoogleSignIn';
import { useNavigate } from 'react-router-dom';

function SignIn() {
    const navigate = useNavigate();
    const navigateToSignUp = () => {
        navigate('/signUp');
    };
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
            <button onClick={navigateToSignUp}>회원가입</button>
        </div>
    );
}

export default SignIn;
