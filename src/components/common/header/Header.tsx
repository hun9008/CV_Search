import { useState } from 'react';
import style from './Header.module.scss';
import { Search, Bell, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/authStore';
import ProfileDialog from '../dialog/ProfileDialog';

function Header() {
    // 검색 관련
    const [searchQuery, setSearchQuery] = useState('');
    // const [searchResults, setSearchResults] = useState<
    //     { id: number; title: string; type: string }[]
    // >([]);
    // const [isSearching, setIsSearching] = useState(false);
    // const [showResults, setShowResults] = useState(false);
    // const [isFocusing, setIsFocusing] = useState(false);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

    // 로그인
    // const accessToken = useAuthStore((state) => state.accessToken);

    const navigate = useNavigate();

    const moveToSignInPage = () => {
        navigate('./signIn');
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    // const debouncedSearch = useCallback(
    //     debounce(async (query: string) => {
    //         if (!query) return;
    //         setIsSearching(true);

    //         try {
    //             const response = await axios.get(
    //                 `https://be.goodjob.ai.kr/jobs/search?keyword=${query}&page=0&size=8&sort=string`,
    //                 {
    //                     headers: { Authorization: `Bearer ${accessToken}` },
    //                     withCredentials: true,
    //                 }
    //             );
    //             setSearchResults(response.data.content.slice(0, 8));
    //         } catch (error) {
    //             console.log(`검색 오류: ${error}`);
    //         } finally {
    //             setIsSearching(false);
    //         }
    //     }, 500),
    //     [accessToken]
    // );

    //테스트용

    return (
        <header className={style.header}>
            <div className={style.header__container}>
                {/* Menu button (visible on mobile only) */}
                <button
                    className={style.header__menuButton}
                    onClick={toggleMobileMenu}
                    aria-label="메뉴 열기">
                    <Menu size={24} />
                </button>

                <div className={style.header__container__subContainer}>
                    <p className={style.header__logo}>goodJob</p>
                    {/* <div className={style.header__searchBar}>
                        <Search className={style.header__searchBar__icon} size={20} />
                        <input
                            type="text"
                            placeholder="검색"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={style.header__searchBar__input}
                        />
                    </div> */}
                </div>

                <div className={style.header__actions}>
                    {isLoggedIn ? (
                        <>
                            <Bell
                                className={style.header__notification}
                                aria-label="알림"
                                size={38}
                            />
                            {/* <User className={style.header__profile} aria-label="프로필" size={38} /> */}
                            <ProfileDialog />
                            {/* 테스트 버튼 */}
                        </>
                    ) : (
                        <>
                            {/* Desktop buttons */}

                            <button className={style.header__signIn} onClick={moveToSignInPage}>
                                로그인
                            </button>

                            {/* Combined button for mobile */}
                            <button className={style.header__authButton} onClick={moveToSignInPage}>
                                로그인
                            </button>
                            {/* 테스트 버튼 */}
                        </>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`${style.header__mobileMenu} ${mobileMenuOpen ? style.active : ''}`}>
                <div className={style.header__mobileMenu__header}>
                    <p className={style.header__mobileMenu__logo}>goodJob</p>
                    <button
                        className={style.header__mobileMenu__close}
                        onClick={toggleMobileMenu}
                        aria-label="메뉴 닫기">
                        <X size={24} />
                    </button>
                </div>

                <div className={style.header__mobileMenu__search}>
                    <Search className={style.header__mobileMenu__searchIcon} size={20} />
                    <input
                        type="text"
                        placeholder="검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={style.header__mobileMenu__searchInput}
                    />
                </div>

                <nav className={style.header__mobileMenu__nav}>
                    <a href="/">지원관리</a>
                    <a href="/">추천 공고</a>
                    <a href="/">북마크</a>
                    <a href="/">나의 CV</a>
                    {isLoggedIn && (
                        <>
                            <a href="/">내 프로필</a>
                            <a href="/">설정</a>
                        </>
                    )}
                </nav>

                {!isLoggedIn && (
                    <div className={style.header__mobileMenu__buttons}>
                        <button
                            className={style.header__mobileMenu__buttonsSignUp}
                            onClick={moveToSignInPage}>
                            회원가입
                        </button>
                        <button
                            className={style.header__mobileMenu__buttonsSignIn}
                            onClick={moveToSignInPage}>
                            로그인
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;
