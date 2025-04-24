import type React from 'react';

import { useState } from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import styles from './MainHeader.module.scss';
import useAuthStore from '../../../store/authStore';
import axios from 'axios';
import ProfileDialog from '../dialog/ProfileDialog';
import usePageStore from '../../../store/pageStore';

const MainHeader = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const { setCompactMenu } = usePageStore();

    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const isCompactMenu = usePageStore((state) => state.isCompactMenu);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const toggleMobileMenu = () => {
        if (isCompactMenu === true) {
            setCompactMenu(false);
        } else {
            setCompactMenu(true);
        }
    };
    const handleTestRecommend = async () => {
        const accessToken = useAuthStore.getState().accessToken;
        const res = await axios.post('https://be.goodjob.ai.kr/recommend/topk_list?topk=10', null, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true,
        });
        console.log(res);
    };

    return (
        <header className={styles.header}>
            <div className={styles.header__container}>
                <button
                    className={styles.header__menuButton}
                    onClick={toggleMobileMenu}
                    aria-label="메뉴 열기">
                    <Menu size={30} />
                </button>

                <div className={styles.header__search}>
                    <Search className={styles.header__searchIcon} size={20} />
                    <input
                        type="text"
                        placeholder="검색"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className={styles.header__searchInput}
                    />
                </div>
                <button onClick={handleTestRecommend}></button>
            </div>
            <div className={styles.header__actions}>
                {isLoggedIn ? (
                    <>
                        <button className={styles.header__actionButton} aria-label="알림">
                            <Bell size={24} />
                        </button>
                        {/* <button className={styles.header__actionButton} aria-label="프로필">
                            <User size={24} />
                        </button> */}
                        <ProfileDialog />
                    </>
                ) : (
                    <div className={styles.header__authButtons}>
                        <button className={styles.header__signUpButton}>회원가입</button>
                        <button className={styles.header__signInButton}>로그인</button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default MainHeader;
