'use client';

import styles from './styles/index.module.scss';
import SideBar from '../../components/common/sideBar/SideBar';
import MainHeader from '../../components/common/header/MainHeader';
import JobList from './components/jobList/JobList';
import MyCv from './components/myCv/MyCv';
import Manage from './components/manage/Manage';
import Bookmark from './components/bookmark/BookMark';
import { useState } from 'react';
import type Job from './types/job';
import usePageStore from '../../store/pageStore';

function Index() {
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const activeContent = usePageStore((state) => state.activeContent);
    const isCompactMenu = usePageStore((state) => state.isCompactMenu);

    const handleJobSelect = (job: Job) => {
        setSelectedJob(job);
    };

    return (
        <div className={styles.layout}>
            <SideBar />

            <div className={`${styles.mainContent} ${isCompactMenu ? styles.sidebarHidden : ''}`}>
                <MainHeader />

                <div className={styles.mainContent__container}>
                    {activeContent === '추천 공고' && (
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
                    )}
                    {activeContent === '지원 관리' && <Manage />}
                    {activeContent === '북마크' && <Bookmark />}
                    {activeContent === '나의 CV' && <MyCv />}
                </div>
            </div>
        </div>
    );
}

export default Index;
