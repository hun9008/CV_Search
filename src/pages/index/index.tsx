import styles from './styles/index.module.scss';
import SideBar from '../../components/common/sideBar/SideBar';
import MainHeader from '../../components/common/header/MainHeader';
import usePageStore from '../../store/pageStore';
import { Outlet, useLocation } from 'react-router-dom';

function Index() {
    const isCompactMenu = usePageStore((state) => state.isCompactMenu);
    const location = useLocation();
    const path = location.pathname;

    // admin 관련 경로에서는 MainHeader를 숨김
    const hideHeader =
        path.includes('admin/dashboard') ||
        path.includes('admin/jobManage') ||
        path.includes('admin/feedback');

    return (
        <div className={styles.layout}>
            <SideBar />
            <div className={`${styles.mainContent} ${isCompactMenu ? styles.hidden : ''}`}>
                {!hideHeader && <MainHeader />}
                <div className={styles.mainContent__container}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default Index;
