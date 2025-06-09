let currentPage = 1;
    let totalPages = 1;
    let jobsPerPage = 10;
    let currentJobs = [];


    // Initialize when the DOM content is loaded
    document.addEventListener('DOMContentLoaded', () => {
        // Add CSS styles for the job status buttons and job-valid-type indicator
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .job-card {
                position: relative;
                padding: 20px;
                margin-bottom: 15px;
                border: 1px solid #e0e0e0;
                border-radius: 5px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }

            .job-valid-type {
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8em;
                font-weight: bold;
                color: white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }

            /* Colors for different job status types */
            .job-valid-type.status-normal {
                background-color: #28a745; /* Green for normal */
            }

            .job-valid-type.status-closed {
                background-color: #6c757d; /* Gray for closed */
            }

            .job-valid-type.status-error {
                background-color: #dc3545; /* Red for error */
            }

            .job-valid-type.status-unchecked {
                background-color: #ffc107; /* Yellow for unchecked */
            }

            /* Job ID style */
            .job-id {
                position: absolute;
                top: 10px;
                left: 10px;
                font-size: 0.8em;
                color: #6c757d;
                font-weight: bold;
            }

            /* Job status actions buttons */
            .job-status-actions {
                display: flex;
                gap: 10px;
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid #eee;
            }

            .status-btn {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9em;
                transition: all 0.2s;
            }

            .status-btn:hover {
                opacity: 0.8;
            }

            .status-btn:disabled {
                cursor: not-allowed;
                opacity: 0.5;
            }

            .status-btn.normal {
                background-color: #28a745;
                color: white;
            }

            .status-btn.closed {
                background-color: #6c757d;
                color: white;
            }

            .status-btn.error {
                background-color: #dc3545;
                color: white;
            }

            /* Filter controls */
            .filter-controls {
                margin-bottom: 20px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 5px;
                border: 1px solid #e0e0e0;
            }

            .filter-controls h4 {
                margin-top: 0;
                margin-bottom: 10px;
            }

            .filter-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }

            .filter-btn {
                padding: 8px 15px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background-color: #D09AFF;
                cursor: pointer;
                transition: all 0.2s;
            }

            .filter-btn:hover {
                background-color: #f1f1f1;
            }

            .filter-btn.active {
                background-color: #007bff;
                color: white;
                border-color: #007bff;
            }
        `;
        document.head.appendChild(styleElement);

        // Setup event listeners
        setupEventListeners();

        // Load initial job listings
        loadJobListings();

        // Load filter options
        loadFilterOptions();
    });

    // Function to set up all event listeners
    function setupEventListeners() {
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
            let apiUrl = `/api/job`;


            // Fetch the data from the server
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }        const data = await response.json();

        // Store the jobs in currentJobs for later use
        currentJobs = data.data;
        // totalPages = Math.ceil(data.total / jobsPerPage);

        // Update the results count
        document.getElementById('results-count').textContent = `Showing ${data.data.length} job listings`;

        // Display the jobs
        displayJobs(data.data);

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

    function displayJobs(jobs) {
        const jobsContainer = document.getElementById('jobs-container');
        jobsContainer.innerHTML = '';

        if (jobs.length === 0) {
            jobsContainer.innerHTML = '<div class="no-results">No job listings found matching your criteria.</div>';
            return;
        }

        jobs.forEach(job => {
            // Format dates
            const postedDate = job.posted_at ? new Date(job.apply_start_date).toLocaleDateString() : 'Unknown';
            const expiryDate = job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Unknown';

            // Create the job card HTML
            const jobCard = document.createElement('div');
            jobCard.className = 'job-card';

            // Determine status class based on job valid type
            let statusClass = '';
            let statusText = '';

            if (job.jobValidTypes) {
                if (job.jobValidTypes.valid_type === 0) {
                    statusClass = 'status-normal';
                    statusText = '정상';
                } else if (job.jobValidTypes.valid_type === 1) {
                    statusClass = 'status-closed';
                    statusText = '마감됨';
                } else if (job.jobValidTypes.valid_type === 2) {
                    statusClass = 'status-error';
                    statusText = '오류';
                }
            }
            else {
                statusClass = 'status-unchecked';
                statusText = '체크 안함';

                }

            jobCard.innerHTML = `
                <span class="job-valid-type ${statusClass}">${statusText}</span>
                <span class="job-id">ID: ${job.id}</span>
                <h3 class="job-title">${escapeHtml(job.title || 'Untitled Position')}</h3>
                <h4 class="company-name">${escapeHtml(job.company_name || 'Unknown Company')}</h4>

                <div class="job-meta">
                    ${job.department ? `<span class="department">${escapeHtml(job.department)}</span>` : ''}
                    ${job.job_type ? `<span class="job-type">${escapeHtml(job.job_type)}</span>` : ''}
                    ${job.require_experience ? `<span class="experience">${escapeHtml(job.require_experience)}</span>` : ''}
                </div>

                <div class="job-dates">
                    <span class="posted-date">Posted: ${postedDate}</span>
                    <span class="expiry-date">Expires: ${expiryDate}</span>
                </div>

                <p class="job-description">${truncateText(job.job_description || 'No description available.', 500)}</p>

                <div class="job-actions">
                    <button class="view-details-btn" data-job-id="${job.id}">View Details</button>
                    ${job.url ? `<a href="${job.url}" target="_blank" class="visit-site-btn">Visit Original Post</a>` : ''}
                </div>
                <div class="job-status-actions" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                    <button class="status-btn normal" data-job-id="${job.id}" data-status-type="0" data-original-text="정상">정상</button>
                    <button class="status-btn closed" data-job-id="${job.id}" data-status-type="1" data-original-text="마감됨">마감됨</button>
                    <button class="status-btn error" data-job-id="${job.id}" data-status-type="2" data-original-text="오류">오류</button>
                </div>
            `;

            jobsContainer.appendChild(jobCard);

            // Add event listeners to the status buttons for this job card
            jobCard.querySelectorAll('.status-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const clickedButton = event.currentTarget;
                    const jobId = clickedButton.getAttribute('data-job-id');
                    const statusType = clickedButton.getAttribute('data-status-type');
                    await handleJobStatusUpdate(jobId, statusType, clickedButton);
                });
            });
        });

        // Add event listeners to the "View Details" buttons
        document.querySelectorAll('.view-details-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const jobId = event.target.getAttribute('data-job-id');
                const job = currentJobs.find(j => j.id == jobId);
                if (job) {
                    showJobDetails(job);
                } else {
                    console.warn(`Job with ID ${jobId} not found in currentJobs. Attempting to use data from card.`);

                    // Build job object from the card's visible data
                    const jobCard = event.target.closest('.job-card');
                    const jobDataFromCard = {
                        id: jobId,
                        title: jobCard.querySelector('.job-title').textContent,
                        company_name: jobCard.querySelector('.company-name').textContent,
                        job_description: jobCard.querySelector('.job-description').textContent
                    };
                    showJobDetails(jobDataFromCard);
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
        const postedDate = job.apply_start_date ? new Date(job.apply_start_date).toLocaleDateString() : 'Unknown';
        const endDate = job.apply_end_date ? new Date(job.apply_end_date).toLocaleDateString() : 'Unknown';

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
                        ${job.job_description ? `<li><strong>Experience Required:</strong> ${escapeHtml(job.job_description)}</li>` : ''}
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
                <p>${formatMultiLineText(job.job_description || 'No description available.')}</p>
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
   // Function to handle job status updates via POST request
   async function handleJobStatusUpdate(jobId, statusType, buttonElement) {
    const originalText = buttonElement.dataset.originalText;
    buttonElement.disabled = true;
    buttonElement.textContent = '처리중...'; // "Processing..."

    try {
        const response = await fetch(`/api/job-valid-type?job_id=${jobId}&valid_type=${statusType}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add any other necessary headers, like CSRF tokens if your app uses them
            },
            body: JSON.stringify({ jobId: parseInt(jobId) }) // Sending jobId in the POST body
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || (typeof errorData === 'string' ? errorData : JSON.stringify(errorData));
            } catch (e) {
                // If response is not JSON or error parsing JSON
                const textError = await response.text(); // Get raw text response
                errorMessage = textError || errorMessage;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json(); // Assuming the server responds with JSON
        console.log('Status update successful:', result);
        buttonElement.textContent = '성공!'; // "Success!"

        // Update the job card's valid_type display
        const jobCard = buttonElement.closest('.job-card');
        const statusIndicator = jobCard.querySelector('.job-valid-type');

        // Update status class and text based on the new status type
        let statusClass = '';
        let statusText = '';

        if (statusType === '0') {
            statusClass = 'status-normal';
            statusText = '정상';
        } else if (statusType === '1') {
            statusClass = 'status-closed';
            statusText = '마감됨';
        } else if (statusType === '2') {
            statusClass = 'status-error';
            statusText = '오류';
        }

        // Remove all previous status classes
        statusIndicator.classList.remove('status-normal', 'status-closed', 'status-error', 'status-unchecked');
        // Add the new status class
        statusIndicator.classList.add(statusClass);
        // Update the text
        statusIndicator.textContent = statusText;

        // Also update the entry in currentJobs array to reflect this change
        const jobIndex = currentJobs.findIndex(job => job.id == jobId);
        if (jobIndex !== -1) {
            if (!currentJobs[jobIndex].jobValidTypes) {
                currentJobs[jobIndex].jobValidTypes = {};
            }
            currentJobs[jobIndex].jobValidTypes.valid_type = parseInt(statusType);
        }

        // Revert button to original state after 2 seconds
        setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Error updating job status:', error);
        alert(`상태 업데이트 오류: ${error.message}`);
        buttonElement.textContent = originalText; // Revert to original text on error
        buttonElement.disabled = false; // Re-enable on error
    }
}

