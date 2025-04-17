/**
 * 채용 정보 검색 및 표시 기능
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const keywordsInput = document.getElementById('job-keywords');
    const limitSelect = document.getElementById('job-limit');
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

    // Initialize
    init();

    // Event listeners
    searchButton.addEventListener('click', handleSearch);
    keywordsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
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
     * 날짜 포맷팅 함수
     * @param {string} dateString - 날짜 문자열
     * @returns {string} 포맷팅된 날짜 문자열
     */
    function formatDate(dateString) {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * 채용공고 상태 확인 함수
     * @param {string} startDate - 시작일
     * @param {string} endDate - 종료일
     * @returns {Object} 상태 정보 객체
     */
    function getJobStatus(startDate, endDate) {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return { status: 'Unknown', class: '' };
        }

        if (now > end) {
            return { status: 'Expired', class: 'job-expired' };
        }

        // 7일 내 만료 여부 확인
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        if (end <= sevenDaysFromNow) {
            return { status: 'Expiring Soon', class: 'job-expiring' };
        }

        return { status: 'Active', class: 'job-active' };
    }

    /**
     * 채용공고 카드 생성 함수
     * @param {Object} job - 채용공고 데이터
     * @returns {HTMLElement} 생성된 카드 요소
     */
    function createJobCard(job) {
        const jobStatus = getJobStatus(job.start_date, job.end_date);

        const card = document.createElement('div');
        card.className = 'job-card';

        const header = document.createElement('div');
        header.className = 'job-header';

        const companyDept = document.createElement('div');
        companyDept.innerHTML = `
            <h3>${job.department || job.title || 'Unspecified Position'}</h3>
            <span class="job-company">${job.company_name || 'Unknown Company'}</span>
        `;

        const dates = document.createElement('div');
        dates.className = 'job-dates';
        dates.innerHTML = `
            <div>Posted: ${formatDate(job.created_at)}</div>
            <div>
                <span class="job-status ${jobStatus.class}">${jobStatus.status}</span>
            </div>
        `;

        header.appendChild(companyDept);
        header.appendChild(dates);

        const content = document.createElement('div');
        content.className = 'job-content';

        // 채용공고 세부 정보 테이블 생성
        const table = document.createElement('table');
        table.className = 'job-table';

        // 필드별 행 추가
        table.innerHTML = `
            <tr>
                <th>URL</th>
                <td><a href="${job.url}" target="_blank" class="job-url">${job.url || 'N/A'}</a></td>
            </tr>
            <tr>
                <th>Domain</th>
                <td>${job.domain || 'N/A'}</td>
            </tr>
            <tr>
                <th>Company</th>
                <td>${job.company_name || 'N/A'}</td>
            </tr>
            <tr>
                <th>Department</th>
                <td>${job.department || 'N/A'}</td>
            </tr>
            <tr>
                <th>Experience</th>
                <td>${job.experience || 'N/A'}</td>
            </tr>
            <tr>
                <th>Job Type</th>
                <td>${job.job_type || 'N/A'}</td>
            </tr>
            <tr>
                <th>Application Period</th>
                <td>${formatDate(job.start_date)} - ${formatDate(job.end_date)}</td>
            </tr>
            <tr>
                <th>Description</th>
                <td><div class="job-description">${job.description || 'N/A'}</div></td>
            </tr>
            <tr>
                <th>Requirements</th>
                <td><div class="job-requirements">${job.requirements || 'N/A'}</div></td>
            </tr>
            <tr>
                <th>Preferred Qualifications</th>
                <td><div class="job-preferred">${job.preferred_qualifications || 'N/A'}</div></td>
            </tr>
            <tr>
                <th>Ideal Candidate</th>
                <td>${job.ideal_candidate || 'N/A'}</td>
            </tr>
            <tr>
                <th>Status</th>
                <td>${job.status || 'N/A'}</td>
            </tr>
            <tr>
                <th>Updated</th>
                <td>${formatDate(job.updated_at)}</td>
            </tr>
        `;

        content.appendChild(table);
        card.appendChild(header);
        card.appendChild(content);

        return card;
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

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        history.replaceState(null, '', newUrl);
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

            // API 호출
            const response = await fetch(`${API_JOBS}?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            // 페이지네이션 정보 업데이트
            totalPages = Math.ceil(data.total / currentLimit) || 1;
            updatePagination();

            // 결과 수 표시
            resultsCountContainer.textContent = `Found ${data.total} recruitment positions`;

            // 결과 컨테이너 초기화
            resultsContainer.innerHTML = '';

            // 결과 표시 또는 결과 없음 메시지
            if (data.jobs.length === 0) {
                resultsContainer.innerHTML = '<div class="no-results">No recruitment positions found. Try different keywords.</div>';
            } else {
                // 각 채용공고에 대한 카드 생성 및 추가
                data.jobs.forEach(job => {
                    const jobCard = createJobCard(job);
                    resultsContainer.appendChild(jobCard);
                });
            }
        } catch (error) {
            console.error('Error fetching results:', error);
            resultsContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        }
    }
});