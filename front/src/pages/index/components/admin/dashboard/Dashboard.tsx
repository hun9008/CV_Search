import { useEffect } from 'react';
import style from './Dashboard.module.scss';
import DashboardMetrics from './DashboardMetrics';
import useAdminDashboardStore from '../../../../../store/adminDashboardStore';
import useAdminServerInfoStore from '../../../../../store/adminServerInfoStore';
import PlanStatus from './PlanStatus';

function Dashboard() {
    const {
        getDashboardInfo,
        totalUserCount,
        weeklyUserChange,
        activeUserCount,
        activeUserChange,
        ctr,
        weeklyCtr,
        totalJobCount,
        weeklyJobChange,
        averageSatisfaction,
        weeklySatisfactionChange,
    } = useAdminDashboardStore();

    const { serverInfo, getServerInfo } = useAdminServerInfoStore();

    const topKeywords = useAdminDashboardStore((state) => state.topKeywords);

    const DateList = (index: number) => {
        const today = new Date();
        const calculatedIndex = index - 1;

        const date = new Date(today);
        date.setDate(today.getDate() - (6 - calculatedIndex));

        const month = date.getMonth() + 1;
        const day = date.getDate();

        return <div className={style.barLabel}>{`${month}월 ${day}일`}</div>;
    };

    const TopKeywordsContainer = () => {
        return (
            <div className={style.card}>
                <div className={style.cardHeader}>
                    <h3 className={style.cardTitle}>🔍 인기 검색어</h3>
                    <p className={style.cardSubtitle}>최근 7일간 검색 순위</p>
                </div>
                <div className={style.keywordList}>
                    {topKeywords.slice(0, 5).map((keyword, index) => (
                        <div key={index} className={style.keywordItem}>
                            <span className={style.keywordRank}>{index + 1}</span>
                            <span className={style.keywordText}>{keyword.keyword}</span>
                            <span className={style.keywordCount}>{keyword.count}회</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const CTRChart = () => {
        const maxValue = Math.max(...weeklyCtr.map((data) => data));

        return (
            <div className={style.card}>
                <div className={style.cardHeader}>
                    <h3 className={style.cardTitle}>📊 클릭률(CTR) 추이</h3>
                    <p className={style.cardSubtitle}>최근 7일간 추천 공고 클릭률</p>
                </div>
                <div className={style.chartContainer}>
                    <div className={style.barChart}>
                        {weeklyCtr.map((data, index) => (
                            <div key={index} className={style.barWrapper}>
                                <div className={style.barValue}>{data.toFixed(1)}%</div>
                                <div className={style.barColumn}>
                                    <div
                                        className={style.bar}
                                        style={{ height: `${(data / maxValue) * 100}%` }}
                                    />
                                </div>
                                {DateList(index)}
                            </div>
                        ))}
                    </div>
                    <div className={style.chartSummary}>
                        <span className={style.avgLabel}>평균 CTR:</span>
                        <span className={style.avgValue}>{ctr.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        );
    };

    const ServerStatus = () => {
        return (
            <div className={style.card}>
                <div className={style.cardHeader}>
                    <h3 className={style.cardTitle}>🖥️ 서버 운영 상태</h3>
                    <p className={style.cardSubtitle}>실시간 시스템 모니터링(10초 간격)</p>
                </div>
                <div className={style.serverList}>
                    {serverInfo.map((server, index) => (
                        <div key={index} className={style.serverItem}>
                            <div className={style.serverInfo}>
                                <span
                                    className={`${style.statusDot} ${
                                        server.uptime >= 0.8
                                            ? style.running
                                            : server.uptime >= 0.5
                                            ? style.warning
                                            : style.error
                                    }`}
                                />
                                <span className={style.serverName}>{server.name}</span>
                            </div>
                            <div className={style.serverMetrics}>
                                <span className={style.metric}>
                                    <span className={style.metricLabel}>가동률:</span>
                                    <span className={style.metricValue}>
                                        {(server.uptime * 100).toFixed(2)}%
                                    </span>
                                </span>
                                <span className={style.metric}>
                                    <span className={style.metricLabel}>응답:</span>
                                    <span className={style.metricValue}>
                                        {server.responseTime.toFixed(2)} ms
                                    </span>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    useEffect(() => {
        if (getDashboardInfo) {
            getDashboardInfo();
        }
    }, [getDashboardInfo]);

    useEffect(() => {
        getServerInfo();
        setInterval(() => {
            getServerInfo();
        }, 10000);
    }, []);

    return (
        <div className={style.container}>
            <div className={style.header}>
                <h2 className={style.header__title}>관리자 대시보드</h2>
                <p className={style.header__subtitle}>각종 현황을 확인하세요</p>
            </div>
            <div className={style.summary}>
                <DashboardMetrics
                    title="총 채용공고"
                    data={totalJobCount}
                    weeklyChange={weeklyJobChange}
                />
                <DashboardMetrics
                    title="총 사용자"
                    data={totalUserCount}
                    weeklyChange={weeklyUserChange}
                />
                <DashboardMetrics
                    title="활성 사용자"
                    data={activeUserCount}
                    weeklyChange={activeUserChange}
                />
                <DashboardMetrics
                    title="추천 만족도"
                    data={averageSatisfaction}
                    weeklyChange={weeklySatisfactionChange}
                />
            </div>

            <div className={style.contentGrid}>
                <div className={style.leftColumn}>
                    <TopKeywordsContainer />
                    <CTRChart />
                </div>
                <div className={style.rightColumn}>
                    <ServerStatus />
                    <PlanStatus />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
