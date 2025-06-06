import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Search,
    Bell,
    ChevronRight,
    X,
    Moon,
    ArrowRightToLine,
    ArrowLeftToLine,
} from 'lucide-react';
import styles from './MainHeader.module.scss';
import useAuthStore from '../../../store/authStore';
import axios from 'axios';
import { debounce } from 'lodash';
import usePageStore from '../../../store/pageStore';
import { useNavigate } from 'react-router-dom';
import type Job from '../../../types/job';
import UniversalDialog from '../dialog/UniversalDialog';
import useSearchStore from '../../../store/searchStore';
import { SERVER_IP } from '../../../constants/env';

const MainHeader = () => {
    const [searchQuery, setSearchQuery] = useState(''); // 검색어
    const [searchResults, setSearchResults] = useState<Job[]>([]); // 검색 결과
    const [isSearching, setIsSearching] = useState(false); // 검색 중
    const [isFocusing, setIsFocusing] = useState(false);
    const [showSingleSearchResult, setShowSingleSearchResult] = useState(false);
    const [selectedResult, setSelectedResult] = useState<Job>();
    const [history, setHistory] = useState<string[]>([]);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const { setCompactMenu } = usePageStore();
    const { setQuery } = useSearchStore();
    const accessToken = useAuthStore((state) => state.accessToken);
    const isCompactMenu = usePageStore((state) => state.isCompactMenu);
    const navigate = useNavigate();

    const toggleDarkmode = () => {
        alert('다크 모드 구현 예정');
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 1) {
            debouncedSearch(query);
        } else {
            debouncedSearch('');
            setSearchResults([]);
        }
    };

    const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            if (!query) return;
            setIsSearching(true);

            try {
                const response = await axios.get(
                    `${SERVER_IP}/jobs/search?keyword=${query}&page=0&size=8&sort=createdAt%2CDESC`
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

    /** 검색 자동 완성 결과 클릭 */
    const handleResultClick = (result: Job) => {
        setSelectedResult(result);
        setShowSingleSearchResult(true);
    };

    /** 검색 기록을 클릭하면 해당 기록을 쿼리로 검색 */
    const handleHistoryClick = (result: string) => {
        setQuery(result);
        setIsSearching(false);
        setIsFocusing(false);
        navigate('searchResult');
    };

    /** 엔터키 처리, 입력된 값을 쿼리로 검색 */
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveSearchHistory(searchQuery);
        setQuery(searchQuery);
        setIsSearching(false);
        setIsFocusing(false);
        navigate('searchResult');
    };

    /** 더 보기 버튼 클릭 처리, 기본적으로 엔터키 처리와 같음 */
    const handleViewMoreResults = () => {
        saveSearchHistory(searchQuery);
        setQuery(searchQuery);
        setIsSearching(false);
        setIsFocusing(false);
        navigate('searchResult');
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

    const handleSearchBlur = (e: React.FocusEvent) => {
        if (
            searchContainerRef.current &&
            (searchContainerRef.current.contains(e.relatedTarget as Node) ||
                e.relatedTarget === null)
        ) {
            return;
        }
        setIsFocusing(false);
    };

    const handleSearchFocus = () => {
        setIsFocusing(true);
        getSearchHistory();
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
            {showSingleSearchResult ? (
                <UniversalDialog
                    isOpen={showSingleSearchResult}
                    onClose={() => setShowSingleSearchResult(false)}
                    job={selectedResult}
                />
            ) : (
                ''
            )}
            {isFocusing && (
                <div
                    className={styles.header__overlay}
                    onClick={() => {
                        setIsFocusing(false);
                    }}
                />
            )}

            <header className={styles.header}>
                <div className={styles.header__container}>
                    <button
                        className={styles.header__menuButton}
                        onClick={toggleMobileMenu}
                        aria-label="메뉴 열기">
                        {isCompactMenu ? (
                            <ArrowRightToLine size={30} color="#666666" />
                        ) : (
                            <ArrowLeftToLine size={30} color="#666666" />
                        )}
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
                        {isFocusing && (
                            <div className={styles.header__searchResults}>
                                {/* 히스토리: 항상 isFocusing일 때 보여줌 */}
                                {history && history.length > 0 && (
                                    <ul className={styles.header__searchResultsList}>
                                        {history.map((result: string) => (
                                            <li
                                                key={result}
                                                onClick={() => handleHistoryClick(result)}
                                                className={styles.header__searchHistoryItem}>
                                                <Search
                                                    size={16}
                                                    className={styles.header__searchResultIcon}
                                                />
                                                <p className={styles.header__searchResultText}>
                                                    {result}
                                                </p>
                                                <X
                                                    size={18}
                                                    className={styles.header__searchHistoryDelete}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteSearchHistory(result);
                                                    }}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {/* 검색 결과 */}
                                {isSearching ? (
                                    <div className={styles.header__searchLoading}>검색 중...</div>
                                ) : searchResults.length > 0 ? (
                                    <>
                                        <ul className={styles.header__searchResultsList}>
                                            {searchResults.map((result: Job) => (
                                                <li
                                                    key={result.id}
                                                    onClick={() => handleResultClick(result)}
                                                    className={styles.header__searchResultItem}>
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
                            <button
                                className={styles.header__actionButton}
                                aria-label="다크모드"
                                onClick={toggleDarkmode}>
                                <Moon size={24} color="#666666" />
                            </button>
                            <button
                                className={styles.header__actionButton}
                                aria-label="알림"
                                onClick={() => {
                                    alert('알림 기능 구현 예정');
                                }}>
                                <Bell size={24} color="#666666" />
                            </button>
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
