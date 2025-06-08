import style from './DashboardMetrics.module.scss';

interface metricsProps {
    title: string;
    data: number;
    weeklyChange: number;
}
function DashboardMetrics({ title, data, weeklyChange }: metricsProps) {
    const isPositive = weeklyChange > 0;
    return (
        <div className={style.container}>
            <div className={style.header}>
                <p className={style.title}>{title}</p>
            </div>
            <h2 className={style.mainData}>{data}</h2>
            <p className={`${style.compareData} ${isPositive ? style.positive : style.negative}`}>
                지난주 대비 {weeklyChange > 0 ? `+${weeklyChange}` : weeklyChange}
            </p>
        </div>
    );
}

export default DashboardMetrics;
