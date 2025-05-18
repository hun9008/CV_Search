import JobDetail from '../../../pages/index/components/jobList/JobDetail';
import style from './styles/BookmarkDialog.module.scss';

function BookmarkDialog() {
    return (
        <div className={style.modalOverlay}>
            <div className={style.container}>
                <JobDetail />
            </div>
        </div>
    );
}

export default BookmarkDialog;
