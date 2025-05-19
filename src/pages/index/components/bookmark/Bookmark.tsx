import { useEffect, useState } from 'react';
import style from './styles/Bookmark.module.scss';
import useBookmarkStore from '../../../../store/bookmarkStore';
import BookmarkCard from './BookmarkCard';
import { BookmarkIcon } from 'lucide-react';
import JobDetailDialog from './JobDetailDialog';
// import useJobStore from '../../../../store/jobStore';

function Bookmark() {
    const { getBookmark, removeBookmark } = useBookmarkStore();
    // const { setSelectedJob } = useJobStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
    const bookmarkList = useBookmarkStore((state) => state.bookmarkList);
    const [isLoading, setIsLoading] = useState(true);

    const toggleBookmark = async (jobId: number) => {
        await removeBookmark(jobId);
        await getBookmark();
    };

    useEffect(() => {
        const fetchBookmarks = async () => {
            setIsLoading(true);
            if (!bookmarkList || bookmarkList.length === 0) {
                await getBookmark();
            }

            setIsLoading(false);
        };

        fetchBookmarks();
    }, []);

    return (
        <>
            <div className={style.container}>
                <div className={style.header}>
                    <h2 className={style.header__title}>북마크한 공고</h2>
                    <p className={style.header__subtitle}>관심있는 공고를 모아서 확인하세요</p>
                </div>

                {isLoading ? (
                    <div className={style.loading}>
                        <div className={style.loading__spinner}></div>
                        <p>북마크를 불러오는 중...</p>
                    </div>
                ) : bookmarkList && bookmarkList.length > 0 ? (
                    <div className={style.grid}>
                        {bookmarkList.map((job) => (
                            <BookmarkCard
                                key={job.id}
                                job={{
                                    ...job,
                                    isBookmarked: true,
                                }}
                                isSelected={selectedJobId === job.id}
                                onToggleBookmark={() => toggleBookmark(job.id)}
                                setSelectedJobId={setSelectedJobId}
                                setIsDialogOpen={setIsDialogOpen}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={style.empty}>
                        <BookmarkIcon size={48} className={style.empty__icon} />
                        <h3 className={style.empty__title}>북마크한 공고가 없습니다</h3>
                        <p className={style.empty__message}>
                            관심있는 공고를 북마크하여 모아보세요
                        </p>
                    </div>
                )}
            </div>

            {isDialogOpen && selectedJobId && (
                <JobDetailDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    jobId={selectedJobId}
                />
            )}
        </>
    );
}

export default Bookmark;
