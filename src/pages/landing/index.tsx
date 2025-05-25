import style from './styles/index.module.scss';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/header/Header';
import CVUpload from '../../components/fileInput/CVUpload';

function Index() {
    const navigate = useNavigate();

    const moveToMainPage = () => {
        navigate('./main');
    };

    return (
        <div className={style.page}>
            <Header />
            <div className={style.page__main}>
                <div className={style.page__content}>
                    <div className={style.page__text}>
                        <br />
                        <h1 className={style.page__title}>
                            goodJob이 찾아주는
                            <br />
                            당신만의 커리어,
                            <br />
                            지금 시작하세요.
                        </h1>
                        <br />
                        <p className={style.page__subtitle}>Get matched with your perfect job</p>
                        {/* <button className={style.page__landingButton} onClick={toggleLogin}>
                            Get Started
                        </button> */}
                        <br />
                        <br />
                        <button className={style.page__landingButton} onClick={moveToMainPage}>
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
