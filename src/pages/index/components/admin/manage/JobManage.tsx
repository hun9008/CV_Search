import { useEffect, useRef, useState } from 'react';
import style from './JobManage.module.scss';
import { Filter, Plus, Search, Ban } from 'lucide-react';
import JobManageItem from './JobManageItem';
import LoadingSpinner from '../../../../../components/common/loading/LoadingSpinner';
import useAdminJobManageStore from '../../../../../store/adminJobManageStore';
import React from 'react';
// import { JobBrief } from '../../../../../types/jobBrief';

type SortField = 'companyName' | 'jobTitle' | 'createdAt' | 'applyStatus';
type SortOrder = 'asc' | 'desc';

function JobManage() {
    /** 공고 불러오기 */
    const totalJob = useAdminJobManageStore((state) => state.totalJob);
    const getTotalJob = useAdminJobManageStore((state) => state.getTotalJob);
    const removeJob = useAdminJobManageStore((state) => state.removeJob);

    /** 필터링 */
    // const [filteredJob, setFilteredJob] = useState<JobBrief[]>();
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
        field: 'createdAt',
        order: 'desc',
    });
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    /** 페이지네이션 */
    // const jobsPerPage = 40;
    const totalPage = useAdminJobManageStore((state) => state.totalPage);
    const currentPage = useAdminJobManageStore((state) => state.currentPage);
    // const isFirstPage = useAdminJobManageStore((state) => state.isFirstPage);
    // const isLastPage = useAdminJobManageStore((state) => state.isLastPage);
    const { goToNextPage, goToPrevPage, setCurrentPage } = useAdminJobManageStore();
    const jobListRef = useRef<HTMLDivElement>(null);

    // 상태 옵션 목록
    const statusOptions = ['확인필요', '정상', '마감', '에러'];

    const handleApplicationRemove = async (jobId: number, vaildType: number | null) => {
        await removeJob(jobId, vaildType);
        await getTotalJob(currentPage, 40);
    };

    const handleStatusChange = async (jobId: number, status: number) => {
        if (status === 2) {
            await removeJob(jobId, status);
        }
        // 상태 수정하고 로컬 스토리지에서 가져오기
    };

    const handleSort = (field: SortField) => {
        setSortConfig((prev) => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
        }));
    };

    const toggleStatusFilter = (status: string) => {
        setStatusFilter((prev) =>
            prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
        );
    };
    const handleJobAdd = () => {};

    // 검색, 필터링, 정렬 적용
    // useEffect(() => {
    //     if (!totalJob) return;

    //     let filtered = [...totalJob];

    //     // 검색어 필터링
    //     if (searchQuery) {
    //         const query = searchQuery.toLowerCase();
    //         filtered = filtered.filter(
    //             (job) =>
    //                 (job.title && job.title.toLowerCase().includes(query)) ||
    //                 (job.companyName && job.companyName.toLowerCase().includes(query))
    //         );
    //     }

    //     // 상태 필터링
    //     if (statusFilter.length > 0) {
    //         filtered = filtered.filter((job) => statusFilter.includes(String(job.jobVaildType)));
    //     }

    //     // 정렬
    //     filtered.sort((a, b) => {
    //         let comparison = 0;

    //         switch (sortConfig.field) {
    //             case 'companyName':
    //                 comparison = a.companyName.localeCompare(b.companyName);
    //                 break;
    //             case 'jobTitle':
    //                 comparison = a.title.localeCompare(b.title);
    //                 break;
    //             case 'createdAt':
    //                 comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    //                 break;
    //             case 'applyStatus':
    //                 comparison = String(a.jobVaildType).localeCompare(String(b.jobVaildType));
    //                 break;
    //         }

    //         return sortConfig.order === 'asc' ? comparison : -comparison;
    //     });

    //     // setFilteredJob(filtered);
    // }, [totalJob, searchQuery, statusFilter, sortConfig]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            await getTotalJob(currentPage, 40);
            setIsLoading(false);
        };

        fetchData();
    }, [currentPage]);

    const getSortIcon = (field: SortField) => {
        if (sortConfig.field !== field) return null;
        return sortConfig.order === 'asc' ? '↑' : '↓';
    };

    // const currentJobs = (filteredJob ?? []).slice(
    //     (currentPage - 1) * jobsPerPage,
    //     currentPage * jobsPerPage
    // );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        jobListRef.current?.querySelector(`.${style.jobList__content}`)?.scrollTo(0, 0);
    };

    return (
        <div className={style.container}>
            <div className={style.header}>
                <div className={style.headerText}>
                    <h2 className={style.header__title}>공고 관리</h2>
                    <p className={style.header__subtitle}>등록된 공고를 관리하세요</p>
                </div>
                <button className={style.addButton} onClick={handleJobAdd}>
                    <Plus />
                    <p className={style.addButton__text}>공고 등록</p>
                </button>
            </div>
            <div className={style.header__actions}>
                <div className={style.header__searchBar}>
                    <Search className={style.header__searchIcon} size={16} />
                    <input
                        type="text"
                        placeholder="검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={style.header__searchInput}
                    />
                </div>

                <button
                    className={`${style.header__filterButton} ${showFilters ? style.active : ''}`}
                    onClick={() => setShowFilters(!showFilters)}>
                    <Filter size={16} />
                    <span>필터</span>
                </button>
            </div>
            {showFilters && (
                <div className={style.filters}>
                    <div className={style.filters__section}>
                        <h3 className={style.filters__title}>상태</h3>
                        <div className={style.filters__options}>
                            {statusOptions.map((status) => (
                                <button
                                    key={status}
                                    className={`${style.filters__option} ${
                                        statusFilter.includes(status) ? style.active : ''
                                    }`}
                                    onClick={() => toggleStatusFilter(status)}>
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={style.filters__section}>
                        <h3 className={style.filters__title}>정렬</h3>
                        <div className={style.filters__sortOptions}>
                            <button
                                className={`${style.filters__sortOption} ${
                                    sortConfig.field === 'createdAt' ? style.active : ''
                                }`}
                                onClick={() => handleSort('createdAt')}>
                                날짜 {getSortIcon('createdAt')}
                            </button>
                            <button
                                className={`${style.filters__sortOption} ${
                                    sortConfig.field === 'companyName' ? style.active : ''
                                }`}
                                onClick={() => handleSort('companyName')}>
                                회사명 {getSortIcon('companyName')}
                            </button>
                            <button
                                className={`${style.filters__sortOption} ${
                                    sortConfig.field === 'applyStatus' ? style.active : ''
                                }`}
                                onClick={() => handleSort('applyStatus')}>
                                상태 {getSortIcon('applyStatus')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <>
                    <div className={style.listView}>
                        <div className={style.listView__header}>
                            <div
                                className={style.listView__cell}
                                onClick={() => handleSort('jobTitle')}>
                                공고명 {getSortIcon('jobTitle')}
                            </div>
                            <div
                                className={style.listView__cell}
                                onClick={() => handleSort('companyName')}>
                                회사 {getSortIcon('companyName')}
                            </div>
                            <div
                                className={style.listView__cell}
                                onClick={() => handleSort('createdAt')}>
                                등록일 {getSortIcon('createdAt')}
                            </div>
                            <div
                                className={style.listView__cell}
                                onClick={() => handleSort('createdAt')}>
                                마감일 {getSortIcon('createdAt')}
                            </div>
                            <div className={style.listView__cell}>상태</div>
                            <div className={style.listView__cell}></div>
                        </div>

                        <div className={style.listView__body} ref={jobListRef}>
                            {totalJob && totalJob.length > 0 ? (
                                totalJob?.map((job) => (
                                    <JobManageItem
                                        key={job.id}
                                        job={job}
                                        onRemove={() =>
                                            handleApplicationRemove(job.id, job.jobVaildType)
                                        }
                                        onStatusChange={(status) =>
                                            handleStatusChange(job.id, status)
                                        }
                                        statusOptions={statusOptions}
                                    />
                                ))
                            ) : (
                                <div className={style.empty}>
                                    <Ban size={48} className={style.empty__icon} />
                                    <h3 className={style.empty__title}>등록된 공고가 없습니다</h3>
                                    <p className={style.empty__message}>
                                        공고 데이터 담당자에게 문의하세요
                                    </p>
                                </div>
                            )}
                            {isLoading ? (
                                ''
                            ) : (
                                <div className={style.jobList__pagination}>
                                    {totalPage > 1 && (
                                        <>
                                            <button
                                                className={`${style.jobList__paginationButton} ${
                                                    currentPage === 1 ? style.disabled : ''
                                                }`}
                                                onClick={goToPrevPage}
                                                disabled={currentPage === 1}>
                                                이전
                                            </button>

                                            <div className={style.jobList__paginationNumbers}>
                                                {Array.from({ length: totalPage }, (_, i) => i)
                                                    .filter(
                                                        (page) =>
                                                            page === 0 || // 첫 페이지
                                                            page === totalPage - 1 || // 마지막 페이지
                                                            Math.abs(page - currentPage) <= 1 // 현재 페이지 전후 1쪽
                                                    )
                                                    .map((page, index, array) => {
                                                        if (
                                                            index > 0 &&
                                                            array[index - 1] !== page - 1
                                                        ) {
                                                            return (
                                                                <React.Fragment
                                                                    key={`ellipsis-${page}`}>
                                                                    <span
                                                                        className={
                                                                            style.jobList__paginationEllipsis
                                                                        }>
                                                                        ...
                                                                    </span>
                                                                    <button
                                                                        className={`${
                                                                            style.jobList__paginationNumber
                                                                        } ${
                                                                            currentPage === page
                                                                                ? style.active
                                                                                : ''
                                                                        }`}
                                                                        onClick={() =>
                                                                            handlePageChange(page)
                                                                        }>
                                                                        {page + 1}
                                                                    </button>
                                                                </React.Fragment>
                                                            );
                                                        }
                                                        return (
                                                            <button
                                                                key={page}
                                                                className={`${
                                                                    style.jobList__paginationNumber
                                                                } ${
                                                                    currentPage === page
                                                                        ? style.active
                                                                        : ''
                                                                }`}
                                                                onClick={() =>
                                                                    handlePageChange(page)
                                                                }>
                                                                {page + 1}
                                                            </button>
                                                        );
                                                    })}
                                            </div>

                                            <button
                                                className={`${style.jobList__paginationButton} ${
                                                    currentPage === totalPage ? style.disabled : ''
                                                }`}
                                                onClick={goToNextPage}
                                                disabled={currentPage === totalPage}>
                                                다음
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default JobManage;
