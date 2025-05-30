import JobDetail from './JobDetail';
import JobList from './JobList';
import style from './styles/RecommendJob.module.scss';

function RecommendJob() {
    return (
        <div className={style.mainContent__jobSection}>
            <div className={style.mainContent__jobList}>
                <JobList bookmarked={false} />
            </div>

            <div className={style.mainContent__jobDetail}>
                <JobDetail />
            </div>
        </div>
    );
}

export default RecommendJob;
