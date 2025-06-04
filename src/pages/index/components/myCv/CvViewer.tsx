import { useEffect, useState, useCallback } from 'react';
import style from './styles/CVViewer.module.scss';
import useS3Store from '../../../../store/s3Store';
import useCvStore, { type CvMe } from '../../../../store/cvStore';
import useActionStore from '../../../../store/actionStore';
import { Loader2, AlertTriangle, X } from 'lucide-react';
import CvItem from './CvItem';

function CvViewer() {
    const { getUserCvList } = useCvStore();
    const { getDownloadPresignedURL, reNameCv } = useS3Store();
    const url = useS3Store((state) => state.url);
    const cvAction = useActionStore((state) => state.cvAction);
    const userCvList = useCvStore((state) => state.userCvList);
    const [fullScreenPdfUrl, setFullScreenPdfUrl] = useState<string | null>(null);
    const [fullScreenPdfFileName, setFullScreenPdfFileName] = useState<string | null>(null);
    const [isLoadingFullScreenPdf, setIsLoadingFullScreenPdf] = useState(false);
    const [fullScreenPdfError, setFullScreenPdfError] = useState<string | null>(null);
    const [currentlyLoadingCvName, setCurrentlyLoadingCvName] = useState<string | null>(null);

    const handleViewCvFullScreen = useCallback(
        async (fileName: string) => {
            if (!fileName) {
                setFullScreenPdfError('File name is missing.');
                return;
            }
            setIsLoadingFullScreenPdf(true);
            setFullScreenPdfError(null);
            setFullScreenPdfUrl(null);
            setFullScreenPdfFileName(fileName);
            setCurrentlyLoadingCvName(fileName);

            try {
                await getDownloadPresignedURL(fileName);
                setFullScreenPdfUrl(url);
            } catch (err) {
                console.error(`CV ${fileName} 뷰어 에러: `, err);
                setFullScreenPdfError(
                    `CV '${fileName}'를 불러오는 데 실패했습니다. 다시 시도해주세요.`
                );
                setFullScreenPdfUrl(null);
            } finally {
                setIsLoadingFullScreenPdf(false);
                setCurrentlyLoadingCvName(null);
            }
        },
        [url, getDownloadPresignedURL]
    );

    const handleCloseFullScreenView = useCallback(() => {
        setFullScreenPdfUrl(null);
        setFullScreenPdfFileName(null);
        setFullScreenPdfError(null);
        setIsLoadingFullScreenPdf(false);
    }, []);

    const handleRenameCv = useCallback(async (cv: CvMe, newFileName: string) => {
        await reNameCv(cv.fileName, newFileName);
        await getUserCvList();
    }, []);

    useEffect(() => {
        getUserCvList();
    }, []);

    useEffect(() => {
        // If cvAction changes (e.g., new CV uploaded), close full screen view and refresh list
        if (fullScreenPdfError || isLoadingFullScreenPdf) {
            handleCloseFullScreenView();
        }
        // No need to call getUserCvList() here again if cvAction already triggers it in the store or MyCv component
    }, [cvAction, fullScreenPdfUrl]);

    if (isLoadingFullScreenPdf && !fullScreenPdfUrl) {
        return (
            <div className={style.fullScreenLoading}>
                <Loader2 size={48} className={style.animateSpin} />
                <p>'{fullScreenPdfFileName}' 로딩 중...</p>
            </div>
        );
    }

    if (fullScreenPdfUrl) {
        return (
            <div className={style.fullScreenViewer}>
                <div className={style.fullScreenHeader}>
                    <h3 className={style.fullScreenTitle}>
                        {fullScreenPdfFileName || 'CV Preview'} {}
                    </h3>
                    <button
                        onClick={handleCloseFullScreenView}
                        className={style.fullScreenCloseButton}
                        title="닫기">
                        <X size={24} />
                    </button>
                </div>
                <object
                    data={fullScreenPdfUrl}
                    type="application/pdf"
                    className={style.fullScreenCvObject}
                    title={`${fullScreenPdfFileName} Preview`}>
                    <div className={style.cvFallback}>
                        <AlertTriangle size={48} className={style.errorIcon} />
                        <p>CV를 불러오는 중 에러가 발생했습니다</p>
                        <p>에러가 지속되면 관리자에 문의하세요</p>
                        <button
                            onClick={handleCloseFullScreenView}
                            className={`${style.fallbackCloseButton} ${style.actionButton}`}>
                            목록으로 돌아가기
                        </button>
                    </div>
                </object>
            </div>
        );
    }

    if (fullScreenPdfError) {
        return (
            <div className={style.fullScreenError}>
                <AlertTriangle size={48} className={style.errorIcon} />
                <p>{fullScreenPdfError}</p>
                <button
                    onClick={handleCloseFullScreenView}
                    className={`${style.errorCloseButton} ${style.actionButton}`}>
                    목록으로 돌아가기
                </button>
            </div>
        );
    }

    if (!Array.isArray(userCvList) || userCvList.length === 0) {
        return <div className={style.noCvMessage}>등록된 CV가 없습니다. CV를 업로드해주세요.</div>;
    }

    return (
        <>
            <div
                className={`${style.grid} ${
                    userCvList.length === 1 ? style.gridSingle : style.gridMulti
                }`}>
                {userCvList.length === 1 ? (
                    <div className={style.container}>
                        <button
                            className={style.viewerButton}
                            onClick={() => handleViewCvFullScreen(userCvList[0].fileName)}>
                            클릭하여 등록한 CV 보기
                        </button>
                    </div>
                ) : (
                    userCvList.map((cv) => (
                        <CvItem
                            key={cv.id || cv.fileName}
                            cv={cv}
                            onView={handleViewCvFullScreen}
                            onRename={handleRenameCv}
                            isViewingThis={
                                fullScreenPdfFileName === cv.fileName && !!fullScreenPdfUrl
                            }
                            isLoadingThis={currentlyLoadingCvName === cv.fileName}
                        />
                    ))
                )}
            </div>
        </>
    );
}

export default CvViewer;
