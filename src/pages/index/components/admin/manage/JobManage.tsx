import { useEffect, useRef, useState } from 'react';
import style from './JobManage.module.scss';
import { Filter, Search, Ban } from 'lucide-react';
import JobManageItem from './JobManageItem';
import LoadingSpinner from '../../../../../components/common/loading/LoadingSpinner';
import useAdminJobManageStore from '../../../../../store/adminJobManageStore';
import React from 'react';

type SortField = 'createdAt' | 'applyEndDate';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

function JobManage() {
    /** 공고 불러오기 */
    const totalJob = useAdminJobManageStore((state) => state.totalJob);
    const getTotalJob = useAdminJobManageStore((state) => state.getTotalJob);
    const removeJob = useAdminJobManageStore((state) => state.removeJob);

    /** 필터링 */
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
        field: 'createdAt',
        order: 'desc',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [searchSubmitted, setSearchSubmitted] = useState(false);

    /** 페이지네이션 */
    const totalPage = useAdminJobManageStore((state) => state.totalPage);
    const currentPage = useAdminJobManageStore((state) => state.currentPage);
    const isFirstPage = useAdminJobManageStore((state) => state.isFirstPage);
    const isLastPage = useAdminJobManageStore((state) => state.isLastPage);
    const { goToNextPage, goToPrevPage, setCurrentPage, jobSearch } = useAdminJobManageStore();
    const jobListRef = useRef<HTMLDivElement>(null);

    // 상태 옵션 목록
    const statusOptions = ['확인필요', '정상', '마감', '에러'];

    const handleApplicationRemove = async (jobId: number, vaildType: number | null) => {
        const res = await removeJob(jobId, vaildType);
        if (res === 200) {
            if (searchQuery) {
                await jobSearch(
                    currentPage,
                    ITEMS_PER_PAGE,
                    searchQuery,
                    `${sortConfig.field},${sortConfig.order}`
                );
            } else {
                await getTotalJob(
                    currentPage,
                    ITEMS_PER_PAGE,
                    `${sortConfig.field},${sortConfig.order}`
                );
            }
        }
    };

    const handleStatusChange = async (jobId: number, status: number) => {
        if (status === 2) {
            const res = await removeJob(jobId, status);
            if (res === 200) {
                if (searchQuery) {
                    await jobSearch(
                        currentPage,
                        ITEMS_PER_PAGE,
                        searchQuery,
                        `${sortConfig.field},${sortConfig.order}`
                    );
                } else {
                    await getTotalJob(
                        currentPage,
                        ITEMS_PER_PAGE,
                        `${sortConfig.field},${sortConfig.order}`
                    );
                }
            }
        }
    };

    const handleSort = (field: SortField) => {
        setSortConfig((prev) => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
        }));
    };

    useEffect(() => {
        if (searchQuery) {
            const fetchData = async () => {
                setIsLoading(true);
                await jobSearch(
                    currentPage,
                    ITEMS_PER_PAGE,
                    searchQuery,
                    `${sortConfig.field},${sortConfig.order}`
                );
                setIsLoading(false);
            };
            fetchData();
        }
        if (!searchQuery) {
            const fetchData = async () => {
                setIsLoading(true);
                await getTotalJob(
                    currentPage,
                    ITEMS_PER_PAGE,
                    `${sortConfig.field},${sortConfig.order}`
                );
                setIsLoading(false);
            };
            fetchData();
        }
    }, [currentPage, getTotalJob, removeJob, searchSubmitted, sortConfig]);

    const getSortIcon = (field: SortField) => {
        if (sortConfig.field !== field) return null;
        return sortConfig.order === 'asc' ? '↑' : '↓';
    };

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
                {/* <button className={style.addButton} onClick={handleJobAdd}>
                    <Plus />
                    <p className={style.addButton__text}>공고 등록</p>
                </button> */}
            </div>
            <div className={style.header__actions}>
                <div className={style.header__searchBar}>
                    <Search className={style.header__searchIcon} size={16} />
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setSearchSubmitted((prev) => !prev); // 트리거용 state 변경
                        }}>
                        <input
                            type="text"
                            placeholder="검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={style.header__searchInput}
                        />
                    </form>
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
                        <h3 className={style.filters__title}>정렬</h3>
                        <div className={style.filters__sortOptions}>
                            <button
                                className={`${style.filters__sortOption} ${
                                    sortConfig.field === 'createdAt' ? style.active : ''
                                }`}
                                onClick={() => handleSort('createdAt')}>
                                등록일 {getSortIcon('createdAt')}
                            </button>
                            <button
                                className={`${style.filters__sortOption} ${
                                    sortConfig.field === 'applyEndDate' ? style.active : ''
                                }`}
                                onClick={() => handleSort('applyEndDate')}>
                                마감일 {getSortIcon('applyEndDate')}
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
                            <div className={style.listView__cell}>공고명</div>
                            <div className={style.listView__cell}>회사</div>
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
                                        onRemove={() => handleApplicationRemove(job.id, 2)}
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
                                                    isFirstPage ? style.disabled : ''
                                                }`}
                                                onClick={goToPrevPage}
                                                disabled={isFirstPage}>
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
                                                    isLastPage ? style.disabled : ''
                                                }`}
                                                onClick={goToNextPage}
                                                disabled={isLastPage}>
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
