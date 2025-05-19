import { Link, useNavigate } from 'react-router-dom';
import {
    ClipboardList,
    Star,
    Bookmark,
    User,
    CircleUser,
    CircleHelp,
    Settings,
    LogOut,
    Crown,
} from 'lucide-react';

import usePageStore from '../../../store/pageStore';
import style from './SideBar.module.scss';
import useUserStore from '../../../store/userStore';
import useAuthStore from '../../../store/authStore';
import ProfileDialog from '../dialog/ProfileDialog';

function SideBar() {
    const { setActiveContent } = usePageStore();
    const { name, email } = useUserStore();
    const activeContent = usePageStore((state) => state.activeContent);
    const isCompactMenu = usePageStore((state) => state.isCompactMenu);
    const { clearTokens, setLogout } = useAuthStore();
    const accessToken = useAuthStore.getState().accessToken;

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
    ] as const; // as const를 붙이면 타입을 추론하는 것이 아니라 리터럴 자체로 고정됨

    const subMenuItems = [
        {
            id: '설정',
            path: '/setting',
            icon: Settings,
        },
        {
            id: '도움말',
            path: '/help',
            icon: CircleHelp,
        },
    ] as const;

    const handleMenuClick = (menuId: PageContent | PageSubContent) => {
        setActiveContent(menuId);
    };

    const handleLogoClick = () => {
        navigate('/');
    };

    const handleLogout = () => {
        setLogout(accessToken);
        clearTokens();

        navigate('/', { replace: true });
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
                            {/* <CircleUser className={style.sidebar__profile__icon} /> */}
                            <ProfileDialog />
                            <div className={style.sidebar__profile__textArea}>
                                <p className={style.userName}>{name}</p>
                                <p className={style.userEmail}>{email}</p>
                            </div>
                            <LogOut
                                size={18}
                                className={style.sidebar__profile__logoutIcon}
                                onClick={handleLogout}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SideBar;
