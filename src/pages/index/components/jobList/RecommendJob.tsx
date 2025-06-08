import JobDetail from './JobDetail';
import JobList from './JobList';
import style from './styles/RecommendJob.module.scss';

function RecommendJob() {
    return (
        <div className={style.mainContent__jobSection}>
            <div className={style.mainContent__jobList}>
                <JobList />
            </div>

            <div className={style.mainContent__jobDetail}>
                <JobDetail isDialog={false} />
            </div>
        </div>
    );
}

export default RecommendJob;
