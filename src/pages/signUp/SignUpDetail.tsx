'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import style from './styles/SignUpDetail.module.scss';
import axios from 'axios';
import useAuthStore from '../../store/authStore';

// 지역 데이터
const locationData = [
    '서울 강남',
    '서울 서초',
    '서울 송파',
    '서울 강동',
    '서울 마포',
    '서울 용산',
    '서울 성동',
    '서울 광진',
    '서울 중구',
    '서울 종로',
    '서울 동대문',
    '서울 성북',
    '서울 강북',
    '서울 도봉',
    '서울 노원',
    '서울 중랑',
    '서울 은평',
    '서울 서대문',
    '서울 강서',
    '서울 양천',
    '서울 구로',
    '서울 금천',
    '서울 영등포',
    '서울 동작',
    '서울 관악',
    '경기 수원',
    '경기 성남',
    '경기 고양',
    '경기 용인',
    '경기 부천',
    '경기 안산',
    '경기 안양',
    '경기 남양주',
    '경기 화성',
    '경기 평택',
    '경기 의정부',
    '경기 시흥',
    '경기 파주',
    '경기 김포',
    '경기 광주',
    '경기 광명',
    '경기 군포',
    '경기 하남',
    '경기 오산',
    '경기 이천',
    '경기 안성',
    '경기 의왕',
    '경기 양주',
    '경기 구리',
    '경기 포천',
    '경기 여주',
    '경기 동두천',
    '인천 중구',
    '인천 동구',
    '인천 미추홀구',
    '인천 연수구',
    '인천 남동구',
    '인천 부평구',
    '인천 계양구',
    '인천 서구',
    '인천 강화군',
    '인천 옹진군',
    '부산 중구',
    '부산 서구',
    '부산 동구',
    '부산 영도구',
    '부산 부산진구',
    '부산 동래구',
    '부산 남구',
    '부산 북구',
    '부산 해운대구',
    '부산 사하구',
    '부산 금정구',
    '부산 강서구',
    '부산 연제구',
    '부산 수영구',
    '부산 사상구',
    '부산 기장군',
    '대구 중구',
    '대구 동구',
    '대구 서구',
    '대구 남구',
    '대구 북구',
    '대구 수성구',
    '대구 달서구',
    '대구 달성군',
    '광주 동구',
    '광주 서구',
    '광주 남구',
    '광주 북구',
    '광주 광산구',
    '대전 동구',
    '대전 중구',
    '대전 서구',
    '대전 유성구',
    '대전 대덕구',
    '울산 중구',
    '울산 남구',
    '울산 동구',
    '울산 북구',
    '울산 울주군',
    '세종특별자치시',
    '강원 춘천',
    '강원 원주',
    '강원 강릉',
    '강원 동해',
    '강원 태백',
    '강원 속초',
    '강원 삼척',
    '충북 청주',
    '충북 충주',
    '충북 제천',
    '충남 천안',
    '충남 공주',
    '충남 보령',
    '충남 아산',
    '충남 서산',
    '충남 논산',
    '충남 계룡',
    '전북 전주',
    '전북 군산',
    '전북 익산',
    '전북 정읍',
    '전북 남원',
    '전북 김제',
    '전남 목포',
    '전남 여수',
    '전남 순천',
    '전남 나주',
    '전남 광양',
    '경북 포항',
    '경북 경주',
    '경북 김천',
    '경북 안동',
    '경북 구미',
    '경북 영주',
    '경북 영천',
    '경북 상주',
    '경북 문경',
    '경북 경산',
    '경남 창원',
    '경남 진주',
    '경남 통영',
    '경남 사천',
    '경남 김해',
    '경남 밀양',
    '경남 거제',
    '경남 양산',
    '경남 진해',
    '제주 제주시',
    '제주 서귀포시',
];

function SignUpDetail() {
    const [inputValue, setInputValue] = useState('');
    const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isValid, setIsValid] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedLocations, setSelectedLocations] = useState<string[]>(['경기 성남']);

    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLUListElement>(null);
    const navigate = useNavigate();

    // 입력값이 변경될 때 자동완성 목록 필터링
    useEffect(() => {
        if (inputValue.trim() === '') {
            setFilteredLocations([]);
            return;
        }

        const filtered = locationData.filter(
            (location) =>
                location.toLowerCase().includes(inputValue.toLowerCase()) &&
                !selectedLocations.includes(location)
        );
        setFilteredLocations(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(-1);
    }, [inputValue, selectedLocations]);

    // 클릭 이벤트 감지하여 자동완성 목록 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        setShowSuggestions(true);

        // 입력 시 유효성 상태 초기화
        if (!isValid) {
            setIsValid(true);
            setErrorMessage('');
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInputValue('');
        setSelectedLocations([...selectedLocations, suggestion]);
        setShowSuggestions(false);
    };

    const removeLocation = (location: string) => {
        setSelectedLocations(selectedLocations.filter((loc) => loc !== location));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // 화살표 키로 자동완성 목록 탐색
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < filteredLocations.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            const selectedLocation = filteredLocations[selectedIndex];
            setInputValue('');
            setSelectedLocations([...selectedLocations, selectedLocation]);
            setShowSuggestions(false);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 입력값 유효성 검사
        if (selectedLocations.length === 0) {
            setIsValid(false);
            setErrorMessage('최소 한 개 이상의 지역을 입력해주세요.');
            return;
        }
        const data: string[] = [...selectedLocations];
        const { accessToken } = useAuthStore.getState();

        console.log('Data to be submitted:', data);

        axios.post('https://be.goodjob.ai.kr/user/profile', data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        navigate('/main');
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className={style.pageWrapper}>
            <div className={style.content}>
                <h1 className={style.title}>어디에서 일하고 싶으신가요?</h1>

                <div className={style.searchContainer}>
                    <div className={style.inputWrapper}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => inputValue && setShowSuggestions(true)}
                            placeholder="근무하고 싶은 지역을 입력하세요"
                            className={`${style.input} ${!isValid ? style.inputError : ''}`}
                        />

                        {showSuggestions && filteredLocations.length > 0 && (
                            <ul ref={suggestionsRef} className={style.suggestions}>
                                {filteredLocations.map((location, index) => (
                                    <li
                                        key={location}
                                        className={`${style.suggestionItem} ${
                                            index === selectedIndex
                                                ? style.suggestionItemActive
                                                : ''
                                        }`}
                                        onClick={() => handleSuggestionClick(location)}>
                                        {location}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {!isValid && <p className={style.errorMessage}>{errorMessage}</p>}

                    {selectedLocations.length > 0 && (
                        <div className={style.selectedLocations}>
                            {selectedLocations.map((location) => (
                                <div key={location} className={style.locationTag}>
                                    {location}
                                    <button
                                        className={style.removeButton}
                                        onClick={() => removeLocation(location)}
                                        aria-label={`${location} 삭제`}>
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className={style.buttonContainer}>
                <button className={style.backButton} onClick={handleBack}>
                    뒤로가기
                </button>
                <button className={style.continueButton} onClick={handleSubmit}>
                    계속하기
                </button>
            </div>
        </div>
    );
}

export default SignUpDetail;
