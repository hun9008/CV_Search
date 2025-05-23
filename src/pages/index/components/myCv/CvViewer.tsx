import { useEffect, useState } from 'react';
import style from './styles/CVViewer.module.scss';
import useS3Store from '../../../../store/s3Store';
import useFileStore from '../../../../store/fileStore';
import useActionStore from '../../../../store/actionStore';

function CvViewer() {
    const [hidden, setHidden] = useState(true);
    const { getDownloadPresignedURL, url } = useS3Store();
    const { setHasFile } = useFileStore();
    const cvState = useActionStore((state) => state.cvAction);
    const hasFile = useFileStore((state) => state.hasFile);

    const handleGetCV = async () => {
        try {
            await getDownloadPresignedURL();
            setHasFile(true);
            setHidden(false);
        } catch (error) {
            console.error('CV 뷰어 에러: ', error);
            throw error;
        }
    };

    useEffect(() => {}, [hasFile]);

    useEffect(() => {
        setHidden(true);
    }, [cvState]);

    return (
        <div className={style.container}>
            {hidden && (
                <button className={style.viewerButton} onClick={handleGetCV}>
                    클릭하여 등록한 CV 보기
                </button>
            )}

            {!hidden && (
                <div className={style.cvContainer}>
                    <object
                        data={url}
                        type="application/pdf"
                        className={style.cvContainer__cv}
                        title="CV Preview">
                        <p>CV가 존재하지 않습니다</p>
                    </object>
                </div>
            )}
        </div>
    );
}

export default CvViewer;
