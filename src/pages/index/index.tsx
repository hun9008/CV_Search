import styles from './styles/index.module.scss';
import SideBar from '../../components/common/sideBar/SideBar';
import MainHeader from '../../components/common/header/MainHeader';
import JobList from './components/jobList/JobList';
import MyCv from './components/myCv/MyCv';
import Manage from './components/manage/Manage';
import Bookmark from './components/bookmark/BookMark';
import { useState } from 'react';
import type Job from './types/job';
import JobDetail from './components/jobList/JobDetail';
import usePageStore from '../../store/pageStore';
import useJobStore from '../../store/jobStore';

function Index() {
    const activeContent = usePageStore((state) => state.activeContent);
    const isCompactMenu = usePageStore((state) => state.isCompactMenu);

    return (
        <div className={styles.layout}>
            <SideBar />

            <div className={`${styles.mainContent} ${isCompactMenu ? styles.hidden : ''}`}>
                <MainHeader />

                <div className={styles.mainContent__container}>
                    {activeContent === '추천 공고' && (
                        <div className={styles.mainContent__jobSection}>
                            <div className={styles.mainContent__jobList}>
                                <JobList />
                            </div>

                            <div className={styles.mainContent__jobDetail}>
                                <JobDetail />
                            </div>
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
