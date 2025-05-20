import React, { useState, useEffect, useRef, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import useFileStore from '../../../../store/fileStore';
import CvViewer from './CvViewer';
import style from './styles/MyCv.module.scss';
import { Trash, CloudUpload } from 'lucide-react';
import CVDeleteDialog from '../../../../components/common/dialog/CVDeleteDialog';
import CVReuploadDialog from '../../../../components/common/dialog/CVReuploadDialog';
import useS3Store from '../../../../store/s3Store';
import Loading from '../../../../components/common/loading/Loading';
import ErrorFallback from '../../../../components/common/error/ErrorFallback';
import LoadingSpinner from '../../../../components/common/loading/LoadingSpinner';
import { parseMarkdown } from '../../utils/markdown';
// import { parseMarkdown } from '../../utils/markdown';

function MyCv() {
    const { uploadFile, getSummary } = useFileStore();
    const { getUploadPresignedURL } = useS3Store();
    const [error, setError] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [reuploadDialogHidden, setReuploadDialogHidden] = useState(false);
    const [deleteDialogHidden, setDeleteDialogHidden] = useState(false);
    const summaryText = useFileStore((state) => state.summary);
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        validateAndSetFile(selectedFile);
    };
    const validateAndSetFile = async (selectedFile?: File) => {
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
            setError(`파일 크기는 5MB 이하여야 합니다. ${error}`);
            return;
        }
        setFile(selectedFile);
        console.log(file); // 나중에 삭제

        try {
            const presignedURL = await getUploadPresignedURL(); // 서버로부터 S3 업로드 URL을 받아옴
            if (typeof presignedURL === 'string' && presignedURL) {
                uploadFile(selectedFile, presignedURL);
            } else {
                setError('업로드 URL을 받아오는 데 실패했습니다.');
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleDeleteCV = async () => {
        setDeleteDialogHidden((prev) => !prev);
    };

    // const handleReUploadCV = async () => {
    //     setReuploadDialogHidden((prev) => !prev);
    //     // if (res === 200) {
    //     // }
    // };

    useEffect(() => {
        const fetchCVSummary = async () => {
            try {
                if (!summaryText || summaryText.length === 0) {
                    setIsLoading(true);
                    await getSummary();
                }
            } catch (error) {
                console.error('데이터 가져오기 에러:', error);
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCVSummary();
    }, []);

    return (
        <>
            {deleteDialogHidden && (
                <CVDeleteDialog
                    isOpen={deleteDialogHidden}
                    onClose={() => setDeleteDialogHidden((prev) => !prev)}
                />
            )}
            {reuploadDialogHidden && (
                <CVReuploadDialog
                    isOpen={reuploadDialogHidden}
                    onClose={() => setReuploadDialogHidden((prev) => !prev)}
                />
            )}
            <div className={style.container}>
                <div className={style.info}>
                    <ErrorBoundary FallbackComponent={ErrorFallback}>
                        {hasError ? (
                            <div className={style.info__content__error}>
                                <ErrorFallback />
                            </div>
                        ) : isLoading ? (
                            <LoadingSpinner />
                        ) : (
                            <Suspense fallback={<Loading content="Summary" />}>
                                <div className={style.info__content}>
                                    <h2>요약</h2>
                                    <div
                                        className={style.feedbackText}
                                        dangerouslySetInnerHTML={{
                                            __html: parseMarkdown(summaryText ?? ''),
                                        }}></div>
                                </div>
                            </Suspense>
                        )}
                    </ErrorBoundary>

                    <div className={style.buttons}>
                        <button className={style.button} onClick={handleDeleteCV}>
                            <Trash size={18} />
                            업로드된 CV 제거
                        </button>
                        <button className={style.button} onClick={handleButtonClick}>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className={style.hiddenInput}
                                ref={fileInputRef}
                            />
                            <CloudUpload size={18} />
                            CV 재업로드
                        </button>
                    </div>
                </div>
                <div className={style.cvviewer}>
                    <CvViewer />
                </div>
            </div>
        </>
    );
}

export default MyCv;
