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

            // Create result header with domain
            const header = document.createElement('div');
            header.className = 'result-header';

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