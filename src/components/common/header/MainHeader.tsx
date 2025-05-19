import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Bell, Menu, ChevronRight, X } from 'lucide-react';
import styles from './MainHeader.module.scss';
import useAuthStore from '../../../store/authStore';
import axios from 'axios';
import { debounce } from 'lodash';
import ProfileDialog from '../dialog/ProfileDialog';
import usePageStore from '../../../store/pageStore';
import { useNavigate } from 'react-router-dom';
import type Job from '../../../../types/job';

const MainHeader = () => {
    const [searchQuery, setSearchQuery] = useState(''); // 검색어
    const [searchResults, setSearchResults] = useState<Job[]>([]); // 검색 결과
    const [isSearching, setIsSearching] = useState(false); // 검색 중
    const [showResults, setShowResults] = useState(false); // 검색 결과 출력 여부
    const [showHistory, setShowHistory] = useState(false); // 검색 기록 출력 여부, 서치바에 텍스트를 입력하지 않아도 출력되어야 함
    const [isFocusing, setIsFocusing] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const { setCompactMenu } = usePageStore();
    const accessToken = useAuthStore((state) => state.accessToken);
    const isCompactMenu = usePageStore((state) => state.isCompactMenu);
    const navigate = useNavigate();

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 1) {
            debouncedSearch(query);
            setShowResults(true);
        } else {
            debouncedSearch('');
            setShowResults(false);
        }
    };

    const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            if (!query) return;
            setIsSearching(true);

            try {
                const response = await axios.get(
                    `https://be.goodjob.ai.kr/jobs/search?keyword=${query}&page=0&size=8&sort=createdAt%2CDESC`
                );
                setSearchResults(response.data.content.slice(0, 8));
            } catch (error) {
                console.log(`검색 오류:${error}`);
            } finally {
                setIsSearching(false);
            }
        }, 500),
        []
    );

    const handleResultClick = (result: Job) => {
        // 로컬 스토리지에 클릭 결과 저장
        // setSearchQuery(title); // 이렇게 하는게 맞나..?
        navigate(`/${result}`);
        setIsSearching(false);
        setIsFocusing(false);
    };

    const handleHistoryClick = (result: string) => {
        // 로컬 스토리지에 클릭 결과 저장
        // setSearchQuery(title); // 이렇게 하는게 맞나..?
        navigate(`/${result}`);
        setIsSearching(false);
        setIsFocusing(false);
    };

    // 검색어 엔터 처리
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log(`검색어: ${searchQuery}`);
        saveSearchHistory(searchQuery);

        // navigate 추가 => 검색 결과 페이지로

        setShowResults(false);
    };

    const saveSearchHistory = (query: string) => {
        const key = 'search-history';
        const history = JSON.parse(localStorage.getItem(key) || '[]');
        history.push(query);
        localStorage.setItem(key, JSON.stringify(history));
        window.dispatchEvent(new Event('search-history-changed'));
    };

    const getSearchHistory = () => {
        setHistory(JSON.parse(localStorage.getItem('search-history') || '[]'));
    };

    const deleteSearchHistory = (query: string) => {
        const key = 'search-history';
        const history: string[] = JSON.parse(localStorage.getItem(key) || '[]');
        const updatedHistory = history.filter((item: string) => item !== query);
        localStorage.setItem(key, JSON.stringify(updatedHistory));
        window.dispatchEvent(new Event('search-history-changed'));
    };

    // 더보기 버튼 처리
    const handleViewMoreResults = () => {
        navigate('/');
    };

    const handleSearchBlur = (e: React.FocusEvent) => {
        if (
            searchContainerRef.current &&
            (searchContainerRef.current.contains(e.relatedTarget as Node) ||
                e.relatedTarget === null)
        ) {
            return;
        }
        setIsFocusing(false);
        setShowResults(false);
    };

    const handleSearchFocus = () => {
        setIsFocusing(true);
        getSearchHistory();
        setShowHistory(true);

        if (searchQuery.length > 1) {
            setShowResults(true);
        }
    };

    const toggleMobileMenu = () => {
        if (isCompactMenu === true) {
            setCompactMenu(false);
        } else {
            setCompactMenu(true);
        }
    };

    useEffect(() => {
        const handleStorageChange = () => {
            getSearchHistory();
        };
        window.addEventListener('search-history-changed', handleStorageChange);
        getSearchHistory();
        return () => {
            window.removeEventListener('search-history-changed', handleStorageChange);
        };
    }, []);

    return (
        <>
            {isFocusing && (
                <div
                    className={styles.header__overlay}
                    onClick={() => {
                        setIsFocusing(false);
                        setShowResults(false);
                        setShowHistory(false);
                    }}
                />
            )}

            <header className={styles.header}>
                <div className={styles.header__container}>
                    <button
                        className={styles.header__menuButton}
                        onClick={toggleMobileMenu}
                        aria-label="메뉴 열기">
                        <Menu size={30} />
                    </button>

                    <div
                        className={`${styles.header__search} ${
                            isFocusing ? styles['header__search--extend'] : ''
                        }`}
                        ref={searchContainerRef}>
                        <div className={styles.header__searchInputWrapper}>
                            <Search className={styles.header__searchIcon} size={20} />
                            <form onSubmit={handleSearchSubmit}>
                                <input
                                    type="text"
                                    placeholder="검색"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    onFocus={handleSearchFocus}
                                    onBlur={handleSearchBlur}
                                    className={styles.header__searchInput}
                                />
                            </form>
                        </div>

                        {/* 검색 결과 드롭다운 */}
                        {showHistory && (
                            <div className={styles.header__searchResults}>
                                {isSearching ? (
                                    <div className={styles.header__searchLoading}>검색 중...</div>
                                ) : searchResults.length > 0 ? (
                                    <>
                                        {/* 히스토리 */}
                                        {history ? (
                                            <ul className={styles.header__searchResultsList}>
                                                {history.map((result: string) => (
                                                    <li
                                                        key={result}
                                                        onClick={() => handleHistoryClick(result)}
                                                        className={
                                                            styles.header__searchHistoryItem
                                                        }>
                                                        <Search
                                                            size={16}
                                                            className={
                                                                styles.header__searchResultIcon
                                                            }
                                                        />
                                                        <p
                                                            className={
                                                                styles.header__searchResultText
                                                            }>
                                                            {result}
                                                        </p>
                                                        <X
                                                            size={18}
                                                            className={
                                                                styles.header__searchHistoryDelete
                                                            }
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteSearchHistory(result);
                                                            }}
                                                        />
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                        {showResults && (
                                            <>
                                                <ul className={styles.header__searchResultsList}>
                                                    {searchResults.map((result: Job) => (
                                                        <li
                                                            key={result.id}
                                                            onClick={() =>
                                                                handleResultClick(result)
                                                            }
                                                            className={
                                                                styles.header__searchResultItem
                                                            }>
                                                            <div
                                                                className={
                                                                    styles.header__searchResultContent
                                                                }>
                                                                <div
                                                                    className={
                                                                        styles.header__searchResultIcon
                                                                    }>
                                                                    <img
                                                                        rel="icon"
                                                                        src={`data:image/x-icon;base64,${result.favicon}`}
                                                                    />
                                                                </div>
                                                                <span>{result.title}</span>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <button
                                                    className={styles.header__viewMoreButton}
                                                    onClick={handleViewMoreResults}>
                                                    검색 결과 더 보기
                                                    <ChevronRight size={16} />
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : searchQuery.length > 1 ? (
                                    <div className={styles.header__searchNoResults}>
                                        검색 결과가 없습니다.
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.header__actions}>
                    {accessToken ? (
                        <>
                            <button className={styles.header__actionButton} aria-label="알림">
                                <Bell size={24} />
                            </button>
                            {/* <ProfileDialog /> */}
                        </>
                    ) : (
                        <div className={styles.header__authButtons}>
                            <button className={styles.header__signUpButton}>회원가입</button>
                            <button className={styles.header__signInButton}>로그인</button>
                        </div>
                    )}
                </div>
            </header>
        </>
    );
};
export default MainHeader;
