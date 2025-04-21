import styles from './styles/index.module.scss';
import SideBar from '../../components/common/sideBar/SideBar';
import MainHeader from '../../components/common/header/MainHeader';
import JobList from './components/jobList/JobList';
import { useState } from 'react';
import Job from './types/job';

function Index() {
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [activeContent, setActiveContent] = useState<'jobList' | 'otherContent'>('jobList');

    const handleJobSelect = (job: Job) => {
        setSelectedJob(job);
    };

    return (
        <div className={styles.layout}>
            <SideBar />

            <div className={styles.mainContent}>
                <MainHeader />

                <div className={styles.mainContent__container}>
                    {activeContent === 'jobList' ? (
                        <div className={styles.mainContent__jobSection}>
                            <div className={styles.mainContent__jobList}>
                                <JobList onJobSelect={handleJobSelect} />
                            </div>

                            {selectedJob && (
                                <div className={styles.mainContent__jobDetail}>
                                    {/* <JobDetail job={selectedJob} /> */}
                                    공고 디테일
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>A</div>
                        // <div className={styles.mainContent__otherContent}>
                        //     {/* 컨텐츠 컴포넌트를 추가 */}
                        //     <div className={styles.mainContent__placeholder}>
                        //         <h2>contents</h2>
                        //     </div>
                        // </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Index;
