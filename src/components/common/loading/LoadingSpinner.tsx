import style from './LoadingSpinner.module.scss';

function LoadingSpinner() {
    return (
        <div className={style.loading}>
            <div className={style.loading__spinner}></div>
        </div>
    );
}

export default LoadingSpinner;
