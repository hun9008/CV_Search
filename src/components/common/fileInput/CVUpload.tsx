import style from './CVUpload.module.scss';
import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileText, X, Check, AlertCircle, FolderPen } from 'lucide-react';
import useFileStore from '../../../store/fileStore';
import useS3Store from '../../../store/s3Store';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/authStore';
import useUserStore from '../../../store/userStore';
import useJobStore from '../../../store/jobStore';

function CVUpload() {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isChangingName, setIsChangingName] = useState(false);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { setFile, uploadFile } = useFileStore();
    const { fetchUserData } = useUserStore();
    const file = useFileStore((state) => state.file);
    const { getUploadPresignedURL } = useS3Store();
    const { getJobList, getSelectedCvId } = useJobStore();
    const navigate = useNavigate();
    const TOTAL_JOB = 80;

    const handleContinue = () => {
        navigate('/main/recommend');
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = async (selectedFile?: File) => {
        try {
            const accessToken = useAuthStore.getState().accessToken;
            await fetchUserData(accessToken);
        } catch (error) {
            console.log('회원 검증 중 에러 발생: ', error);
            setError('회원 가입 후 자신의 CV에 맞는 공고를 추천 받아 보세요');
            return;
        }
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

        setIsChangingName(true);
    };

    const fileUpload = async (selectedFile: File, presignedURL: string) => {
        setIsUploading(true);
        setUploadSuccess(false);

        try {
            const res = await uploadFile(selectedFile, presignedURL, fileName);
            if (res === 400 || res === 403) {
                setIsUploading(false);
                if (res === 400) {
                    setError('같은 별명의 CV가 이미 존재합니다');
                } else {
                    setError('goodJob 서비스 정책에 위반되는 CV입니다.');
                }
                setFile(null);
                setIsUploading(false);
                return;
            }
            const selectedCVId = await getSelectedCvId();
            await getJobList(TOTAL_JOB, selectedCVId);
        } catch (error) {
            console.error('CV 업로드 에러: ', error);
            setFile(null);
            setIsUploading(false);
        }

        setIsUploading(false);
        setUploadSuccess(true);
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
        setIsChangingName(false);
        setFileName('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    // 파일 이름 입력 핸들러
    const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setFileName(e.target.value);
    };

    // 파일 이름 제출 핸들러
    const handleFileNameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (fileName) {
            try {
                const presignedURL = await getUploadPresignedURL(fileName);
                if (typeof presignedURL === 'string' && presignedURL) {
                    if (file) {
                        setIsChangingName(false);
                        await fileUpload(file, presignedURL);
                    } else {
                        setError('파일이 선택되지 않았습니다.');
                    }
                } else {
                    setError('업로드 URL을 받아오는 데 실패했습니다.');
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    setError(error.message);
                }
            }
        } else {
            setError('CV의 별명을 입력해주세요!');
        }
    };

    return (
        <div className={style.container}>
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

                        <div className={style.fileButtonContainer}>
                            <button
                                className={style.dragAndDropCard__button}
                                onClick={handleButtonClick}>
                                파일에서 선택
                            </button>
                        </div>
                    </div>
                )}

                {file && !isChangingName && (
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
                            <>
                                <div className={style.uploadSuccess}>
                                    <Check size={20} />
                                    <span>업로드 완료</span>
                                </div>

                                <div className={style.buttonContainer}>
                                    <button
                                        className={`${style.dragAndDropCard__button} ${
                                            !file || isUploading ? style.disabled : ''
                                        }`}
                                        onClick={handleContinue}
                                        disabled={!file || isUploading}>
                                        계속하기
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {file && isChangingName && (
                    <div className={style.filePreview}>
                        <div className={style.filePreview__header}>
                            <div className={style.filePreview__icon}>
                                <FolderPen size={32} />
                            </div>
                            <div className={style.filePreview__info}>
                                <form onSubmit={handleFileNameSubmit}>
                                    <input
                                        type="text"
                                        placeholder="CV 별명"
                                        value={fileName}
                                        onChange={handleFileNameChange}
                                        className={style.searchInput}
                                    />
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {error && (
                <div className={style.errorMessage}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className={style.terms}>
                <p className={style.terms__main}>
                    이력서를 업로드하면 맞춤 공고와 피드백을 제공합니다.
                </p>
                <br />
                <p className={style.terms}>
                    goodJob에 파일을 업로드함으로써, 당사 이용약관에 동의하고
                </p>
                <p className={style.terms}>개인정보 보호 정책에 읽은 것으로 간주합니다.</p>
            </div>
        </div>
    );
}

export default CVUpload;
