import { useEffect, useState } from 'react';
import style from './CustomerFeedback.module.scss';
import { Filter, Search, Ban } from 'lucide-react';
import FeedbackItem from './FeedbackItem';
import useUserFeedbackStore from '../../../../../store/userFeedbackStore';
import feedback from '../../../../../types/feedback';
import LoadingSpinner from '../../../../../components/common/loading/LoadingSpinner';

type SortField = 'satisfactionScore' | 'createdAt';
type SortOrder = 'asc' | 'desc';

function CustomerFeedback() {
    const feedbackList = useUserFeedbackStore((state) => state.feedbackList);
    const getFeedbackList = useUserFeedbackStore((state) => state.getFeedbackList);
    const deleteFeedback = useUserFeedbackStore((state) => state.removeFeedback);

    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filteredFeedback, setFilteredFeedback] = useState<feedback[] | null>(null);
    const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
        field: 'createdAt',
        order: 'desc',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleFeedbackRemove = async (jobId: number) => {
        await deleteFeedback(jobId);
        await getFeedbackList();
    };

    const handleSort = (field: SortField) => {
        setSortConfig((prev) => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
        }));
    };

    // 검색, 필터링, 정렬 적용
    useEffect(() => {
        if (!feedbackList) return;

        let filtered = [...feedbackList];

        // 검색어 필터링
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (feedback) =>
                    feedback.content.toLowerCase().includes(query) ||
                    feedback.userId.toString().includes(query)
            );
        }

        // 정렬
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortConfig.field) {
                case 'satisfactionScore':
                    comparison = a.satisfactionScore - b.satisfactionScore;
                    break;
                case 'createdAt':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
            }

            return sortConfig.order === 'asc' ? comparison : -comparison;
        });

        setFilteredFeedback(filtered);
    }, [feedbackList, searchQuery, sortConfig]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            await getFeedbackList();
            setIsLoading(false);
        };
        if (!feedbackList || feedbackList.length === 0) {
            fetchData();
        }
    }, []);

    const getSortIcon = (field: SortField) => {
        if (sortConfig.field !== field) return null;
        return sortConfig.order === 'asc' ? '↑' : '↓';
    };

    return (
        <div className={style.container}>
            <div className={style.header}>
                <div className={style.headerText}>
                    <h2 className={style.header__title}>유저 피드백 관리</h2>
                    <p className={style.header__subtitle}>제출된 유저 피드백을 관리하세요</p>
                </div>
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
                                    sortConfig.field === 'satisfactionScore' ? style.active : ''
                                }`}
                                onClick={() => handleSort('satisfactionScore')}>
                                만족도 {getSortIcon('satisfactionScore')}
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
                            <div className={style.listView__cell}>사용자 ID</div>
                            <div className={style.listView__cell}>피드백 내용</div>
                            <div
                                className={style.listView__cell}
                                onClick={() => handleSort('satisfactionScore')}>
                                만족도 {getSortIcon('satisfactionScore')}
                            </div>
                            <div
                                className={style.listView__cell}
                                onClick={() => handleSort('createdAt')}>
                                등록일 {getSortIcon('createdAt')}
                            </div>
                            <div className={style.listView__cell}></div>
                        </div>

                        <div className={style.listView__body}>
                            {filteredFeedback && filteredFeedback.length > 0 ? (
                                filteredFeedback.map((feedback) => (
                                    <FeedbackItem
                                        key={feedback.id}
                                        feedback={feedback}
                                        onRemove={() => handleFeedbackRemove(feedback.id)}
                                    />
                                ))
                            ) : (
                                <div className={style.empty}>
                                    <Ban size={48} className={style.empty__icon} />
                                    <h3 className={style.empty__title}>제출된 피드백이 없습니다</h3>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default CustomerFeedback;
