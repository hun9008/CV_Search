let currentPage = 1;
let totalPages = 1;
let jobsPerPage = 10;
let currentJobs = [];
let filters = {
    jobType: '',
    experience: '',
    searchText: '',
    sortBy: 'created_at'
};

// Initialize when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Setup event listeners
    setupEventListeners();

    // Load initial job listings
    loadJobListings();

    // Load filter options
    loadFilterOptions();
});

// Function to set up all event listeners
function setupEventListeners() {
    // Pagination controls
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadJobListings();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadJobListings();
        }
    });

    // Filter controls
    document.getElementById('apply-filters').addEventListener('click', () => {
        currentPage = 1;
        filters.jobType = document.getElementById('job-type').value;
        filters.experience = document.getElementById('experience').value;
        filters.searchText = document.getElementById('search-text').value;
        filters.sortBy = document.getElementById('sort-by').value;
        loadJobListings();
    });

    document.getElementById('reset-filters').addEventListener('click', () => {
        currentPage = 1;
        document.getElementById('job-type').value = '';
        document.getElementById('experience').value = '';
        document.getElementById('search-text').value = '';
        document.getElementById('sort-by').value = 'created_at';

        filters = {
            jobType: '',
            experience: '',
            searchText: '',
            sortBy: 'created_at'
        };

        loadJobListings();
    });

    // Modal close button
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('job-modal').style.display = 'none';
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('job-modal')) {
            document.getElementById('job-modal').style.display = 'none';
        }
    });
}

// Function to load the job listings from the server
async function loadJobListings() {
    try {
        const jobsContainer = document.getElementById('jobs-container');
        jobsContainer.innerHTML = '<div class="loading">Loading job listings...</div>';

        // Construct the API URL with filters and pagination
        let apiUrl = `/api/mysql-jobs?page=${currentPage}&limit=${jobsPerPage}`;

        if (filters.jobType) {
            apiUrl += `&jobType=${encodeURIComponent(filters.jobType)}`;
        }

        if (filters.experience) {
            apiUrl += `&experience=${encodeURIComponent(filters.experience)}`;
        }

        if (filters.searchText) {
            apiUrl += `&search=${encodeURIComponent(filters.searchText)}`;
        }

        if (filters.sortBy) {
            apiUrl += `&sortBy=${encodeURIComponent(filters.sortBy)}`;
        }

        // Fetch the data from the server
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        currentJobs = data.jobs;
        totalPages = Math.ceil(data.total / jobsPerPage);

        // Update the results count
        document.getElementById('results-count').textContent = `Showing ${currentJobs.length} of ${data.total} job listings`;

        // Display the jobs
        displayJobs(currentJobs);

        // Update pagination controls
        updatePagination();

    } catch (error) {
        console.error('Error loading job listings:', error);
        document.getElementById('jobs-container').innerHTML = `
            <div class="error">
                <p>Error loading job listings. Please try again later.</p>
                <p>Details: ${error.message}</p>
            </div>
        `;
    }
}

