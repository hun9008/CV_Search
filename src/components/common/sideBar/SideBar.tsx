import { Link, useNavigate } from 'react-router-dom';
import {
    ClipboardList,
    Star,
    Bookmark,
    User,
    Crown,
    FileUser,
    LayoutDashboard,
    Briefcase,
    Sticker,
} from 'lucide-react';
import usePageStore from '../../../store/pageStore';
import style from './SideBar.module.scss';
import useUserStore from '../../../store/userStore';
import SideBarProfileDialog from '../dialog/SideBarProfileDialog';
function SideBar() {
    const { setActiveContent } = usePageStore();
    const { name, email } = useUserStore();
    const activeContent = usePageStore((state) => state.activeContent);
    const isCompactMenu = usePageStore((state) => state.isCompactMenu);
    const navigate = useNavigate();
    type PageContent = (typeof menuItems)[number]['id'];
    type PageSubContent = (typeof subMenuItems)[number]['id'];

    const menuItems = [
        {
            id: '지원 관리',
            path: '/main',
            icon: ClipboardList,
        },
        {
            id: '추천 공고',
            path: '/main',
            icon: Star,
        },
        {
            id: '북마크',
            path: '/main',
            icon: Bookmark,
        },
        {
            id: '나의 CV',
            path: '/main',
            icon: User,
        },
        {
            id: '대시보드',
            path: '/main',
            icon: LayoutDashboard,
        },
        {
            id: '공고 관리',
            path: '/main',
            icon: Briefcase,
        },
        { id: '피드백 관리', path: '/main', icon: Sticker },
    ] as const; // as const를 붙이면 타입을 추론하는 것이 아니라 리터럴 자체로 고정됨

    const subMenuItems = [
        {
            id: 'CV 생성',
            path: '/main',
            icon: FileUser,
        },
    ] as const;

    const handleMenuClick = (menuId: PageContent | PageSubContent) => {
        setActiveContent(menuId);
    };

    const handleLogoClick = () => {
        navigate('/');
    };

    return (
        <div className={`${style.sidebar} ${isCompactMenu ? style.sidebar__hidden : ''}`}>
            <div className={style.sidebar__container}>
                <div className={style.sidebar__logo} onClick={handleLogoClick}>
                    goodJob
                </div>
                <div className={style.sidebar__navigation}>
                    <ul className={style.sidebar__menu}>
                        {menuItems.map((item) => (
                            <li key={item.id} className={style.sidebar__menuItem}>
                                <Link // 이후 삭제할 것
                                    to={item.path}
                                    className={`${style.sidebar__menuLink} ${
                                        activeContent === item.id ? style.active : ''
                                    }`}
                                    onClick={() => handleMenuClick(item.id)}>
                                    <item.icon className={style.sidebar__menuIcon} size={24} />
                                    <span className={style.sidebar__menuText}>{item.id}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className={style.sidebar__subConatiner}>
                        <ul className={style.sidebar__menu}>
                            {subMenuItems.map((item) => (
                                <li key={item.id} className={style.sidebar__menuItem}>
                                    <Link // 이후 삭제할 것
                                        to={item.path}
                                        className={`${style.sidebar__menuLink} ${
                                            activeContent === item.id ? style.active : ''
                                        }`}
                                        onClick={() => handleMenuClick(item.id)}>
                                        <item.icon className={style.sidebar__menuIcon} size={24} />
                                        <span className={style.sidebar__menuText}>{item.id}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <div className={style.plan}>
                            <div className={style.plan__textContainer}>
                                <h3>
                                    <Crown size={16} className={style.planIcon} />
                                    베이직 플랜
                                </h3>
                                <p>제한적인 추천과 관리만 제공됩니다</p>
                            </div>
                            <button className={style.plan__upgrade}>업그레이드</button>
                        </div>
                        <span className={style.divider}></span>
                        <div className={style.sidebar__profile}>
                            <SideBarProfileDialog />
                            <div className={style.sidebar__profile__textArea}>
                                <p className={style.userName}>{name}</p>
                                <p className={style.userEmail}>{email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SideBar;
