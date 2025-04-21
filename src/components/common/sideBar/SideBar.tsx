import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Star, Bookmark, User } from 'lucide-react';

import usePageStore from '../../../store/pageStore';
import style from './SideBar.module.scss';

function SideBar() {
    const { setActiveContent } = usePageStore();
    const activeContent = usePageStore((state) => state.activeContent);
    const isCompactMenu = usePageStore((state) => state.isCompactMenu);

    const navigate = useNavigate();
    type PageContent = (typeof menuItems)[number]['id'];

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

    const handleMenuClick = (menuId: PageContent) => {
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
                </div>
            </div>
        </div>
    );
}

export default SideBar;
