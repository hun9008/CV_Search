import { useState, useRef, useEffect } from 'react';
import type feedback from '../../../../../types/feedback';
import style from './FeedbackItem.module.scss';
import { Trash, MoreHorizontal } from 'lucide-react';
import UniversalDialog from '../../../../../components/common/dialog/UniversalDialog';

interface FeedbackItemProps {
    feedback: feedback;
    onRemove: () => void;
}

function FeedbackItem({ feedback, onRemove }: FeedbackItemProps) {
    const [showActions, setShowActions] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const actionsMenuRef = useRef<HTMLDivElement>(null);
    const feedbackTextRef = useRef<HTMLDialogElement>(null);

    // 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // 액션 메뉴 외부 클릭
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
                setShowActions(false);
            }
            if (
                feedbackTextRef.current &&
                !feedbackTextRef.current.contains(event.target as Node)
            ) {
                setShowFeedback(false);
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

    const handleViewFeedback = () => {
        setShowFeedback(true);
    };

    return (
        <>
            {showFeedback ? (
                <UniversalDialog
                    isOpen={showFeedback}
                    onClose={() => setShowFeedback(false)}
                    feedback={feedback}
                />
            ) : (
                ''
            )}
            <div className={style.item}>
                <div className={style.item__cell}>
                    <div className={style.item__text}>{feedback.userId}</div>
                </div>

                <div className={style.item__cell}>
                    <div className={style.item__feedbackText} onClick={handleViewFeedback}>
                        {feedback.content}
                    </div>
                </div>

                <div className={style.item__cell}>
                    <div className={style.item__date}>{feedback.satisfactionScore}</div>
                </div>

                <div className={style.item__cell}>
                    <div className={style.item__date}>{formatDate(feedback.createdAt)}</div>
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
        </>
    );
}

export default FeedbackItem;
