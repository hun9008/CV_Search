import style from './DashboardMetrics.module.scss';

interface metricsProps {
    title: string;
    data: number;
    weeklyChange: number;
}

function formatData(data: number): string {
    const decimalPart = data.toString().split('.')[1];
    if (data % 1 !== 0 && decimalPart && decimalPart.length > 1) {
        return data.toFixed(1);
    }
    return data.toString();
}

function DashboardMetrics({ title, data, weeklyChange }: metricsProps) {
    const isPositive = weeklyChange > 0;

    return (
        <div className={style.container}>
            <div className={style.header}>
                <p className={style.title}>{title}</p>
            </div>
            <h2 className={style.mainData}>{formatData(data)}</h2>
            <p className={`${style.compareData} ${isPositive ? style.positive : style.negative}`}>
                지난주 대비 {isPositive ? `+${formatData(weeklyChange)}` : formatData(weeklyChange)}
            </p>
        </div>
    );
}

export default DashboardMetrics;
