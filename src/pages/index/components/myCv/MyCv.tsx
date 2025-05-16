import { useState, useEffect, useRef } from 'react';
import useFileStore from '../../../../store/fileStore';
import CvViewer from './CvViewer';
import style from './styles/MyCv.module.scss';
import { Trash, CloudUpload } from 'lucide-react';
import CVDeleteDialog from '../../../../components/common/dialog/CVDeleteDialog';
import CVReuploadDialog from '../../../../components/common/dialog/CVReuploadDialog';
import useS3Store from '../../../../store/s3Store';

function MyCv() {
    const { removeFile, uploadFile } = useFileStore();
    const { getUploadPresignedURL } = useS3Store();
    const [error, setError] = useState<string | null>('');
    const [file, setFile] = useState<File | null>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [reuploadDialogHidden, setReuploadDialogHidden] = useState(false);
    const [deleteDialogHidden, setDeleteDialogHidden] = useState(false);
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
            setError('파일 크기는 5MB 이하여야 합니다.');
            return;
        }
        setFile(selectedFile);

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

    const mockSummary = `이름: Ruby Gibson (루비 깁슨)
직함: Senior Software Developer | FinTech Enthusiast | Client Solutions (시니어 소프트웨어 개발자 | 핀테크 전문가 | 클라이언트 솔루션)
연락처: +44 20 7123 4567
이메일: help@enhancv.com
위치: Edinburgh, UK (에든버러, 영국)
LinkedIn: linkedin.com (링크드인 프로필 있음)
    8년 이상의 소프트웨어 개발 경험, 핀테크 및 클라이언트 솔루션에 특화.
다양한 프로그래밍 언어로 고성능 금융 애플리케이션 개발.
데이터베이스 로드 시간 단축 및 다중 통화 교환 기능 통합에 강점.`;

    const handleDeleteCV = async () => {
        setDeleteDialogHidden((prev) => !prev);
    };

    const handleReUploadCV = async () => {
        setReuploadDialogHidden((prev) => !prev);
        // if (res === 200) {
        // }
    };

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
                    <div className={style.info__content}>
                        <h2>요약</h2>
                        {mockSummary}
                    </div>
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
