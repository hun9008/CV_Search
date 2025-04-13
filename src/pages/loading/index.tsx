import styles from './styles/index.module.scss';

function index() {
    return (
        <div className={styles.page}>
            <div className={styles.page__logo}>goodJob</div>

            <div className={styles.page__loadingIndicator}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="8"
                    viewBox="0 0 40 8"
                    fill="none"
                >
                    <circle cx="4" cy="4" r="4" fill="#797979" />
                    <circle cx="20" cy="4" r="4" fill="#797979" />
                    <circle cx="36" cy="4" r="4" fill="#797979" />
                </svg>
            </div>
            <p className={styles.page__loadingText}>
                당신에게 딱 맞는 일을 찾는 중...
            </p>
        </div>
    );
}

export default index;
