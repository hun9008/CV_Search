import styles from './styles/FeedbackDialog.module.scss';
import { parseMarkdown } from '../../../../utils/markdown';
import { X } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface FeedbackProps {
    isOpen: boolean;
    onClose: () => void;
    feedback: string;
}

function Feedback({ isOpen, onClose, feedback }: FeedbackProps) {
    const feedbackRef = useRef<HTMLDivElement>(null);

    const handleOutsideClick = (e: MouseEvent) => {
        if (feedbackRef.current && !feedbackRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
            return () => {
                document.removeEventListener('mousedown', handleOutsideClick);
            };
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modal} ${isOpen ? '' : styles.hidden}`} ref={feedbackRef}>
                <div className={styles.modal__header}>
                    <h2 className={styles.modal__header__title}>피드백</h2>
                    <X className={styles.modal__closeButton} size={30} onClick={onClose} />
                </div>
                <div className={styles.modal__content}>
                    <div
                        className={styles.modal__feedbackText}
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(feedback) }}
                    />
                </div>
            </div>
        </div>
    );
}

export default Feedback;
