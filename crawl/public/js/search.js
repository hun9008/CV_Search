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
    const API_BASE_URL = 'http://localhost:3000/api';

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
        resultsDiv.innerHTML = '<div class="loading">Searching...</div>';

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
     * Displays search results
     */
    function displayResults(data) {
        resultsDiv.innerHTML = '';

        if (!data.results || data.results.length === 0) {
            resultsDiv.innerHTML = '<p>No results found.</p>';
            return;
        }

        totalResults = data.totalResults || 0;
        totalPages = data.totalPages || 1;
        const limit = parseInt(limitSelect.value);

        // Update results count
        resultsCountDiv.textContent = `Showing ${data.results.length} of ${totalResults} results`;

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
            domain.textContent = result.domain || 'Unknown Domain';
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
                date.textContent = `Indexed on: ${formatDate(result.createdAt)}`;
                resultItem.appendChild(date);
            }

            // Text content section heading
            const textHeading = document.createElement('h3');
            textHeading.textContent = 'Content:';
            textHeading.style.marginBottom = '8px';
            textHeading.style.marginTop = '15px';
            resultItem.appendChild(textHeading);

            // Text content without toggle
            const textContent = document.createElement('div');
            textContent.className = 'result-text';
            if (result.text) {
                textContent.innerHTML = highlightKeywords(result.text);
            } else {
                textContent.textContent = 'No text content available.';
                textContent.style.fontStyle = 'italic';
                textContent.style.color = '#888';
            }
            resultItem.appendChild(textContent);

            resultsDiv.appendChild(resultItem);
        });
    }

    /**
     * Updates pagination controls
     */
    function updatePagination(pages) {
        pageInfoSpan.textContent = `Page ${currentPage} of ${pages || 1}`;

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