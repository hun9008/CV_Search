let currentPage = 1;
let totalPages = 1;
let jobsPerPage = 10;
let currentJobs = [];
let filters = {
    jobType: '',
    experience: '',
    searchText: '',
    sortBy: 'updated_at',
    completeDataOnly: false,
    itOnly: false

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
// "완성도 통계 보기" 버튼을 추가하고 통계 표시 기능 구현
function setupCompletionStats() {
  // HTML 요소 추가 (적절한 위치에 삽입)
  const statsButton = document.createElement('button');
  statsButton.id = 'show-completion-stats';
  statsButton.className = 'filter-btn';
  statsButton.textContent = '데이터 완성도 통계 보기';

  // 버튼을 페이지에 삽입 (필터 섹션 다음에)
  const filterSection = document.querySelector('.filter-section');
  filterSection.after(statsButton);

  // 통계 표시 모달 생성
  const statsModal = document.createElement('div');
  statsModal.id = 'stats-modal';
  statsModal.className = 'modal';
  statsModal.innerHTML = `
    <div class="modal-content wider-modal">
      <div class="modal-header">
        <h2>채용공고 데이터 완성도 통계</h2>
        <span class="close-stats">&times;</span>
      </div>
      <div id="stats-content">
        <div class="loading">통계 데이터를 불러오는 중...</div>
      </div>
    </div>
  `;
  document.body.appendChild(statsModal);

  // 이벤트 리스너 설정
  statsButton.addEventListener('click', async () => {
    statsModal.style.display = 'block';
    await loadCompletionStats();
  });

  document.querySelector('.close-stats').addEventListener('click', () => {
    statsModal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target === statsModal) {
      statsModal.style.display = 'none';
    }
  });
}

