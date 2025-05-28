import style from './styles/index.module.scss';
import { useNavigate } from 'react-router-dom';

function index() {
    const navigate = useNavigate(); // 나중에 상단바 컴포넌트로 뺄 것

    const navigateToSignIn = () => {
        navigate('/signIn');
    };
    const navigateToSignUp = () => {
        navigate('/signUp');
    };
    return (
        <div className={style.page}>
            <nav className={style.navbar}>
                <div className={style.logo}>goodJob</div>
                <div className={style.nav_links}>
                    <button
                        className={style.signup_btn}
                        onClick={navigateToSignUp}
                    >
                        회원가입
                    </button>
                    <button
                        className={style.login_btn}
                        onClick={navigateToSignIn}
                    >
                        로그인
                    </button>
                </div>
            </nav>

            <div className={style.container}>
                <div className={style.text_section}>
                    <h1>
                        goodJob이 찾아주는
                        <br />
                        당신만의 커리어, 지금 시작하세요.
                    </h1>
                    <p>Get matched with your perfect job</p>
                    <button className={style.get_started_btn}>
                        Get Started
                    </button>
                </div>
                <div className={style.upload_box}>
                    <img src="@assets/icons/upload.png" />
                    <p>파일을 선택하세요</p>
                </div>
            </div>

            <footer>
                <p>
                    이력서를 업로드하면 맞춤 공고와 피드백을 제공합니다.
                    <br />
                    goodJob에 파일을 업로드함으로써, 당사 이용약관에 동의하고
                    개인정보 보호 정책을 읽은 것으로 간주합니다.
                </p>
            </footer>
        </div>
    );
}

export default index;
