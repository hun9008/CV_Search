import { useState, useEffect, useRef, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import useFileStore from '../../../../store/fileStore';
import CvViewer from './CvViewer';
import style from './styles/MyCv.module.scss';
import { Trash, CloudUpload } from 'lucide-react';
import CVReuploadDialog from '../../../../components/common/dialog/CVReuploadDialog';
import Loading from '../../../../components/common/loading/Loading';
import ErrorFallback from '../../../../components/common/error/ErrorFallback';
import LoadingSpinner from '../../../../components/common/loading/LoadingSpinner';
import { parseMarkdown } from '../../../../utils/markdown';
import { useLocation, useNavigate } from 'react-router-dom';
import useCvStore from '../../../../store/cvStore';
import useJobStore from '../../../../store/jobStore';
import usePageStore from '../../../../store/pageStore';

function MyCv() {
    const { getSummary } = useFileStore();
    const [hasError, setHasError] = useState(false);
    // 로딩
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [reuploadDialogHidden, setReuploadDialogHidden] = useState(false);
    const hasFile = useFileStore((state) => state.hasFile);
    const summaryText = useFileStore((state) => state.summary);
    const userCvList = useCvStore((state) => state.userCvList);
    const selectedCVId = useJobStore((state) => state.selectedCVId);
    const { getSelectedCvId } = useJobStore();

    const navigate = useNavigate();
    const setPreviousPage = usePageStore((state) => state.setPreviousPage);
    const location = useLocation();

    const handleButtonClick = () => {
        setPreviousPage(location.pathname);
        navigate('/upload');
    };

    useEffect(() => {
        const fetchCVSummary = async () => {
            try {
                setIsSummaryLoading(true);
                if (selectedCVId !== null) {
                    await getSummary(selectedCVId);
                }
            } catch (error) {
                console.error('데이터 가져오기 에러:', error);
                setHasError(true);
            } finally {
                setIsSummaryLoading(false);
            }
        };
        fetchCVSummary();
    }, [hasFile, userCvList, selectedCVId]);

    useEffect(() => {
        getSelectedCvId();
    }, [hasError]);

    return (
        <>
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
                        ) : (
                            <div className={style.info__content}>
                                {isSummaryLoading ? (
                                    <LoadingSpinner />
                                ) : (
                                    <Suspense fallback={<Loading content="Summary" />}>
                                        <div
                                            className={style.feedbackText}
                                            dangerouslySetInnerHTML={{
                                                __html: parseMarkdown(summaryText ?? ''),
                                            }}></div>
                                    </Suspense>
                                )}
                            </div>
                        )}
                    </ErrorBoundary>

                    <div className={style.buttons}>
                        <button
                            className={style.button}
                            onClick={() => {
                                alert('CV 전체 삭제 기능 구현 예정');
                            }}>
                            <Trash size={18} />
                            업로드된 모든 CV 제거
                        </button>
                        <button className={style.button} onClick={handleButtonClick}>
                            <input
                                type="file"
                                accept=".pdf"
                                className={style.hiddenInput}
                                ref={fileInputRef}
                            />
                            <>
                                <CloudUpload size={18} />
                                CV 업로드
                            </>
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