// Function to load filter options dynamically from available data
async function loadFilterOptions() {
    try {
        const response = await fetch('/api/mysql-jobs/filters');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Populate job type filter
        const jobTypeSelect = document.getElementById('job-type');
        jobTypeSelect.innerHTML = '<option value="">All Types</option>';

        if (data.jobTypes && data.jobTypes.length) {
            data.jobTypes.forEach(type => {
                if (type) {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = type;
                    jobTypeSelect.appendChild(option);
                }
            });
        }

        // Populate experience level filter
        const experienceSelect = document.getElementById('experience');
        experienceSelect.innerHTML = '<option value="">All Levels</option>';

        if (data.experienceLevels && data.experienceLevels.length) {
            data.experienceLevels.forEach(level => {
                if (level) {
                    const option = document.createElement('option');
                    option.value = level;
                    option.textContent = level;
                    experienceSelect.appendChild(option);
                }
            });
        }

    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

// Function to display the job listings
function displayJobs(jobs) {
    const jobsContainer = document.getElementById('jobs-container');
    jobsContainer.innerHTML = '';

    if (jobs.length === 0) {
        jobsContainer.innerHTML = '<div class="no-results">No job listings found matching your criteria.</div>';
        return;
    }

    jobs.forEach(job => {
        // Format dates
        const postedDate = job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Unknown';
        const expiryDate = job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Unknown';

        // Create the job card HTML
        const jobCard = document.createElement('div');
        jobCard.className = 'job-card';
        jobCard.innerHTML = `
            <span class="mysql-info">MySQL Stored</span>
            <h3 class="job-title">${escapeHtml(job.title || 'Untitled Position')}</h3>
            <h4 class="company-name">${escapeHtml(job.company_name || 'Unknown Company')}</h4>

            <div class="job-meta">
                ${job.department ? `<span class="department">${escapeHtml(job.department)}</span>` : ''}
                ${job.job_type ? `<span class="job-type">${escapeHtml(job.job_type)}</span>` : ''}
                ${job.experience ? `<span class="experience">${escapeHtml(job.experience)}</span>` : ''}
            </div>

            <div class="job-dates">
                <span class="posted-date">Posted: ${postedDate}</span>
                <span class="expiry-date">Expires: ${expiryDate}</span>
            </div>

            <p class="job-description">${truncateText(job.description || 'No description available.', 150)}</p>

            <div class="job-actions">
                <button class="view-details-btn" data-job-id="${job.id}">View Details</button>
                ${job.url ? `<a href="${job.url}" target="_blank" class="visit-site-btn">Visit Original Post</a>` : ''}
            </div>
        `;

        jobsContainer.appendChild(jobCard);
    });

    // Add event listeners to the "View Details" buttons
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const jobId = event.target.getAttribute('data-job-id');
            const job = currentJobs.find(j => j.id == jobId);
            if (job) {
                showJobDetails(job);
            }
        });
    });
}

// Function to update pagination controls
function updatePagination() {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;

    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
}

// Function to show job details in a modal
function showJobDetails(job) {
    const modal = document.getElementById('job-modal');
    const jobDetails = document.getElementById('job-details');

    // Format dates
    const postedDate = job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Unknown';
    const endDate = job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Unknown';

    // Construct the modal content
    jobDetails.innerHTML = `
        <div class="modal-header">
            <h2>${escapeHtml(job.title || 'Untitled Position')}</h2>
            <h3>${escapeHtml(job.company_name || 'Unknown Company')}</h3>
            <div class="mysql-tag">MySQL Stored</div>
        </div>

        <div class="job-info-grid">
            <div class="info-group">
                <h4>Job Details</h4>
                <ul>
                    ${job.department ? `<li><strong>Department:</strong> ${escapeHtml(job.department)}</li>` : ''}
                    ${job.job_type ? `<li><strong>Job Type:</strong> ${escapeHtml(job.job_type)}</li>` : ''}
                    ${job.experience ? `<li><strong>Experience Required:</strong> ${escapeHtml(job.experience)}</li>` : ''}
                </ul>
            </div>

            <div class="info-group">
                <h4>Dates</h4>
                <ul>
                    <li><strong>Posted Date:</strong> ${postedDate}</li>
                    <li><strong>End Date:</strong> ${endDate}</li>
                </ul>
            </div>
        </div>

        <div class="job-description-section">
            <h4>Job Description</h4>
            <p>${formatMultiLineText(job.description || 'No description available.')}</p>
        </div>

        ${job.requirements ? `
        <div class="job-requirements-section">
            <h4>Requirements</h4>
            <p>${formatMultiLineText(job.requirements)}</p>
        </div>
        ` : ''}

        ${job.preferred_qualifications ? `
        <div class="job-qualifications-section">
            <h4>Preferred Qualifications</h4>
            <p>${formatMultiLineText(job.preferred_qualifications)}</p>
        </div>
        ` : ''}

        ${job.ideal_candidate ? `
        <div class="job-candidate-section">
            <h4>Ideal Candidate</h4>
            <p>${formatMultiLineText(job.ideal_candidate)}</p>
        </div>
        ` : ''}

        <div class="job-actions-footer">
            ${job.url ? `<a href="${job.url}" target="_blank" class="btn primary-btn">Visit Original Post</a>` : ''}
            <button class="btn secondary-btn close-modal-btn">Close</button>
        </div>
    `;

    // Add event listener to the close button in the modal
    document.querySelector('.close-modal-btn').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Display the modal
    modal.style.display = 'block';
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return escapeHtml(text);
    return escapeHtml(text.substring(0, maxLength)) + '...';
}

// Helper function to format multi-line text
function formatMultiLineText(text) {
    if (!text) return '';
    const escaped = escapeHtml(text);
    return escaped.replace(/\n/g, '<br>').replace(/• /g, '&bull; ');
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}