import { useEffect, useRef } from 'react';
import style from './styles/CVReupload.module.scss';
import { UploadCloud, X } from 'lucide-react';

interface CVReuploadDialog {
    isOpen: boolean;
    onClose: () => void;
}
function CVReuploadDialog({ isOpen, onClose }: CVReuploadDialog) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOutsideClick = (e: MouseEvent) => {
        if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
            onClose();
        }
    };
    const handleButtonClick = () => {};

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
            return () => {
                document.removeEventListener('mousedown', handleOutsideClick);
            };
        }
    }, [isOpen]);

    return (
        <div className={`${style.modalOverlay} ${isOpen ? '' : style.hidden}`}>
            <div className={style.container} ref={dialogRef}>
                <p>다이얼로그</p>
                <button onClick={onClose}>
                    <X />
                    <p>오버레이 닫기</p>
                </button>
                <button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        // onChange={handleFileChange}
                        accept=".pdf"
                        className={style.hiddenInput}
                    />
                </button>
            </div>
        </div>
    );
}

export default CVReuploadDialog;
