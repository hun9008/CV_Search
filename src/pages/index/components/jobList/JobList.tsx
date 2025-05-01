import { useState, useEffect, useRef, useCallback } from 'react';
import JobCard from './JobCard';
import styles from './styles/JobList.module.scss';
import type Job from '../../types/job';

import useJobStore from '../../../../store/jobStore';

interface JobListProps {
    onJobSelect: (job: Job) => void;
}

function JobList({ onJobSelect }: JobListProps) {
    const [activeFilter, setActiveFilter] = useState('검색'); // 검색은 다른 필터와 다르게 구현
    const filters = ['검색', '회사', '경력', '근무유형'];
    const [bookmarkedJobs, setBookmarkedJobs] = useState<number[]>([]); // 북마크 처리
    const [isLoading, setIsLoading] = useState(false); // 공고 리스트 로딩
    const [jobs, setJobs] = useState<Job[]>([]); // 공고 리스트
    const [totalPages, setTotalPages] = useState(1); // 공고 리스트 페이지 수
    const jobListRef = useRef<HTMLDivElement>(null); //?
    const { getJobList } = useJobStore();

    const JOBS_PER_PAGE = 15;

    // 다시 처리
    const toggleBookmark = (jobId: number) => {
        // setJobs((prevJobs) =>
        //     prevJobs.map((job) =>
        //         job.id === jobId ? { ...job, isBookmarked: !job.isBookmarked } : job
        //     )
        // );

        if (bookmarkedJobs.includes(jobId)) {
            setBookmarkedJobs(bookmarkedJobs.filter((id) => id !== jobId));
        } else {
            setBookmarkedJobs([...bookmarkedJobs, jobId]);
        }
    };

    const loadJobs = useCallback(
        // 일단 임시로 세팅
        async (page: number) => {
            setIsLoading(true);
            const jobList = await getJobList(page);

            setJobs(jobList);

            setTotalPages(3); // 예시로 총 3페이지로 설정
            setIsLoading(false);

            console.log(Array.isArray(jobList));

            // 첫 번째 작업 선택
            if (jobList.length > 0 && page === 1) {
                onJobSelect(jobList[0]);
            }
        },
        [onJobSelect]
    );

    useEffect(() => {
        loadJobs(1);
    }, []);

    // const loadJobDetail = useCallback(
    //     // 일단 임시로 세팅
    //     (page: number) => {
    //         setIsLoading(true);
    //         const mockJobs = generateMockJobs(JOBS_PER_PAGE, (page - 1) * JOBS_PER_PAGE);
    //         setJobs(mockJobs);
    //         setIsLoading(false);

    //         // 첫 번째 작업 선택
    //         if (mockJobs.length > 0 && page === 1) {
    //             onJobSelect(mockJobs[0]);
    //         }
    //     },
    //     [onJobSelect]
    // );

    return (
        <div className={styles.jobList} ref={jobListRef}>
            <div className={styles.jobList__filters}>
                {filters.map((filter) => (
                    <button
                        key={filter}
                        className={`${styles.jobList__filterButton} ${
                            activeFilter === filter ? styles.active : ''
                        }`}>
                        {filter}
                    </button>
                ))}
            </div>

            <div className={styles.jobList__content}>
                {isLoading ? (
                    <div className={styles.jobList__loading}>
                        <div className={styles.jobList__loadingSpinner}></div>
                    </div>
                ) : (
                    Array.isArray(jobs) &&
                    jobs.map((job) => (
                        <JobCard
                            key={job.id}
                            job={job}
                            isSelected={false}
                            onSelect={() => onJobSelect(job)}
                            onToggleBookmark={() => toggleBookmark(job.id)}
                        />
                    ))
                )}
            </div>

            <div className={styles.jobList__pagianation}></div>
        </div>
    );
}

export default JobList;
