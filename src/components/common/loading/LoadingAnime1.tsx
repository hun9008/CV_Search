import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import style from './LoadingAnime1.module.scss';

function LoadingAnime1() {
    return (
        <div className={style.container}>
            <DotLottieReact src="/Animation1748155642035.lottie" loop autoplay />
            <h3 className={style.container__title}>추천 공고를 불러오고 있습니다...</h3>
        </div>
    );
}

export default LoadingAnime1;
