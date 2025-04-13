import style from './styles/index.module.scss';
import SideBar from '../../components/common/sideBar/SideBar';
import Header from '../../components/common/header/MainHeader';

function index() {
    return (
        <div className={style.layout}>
            <SideBar />

            {/* 사이드바 컴포넌트 */}
            <div className={style.mainContent}>
                <Header />
                {/* 헤더 컴포넌트 */}
                <div className={style.mainContent__area}>
                    {/* 사이드바의 위치에 따라서 다른 컨텐츠 출력 */}
                    <div>JobList</div>
                </div>
            </div>
        </div>
    );
}

export default index;
