import { useState, useEffect, useRef, useCallback } from 'react';
import JobCard from './JobCard';
import styles from './styles/JobList.module.scss';
import type Job from '../../../../../types/job';
import useJobStore from '../../../../store/jobStore';
import useBookmarkStore from '../../../../store/bookmarkStore';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../../../../components/common/error/ErrorFallback';
import LoadingSpinner from '../../../../components/common/loading/LoadingSpinner';

interface jobListProps {
    bookmarked: boolean;
}

function JobList({ bookmarked }: jobListProps) {
    const [activeFilter, setActiveFilter] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [hasError, setHasError] = useState(false);
    const [isPending, setIsPending] = useState(false); // 업로드 직후 topk-list 요청 시 fallback 용

    const jobListRef = useRef<HTMLDivElement>(null);
    const experienceFilterRef = useRef<HTMLDivElement>(null);
    const typeFilterRef = useRef<HTMLDivElement>(null);
    const experienceButtonRef = useRef<HTMLDivElement>(null);
    const typeButtonRef = useRef<HTMLDivElement>(null);

    const { setSelectedJob, jobList, getJobList } = useJobStore();
    const { addBookmark, removeBookmark, getBookmark } = useBookmarkStore();
    const bookmarkedList = useBookmarkStore((state) => state.bookmarkList);

    const [experienceFilterVector, setExperienceFilterVector] = useState<string[]>([]);
    const [typeFilterVector, setTypeFilterVector] = useState<string[]>([]);
    const filterData = {
        jobExperience: ['신입', '경력', '경력무관'],
        jobType: ['정규직', '계약직', '인턴', '아르바이트', '프리랜서', '파견직'],
    };

    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 15;

    const TOTAL_JOB = 80;

    // 파일 업로드에서 다른 pending 페이지를 만들어 1분 가량을 벌어야함
    // 현재 파일 업로드에서 10초의 시간을 확보
    // 최대 1분 20초 소요
    // setTimeout 70000
    // 최초 업로드 및 재업로드에 70000~80000ms
    // 최초 업로드시에는 업로드 페이지에서 10000ms 확보
    useEffect(() => {
        const checkPending = () => {
            setTimeout(() => {
                console.log('pending end');
                setIsPending(false);
            }, 80000);
        };
        setIsPending(true);
        checkPending();
    }, [hasError]);

    const filterJobs = useCallback(() => {
        const filtered = (bookmarked ? filteredJobs || [] : jobList || []).filter((job) => {
            const matchesExperience =
                experienceFilterVector.length === 0 ||
                experienceFilterVector.includes(job.requireExperience || '');
            const matchesType =
                typeFilterVector.length === 0 || typeFilterVector.includes(job.jobType || '');
            return matchesExperience && matchesType;
        });

        setFilteredJobs(filtered);

        if (filtered.length > 0) {
            console.log(`상세 정보 선택: ${filtered[0].title}`);
            setSelectedJob(filtered[0].id);
        }
    }, [experienceFilterVector, typeFilterVector, jobList, bookmarked]);

    useEffect(() => {
        if (bookmarked) {
            setSelectedJob(0);
        }

        filterJobs();
        setCurrentPage(1); // 필터 적용하면 페이지는 어디로 이동?
    }, [filterJobs]);

    const handleFilterOutsideClick = (e: MouseEvent) => {
        const target = e.target as Node;
        const isInsideExperience =
            experienceFilterRef.current?.contains(target) ||
            experienceButtonRef.current?.contains(target);
        const isInsideType =
            typeFilterRef.current?.contains(target) || typeButtonRef.current?.contains(target);
        if (!isInsideExperience && !isInsideType) {
            setActiveFilter('');
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleFilterOutsideClick);
        return () => document.removeEventListener('mousedown', handleFilterOutsideClick);
    }, []);

    const toggleBookmark = async (jobId: number) => {
        const currentBookmarks = bookmarkedList || [];
        const isBookmarked = currentBookmarks.some((job) => job.id === jobId);

        try {
            // 낙관적 업데이트: UI 즉시 반영
            const updatedJobs = filteredJobs.map((job) =>
                job.id === jobId ? { ...job, isBookmarked: !isBookmarked } : job
            );
            setFilteredJobs(updatedJobs);

            // 서버에 북마크 상태 변경 요청
            if (isBookmarked) {
                await removeBookmark(jobId);
            } else {
                await addBookmark(jobId);
                // 북마크 추가 후 상태를 강제로 업데이트하여 UI 반영
            }

            // 북마크 목록 갱신
            await getBookmark();

            // 강제 리렌더링을 위한 상태 업데이트
            // setFilteredJobs([...filteredJobs]);
        } catch (error) {
            console.error('북마크 토글 중 오류 발생:', error);
            const revertedJobs = filteredJobs.map((job) =>
                job.id === jobId ? { ...job, isBookmarked: isBookmarked } : job
            );
            setFilteredJobs(revertedJobs);
        }
    };

    // useEffect(() => {
    //     const fetchData = async () => {
    //         setIsLoading(true);
    //         try {
    //             if (bookmarked) {
    //                 const updatedJob = await getBookmark();

    //                 if (Array.isArray(updatedJob)) {
    //                     setFilteredJobs(updatedJob);
    //                     setSelectedJob(updatedJob[0]?.id ?? 0);
    //                 } else {
    //                     throw new Error('북마크 응답이 배열이 아님');
    //                 }
    //             } else {
    //                 if (!jobList || jobList.length === 0) {
    //                     await getJobList(TOTAL_JOB);
    //                     await getBookmark();
    //                 }
    //             }
    //         } catch (error) {
    //             console.error('데이터 가져오기 에러:', error);
    //             // 여기에서 임의의 시간(70000ms) 동안 주기적으로 fetchData 호출
    //             setHasError(true);
    //         } finally {
    //             setIsLoading(false);
    //         }
    //     };

    //     fetchData();
    // }, []);

    // 최초 업로드 후 80초 동안 topk-list 재호출
    useEffect(() => {
        let pollingInterval: NodeJS.Timeout;
        let timeoutHandle: NodeJS.Timeout;
        let pollingActive = true;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (bookmarked) {
                    const updatedJob = await getBookmark();

                    if (Array.isArray(updatedJob)) {
                        setFilteredJobs(updatedJob);
                        setSelectedJob(updatedJob[0]?.id ?? 0);
                        pollingActive = false; // 성공했으면 polling 멈춤
                    } else {
                        throw new Error('북마크 응답이 배열이 아님');
                    }
                } else {
                    if (!jobList || jobList.length === 0) {
                        await getJobList(TOTAL_JOB);
                        await getBookmark();
                        pollingActive = false;
                    }
                }
                setHasError(false);
            } catch (error) {
                console.error('데이터 가져오기 에러:', error);
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        };

        const startPolling = () => {
            fetchData(); // 초기 1회 호출
            pollingInterval = setInterval(() => {
                if (pollingActive) {
                    fetchData();
                    // 만약에 응답이 정상적으로 온다면 바로 polling 중단
                }
            }, 10000); // 10초 간격
        };

        startPolling();

        // eslint-disable-next-line prefer-const
        timeoutHandle = setTimeout(() => {
            pollingActive = false;
            clearInterval(pollingInterval);
            console.log('⏱️ 80초 polling 중단');
        }, 80000); // 80초 뒤 polling 종료

        return () => {
            clearInterval(pollingInterval);
            clearTimeout(timeoutHandle);
        };
    }, []);
    const totalItems = filteredJobs.length;
    const calculatedTotalPages = Math.ceil(totalItems / jobsPerPage);
    // const currentJobs = useEffect(() => {
    //     filteredJobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage);
    // }, [filteredJobs]);
    const currentJobs = filteredJobs.slice(
        (currentPage - 1) * jobsPerPage,
        currentPage * jobsPerPage
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        jobListRef.current?.querySelector(`.${styles.jobList__content}`)?.scrollTo(0, 0);
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) handlePageChange(currentPage - 1);
    };

    const goToNextPage = () => {
        if (currentPage < calculatedTotalPages) handlePageChange(currentPage + 1);
    };

    const handleExperienceClick = (item: string) => {
        setExperienceFilterVector((prev) =>
            prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
        );
    };

    const handleTypeClick = (item: string) => {
        setTypeFilterVector((prev) =>
            prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
        );
    };

    const JobExperienceFilter = () => (
        <div
            className={`${styles.jobList__filters__extend} ${
                activeFilter === '경력' ? styles.active : ''
            } ${activeFilter === '경력' ? '' : styles.hidden}`}
            ref={experienceFilterRef}>
            {filterData.jobExperience.map((item) => (
                <div
                    key={item}
                    className={`${styles.jobList__filterButton} ${
                        experienceFilterVector.includes(item) ? styles.active : ''
                    }`}
                    onClick={() => handleExperienceClick(item)}>
                    {item}
                </div>
            ))}
        </div>
    );

    const JobTypeFilter = () => (
        <div
            className={`${styles.jobList__filters__extend} ${
                activeFilter === '근무 유형' ? styles.active : ''
            } ${activeFilter === '근무 유형' ? '' : styles.hidden}`}
            ref={typeFilterRef}>
            {filterData.jobType.map((item) => (
                <div
                    key={item}
                    className={`${styles.jobList__filterButton} ${
                        typeFilterVector.includes(item) ? styles.active : ''
                    }`}
                    onClick={() => handleTypeClick(item)}>
                    {item}
                </div>
            ))}
        </div>
    );

    return (
        <div className={styles.jobList} ref={jobListRef}>
            {hasError || isLoading ? (
                ''
            ) : (
                <div className={styles.jobList__filters}>
                    <div
                        className={`${styles.jobList__filterButton} ${
                            activeFilter === '경력' ? styles.active : ''
                        }`}
                        ref={experienceButtonRef}
                        onMouseDown={() =>
                            setActiveFilter((prev) => (prev === '경력' ? '' : '경력'))
                        }>
                        경력
                    </div>
                    {activeFilter === '경력' && <JobExperienceFilter />}

                    <div
                        className={`${styles.jobList__filterButton} ${
                            activeFilter === '근무 유형' ? styles.active : ''
                        }`}
                        onMouseDown={() =>
                            setActiveFilter((prev) => (prev === '근무 유형' ? '' : '근무 유형'))
                        }
                        ref={typeButtonRef}>
                        근무 유형
                    </div>
                    {activeFilter === '근무 유형' && <JobTypeFilter />}
                </div>
            )}

            <ErrorBoundary FallbackComponent={ErrorFallback}>
                <div className={styles.jobList__content}>
                    {hasError ? (
                        isPending ? (
                            <LoadingSpinner />
                        ) : (
                            <ErrorFallback />
                        )
                    ) : isLoading ? (
                        <div className={styles.jobList__loading}>
                            <div className={styles.jobList__loadingSpinner}></div>
                        </div>
                    ) : (
                        currentJobs.map((job) => (
                            <JobCard
                                key={job.id}
                                job={{
                                    ...job,
                                    isBookmarked: !!bookmarkedList?.some((b) => b.id === job.id),
                                }}
                                isSelected={false}
                                onSelect={() => setSelectedJob(job.id)}
                                onToggleBookmark={() => toggleBookmark(job.id)}
                            />
                        ))
                    )}
                </div>
            </ErrorBoundary>

            {hasError || isLoading ? (
                ''
            ) : (
                <div className={styles.jobList__pagination}>
                    {calculatedTotalPages > 1 && (
                        <>
                            <button
                                className={`${styles.jobList__paginationButton} ${
                                    currentPage === 1 ? styles.disabled : ''
                                }`}
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}>
                                이전
                            </button>

                            <div className={styles.jobList__paginationNumbers}>
                                {Array.from({ length: calculatedTotalPages }, (_, i) => i + 1)
                                    .filter(
                                        (page) =>
                                            page === 1 ||
                                            page === calculatedTotalPages ||
                                            Math.abs(page - currentPage) <= 1
                                    )
                                    .map((page, index, array) => {
                                        if (index > 0 && array[index - 1] !== page - 1) {
                                            return (
                                                <React.Fragment key={`ellipsis-${page}`}>
                                                    <span
                                                        className={
                                                            styles.jobList__paginationEllipsis
                                                        }>
                                                        ...
                                                    </span>
                                                    <button
                                                        className={`${
                                                            styles.jobList__paginationNumber
                                                        } ${
                                                            currentPage === page
                                                                ? styles.active
                                                                : ''
                                                        }`}
                                                        onClick={() => handlePageChange(page)}>
                                                        {page}
                                                    </button>
                                                </React.Fragment>
                                            );
                                        }
                                        return (
                                            <button
                                                key={page}
                                                className={`${styles.jobList__paginationNumber} ${
                                                    currentPage === page ? styles.active : ''
                                                }`}
                                                onClick={() => handlePageChange(page)}>
                                                {page}
                                            </button>
                                        );
                                    })}
                            </div>

                            <button
                                className={`${styles.jobList__paginationButton} ${
                                    currentPage === calculatedTotalPages ? styles.disabled : ''
                                }`}
                                onClick={goToNextPage}
                                disabled={currentPage === calculatedTotalPages}>
                                다음
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default JobList;
