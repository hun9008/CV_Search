import { useState } from 'react';
import style from './styles/CVViewer.module.scss';
import useS3Store from '../../../../store/s3Store';

function CvViewer() {
    const [hidden, setHidden] = useState(true);
    const { getDownloadPresignedURL, url } = useS3Store();

    const handleGetCV = async () => {
        await getDownloadPresignedURL();
        console.log(url);
        setHidden(!hidden);
    };

    return (
        <div className={style.container}>
            {hidden && (
                <button className={style.viewerButton} onClick={handleGetCV}>
                    클릭하여 등록한 CV 보기
                </button>
            )}

            {url && !hidden && (
                <div className={style.cvContainer}>
                    <iframe src={url} className={style.cvContainer__cv} title="CV Preview"></iframe>
                </div>
            )}
        </div>
    );
}

export default CvViewer;
