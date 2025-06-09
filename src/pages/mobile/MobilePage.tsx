import { AlertTriangle, RefreshCw } from 'lucide-react';
import style from './MobilePage.module.scss';
import { useNavigate } from 'react-router-dom';

function MobilePage() {
    const navigate = useNavigate();
    return (
        <div className={style.container}>
            <div className={style.content}>
                <div className={style.iconContainer}>
                    <AlertTriangle size={70} className={style.icon} />
                </div>

                <h2 className={style.title}>이 페이지는</h2>
                <h2 className={style.title}>PC에서만 이용할 수 있어요</h2>

                <div className={style.actions}>
                    <button
                        className={style.refreshButton}
                        onClick={() => {
                            navigate('/');
                        }}>
                        <RefreshCw size={16} />
                        페이지 새로고침
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MobilePage;
