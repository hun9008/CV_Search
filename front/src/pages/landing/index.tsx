import style from './styles/index.module.scss';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/header/Header';
import CVUpload from '../../components/common/fileInput/CVUpload';
import useAuthStore from '../../store/authStore';
import useUserStore from '../../store/userStore';
import { useEffect } from 'react';

function Index() {
    const { fetchUserData } = useUserStore();
    const navigate = useNavigate();

    useEffect(() => {
        const isMobile = window.matchMedia('only screen and (max-width: 768px)').matches;

        // 예외 페이지를 정의하거나 조건 설정
        const isException = location.pathname === '/mobile';

        if (isMobile && !isException) {
            navigate('/mobile');
        }
    }, [location.pathname]);

    const handleMoveToMainPage = async () => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            if (await fetchUserData(accessToken)) {
                navigate('/main/admin/dashboard');
            } else {
                navigate('/main/recommend');
            }
        } catch (error) {
            console.log('회원 검증 중 에러 발생: ', error);
            navigate('./signIn');
            return;
        }
    };

    return (
        <div className={style.page}>
            <Header />
            <div className={style.page__main}>
                <div className={style.page__content}>
                    <div className={style.page__text}>
                        <br />
                        <h1 className={style.page__title}>
                            goodJob이 찾아주는 당신만의 커리어,
                            <br />
                            지금 시작하세요.
                        </h1>
                        <br />
                        <p className={style.page__subtitle}>Get matched with your perfect job</p>
                        <br />
                        <br />
                        <button
                            className={style.page__landingButton}
                            onClick={handleMoveToMainPage}>
                            Get Started
                        </button>
                    </div>
                    <CVUpload />
                </div>
            </div>
        </div>
    );
}

export default Index;
