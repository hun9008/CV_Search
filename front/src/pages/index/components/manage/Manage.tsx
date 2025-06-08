import { useEffect, useState } from 'react';
import ManageItem from './ManageItem';
import style from './styles/Manage.module.scss';
import useApplyStore from '../../../../store/applyStore';
import { Filter, Search } from 'lucide-react';
import type application from '../../../../types/application';

type SortField = 'companyName' | 'jobTitle' | 'createdAt' | 'applyStatus';
type SortOrder = 'asc' | 'desc';

function Manage() {
    const applications = useApplyStore((state) => state.applications);
    const getApplications = useApplyStore((state) => state.getApplications);
    const deleteApplications = useApplyStore((state) => state.deleteApplications);
    const editApplications = useApplyStore((state) => state.editApplications);

    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filteredApplications, setFilteredApplications] = useState<application[] | null>(null);
    const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
        field: 'createdAt',
        order: 'desc',
    });
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 상태 옵션 목록
    const statusOptions = ['준비중', '지원', '서류전형', '코테', '면접', '최종합격', '불합격'];

    const handleApplicationRemove = async (jobId: number) => {
        await deleteApplications(jobId);
        await getApplications();
    };

    const handleStatusChange = async (jobId: number, status: string) => {
        await editApplications(jobId, status, '');
        await getApplications();
    };

    const handleNoteChange = async (jobId: number, note: string) => {
        const currentApplication = applications?.find((app) => app.jobId === jobId);
        if (currentApplication) {
            await editApplications(jobId, currentApplication.applyStatus, note);
            await getApplications();
        }
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

    // 검색, 필터링, 정렬 적용
    useEffect(() => {
        if (!applications) return;

        let filtered = [...applications];

        // 검색어 필터링
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (app) =>
                    app.jobTitle.toLowerCase().includes(query) ||
                    app.companyName.toLowerCase().includes(query) ||
                    (app.note && app.note.toLowerCase().includes(query))
            );
        }

        // 상태 필터링
        if (statusFilter.length > 0) {
            filtered = filtered.filter((app) => statusFilter.includes(app.applyStatus));
        }

        // 정렬
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortConfig.field) {
                case 'companyName':
                    comparison = a.companyName.localeCompare(b.companyName);
                    break;
                case 'jobTitle':
                    comparison = a.jobTitle.localeCompare(b.jobTitle);
                    break;
                case 'createdAt':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case 'applyStatus':
                    comparison = a.applyStatus.localeCompare(b.applyStatus);
                    break;
            }

            return sortConfig.order === 'asc' ? comparison : -comparison;
        });

        setFilteredApplications(filtered);
    }, [applications, searchQuery, statusFilter, sortConfig]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            await getApplications();
            setIsLoading(false);
        };
        if (!applications || applications.length === 0) {
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
                <div className={style.header__titleSection}>
                    <h2 className={style.header__title}>지원 관리</h2>
                    <p className={style.header__subtitle}>
                        모든 지원 현황을 한곳에 모으고 관리하세요
                    </p>
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
                        className={`${style.header__filterButton} ${
                            showFilters ? style.active : ''
                        }`}
                        onClick={() => setShowFilters(!showFilters)}>
                        <Filter size={16} />
                        <span>필터</span>
                    </button>
                </div>
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
                <div className={style.loading}>
                    <div className={style.loading__spinner}></div>
                    <p>데이터를 불러오는 중...</p>
                </div>
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
                                북마크 일자 {getSortIcon('createdAt')}
                            </div>
                            <div className={style.listView__cell}>메모</div>
                            <div className={style.listView__cell}>상태</div>
                            <div className={style.listView__cell}></div>
                        </div>

                        <div className={style.listView__body}>
                            {filteredApplications && filteredApplications.length > 0 ? (
                                filteredApplications.map((job) => (
                                    <ManageItem
                                        key={job.jobId}
                                        job={job}
                                        onRemove={() => handleApplicationRemove(job.jobId)}
                                        onStatusChange={(status) =>
                                            handleStatusChange(job.jobId, status)
                                        }
                                        onNoteChange={(note) => handleNoteChange(job.jobId, note)}
                                        statusOptions={statusOptions}
                                    />
                                ))
                            ) : (
                                <div className={style.emptyState}>
                                    <p>지원 내역이 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Manage;
