import style from './styles/SignIn.module.scss';
import KakaoSignIn from '../../pages/index/components/auth/KakaoSignIn';
import GoogleSignIn from '../../pages/index/components/auth/GoogleSignIn';
import { useNavigate } from 'react-router-dom';

function SignIn() {
    const navigate = useNavigate();
    const navigateToLandingpage = () => {
        navigate('/');
    };
    return (
        <div className={style.pageWrapper}>
            <div className={style.ratioContainer}>
                <div className={style.login}>
                    <div className={style.login__card}>
                        <h1 className={style.login__title} onClick={navigateToLandingpage}>
                            goodJob
                        </h1>

                        <p className={style.login__subtitle}>
                            goodJob이 찾아주는 당신만의 커리어, 지금 시작하세요.{' '}
                            {/* 모바일 최적화 필요.. 문장 두 개로 분리 */}
                        </p>
                        <div className={style.login__buttons}>
                            <GoogleSignIn />
                            <KakaoSignIn />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignIn;
