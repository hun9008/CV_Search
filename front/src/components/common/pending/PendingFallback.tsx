// "use client"

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import style from './ErrorFallback.module.scss';

interface ErrorFallbackProps {
    error?: Error;
    resetErrorBoundary?: () => void;
    message?: string;
    showDetails?: boolean;
}

function ErrorFallback({
    error,
    resetErrorBoundary,
    message = '컴포넌트를 불러오는 중 오류가 발생했습니다',
    showDetails = false,
}: ErrorFallbackProps) {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(15);
    const [isCountingDown, setIsCountingDown] = useState(false);

    // 자동 새로고침 카운트다운
    useEffect(() => {
        if (isCountingDown && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (isCountingDown && countdown === 0) {
            handleRefresh();
        }
    }, [countdown, isCountingDown]);

    const handleRefresh = () => {
        if (resetErrorBoundary) {
            resetErrorBoundary();
        } else {
            window.location.reload();
        }
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const stopCountdown = () => {
        setIsCountingDown(false);
        setCountdown(15);
    };

    return (
        <div className={style.container}>
            <div className={style.content}>
                <div className={style.iconContainer}>
                    <AlertTriangle size={48} className={style.icon} />
                </div>

                <h2 className={style.title}>문제가 발생했습니다</h2>
                <p className={style.message}>{message}</p>

                {showDetails && error && (
                    <div className={style.details}>
                        <h3 className={style.detailsTitle}>오류 세부 정보:</h3>
                        <div className={style.errorBox}>
                            <p className={style.errorName}>
                                {error.name}: {error.message}
                            </p>
                            <pre className={style.errorStack}>{error.stack}</pre>
                        </div>
                    </div>
                )}

                <div className={style.actions}>
                    <button
                        className={style.refreshButton}
                        onClick={handleRefresh}
                        onMouseEnter={stopCountdown}>
                        <RefreshCw size={16} />
                        페이지 새로고침
                    </button>

                    <button className={style.homeButton} onClick={handleGoHome}>
                        <Home size={16} />
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ErrorFallback;
