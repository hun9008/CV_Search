document.addEventListener('DOMContentLoaded', function() {
    // Element references
    const searchBtn = document.getElementById('search-btn');
    const keywordsInput = document.getElementById('keywords');
    const limitSelect = document.getElementById('limit');
    const resultsDiv = document.getElementById('results');
    const resultsCountDiv = document.getElementById('results-count');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfoSpan = document.getElementById('page-info');
    const activeKeywordsDiv = document.getElementById('active-keywords');

    // State variables
    let currentPage = 1;
    let totalResults = 0;
    let totalPages = 1;
    let currentKeywords = [];

    // API base URL - change if needed
    const API_BASE_URL = '/api';
    const GEMINI_API_URL = '/parse-cv';

    /**
     * Performs the search request to the API
     */
    function performSearch() {
        const keywords = keywordsInput.value.trim();
        const limit = limitSelect.value;

        // Update current keywords list
        currentKeywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
        displayActiveKeywords();

        // Construct the API URL
        const apiUrl = `${API_BASE_URL}/search?keywords=${encodeURIComponent(keywords)}&limit=${limit}&page=${currentPage}`;

        // Show loading state
        resultsDiv.innerHTML = '<div class="loading">검색 중...</div>';

        // Fetch data from the API
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                displayResults(data);
            })
            .catch(error => {
                resultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
                console.error('Search error:', error);
            });
    }

    /**
     * Displays active keywords as tags
     */
    function displayActiveKeywords() {
        activeKeywordsDiv.innerHTML = '';
        currentKeywords.forEach(keyword => {
            const keywordTag = document.createElement('span');
            keywordTag.className = 'keyword-tag';
            keywordTag.textContent = keyword;
            activeKeywordsDiv.appendChild(keywordTag);
        });
    }

    /**
     * Highlights keywords in text content
     */
    function highlightKeywords(text) {
        if (!text) return '';
        let highlightedText = text;

        // Escape special characters in keywords for regex use
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Highlight each keyword
        currentKeywords.forEach(keyword => {
            if (!keyword) return;
            const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
        });

        return highlightedText;
    }

    /**
     * Formats date for display
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    /**
     * Parses job posting content using Gemini API
     */
    function parseCV(textContent, resultId) {
        const parseButton = document.querySelector(`#parse-btn-${resultId}`);
        const parseResultDiv = document.querySelector(`#parse-result-${resultId}`);

        parseButton.disabled = true;
        parseButton.textContent = '분석 중...';
        parseResultDiv.innerHTML = '<div class="loading-small">분석 중입니다...</div>';

        // Call backend which will use Gemini API to parse the job posting
        fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: textContent }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                displayParsedData(data, parseResultDiv);
                parseButton.textContent = '채용공고 분석하기';
                parseButton.disabled = false;
            })
            .catch(error => {
                console.error('Job posting parsing error:', error);
                parseResultDiv.innerHTML = `<p class="error">분석 오류: ${error.message}</p>`;
                parseButton.textContent = '채용공고 분석하기';
                parseButton.disabled = false;
            });
    }

    /**
     * Displays parsed job posting data
     */
    function displayParsedData(data, container) {
        let html = '';

        if (data.success) {
            html += '<div class="parsed-cv-data">';

            if (data.company_name) {
                html += `<div class="cv-field"><strong>회사명:</strong> ${data.company_name}</div>`;
            }

            if (data.department) {
                html += `<div class="cv-field"><strong>부서:</strong> ${data.department}</div>`;
            }

            if (data.experience) {
                html += `<div class="cv-field"><strong>경력 요구사항:</strong> ${data.experience}</div>`;
            }

            if (data.description) {
                html += `<div class="cv-field"><strong>직무 설명:</strong> ${data.description}</div>`;
            }

            if (data.job_type) {
                html += `<div class="cv-field"><strong>고용 형태:</strong> ${data.job_type}</div>`;
            }

            if (data.posted_period) {
                html += `<div class="cv-field"><strong>게시 기간:</strong> ${data.posted_period}</div>`;
            }

            if (data.requirements) {
                html += `<div class="cv-field"><strong>필수 요건:</strong> ${data.requirements}</div>`;
            }

            if (data.preferred_qualifications) {
                html += `<div class="cv-field"><strong>우대 사항:</strong> ${data.preferred_qualifications}</div>`;
            }

            if (data.ideal_candidate) {
                html += `<div class="cv-field"><strong>이상적인 후보자:</strong> ${data.ideal_candidate}</div>`;
            }

            html += '</div>';
        } else {
            html = `<p class="error">이 내용은 채용공고가 아닌 것으로 판단됩니다. 이유: ${data.reason || '알 수 없는 오류'}</p>`;
        }

        container.innerHTML = html;
    }

    /**
     * Displays search results
     */
    function displayResults(data) {
        resultsDiv.innerHTML = '';

        if (!data.results || data.results.length === 0) {
            resultsDiv.innerHTML = '<p>검색 결과가 없습니다.</p>';
            return;
        }

        totalResults = data.totalResults || 0;
        totalPages = data.totalPages || 1;
        const limit = parseInt(limitSelect.value);

        // Update results count
        resultsCountDiv.textContent = `${totalResults}개 중 ${data.results.length}개 결과 표시`;

        // Update pagination
        updatePagination(totalPages);

        // Display each result
        data.results.forEach((result, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';

            // Create result header with domain and favicon
            const header = document.createElement('div');
            header.className = 'result-header';

            // Add favicon to domain
            const faviconContainer = document.createElement('div');
            faviconContainer.className = 'favicon-container';

            const favicon = document.createElement('img');
            favicon.className = 'domain-favicon';
            favicon.src = `${API_BASE_URL}/favicon/${encodeURIComponent(result.domain)}`;
            favicon.alt = '';
            favicon.onerror = function() {
                // Replace with default icon if favicon load fails
                this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855-.143.268-.276.56-.395.872.705.157 1.472.257 2.282.287V1.077zM4.249 3.539c.142-.384.304-.744.481-1.078a6.7 6.7 0 0 1 .597-.933A7.01 7.01 0 0 0 3.051 3.05c.362.184.763.349 1.198.49zM3.509 7.5c.036-1.07.188-2.087.436-3.008a9.124 9.124 0 0 1-1.565-.667A6.964 6.964 0 0 0 1.018 7.5h2.49zm1.4-2.741a12.344 12.344 0 0 0-.4 2.741H7.5V5.091c-.91-.03-1.783-.145-2.591-.332zM8.5 5.09V7.5h2.99a12.342 12.342 0 0 0-.399-2.741c-.808.187-1.681.301-2.591.332zM4.51 8.5c.035.987.176 1.914.399 2.741A13.612 13.612 0 0 1 7.5 10.91V8.5H4.51zm3.99 0v2.409c.91.03 1.783.145 2.591.332.223-.827.364-1.754.4-2.741H8.5zm-3.282 3.696c.12.312.252.604.395.872.552 1.035 1.218 1.65 1.887 1.855V11.91c-.81.03-1.577.13-2.282.287zm.11 2.276a6.696 6.696 0 0 1-.598-.933 8.853 8.853 0 0 1-.481-1.079 8.38 8.38 0 0 0-1.198.49 7.01 7.01 0 0 0 2.276 1.522zm-1.383-2.964A13.36 13.36 0 0 1 3.508 8.5h-2.49a6.963 6.963 0 0 0 1.362 3.675c.47-.258.995-.482 1.565-.667zm6.728 2.964a7.009 7.009 0 0 0 2.275-1.521 8.376 8.376 0 0 0-1.197-.49 8.853 8.853 0 0 1-.481 1.078 6.688 6.688 0 0 1-.597.933zM8.5 11.909v3.014c.67-.204 1.335-.82 1.887-1.855.143-.268.276-.56.395-.872A12.63 12.63 0 0 0 8.5 11.91zm3.555-.401c.57.185 1.095.409 1.565.667A6.963 6.963 0 0 0 14.982 8.5h-2.49a13.36 13.36 0 0 1-.437 3.008zM14.982 7.5a6.963 6.963 0 0 0-1.362-3.675c-.47.258-.995.482-1.565.667.248.92.4 1.938.437 3.008h2.49zM11.27 2.461c.177.334.339.694.482 1.078a8.368 8.368 0 0 0 1.196-.49 7.01 7.01 0 0 0-2.275-1.52c.218.283.418.597.597.932zm-.488 1.343a7.765 7.765 0 0 0-.395-.872C9.835 1.897 9.17 1.282 8.5 1.077V4.09c.81-.03 1.577-.13 2.282-.287z"/></svg>';
                this.classList.add('default-favicon');
            };
            faviconContainer.appendChild(favicon);
            header.appendChild(faviconContainer);

            const domain = document.createElement('span');
            domain.className = 'result-domain';
            domain.textContent = result.domain || '알 수 없는 도메인';
            header.appendChild(domain);

            resultItem.appendChild(header);

            // URL as link
            const urlLink = document.createElement('a');
            urlLink.href = result.url;
            urlLink.target = '_blank';
            urlLink.className = 'result-url';
            urlLink.textContent = result.url;
            resultItem.appendChild(urlLink);

            // Creation date
            if (result.createdAt) {
                const date = document.createElement('div');
                date.className = 'result-date';
                date.textContent = `인덱싱 날짜: ${formatDate(result.createdAt)}`;
                resultItem.appendChild(date);
            }

            // Text content section heading
            const textHeading = document.createElement('h3');
            textHeading.textContent = '내용:';
            textHeading.style.marginBottom = '8px';
            textHeading.style.marginTop = '15px';
            resultItem.appendChild(textHeading);

            // Text content without toggle
            const textContent = document.createElement('div');
            textContent.className = 'result-text';
            if (result.text) {
                textContent.innerHTML = highlightKeywords(result.text);
                resultItem.appendChild(textContent);

                // Create parse container (button and results side by side)
                const parseContainer = document.createElement('div');
                parseContainer.className = 'parse-container';

                // Add parse button
                const parseButton = document.createElement('button');
                parseButton.id = `parse-btn-${index}`;
                parseButton.className = 'parse-btn';
                parseButton.textContent = '채용공고 분석하기';
                parseContainer.appendChild(parseButton);

                // Add parse result container
                const parseResultDiv = document.createElement('div');
                parseResultDiv.id = `parse-result-${index}`;
                parseResultDiv.className = 'parse-result';
                parseContainer.appendChild(parseResultDiv);

                // Add event listener to button
                parseButton.addEventListener('click', () => parseCV(result.text, index));

                resultItem.appendChild(parseContainer);
            } else {
                textContent.textContent = '내용이 없습니다.';
                textContent.style.fontStyle = 'italic';
                textContent.style.color = '#888';
                resultItem.appendChild(textContent);
            }

            resultsDiv.appendChild(resultItem);
        });
    }

    /**
     * Updates pagination controls
     */
    function updatePagination(pages) {
        pageInfoSpan.textContent = `페이지 ${currentPage} / ${pages || 1}`;

        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= pages;
    }

    // Event listeners
    searchBtn.addEventListener('click', function() {
        currentPage = 1;
        performSearch();
    });

    keywordsInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            currentPage = 1;
            performSearch();
        }
    });

    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            performSearch();
        }
    });

    nextPageBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            performSearch();
        }
    });
});