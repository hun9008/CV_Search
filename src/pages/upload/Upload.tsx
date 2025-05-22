import { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileText, X, Check, AlertCircle } from 'lucide-react';
import style from './styles/Upload.module.scss';
import { useNavigate } from 'react-router-dom';
import useFileStore from '../../store/fileStore';
import useS3Store from '../../store/s3Store';

function Upload() {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const { setFile, uploadFile } = useFileStore();
    const file = useFileStore((state) => state.file);
    const { getUploadPresignedURL } = useS3Store();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = async (selectedFile?: File) => {
        setError(null);

        if (!selectedFile) return;

        // 파일 타입 검증
        const fileExtension = `.${selectedFile.name.split('.').pop()?.toLowerCase()}`;
        if (fileExtension !== '.pdf') {
            setError('PDF 파일만 업로드 가능합니다.');
            return;
        }

        // 파일 크기 검증 (5MB)
        const maxSizeMB = 5;
        const fileSizeMB = selectedFile.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            setError(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
            return;
        }
        setFile(selectedFile); // 파일 세팅
        try {
            const presignedURL = await getUploadPresignedURL(); // 서버로부터 S3 업로드 URL을 받아옴
            if (typeof presignedURL === 'string' && presignedURL) {
                fileUpload(selectedFile, presignedURL);
            } else {
                setError('업로드 URL을 받아오는 데 실패했습니다.');
            }
        } catch (error) {
            console.log(error);
        }
    };

    const fileUpload = (selectedFile: File, presignedURL: string) => {
        setIsUploading(true);
        setUploadSuccess(false);

        uploadFile(selectedFile, presignedURL);

        // pdf 업로드와 스프링 서버의 CV 처리 시간을 벌어줌
        setTimeout(() => {
            setIsUploading(false);
            setUploadSuccess(true);
        }, 10000);
    };

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    }, []);

    const handleRemoveFile = () => {
        setFile(null);
        setUploadSuccess(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    /** 나중에 할래요 버튼 처리 로직 */
    const handleSkip = () => {
        navigate('/');
    };

    const handleContinue = () => {
        // 계속하기 버튼 처리 로직
        if (file && uploadSuccess) {
            console.log('Continue with uploaded file:', file.name);
            navigate('/main', { replace: true });
            // 여기에 다음 페이지로 이동하는 로직 추가
        } else {
            setError('계속하려면 CV를 업로드해주세요.');
        }
    };

    return (
        <div className={style.page}>
            <div className={style.container}>
                <div className={style.title}>
                    <h1 className={style.title__text}>CV를 업로드하세요</h1>
                    <p className={style.title__subtext}>
                        업로드하지 않으면 맞춤 공고 추천을 받을 수 없습니다.
                    </p>
                </div>

                <div
                    className={`${style.dragAndDropCard} ${isDragging ? style.dragging : ''} ${
                        error ? style.error : ''
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf"
                        className={style.hiddenInput}
                    />

                    {!file && (
                        <div className={style.uploadPlaceholder}>
                            <div className={style.uploadIcon}>
                                <UploadCloud size={48} strokeWidth={1.5} />
                            </div>
                            <p className={style.dragAndDropCard__text}>
                                CV를 여기에 드래그하여 업로드하세요
                            </p>
                            <div className={style.fileInfo}>
                                <p className={style.dragAndDropCard__subtext}>지원 파일: PDF</p>
                                <p className={style.dragAndDropCard__subtext}>용량 제한: 5 MB</p>
                            </div>

                            <div className={style.dragAndDropCard__divider}>
                                <span>또는</span>
                            </div>

                            <button
                                className={style.dragAndDropCard__button}
                                onClick={handleButtonClick}>
                                파일에서 선택
                            </button>
                        </div>
                    )}

                    {file && (
                        <div className={style.filePreview}>
                            <div className={style.filePreview__header}>
                                <div className={style.filePreview__icon}>
                                    <FileText size={32} />
                                </div>
                                <div className={style.filePreview__info}>
                                    <p className={style.filePreview__name}>{file.name}</p>
                                    <p className={style.filePreview__size}>
                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                                <button
                                    className={style.filePreview__remove}
                                    onClick={handleRemoveFile}
                                    disabled={isUploading}
                                    aria-label="파일 제거">
                                    <X size={20} />
                                </button>
                            </div>

                            {isUploading && (
                                <div className={style.uploadProgress}>
                                    <div className={style.uploadProgress__bar}>
                                        <div className={style.uploadProgress__fill}></div>
                                    </div>
                                    <p className={style.uploadProgress__text}>업로드 중...</p>
                                </div>
                            )}
                            {uploadSuccess && (
                                <div className={style.uploadSuccess}>
                                    <Check size={20} />
                                    <span>업로드 완료</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {error && (
                    <div className={style.errorMessage}>
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <div className={style.continueButtons}>
                    <button className={style.continueButtons__skip} onClick={handleSkip}>
                        나중에 할래요
                    </button>
                    <button
                        className={`${style.dragAndDropCard__button} ${
                            !file || isUploading ? style.disabled : ''
                        }`}
                        onClick={handleContinue}
                        disabled={!file || isUploading}>
                        계속하기
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Upload;
