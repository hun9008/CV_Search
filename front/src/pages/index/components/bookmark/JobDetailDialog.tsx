import { useEffect, useRef } from 'react';
import style from './styles/JobDetailDialog.module.scss';
import JobDetail from '../jobList/JobDetail';
import { X } from 'lucide-react';

interface JobDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

function JobDetailDialog({ isOpen, onClose }: JobDetailDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={style.overlay}>
            <div className={style.dialog} ref={dialogRef}>
                <div className={style.header}>
                    <button className={style.closeButton} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className={style.content}>
                    <JobDetail isDialog={true} />
                </div>
            </div>
        </div>
    );
}

export default JobDetailDialog;
