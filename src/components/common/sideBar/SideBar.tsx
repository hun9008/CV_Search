'use client';

import { Link } from 'react-router-dom';
import { ClipboardList, Star, Bookmark, User } from 'lucide-react';
import { useState } from 'react';
import style from './SideBar.module.scss';

function SideBar() {
    const [activeMenu, setActiveMenu] = useState('추천 공고');
    const menuItems = [
        {
            id: '지원 관리',
            path: '/',
            icon: ClipboardList,
        },
        {
            id: '추천 공고',
            path: '/',
            icon: Star,
        },
        {
            id: '북마크',
            path: '/',
            icon: Bookmark,
        },
        {
            id: '나의 CV',
            path: '/',
            icon: User,
        },
    ];

    const handleMenuClick = (menuId: string) => {
        console.log(menuId);
        // setActiveMenu(menuId);
    };

    return (
        <div className={style.sidebar}>
            <div className={style.sidebar__container}>
                <div className={style.sidebar__logo}>goodJob</div>

                <div className={style.sidebar__navigation}>
                    <ul className={style.sidebar__menu}>
                        {menuItems.map((item) => (
                            <li key={item.id} className={style.sidebar__menuItem}>
                                <Link // 이후 삭제할 것
                                    to={item.path}
                                    className={`${style.sidebar__menuLink} ${
                                        activeMenu === item.id ? style.active : ''
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
