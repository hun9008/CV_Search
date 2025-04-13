import style from './styles/index.module.scss';
import { useNavigate } from 'react-router-dom';
import { useCallback, useRef, useState } from 'react'; // 추가
import Header from '../../components/common/header/Header';
import { UploadCloud, FileText, X, Check, AlertCircle } from 'lucide-react';

function Index() {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 여부 기본값 false, 이후 store.ts에서 관리

    const navigate = useNavigate();

    const handleContinue = () => {
        navigate('/main');
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (selectedFile?: File) => {
        setError(null);
        if (!selectedFile) return;

        const fileExtension = `.${selectedFile.name.split('.').pop()?.toLowerCase()}`;
        if (fileExtension !== '.pdf') {
            setError('PDF 파일만 업로드 가능합니다.');
            return;
        }
        const maxFileSize = 5;
        const fileSize = selectedFile.size / (1024 * 1024);

        if (fileSize > maxFileSize) {
            setError('파일 크기는 5MB 이하여야 합니다.');
            return;
        }
        setFile(selectedFile);

        fileUpload();
    };

    const fileUpload = () => {
        setIsUploading(true);
        setUploadSuccess(false);

        console.log('test');
        // 업로드 테스트 => S3 저장으로 변경
        setTimeout(() => {
            setIsUploading(false);
            setUploadSuccess(true);
        }, 2000);
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
        setFile(null); // file 삭제
        setUploadSuccess(false); // 업로드 성공 여부 초기화
        if (fileInputRef.current) {
            // 이건 왜 이렇게?
            fileInputRef.current.value = '';
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const toggleLogin = () => {
        // 테스트용!!!!!! 배포 시 반드시 지울 것
        setIsLoggedIn(!isLoggedIn);
    };

    const handleUploadBoxClick = () => {
        fileInputRef.current.click();
    };

    const moveToMainPage = () => {
        navigate('./upload');
    };

    return (
        <div className={style.page}>
            <Header isLoggedIn={isLoggedIn} />

            <div className={style.page__main}>
                <div className={style.page__content}>
                    <div className={style.page__text}>
                        <h1 className={style.page__title}>
                            goodJob이 찾아주는
                            <br />
                            당신만의 커리어,
                            <br />
                            지금 시작하세요.
                        </h1>
                        <p className={style.page__subtitle}>Get matched with your perfect job</p>
                        {/* <button className={style.page__landingButton} onClick={toggleLogin}>
                            Get Started
                        </button> */}
                        <button className={style.page__landingButton} onClick={moveToMainPage}>
                            Get Started
                        </button>
                    </div>

                    <div className={style.container}>
                        <div
                            className={`${style.dragAndDropCard} ${
                                isDragging ? style.dragging : ''
                            } ${error ? style.error : ''}`}
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
                                        <p className={style.dragAndDropCard__subtext}>
                                            지원 파일: PDF
                                        </p>
                                        <p className={style.dragAndDropCard__subtext}>
                                            용량 제한: 5 MB
                                        </p>
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
                                            <p className={style.uploadProgress__text}>
                                                업로드 중...
                                            </p>
                                        </div>
                                    )}

                                    {uploadSuccess && (
                                        <>
                                            <div className={style.uploadSuccess}>
                                                <Check size={20} />
                                                <span>업로드 완료</span>
                                            </div>
                                            <button
                                                className={`${style.dragAndDropCard__button} ${
                                                    !file || isUploading ? style.disabled : ''
                                                }`}
                                                onClick={handleContinue}
                                                disabled={!file || isUploading}>
                                                계속하기
                                            </button>
                                        </>
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

                        <br />
                        <div className={style.terms}>
                            <p className={style.terms__main}>
                                이력서를 업로드하면 맞춤 공고와 피드백을 제공합니다.
                            </p>
                            <br />
                            <p className={style.terms}>
                                goodJob에 파일을 업로드함으로써, 당사 이용약관에 동의하고
                            </p>
                            <p className={style.terms}>
                                개인정보 보호 정책에 읽은 것으로 간주합니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Index;
