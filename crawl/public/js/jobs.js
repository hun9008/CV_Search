/**
 * 채용 정보 검색 및 표시 기능
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const keywordsInput = document.getElementById('job-keywords');
    const limitSelect = document.getElementById('job-limit');
    const completeOnlyCheckbox = document.getElementById('complete-only'); // 새로운 체크박스
    const searchButton = document.getElementById('job-search-btn');
    const activeKeywordsContainer = document.getElementById('job-active-keywords');
    const resultsContainer = document.getElementById('job-results');
    const resultsCountContainer = document.getElementById('job-results-count');
    const prevPageButton = document.getElementById('job-prev-page');
    const nextPageButton = document.getElementById('job-next-page');
    const pageInfoSpan = document.getElementById('job-page-info');

    const API_JOBS = '/api/jobs';
    // State variables
    let currentPage = 1;
    let totalPages = 1;
    let currentKeywords = [];
    let currentLimit = parseInt(limitSelect.value);
    let completeOnly = false; // 완전한 데이터만 표시할지 여부

    // Initialize
    init();

    // Event listeners
    searchButton.addEventListener('click', handleSearch);
    keywordsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    completeOnlyCheckbox.addEventListener('change', () => {
        completeOnly = completeOnlyCheckbox.checked;
        currentPage = 1;
        fetchResults();
    });
    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchResults();
        }
    });
    nextPageButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchResults();
        }
    });
    limitSelect.addEventListener('change', () => {
        currentLimit = parseInt(limitSelect.value);
        currentPage = 1;
        fetchResults();
    });

    /**
     * 초기화 함수
     */
    function init() {
        // Check for URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const keywordsParam = urlParams.get('keywords');
        const pageParam = urlParams.get('page');
        const limitParam = urlParams.get('limit');
        const completeOnlyParam = urlParams.get('complete');

        if (keywordsParam) {
            currentKeywords = keywordsParam.split(',').map(k => k.trim()).filter(k => k);
            keywordsInput.value = currentKeywords.join(', ');
            updateActiveKeywords();
        }

        if (pageParam && !isNaN(parseInt(pageParam))) {
            currentPage = parseInt(pageParam);
        }

        if (limitParam && !isNaN(parseInt(limitParam))) {
            currentLimit = parseInt(limitParam);
            limitSelect.value = currentLimit;
        }

        // 완전한 데이터만 표시 옵션 설정
        if (completeOnlyParam === 'true') {
            completeOnly = true;
            completeOnlyCheckbox.checked = true;
        }

        // 초기 결과 가져오기
        fetchResults();
    }

    /**
     * 검색 처리 함수
     */
    function handleSearch() {
        const inputValue = keywordsInput.value.trim();
        if (inputValue) {
            currentKeywords = inputValue.split(',').map(k => k.trim()).filter(k => k);
            currentPage = 1;
            updateActiveKeywords();
            fetchResults();
        } else {
            currentKeywords = [];
            updateActiveKeywords();
            fetchResults();
        }
    }

    /**
     * 객체에 null/undefined 값이 있는지 확인
     * @param {Object} job - 채용공고 데이터
     * @returns {boolean} null/undefined 값이 없으면 true
     */
    function isCompleteJob(job) {
        // 확인할 중요 필드 목록
        const requiredFields = [
            'company_name',
            'department',
            'location',
            'experience',
            'job_type',
            'description',
            'requirements'
        ];

        // 모든 필드가 유효한 값(null/undefined가 아닌)을 가지고 있는지 확인
        return requiredFields.every(field => {
            const value = job[field];
            return value !== null && value !== undefined && value !== '';
        });
    }

    /**
     * 활성 키워드 업데이트 함수
     */
    function updateActiveKeywords() {
        activeKeywordsContainer.innerHTML = '';

        currentKeywords.forEach(keyword => {
            const keywordElem = document.createElement('span');
            keywordElem.className = 'keyword';
            keywordElem.textContent = keyword;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-keyword';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', () => {
                currentKeywords = currentKeywords.filter(k => k !== keyword);
                keywordsInput.value = currentKeywords.join(', ');
                updateActiveKeywords();
                currentPage = 1;
                fetchResults();
            });

            keywordElem.appendChild(removeBtn);
            activeKeywordsContainer.appendChild(keywordElem);
        });
    }

    /**
     * 결과 가져오기 함수
     */
    async function fetchResults() {
        resultsContainer.innerHTML = '<div class="loading">Loading...</div>';

        try {
            // API 파라미터 준비
            const params = new URLSearchParams();
            if (currentKeywords.length > 0) {
                params.set('keywords', currentKeywords.join(','));
            }
            params.set('page', currentPage);
            params.set('limit', currentLimit);

            // 완전한 데이터만 요청하는 파라미터 추가
            if (completeOnly) {
                params.set('complete', 'true');
            }

            // API 호출
            const response = await fetch(`${API_JOBS}?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            let filteredJobs = data.jobs;

            // 클라이언트 측에서 추가 필터링 (서버에서 처리하지 않는 경우)
            if (completeOnly && !params.has('complete')) {
                filteredJobs = data.jobs.filter(job => isCompleteJob(job));
            }

            // 페이지네이션 정보 업데이트
            // completeOnly가 true이고 서버에서 필터링되지 않은 경우 필터링된 개수를 사용
            const totalItems = completeOnly && !params.has('complete')
                ? filteredJobs.length
                : data.total;

            totalPages = Math.ceil(totalItems / currentLimit) || 1;
            updatePagination();

            // 결과 수 표시
            resultsCountContainer.textContent = `Found ${totalItems} recruitment positions`;

            // 결과 컨테이너 초기화
            resultsContainer.innerHTML = '';

            // 결과 표시 또는 결과 없음 메시지
            if (filteredJobs.length === 0) {
                resultsContainer.innerHTML = '<div class="no-results">No recruitment positions found. Try different keywords or filters.</div>';
            } else {
                // 각 채용공고에 대한 카드 생성 및 추가
                filteredJobs.forEach(job => {
                    const jobCard = createJobCard(job);
                    resultsContainer.appendChild(jobCard);
                });
            }
        } catch (error) {
            console.error('Error fetching results:', error);
            resultsContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        }
    }

    /**
     * 페이지네이션 업데이트 함수
     */
    function updatePagination() {
        pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageButton.disabled = currentPage <= 1;
        nextPageButton.disabled = currentPage >= totalPages;

        // URL 상태 업데이트
        const params = new URLSearchParams();
        if (currentKeywords.length > 0) {
            params.set('keywords', currentKeywords.join(','));
        }
        params.set('page', currentPage);
        params.set('limit', currentLimit);

        // 완전한 데이터 필터 URL 파라미터에 추가
        if (completeOnly) {
            params.set('complete', 'true');
        }

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        history.replaceState(null, '', newUrl);
    }

    /**
     * 채용공고 카드 생성 함수
     * @param {Object} job - 채용공고 데이터
     * @returns {HTMLElement} 생성된 카드 요소
     */
    function createJobCard(job) {
        const jobStatus = getJobStatus(job.apply_start_date, job.apply_end_date);
        const isComplete = isCompleteJob(job);

        const card = document.createElement('div');
        card.className = `job-card ${isComplete ? 'complete-job' : 'incomplete-job'}`;

        // 완전한 데이터인지 표시하는 배지 추가
        const completeBadge = document.createElement('div');
        completeBadge.className = `job-badge ${isComplete ? 'complete-badge' : 'incomplete-badge'}`;
        completeBadge.textContent = isComplete ? 'Complete' : 'Incomplete';

        const header = document.createElement('div');
        header.className = 'job-header';

        // 헤더에 배지 추가
        header.appendChild(completeBadge);

        const companyDept = document.createElement('div');
        companyDept.innerHTML = `
            <h3>${job.department || job.title || 'Unspecified Position'}</h3>
            <span class="job-company">${job.company_name || 'Unknown Company'}</span>
        `;
        header.appendChild(companyDept);

        const statusBadge = document.createElement('div');
        statusBadge.className = `job-status ${jobStatus.class}`;
        statusBadge.textContent = jobStatus.text;
        header.appendChild(statusBadge);

        card.appendChild(header);

        // 필드 값이 null인 경우 강조 표시
        const formatFieldValue = (value, fieldName) => {
            if (value === null || value === undefined || value === '') {
                return `<span class="missing-field">No ${fieldName} data</span>`;
            }
            if (Array.isArray(value)) {
                return value.join(', ');
            }
            return value;
        };

        // 테이블 생성
        const table = document.createElement('table');
        table.className = 'job-table';

        // 테이블 내용 채우기
        table.innerHTML = `
            <tr>
                <th>URL</th>
                <td><a href="${job.url}" target="_blank" class="job-url">${job.url || 'N/A'}</a></td>
            </tr>
            <tr>
                <th>Company</th>
                <td>${formatFieldValue(job.company_name, 'company')}</td>
            </tr>
            <tr>
                <th>Department</th>
                <td>${formatFieldValue(job.department, 'department')}</td>
            </tr>
            <tr>
                <th>Location</th>
                <td>${formatFieldValue(job.location, 'location')}</td>
            </tr>
            <tr>
                <th>Experience</th>
                <td>${formatFieldValue(job.experience, 'experience')}</td>
            </tr>
            <tr>
                <th>Job Type</th>
                <td>${formatFieldValue(job.job_type, 'job type')}</td>
            </tr>
            <tr>
                <th>Application Period</th>
                <td>${formatDate(job.apply_start_date)} - ${formatDate(job.apply_end_date)}</td>
            </tr>
            <tr>
                <th>Description</th>
                <td><div class="job-description">${formatFieldValue(job.description, 'description')}</div></td>
            </tr>
            <tr>
                <th>Requirements</th>
                <td><div class="job-requirements">${formatFieldValue(job.requirements, 'requirements')}</div></td>
            </tr>
            <tr>
                <th>Preferred Qualifications</th>
                <td><div class="job-preferred">${formatFieldValue(job.preferred_qualifications, 'qualifications')}</div></td>
            </tr>
            <tr>
                <th>Ideal Candidate</th>
                <td>${formatFieldValue(job.ideal_candidate, 'candidate info')}</td>
            </tr>
            <tr>
                <th>Updated</th>
                <td>${formatDate(job.updated_at)}</td>
            </tr>
        `;

        card.appendChild(table);
        return card;
    }

    /**
     * 채용공고 상태 확인 함수
     * @param {string} startDate - 시작일
     * @param {string} endDate - 종료일
     * @returns {Object} 상태 정보
     */
    function getJobStatus(startDate, endDate) {
        const now = new Date();
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        // 종료일이 과거인 경우
        if (end && end < now) {
            return { text: 'Expired', class: 'job-expired' };
        }

        // 종료일이 7일 이내인 경우
        if (end) {
            const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 7) {
                return { text: `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`, class: 'job-expiring' };
            }
        }

        // 시작일이 미래인 경우
        if (start && start > now) {
            return { text: 'Upcoming', class: 'job-upcoming' };
        }

        // 기본 상태: 활성화
        return { text: 'Active', class: 'job-active' };
    }

    /**
     * 날짜 포맷팅 함수
     * @param {string} dateStr - 날짜 문자열
     * @returns {string} 포맷된 날짜
     */
    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Invalid Date';

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
});