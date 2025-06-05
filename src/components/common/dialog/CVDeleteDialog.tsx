import { useEffect, useRef, useState } from 'react';
import style from './styles/CVDeleteDialog.module.scss';
import { AlertTriangle, Clock } from 'lucide-react';
import useFileStore from '../../../store/fileStore';
import LoadingSpinner from '../loading/LoadingSpinner';
import useActionStore from '../../../store/actionStore';
import useCvStore from '../../../store/cvStore';
import useJobStore from '../../../store/jobStore';

interface CVDeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    fileName: string;
}

function CVDeleteDialog({ isOpen, onClose, fileName }: CVDeleteDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const [isChecked, setIsChecked] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [showCountdown, setShowCountdown] = useState(false);
    const { removeFile, setHasFile } = useFileStore();
    const { setCVAction } = useActionStore();
    const { getUserCvList } = useCvStore();
    const { getSelectedCvId } = useJobStore();

    const handleOutsideClick = (e: MouseEvent) => {
        if (!isDeleting) {
            return;
        }
        if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const handleDelete = async () => {
        if (!isChecked) {
            setShowCountdown(true);
            return;
        }
        setIsDeleting(true);
        const res = await removeFile(fileName);
        await getSelectedCvId();

        await getSelectedCvId();

        if (res === 200) {
            setCVAction((prev) => !prev);
            setHasFile(false);
            getUserCvList();
            onClose();
            setIsDeleting(false);
            console.log('CV delete Success!!!');
        } else {
            console.log('CV delete Error!!!');
        }
    };

    useEffect(() => {
        if (isOpen && !isDeleting) {
            document.addEventListener('mousedown', handleOutsideClick);
            return () => {
                document.removeEventListener('mousedown', handleOutsideClick);
            };
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        if (showCountdown && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            setShowCountdown(false);
            setCountdown(5);
        }
    }, [showCountdown, countdown]);

    useEffect(() => {}, [isDeleting]);
    useEffect(() => {
        if (isOpen) {
            setIsChecked(false);
            setShowCountdown(false);
            setCountdown(10);
        }
    }, [isOpen]);

    return (
        <div className={`${style.modalOverlay} ${isOpen ? '' : style.hidden}`}>
            <div className={style.container} ref={dialogRef}>
                <div className={style.container__header}>
                    <h3>
                        <AlertTriangle size={24} />
                        CV 삭제 경고
                    </h3>
                    <p>
                        CV를 삭제하면 <strong>모든 맞춤형 추천 서비스</strong>와{' '}
                        <strong>피드백 기능</strong>을 더 이상 이용할 수 없게 됩니다.
                    </p>
                    <div className={style.warning}>
                        이 작업은 <strong>영구적</strong>이며 삭제된 CV는{' '}
                        <strong>복구할 수 없습니다</strong>.
                    </div>

                    <div className={style.checkbox}>
                        <input
                            type="checkbox"
                            id="confirm-delete"
                            checked={isChecked}
                            onChange={(e) => setIsChecked(e.target.checked)}
                        />
                        <label htmlFor="confirm-delete">
                            CV 삭제의 결과를 이해했으며 진행하겠습니다
                        </label>
                    </div>
                </div>

                <div className={style.container__content}>
                    {isDeleting ? (
                        <button className={`${style.button} ${style.cancel}`} disabled={true}>
                            취소하기
                        </button>
                    ) : (
                        <button className={`${style.button} ${style.cancel}`} onClick={onClose}>
                            취소하기
                        </button>
                    )}

                    <button
                        className={`${style.button} ${style.delete}`}
                        onClick={handleDelete}
                        disabled={showCountdown}>
                        {showCountdown ? (
                            <span className={style.countdown}>
                                <Clock size={14} /> {countdown}초 후 활성화
                            </span>
                        ) : isDeleting ? (
                            <LoadingSpinner />
                        ) : (
                            '삭제하기'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CVDeleteDialog;
