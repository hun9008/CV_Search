import { useEffect } from 'react';
import useAdminPlanStore from '../../../../../store/adminPlanStore';
import style from './Dashboard.module.scss';
import styles from './PlanStatus.module.scss';

function PlanStatus() {
    const { plan, getPlan } = useAdminPlanStore();

    useEffect(() => {
        getPlan();
    }, []);

    const total = plan.starter + plan.basic + plan.enterprise;

    let starterPercent = 0, basicPercent = 0, enterprisePercent = 0;

    if (total > 0) {
        starterPercent = (plan.starter / total) * 100;
        basicPercent = (plan.basic / total) * 100;
        enterprisePercent = (plan.enterprise / total) * 100;
    }

    const gradient = `conic-gradient(
        #4e79a7 0% ${starterPercent}%,
        #f28e2c ${starterPercent}% ${starterPercent + basicPercent}%,
        #e15759 ${starterPercent + basicPercent}% 100%
    )`;

    return (
        <div className={style.card}>
            <div className={style.cardHeader}>
                <h3 className={style.cardTitle}>💼 요금제 이용 현황</h3>
                <p className={style.cardSubtitle}>Starter / Basic / Enterprise 비율</p>
            </div>
            <div className={styles.donutWrapper}>
                <div className={styles.donut} style={{ background: gradient }}>
                    <div className={styles.centerText}>Plan</div>
                </div>
                <div className={styles.legend}>
                    <div><span className={`${styles.box} ${styles.starter}`}></span> Starter: {starterPercent.toFixed(1)}%</div>
                    <div><span className={`${styles.box} ${styles.basic}`}></span> Basic: {basicPercent.toFixed(1)}%</div>
                    <div><span className={`${styles.box} ${styles.enterprise}`}></span> Enterprise: {enterprisePercent.toFixed(1)}%</div>
                </div>
            </div>
        </div>
    );
}

export default PlanStatus;