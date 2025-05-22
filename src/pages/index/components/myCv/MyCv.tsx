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
    const { uploadFile, getSummary, setHasFile } = useFileStore();
    const { getUploadPresignedURL } = useS3Store();
    const [error, setError] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);
    // 로딩
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [isReuploadLoading, setIsReuploadLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [reuploadDialogHidden, setReuploadDialogHidden] = useState(false);
    const [deleteDialogHidden, setDeleteDialogHidden] = useState(false);
    const hasFile = useFileStore((state) => state.hasFile);
    const summaryText = useFileStore((state) => state.summary);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        validateAndSetFile(selectedFile);
    };
    // const validateAndSetFile = async (selectedFile?: File) => {
    //     setError(null);
    //     setIsReuploadLoading(true);
    //     if (!selectedFile) return;

    //     const fileExtension = `.${selectedFile.name.split('.').pop()?.toLowerCase()}`;
    //     if (fileExtension !== '.pdf') {
    //         setError('PDF 파일만 업로드 가능합니다.');
    //         return;
    //     }
    //     const maxFileSize = 5;
    //     const fileSize = selectedFile.size / (1024 * 1024);

    //     if (fileSize > maxFileSize) {
    //         setError(`파일 크기는 5MB 이하여야 합니다. ${error}`);
    //         return;
    //     }
    //     setFile(selectedFile);
    //     console.log(file); // 나중에 삭제

    //     try {
    //         const presignedURL = await getUploadPresignedURL();
    //         if (typeof presignedURL === 'string' && presignedURL) {
    //             await uploadFile(selectedFile, presignedURL);
    //         } else {
    //             setError('업로드 URL을 받아오는 데 실패했습니다.');
    //             throw error;
    //         }
    //     } catch (error) {
    //         console.log(error);
    //     } finally {
    //         console.log('CV 재업로드 완료');
    //         setIsReuploadLoading(false);
    //         setHasFile(true);
    //     }
    // };

    const validateAndSetFile = async (selectedFile?: File) => {
        setError(null);
        setIsReuploadLoading(true);
        if (!selectedFile) return;

        const fileExtension = `.${selectedFile.name.split('.').pop()?.toLowerCase()}`;
        if (fileExtension !== '.pdf') {
            setError('PDF 파일만 업로드 가능합니다.');
            console.error(error);
            setIsReuploadLoading(false);
            return;
        }

        const maxFileSize = 5; // MB
        const fileSize = selectedFile.size / (1024 * 1024);

        if (fileSize > maxFileSize) {
            setError(`파일 크기는 5MB 이하여야 합니다.`);
            setIsReuploadLoading(false);
            return;
        }

        console.log('파일 준비 완료:', selectedFile.name);

        try {
            console.time('⏱️ getUploadPresignedURL');
            const presignedURL = await getUploadPresignedURL();
            console.timeEnd('⏱️ getUploadPresignedURL');

            if (typeof presignedURL === 'string' && presignedURL) {
                console.time('⏱️ uploadFile');
                await uploadFile(selectedFile, presignedURL);
                console.timeEnd('⏱️ uploadFile');
            } else {
                setError('업로드 URL을 받아오는 데 실패했습니다.');
                throw new Error('Invalid presigned URL');
            }
        } catch (error) {
            console.error('업로드 중 오류 발생:', error);
            setError('파일 업로드 중 오류가 발생했습니다.');
        } finally {
            console.log('📄 CV 재업로드 완료');
            setIsReuploadLoading(false);
            setHasFile(true);
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
                    setIsSummaryLoading(true);
                    await getSummary();
                }
            } catch (error) {
                console.error('데이터 가져오기 에러:', error);
                setHasError(true);
            } finally {
                setIsSummaryLoading(false);
            }
        };
        fetchCVSummary();
    }, [hasFile]);

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
                        ) : isSummaryLoading ? (
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

                            {isReuploadLoading ? (
                                <LoadingSpinner />
                            ) : (
                                <>
                                    <CloudUpload size={18} />
                                    CV 재업로드
                                </>
                            )}
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
