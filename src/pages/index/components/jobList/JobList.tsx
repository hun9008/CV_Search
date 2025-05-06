import { useState, useEffect, useRef, useCallback } from 'react';
import JobCard from './JobCard';
import styles from './styles/JobList.module.scss';
import type Job from '../../types/job';
import useJobStore from '../../../../store/jobStore';
import useAuthStore from '../../../../store/authStore';

function JobList() {
    const [activeFilter, setActiveFilter] = useState('검색'); // 검색은 다른 필터와 다르게 구현
    const filters = ['경력', '근무유형'];
    const [bookmarkedJobs, setBookmarkedJobs] = useState<number[]>([]); // 북마크 처리
    const [isLoading, setIsLoading] = useState(false); // 공고 리스트 로딩
    const [jobs, setJobs] = useState<Job[]>([]); // 공고 리스트
    const [totalPages, setTotalPages] = useState(1); // 공고 리스트 페이지 수
    const jobListRef = useRef<HTMLDivElement>(null); //?
    const { getJobList, setSelectedJob } = useJobStore();
    const JOBS_PER_PAGE = 75;

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

    const loadJobs = useCallback(async (page: number) => {
        setIsLoading(true);

        const jobList = await getJobList(page);

        setJobs(jobList);

        setTotalPages(3); // 예시로 총 3페이지로 설정
        setIsLoading(false);

        // 첫 번째 작업 선택
        setSelectedJob(jobList[0].id);
    }, []);

    useEffect(() => {
        loadJobs(JOBS_PER_PAGE);
    }, []);

    return (
        <div className={styles.jobList} ref={jobListRef}>
            <div className={styles.jobList__filters}>
                {filters.map((filter) => (
                    <button
                        key={filter}
                        className={`${styles.jobList__filterButton} ${
                            activeFilter === filter ? styles.active : ''
                        }`}
                        onClick={() => setActiveFilter(filter)}>
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
                            onSelect={() => setSelectedJob(job.id)}
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