// 완성도 통계 데이터 로드 함수
async function loadCompletionStats() {
  try {
    const statsContent = document.getElementById('stats-content');
    statsContent.innerHTML = '<div class="loading">통계 데이터를 불러오는 중...</div>';

    const response = await fetch('/api/recruitinfos-claude/completion-stats');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '통계 데이터를 불러오지 못했습니다.');
    }

    // 통계 데이터 표시
    statsContent.innerHTML = `
      <div class="stats-summary">
        <h3>요약</h3>
        <p>전체 채용공고: <strong>${data.totalDocuments}</strong>개</p>
        <p>완전한 데이터를 가진 채용공고: <strong>${data.completeDocuments}</strong>개 (${data.completePercentage}%)</p>
      </div>

      <h3>필드별 완성도</h3>
      <table class="stats-table">
        <thead>
          <tr>
            <th>필드명</th>
            <th>채워진 데이터</th>
            <th>알 수 없음 데이터</th>
            <th>비어있는 데이터</th>
          </tr>
        </thead>
        <tbody>
          ${data.fieldStats.map(stat => `
            <tr>
              <td>${stat.display}</td>
              <td>${stat.filled}개 (${stat.filledPercentage}%)</td>
              <td>${stat.unknown}개 (${stat.unknownPercentage}%)</td>
              <td>${stat.empty}개 (${stat.emptyPercentage}%)</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="stats-actions">
        <button id="load-complete-data" class="primary-btn">완전한 데이터의 채용공고만 보기</button>
      </div>
    `;

    // 완전한 데이터만 보기 버튼 이벤트 리스너
    document.getElementById('load-complete-data').addEventListener('click', () => {
      document.getElementById('complete-data-only').checked = true;
      filters.completeDataOnly = true;
      loadJobListings();
      statsModal.style.display = 'none';
    });

  } catch (error) {
    console.error('데이터 완성도 통계 로드 오류:', error);
    document.getElementById('stats-content').innerHTML = `
      <div class="error">
        <p>데이터 완성도 통계를 불러오지 못했습니다.</p>
        <p>자세한 내용: ${error.message}</p>
      </div>
    `;
  }
}


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
        filters.completeDataOnly = document.getElementById('complete-data-only').checked;
        filters.itOnly = document.getElementById('it-only').checked; // Add this line
        loadJobListings();
    });

    document.getElementById('reset-filters').addEventListener('click', () => {
        currentPage = 1;
        document.getElementById('job-type').value = '';
        document.getElementById('experience').value = '';
        document.getElementById('search-text').value = '';
        document.getElementById('sort-by').value = 'updated_at';
        document.getElementById('complete-data-only').checked = false;
        document.getElementById('it-only').checked = false; // Add this line

        filters = {
            jobType: '',
            experience: '',
            searchText: '',
            sortBy: 'updated_at',
            completeDataOnly: false,
            itOnly: false // Add this property
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
        let apiUrl = `/api/recruitinfos-claude?page=${currentPage}&limit=${jobsPerPage}`;

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

        // Add complete data filter parameter
        if (filters.completeDataOnly) {
            apiUrl += `&complete=true`;
        }

        // Add IT jobs only filter if the checkbox is checked
        if (filters.itOnly) {
            apiUrl += `&itOnly=true`;
        }

        // Fetch the data from the server
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        currentJobs = data.jobs;
        totalPages = Math.ceil(data.total / jobsPerPage);

        // Update the results count with additional information when complete filter is active
        if (filters.completeDataOnly) {
            document.getElementById('results-count').innerHTML = `
                <div class="results-stats">
                    <p>완전한 데이터의 채용공고: <strong>${data.total}</strong>개
                    ${data.totalAll ? `(전체 ${data.totalAll}개 중 ${data.completeRatio}%)` : ''}
                    </p>
                </div>
            `;
        } else {
            document.getElementById('results-count').textContent = `Showing ${currentJobs.length} of ${data.total} job listings`;
        }

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
        const response = await fetch('/api/recruitinfos-claude/filters');

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
        job.title = company_name + job.department + job.job_type;
        const postedDate = job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Unknown';
        const expiryDate = job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Unknown';

        // Check if data is complete
        const isComplete = job.company_name &&
                           job.company_name !== 'Unknown Company' &&
                           job.company_name !== '알 수 없음' &&
                           job.company_name !== '명시되지 않음' &&
                           job.description &&
                           job.description !== 'No description available.' &&
                           job.job_type &&
                           job.job_type !== '' &&
                           job.experience &&
                           job.experience !== '';

        // Create the job card HTML
        const jobCard = document.createElement('div');
        jobCard.className = 'job-card';
        jobCard.innerHTML = `
            <span class="parser-info">Parsed by Claude</span>
            <h3 class="job-title">${escapeHtml(job.title || 'Untitled Position')}
                <span class="${isComplete ? 'complete-data-indicator' : 'complete-data-indicator incomplete-data-indicator'}">
                    ${isComplete ? 'Complete Data' : 'Incomplete Data'}
                </span>
            </h3>
            <h4 class="company-name">${escapeHtml(job.company_name || 'Unknown Company')}</h4>

            <div class="job-meta">
                ${job.department ? `<span class="department">${escapeHtml(job.department)}</span>` : ''}
                ${job.job_type ? `<span class="job-type">${escapeHtml(job.job_type)}</span>` : '<span class="job-type missing">No Job Type</span>'}
                ${job.experience ? `<span class="experience">${escapeHtml(job.experience)}</span>` : '<span class="experience missing">No Experience Level</span>'}
            </div>

            <div class="job-dates">
                <span class="posted-date">Posted: ${postedDate}</span>
                <span class="expiry-date">Expires: ${expiryDate}</span>
            </div>

            <p class="job-description">${truncateText(job.description || 'No description available.', 150)}</p>

            <div class="job-actions">
                <button class="view-details-btn" data-job-id="${job._id}">View Details</button>
                <a href="${job.url}" target="_blank" class="visit-site-btn">Visit Original Post</a>
            </div>
        `;

        jobsContainer.appendChild(jobCard);
    });

    // Add event listeners to the "View Details" buttons
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const jobId = event.target.getAttribute('data-job-id');
            const job = currentJobs.find(j => j._id === jobId);
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
// 수정: showJobDetails 함수 내에 MySQL 저장 버튼 추가
function showJobDetails(job) {
    const modal = document.getElementById('job-modal');
    const jobDetails = document.getElementById('job-details');

    // Format dates
    const postedDate = job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Unknown';
    const startDate = job.start_date ? new Date(job.start_date).toLocaleDateString() : 'Unknown';
    const endDate = job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Unknown';

    // Construct the modal content
    jobDetails.innerHTML = `
        <div class="modal-header">
            <h2>${escapeHtml(job.title || 'Untitled Position')}</h2>
            <h3>${escapeHtml(job.company_name || 'Unknown Company')}</h3>
            <div class="parser-tag">Parsed by Claude</div>
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
                    <li><strong>Start Date:</strong> ${startDate}</li>
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
            <a href="${job.url}" target="_blank" class="btn primary-btn">Visit Original Post</a>
            <button id="save-to-mysql" class="btn save-btn">저장하기 (MySQL)</button>
            <button class="btn secondary-btn close-modal-btn">Close</button>
        </div>
        <div id="save-result" class="save-result"></div>
    `;

    // Add event listener to the close button in the modal
    document.querySelector('.close-modal-btn').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Add event listener to the "Save to MySQL" button
    document.getElementById('save-to-mysql').addEventListener('click', () => {
        saveJobToMySql(job);
    });

    // Display the modal
    modal.style.display = 'block';
}

// Function to save a job to MySQL
async function saveJobToMySql(job) {
    const saveResult = document.getElementById('save-result');
    saveResult.innerHTML = '<p class="saving">저장 중...</p>';

    try {
        const response = await fetch('/api/mysql-jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: job.title,
                company_name: job.company_name,
                job_type: job.job_type,
                experience: job.experience,
                department: job.department,
                description: job.description,
                requirements: job.requirements,
                preferred_qualifications: job.preferred_qualifications,
                ideal_candidate: job.ideal_candidate,
                url: job.url,
                posted_at: job.posted_at,
                end_date: job.end_date
            })
        });

        const result = await response.json();

        if (response.ok) {
            saveResult.innerHTML = '<p class="success">채용공고가 MySQL에 성공적으로 저장되었습니다.</p>';

            // MySQL 저장 성공 시 버튼 비활성화
            document.getElementById('save-to-mysql').disabled = true;
            document.getElementById('save-to-mysql').textContent = 'MySQL에 저장됨';
            document.getElementById('save-to-mysql').classList.add('saved');
        } else {
            throw new Error(result.error || '저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error saving job to MySQL:', error);
        saveResult.innerHTML = `<p class="error">저장 실패: ${error.message}</p>`;
    }
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

function displayJobs(jobs) {
    const jobsContainer = document.getElementById('jobs-container');
    jobsContainer.innerHTML = '';

    if (jobs.length === 0) {
        jobsContainer.innerHTML = '<div class="no-results">No job listings found matching your criteria.</div>';
        return;
    }

    // 일괄 저장 버튼 추가
    const batchSaveContainer = document.createElement('div');
    batchSaveContainer.className = 'batch-actions';
    batchSaveContainer.innerHTML = `
        <div class="batch-controls">
            <label>
                <input type="checkbox" id="select-all"> 전체 선택
            </label>
            <button id="batch-save" class="batch-save-btn" disabled>선택항목 MySQL에 저장</button>
        </div>
        <div id="batch-result" class="batch-result"></div>
    `;
    jobsContainer.appendChild(batchSaveContainer);

    jobs.forEach(job => {
        // Format dates
        const postedDate = job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Unknown';
        const expiryDate = job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Unknown';

        // Check if data is complete
        const isComplete = job.company_name &&
                           job.company_name !== 'Unknown Company' &&
                           job.company_name !== '알 수 없음' &&
                           job.company_name !== '명시되지 않음' &&
                           job.description &&
                           job.description !== 'No description available.' &&
                           job.job_type &&
                           job.job_type !== '' &&
                           job.experience &&
                           job.experience !== '';

        // Create the job card HTML
        const jobCard = document.createElement('div');
        jobCard.className = 'job-card';
        jobCard.innerHTML = `
            <div class="job-selection">
                <input type="checkbox" class="job-checkbox" data-job-id="${job._id}">
            </div>
            <span class="parser-info">Parsed by Claude</span>
            <h3 class="job-title">${escapeHtml(job.title || 'Untitled Position')}
                <span class="${isComplete ? 'complete-data-indicator' : 'complete-data-indicator incomplete-data-indicator'}">
                    ${isComplete ? 'Complete Data' : 'Incomplete Data'}
                </span>
            </h3>
            <h4 class="company-name">${escapeHtml(job.company_name || 'Unknown Company')}</h4>

            <div class="job-meta">
                ${job.department ? `<span class="department">${escapeHtml(job.department)}</span>` : ''}
                ${job.job_type ? `<span class="job-type">${escapeHtml(job.job_type)}</span>` : '<span class="job-type missing">No Job Type</span>'}
                ${job.experience ? `<span class="experience">${escapeHtml(job.experience)}</span>` : '<span class="experience missing">No Experience Level</span>'}
            </div>

            <div class="job-dates">
                <span class="posted-date">Posted: ${postedDate}</span>
                <span class="expiry-date">Expires: ${expiryDate}</span>
            </div>

            <p class="job-description">${truncateText(job.description || 'No description available.', 150)}</p>

            <div class="job-actions">
                <button class="view-details-btn" data-job-id="${job._id}">View Details</button>
                <a href="${job.url}" target="_blank" class="visit-site-btn">Visit Original Post</a>
            </div>
        `;

        jobsContainer.appendChild(jobCard);
    });

    // Add event listeners to the "View Details" buttons
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const jobId = event.target.getAttribute('data-job-id');
            const job = currentJobs.find(j => j._id === jobId);
            if (job) {
                showJobDetails(job);
            }
        });
    });

    // Add event listeners for batch selection
    setupBatchSelectionListeners();
}

// 일괄 선택 관련 이벤트 리스너 설정
function setupBatchSelectionListeners() {
    const selectAllCheckbox = document.getElementById('select-all');
    const jobCheckboxes = document.querySelectorAll('.job-checkbox');
    const batchSaveButton = document.getElementById('batch-save');

    // 전체 선택 체크박스
    selectAllCheckbox.addEventListener('change', function() {
        jobCheckboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
        updateBatchSaveButton();
    });

    // 개별 체크박스
    jobCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateBatchSaveButton);
    });

    // 일괄 저장 버튼
    batchSaveButton.addEventListener('click', batchSaveToMySql);

    // 버튼 상태 업데이트
    function updateBatchSaveButton() {
        const checkedBoxes = document.querySelectorAll('.job-checkbox:checked');
        batchSaveButton.disabled = checkedBoxes.length === 0;
    }
}

// 선택한 채용공고를 MySQL에 일괄 저장
async function batchSaveToMySql() {
    const batchResult = document.getElementById('batch-result');
    batchResult.innerHTML = '<p class="saving">선택한 항목을 저장 중...</p>';

    const checkedBoxes = document.querySelectorAll('.job-checkbox:checked');
    const selectedJobIds = Array.from(checkedBoxes).map(checkbox => checkbox.getAttribute('data-job-id'));

    let savedCount = 0;
    let failedCount = 0;

    for (const jobId of selectedJobIds) {
        const job = currentJobs.find(j => j._id === jobId);
        if (job) {
            try {
                const response = await fetch('/api/mysql-jobs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: job.title || job.company_name+' '+job.defartment,
                        company_name: job.company_name,
                        job_type: job.job_type,
                        experience: job.experience,
                        department: job.department,
                        description: job.description,
                        requirements: job.requirements,
                        preferred_qualifications: job.preferred_qualifications,
                        ideal_candidate: job.ideal_candidate,
                        url: job.url,
                        posted_at: job.posted_at,
                        end_date: job.end_date
                    })
                });

                if (response.ok) {
                    savedCount++;
                } else {
                    failedCount++;
                }
            } catch (error) {
                console.error('Error saving job to MySQL:', error);
                failedCount++;
            }
        }
    }

    // 결과 표시
    batchResult.innerHTML = `
        <p class="info">
            저장 완료: <span class="success">${savedCount}개</span> 성공,
            <span class="error">${failedCount}개</span> 실패
        </p>
    `;

    // 저장된 항목의 체크박스를 비활성화하고 표시
    checkedBoxes.forEach(checkbox => {
        checkbox.disabled = true;
        checkbox.parentElement.classList.add('saved');
    });

    // 전체 선택 체크박스 초기화
    document.getElementById('select-all').checked = false;

    // 저장 버튼 비활성화
    document.getElementById('batch-save').disabled = true;
}