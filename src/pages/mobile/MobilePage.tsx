import { AlertTriangle, RefreshCw } from 'lucide-react';
import style from './MobilePage.module.scss';

function MobilePage() {
    return (
        <div className={style.container}>
            <div className={style.content}>
                <div className={style.iconContainer}>
                    <AlertTriangle size={70} className={style.icon} />
                </div>

                <h2 className={style.title}>이 페이지는</h2>
                <h2 className={style.title}>PC에서만 이용할 수 있어요</h2>

                <div className={style.actions}>
                    <button className={style.refreshButton} onClick={() => {}}>
                        <RefreshCw size={16} />
                        페이지 새로고침
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MobilePage;
