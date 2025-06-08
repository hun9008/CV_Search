import { useState, useRef, useEffect } from 'react';
import type application from '../../../../types/application';
import style from './styles/ManageItem.module.scss';
import { Trash, Check, X, MoreHorizontal } from 'lucide-react';

interface ManageItemProps {
    job: application;
    onRemove: () => void;
    onStatusChange: (status: string) => void;
    onNoteChange: (note: string) => void;
    statusOptions: string[];
}

function ManageItem({
    job,
    onRemove,
    onStatusChange,
    onNoteChange,
    statusOptions,
}: ManageItemProps) {
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [editedNote, setEditedNote] = useState(job.note || '');
    const noteInputRef = useRef<HTMLTextAreaElement>(null);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const actionsMenuRef = useRef<HTMLDivElement>(null);

    // 상태에 따른 색상 매핑
    const getStatusColor = (status: string) => {
        switch (status) {
            case '준비중':
                return '#9e9e9e';
            case '지원':
                return '#2196f3';
            case '서류전형':
                return '#ff9800';
            case '코테':
                return '#9c27b0';
            case '면접':
                return '#673ab7';
            case '최종합격':
                return '#4caf50';
            case '불합격':
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

    // 편집 모드 활성화 시 자동 포커스
    useEffect(() => {
        if (isEditingNote && noteInputRef.current) {
            noteInputRef.current.focus();
        }
    }, [isEditingNote]);

    const handleNoteEdit = () => {
        setIsEditingNote(true);
    };

    const handleNoteSave = () => {
        setIsEditingNote(false);
        onNoteChange(editedNote);
    };

    const handleNoteCancel = () => {
        setEditedNote(job.note || '');
        setIsEditingNote(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    return (
        <div className={style.item}>
            <div className={style.item__cell}>
                <div className={style.item__text}>{job.jobTitle}</div>
            </div>

            <div className={style.item__cell}>
                <div className={style.item__text}>{job.companyName}</div>
            </div>

            <div className={style.item__cell}>
                <div className={style.item__date}>{formatDate(job.createdAt)}</div>
            </div>

            <div className={style.item__cell}>
                {isEditingNote ? (
                    <div className={style.item__editField}>
                        <textarea
                            ref={noteInputRef}
                            value={editedNote}
                            onChange={(e) => setEditedNote(e.target.value)}
                            className={style.item__textarea}
                            placeholder="메모를 입력하세요..."
                        />
                        <div className={style.item__editActions}>
                            <button className={style.item__editButton} onClick={handleNoteSave}>
                                <Check size={16} />
                            </button>
                            <button className={style.item__editButton} onClick={handleNoteCancel}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        className={`${style.item__note} ${
                            !job.note ? style.item__notePlaceholder : ''
                        }`}
                        onClick={handleNoteEdit}>
                        {job.note || '메모 추가...'}
                    </div>
                )}
            </div>

            <div className={style.item__cell}>
                <div className={style.item__statusContainer} ref={statusDropdownRef}>
                    <button
                        className={style.item__status}
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                        style={{ backgroundColor: getStatusColor(job.applyStatus) }}>
                        {job.applyStatus}
                    </button>

                    {showStatusDropdown && (
                        <div className={style.item__statusDropdown}>
                            {statusOptions.map((status) => (
                                <div
                                    key={status}
                                    className={style.item__statusOption}
                                    onClick={() => {
                                        onStatusChange(status);
                                        setShowStatusDropdown(false);
                                    }}>
                                    <span
                                        className={style.item__statusDot}
                                        style={{ backgroundColor: getStatusColor(status) }}></span>
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

export default ManageItem;