// Function to load filter options
async function loadFilterOptions() {
    // Create filter controls container if it doesn't exist
    let filterControls = document.getElementById('filter-controls');

    if (!filterControls) {
        const jobsSection = document.getElementById('jobs-container').parentNode;
        filterControls = document.createElement('div');
        filterControls.id = 'filter-controls';
        filterControls.className = 'filter-controls';
        jobsSection.insertBefore(filterControls, document.getElementById('jobs-container'));
    }

    // Create the filter controls HTML
    filterControls.innerHTML = `
        <h4>필터링</h4>
        <div class="filter-section">
            <h5>상태별 필터</h5>
            <div class="filter-buttons" id="status-filters">
                <button class="filter-btn active" data-filter="all">모두 보기</button>
                <button class="filter-btn" data-filter="status-normal">정상</button>
                <button class="filter-btn" data-filter="status-closed">마감됨</button>
                <button class="filter-btn" data-filter="status-error">오류</button>
                <button class="filter-btn" data-filter="status-unchecked">체크 안함</button>
            </div>
        </div>
    `;

    // Add event listeners to the filter buttons
    const filterButtons = document.querySelectorAll('#status-filters .filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');

            // Get the filter value
            const filterValue = button.getAttribute('data-filter');

            // Apply the filter
            filterJobsByStatus(filterValue);
        });
    });
}

// Function to filter jobs by status type
function filterJobsByStatus(filterValue) {
    if (!currentJobs || currentJobs.length === 0) {
        console.warn('No jobs to filter');
        return;
    }

    // If "all" is selected, show all jobs
    if (filterValue === 'all') {
        displayJobs(currentJobs);
        return;
    }

    // Otherwise, filter the jobs based on the selected status
    const filteredJobs = currentJobs.filter(job => {
        if (!job.jobValidTypes && filterValue === 'status-unchecked') {
            return true;
        }

        if (!job.jobValidTypes) {
            return false;
        }

        if (filterValue === 'status-normal' && job.jobValidTypes.valid_type === 0) {
            return true;
        }

        if (filterValue === 'status-closed' && job.jobValidTypes.valid_type === 1) {
            return true;
        }

        if (filterValue === 'status-error' && job.jobValidTypes.valid_type === 2) {
            return true;
        }

        return false;
    });

    // Update the results count
    document.getElementById('results-count').textContent = `Showing ${filteredJobs.length} of ${currentJobs.length} job listings`;

    // Display the filtered jobs
    displayJobs(filteredJobs);
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