import { useState, useEffect, useRef, useCallback } from 'react';
import JobCard from './JobCard';
import styles from './styles/JobList.module.scss';
import type Job from '../../types/job';

import useJobStore from '../../../../store/jobStore';

interface JobListProps {
    onJobSelect: (job: Job) => void;
}
const generateMockJobs = (count: number, startIndex = 0): Job[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: startIndex + i + 1,
        title: `Frontend Developer(${i % 2 === 0 ? 'Mobile' : 'Product'})`,
        company: 'Viva Republica(TOSS)',
        logo: '/abstract-geometric-logo.png',
        location: '대한민국 서울',
        tags: ['확인함'],
        score: 95,
        isBookmarked: false,
        deadline: '2025.03.17 마감',
        description:
            "토스팀은 연차에 따른 정형적인 평가보다, 그동안 '얼마나 경험을 쌓는지'와 '얼마나 가치를 창출하는지'를 통해 기술자를 평가해요.",
        requirements: [
            '토스팀에서는 하나의 스쿼드 안에 1-3명의 Frontend Developer가 소속되어 있으며, 서비스 개발을 넘어 역량적 성장을 함께해요.',
            '토스팀은 서비스 단위의 스쿼드 조직으로 서비스/제품을 만들어요. 전체는 4명에서 많게는 15명의 멤버가 하나의 스쿼드를 이루어 작은 스타트업처럼 자율성을 갖고 협하고 있어요.',
            '토스팀의 Frontend 팀터는 하나의 팀처럼 협업하고 있어요. 주기적으로 챕터 위클리를 진행하여 기술부채를 청산해요.',
        ],
        benefits: [
            '도전적인 프로젝트와 함께 더 성장하고 싶다면? → 지금 토스팀으로 오세요!',
            '더 궁금한 내용이 있으신가요? → 토스팀 프론트엔드 개발자의 일주일',
        ],
    }));
};

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
        setJobs((prevJobs) =>
            prevJobs.map((job) =>
                job.id === jobId ? { ...job, isBookmarked: !job.isBookmarked } : job
            )
        );

        if (bookmarkedJobs.includes(jobId)) {
            setBookmarkedJobs(bookmarkedJobs.filter((id) => id !== jobId));
        } else {
            setBookmarkedJobs([...bookmarkedJobs, jobId]);
        }
    };

    // const toggleFilterButton =

    useEffect(() => {
        loadJobs(1);
    }, []);

    const loadJobs = useCallback(
        // 일단 임시로 세팅
        (page: number) => {
            setIsLoading(true);
            const mockJobs = generateMockJobs(JOBS_PER_PAGE, (page - 1) * JOBS_PER_PAGE);
            setJobs(mockJobs);
            setTotalPages(3); // 예시로 총 3페이지로 설정
            setIsLoading(false);

            // 첫 번째 작업 선택
            if (mockJobs.length > 0 && page === 1) {
                onJobSelect(mockJobs[0]);
            }
        },
        [onJobSelect]
    );
    // const loadJobs = useCallback((page: number) => {
    //     setIsLoading(true);
    //     const list = getJobList(15); // 페이지 당 15개
    //     setJobs(list);
    //     setTotalPages(3); // 예시로 총 3페이지로 설정
    //     setIsLoading(false);
    // });

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
