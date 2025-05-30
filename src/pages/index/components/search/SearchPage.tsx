import { useEffect, useRef, useState } from 'react';
import style from './SearchPage.module.scss';
import SearchCard from './SearchCard';
import useSearchStore from '../../../../store/searchStore';
import { BookmarkIcon } from 'lucide-react';
import React from 'react';
import useBookmarkStore from '../../../../store/bookmarkStore';

function SearchPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { getSearchList } = useSearchStore();
    const searchList = useSearchStore((state) => state.searchList);
    const query = useSearchStore((state) => state.query);
    const bookmarkedList = useBookmarkStore((state) => state.bookmarkList);
    /** 북마크 */
    const { addBookmark, removeBookmark, getBookmark } = useBookmarkStore();
    /** 페이지네이션 */
    const jobListRef = useRef<HTMLDivElement>(null);
    const { goToNextPage, goToPrevPage, setCurrentPage } = useSearchStore();
    const currentPage = useSearchStore((state) => state.currentPage);
    const calculatedTotalPages = useSearchStore((state) => state.totalPage);

    const toggleBookmark = async (jobId: number) => {
        const currentBookmarks = bookmarkedList || [];
        const isBookmarked = currentBookmarks.some((job) => job.id === jobId);

        try {
            // 낙관적 업데이트: searchList를 직접 업데이트
            useSearchStore.setState((state) => ({
                searchList: state.searchList.map((job) =>
                    job.id === jobId ? { ...job, isBookmarked: !isBookmarked } : job
                ),
            }));

            // 서버에 북마크 상태 변경 요청
            if (isBookmarked) {
                await removeBookmark(jobId);
            } else {
                await addBookmark(jobId);
            }

            // 북마크 목록 갱신
            await getBookmark();
        } catch (error) {
            console.error('북마크 토글 중 오류 발생:', error);
            // 실패 시 원래 상태로 복구
            useSearchStore.setState((state) => ({
                searchList: state.searchList.map((job) =>
                    job.id === jobId ? { ...job, isBookmarked: isBookmarked } : job
                ),
            }));
        }
    };

    const handlePageChange = (pageNum: number) => {
        setCurrentPage(pageNum);
        jobListRef.current?.querySelector(`.${style.jobList__content}`)?.scrollTo(0, 0);
    };

    useEffect(() => {
        async function fetchSearchList() {
            try {
                setIsLoading(true);
                await getSearchList(query, currentPage, 24); // 0 페이지가 1페이지, 백에서 페이징까지 담당
                setIsLoading(false);
            } catch (error) {
                console.error('검색 결과 가져오기 오류: ', error);
                setIsLoading(false);
            }
        }

        fetchSearchList();
    }, [query, goToNextPage, goToPrevPage, currentPage]);

    return (
        <div className={style.container} ref={jobListRef}>
            <div className={style.header}>
                <h2 className={style.header__title}>"{query}"</h2>
                <p className={style.header__subtitle}> 에 대한 검색 결과</p>
            </div>
            {isLoading ? (
                <div className={style.loading}>
                    <div className={style.loading__spinner}></div>
                    <p>검색 결과를 불러오는 중...</p>
                </div>
            ) : searchList && searchList.length > 0 ? (
                <>
                    <div className={style.grid}>
                        {searchList.map((job) => (
                            <SearchCard
                                key={job.id}
                                job={{
                                    ...job,
                                    isBookmarked: !!bookmarkedList?.some((b) => b.id === job.id),
                                }}
                                isSelected={false}
                                onToggleBookmark={() => toggleBookmark(job.id)}
                            />
                        ))}
                    </div>
                    {isLoading ? (
                        ''
                    ) : (
                        <div className={style.jobList__pagination}>
                            {calculatedTotalPages > 1 && (
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
                                        {Array.from({ length: calculatedTotalPages }, (_, i) => i)
                                            .filter(
                                                (page) =>
                                                    page === 0 || // 첫 페이지 (0)
                                                    page === calculatedTotalPages - 1 || // 마지막 페이지
                                                    Math.abs(page - currentPage) <= 1 // 현재 페이지 전후 1쪽
                                            )
                                            .map((page, index, array) => {
                                                if (index > 0 && array[index - 1] !== page - 1) {
                                                    return (
                                                        <React.Fragment key={`ellipsis-${page}`}>
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
                                                            currentPage === page ? style.active : ''
                                                        }`}
                                                        onClick={() => handlePageChange(page)}>
                                                        {page + 1}
                                                    </button>
                                                );
                                            })}
                                    </div>

                                    <button
                                        className={`${style.jobList__paginationButton} ${
                                            currentPage === calculatedTotalPages
                                                ? style.disabled
                                                : ''
                                        }`}
                                        onClick={goToNextPage}
                                        disabled={currentPage === calculatedTotalPages}>
                                        다음
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className={style.empty}>
                    <BookmarkIcon size={48} className={style.empty__icon} />
                    <h3 className={style.empty__title}>{query}에 대한 검색 결과가 없습니다</h3>
                    <p className={style.empty__message}>다른 키워드로 검색 해보세요</p>
                </div>
            )}
        </div>
    );
}

export default SearchPage;
