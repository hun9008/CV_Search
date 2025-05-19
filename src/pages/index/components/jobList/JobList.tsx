import { useState, useEffect, useRef, useCallback } from 'react';
import JobCard from './JobCard';
import styles from './styles/JobList.module.scss';
import type Job from '../../../../../types/job';
import useJobStore from '../../../../store/jobStore';
import useBookmarkStore from '../../../../store/bookmarkStore';
import React from 'react';

interface jobListProps {
    bookmarked: boolean;
}

function JobList({ bookmarked }: jobListProps) {
    const [activeFilter, setActiveFilter] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

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
            if (isBookmarked) {
                await removeBookmark(jobId);
            } else {
                await addBookmark(jobId);
                // 북마크 추가 후 상태를 강제로 업데이트하여 UI 반영
                const updatedJobs = [...filteredJobs]; // filter 적용 후 북마크 했을 때 동작 보장

                setFilteredJobs(updatedJobs);
            }

            // 북마크 목록 갱신
            await getBookmark();

            // 강제 리렌더링을 위한 상태 업데이트
            setFilteredJobs([...filteredJobs]);
        } catch (error) {
            console.error('북마크 토글 중 오류 발생:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (bookmarked) {
                    const updatedJob = await getBookmark();

                    if (Array.isArray(updatedJob)) {
                        setFilteredJobs(updatedJob);
                        setSelectedJob(updatedJob[0].id);
                    } else {
                        console.error('북마크 에러');
                    }
                } else {
                    if (!jobList || jobList.length === 0) {
                        await getJobList(TOTAL_JOB);
                        await getBookmark();
                    }
                }
            } catch (error) {
                console.error('데이터 가져오기 오류:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
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
            <div className={styles.jobList__filters}>
                <div
                    className={`${styles.jobList__filterButton} ${
                        activeFilter === '경력' ? styles.active : ''
                    }`}
                    ref={experienceButtonRef}
                    onMouseDown={() => setActiveFilter((prev) => (prev === '경력' ? '' : '경력'))}>
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

            <div className={styles.jobList__content}>
                {isLoading ? (
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
                                                    className={styles.jobList__paginationEllipsis}>
                                                    ...
                                                </span>
                                                <button
                                                    className={`${
                                                        styles.jobList__paginationNumber
                                                    } ${currentPage === page ? styles.active : ''}`}
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
        </div>
    );
}

export default JobList;
