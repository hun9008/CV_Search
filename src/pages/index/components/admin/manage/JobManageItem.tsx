import { useState, useRef, useEffect } from 'react';
import style from './JobManageItem.module.scss';
import { Trash, MoreHorizontal } from 'lucide-react';
import { JobBrief } from '../../../../../types/jobBrief';

interface JobManageItemProps {
    job: JobBrief;
    onRemove: () => void;
    onStatusChange: (status: number) => void;
    statusOptions: string[];
}

function JobManageItem({ job, onRemove, onStatusChange, statusOptions }: JobManageItemProps) {
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const actionsMenuRef = useRef<HTMLDivElement>(null);

    // 상태에 따른 색상 매핑
    const getStatusColor = (vaildType: number | null) => {
        switch (vaildType) {
            case 0:
                return '#4caf50';
            case 1:
                return '#f44336';
            case 2:
                return '#f44336';
            default:
                return '#9e9e9e';
        }
    };

    // 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // 상태 드롭다운 외부 클릭
            if (
                statusDropdownRef.current &&
                !statusDropdownRef.current.contains(event.target as Node)
            ) {
                setShowStatusDropdown(false);
            }

            // 액션 메뉴 외부 클릭
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
                setShowActions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    return (
        <div className={style.item}>
            <div className={style.item__cell}>
                <div className={style.item__text}>{job.title}</div>
            </div>

            <div className={style.item__cell}>
                <div className={style.item__text}>{job.companyName}</div>
            </div>

            <div className={style.item__cell}>
                <div className={style.item__date}>{formatDate(job.createdAt)}</div>
            </div>

            <div className={style.item__cell}>
                <div className={style.item__date}>{formatDate(job.applyEndDate)}</div>
            </div>

            <div className={style.item__cell}>
                <div className={style.item__statusContainer} ref={statusDropdownRef}>
                    <button
                        className={style.item__status}
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                        style={{ backgroundColor: getStatusColor(job.jobVaildType) }}>
                        {job.jobVaildType !== null && job.jobVaildType !== undefined
                            ? job.jobVaildType
                            : '확인필요'}
                    </button>

                    {showStatusDropdown && (
                        <div className={style.item__statusDropdown}>
                            {statusOptions.map((status) => (
                                <div
                                    key={status}
                                    className={style.item__statusOption}
                                    onClick={() => {
                                        let statusNumber: number;
                                        switch (status) {
                                            case '확인 필요':
                                                statusNumber = 3;
                                                break;
                                            case '정상':
                                                statusNumber = 0;
                                                break;
                                            case '마감':
                                                statusNumber = 1;
                                                break;
                                            case '에러':
                                                statusNumber = 2;
                                                break;
                                            default:
                                                statusNumber = 3;
                                        }
                                        onStatusChange(statusNumber);
                                        setShowStatusDropdown(false);
                                    }}>
                                    <span
                                        className={style.item__statusDot}
                                        style={{
                                            backgroundColor: getStatusColor(job.jobVaildType),
                                        }}></span>
                                    {status}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className={style.item__cell}>
                <div className={style.item__actions} ref={actionsMenuRef}>
                    <button
                        className={style.item__actionsButton}
                        onClick={() => setShowActions(!showActions)}>
                        <MoreHorizontal size={16} />
                    </button>

                    {showActions && (
                        <div className={style.item__actionsMenu}>
                            <button
                                className={`${style.item__actionsMenuItem} ${style.item__actionsMenuItemDanger}`}
                                onClick={() => {
                                    onRemove();
                                    setShowActions(false);
                                }}>
                                <Trash size={14} />
                                <span>삭제</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default JobManageItem;
