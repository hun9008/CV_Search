/**
 * 통계 페이지 JavaScript
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const refreshButton = document.getElementById('refresh-stats-btn');
    const totalUrlsElement = document.getElementById('total-urls');
    const recruitUrlsElement = document.getElementById('recruit-urls');
    const nonRecruitUrlsElement = document.getElementById('non-recruit-urls');
    const unclassifiedUrlsElement = document.getElementById('unclassified-urls');
    const lastUpdatedElement = document.getElementById('last-updated-time');
    const jobTypesSummaryElement = document.getElementById('job-types-summary');

    // Chart canvas elements
    const urlClassificationCanvas = document.getElementById('url-classification-chart');
    const jobTypesCanvas = document.getElementById('job-types-chart');
    const timelineCanvas = document.getElementById('timeline-chart');
    const totalVisitsElement = document.getElementById('total-visits');
    const totalSubUrlsElement = document.getElementById('total-sub-urls');
    const analyzedUrlsElement = document.getElementById('analyzed-urls');
    const recruitSubUrlsElement = document.getElementById('recruit-sub-urls');
    const nonRecruitSubUrlsElement = document.getElementById('non-recruit-sub-urls');
    const analysisRatioElement = document.getElementById('analysis-ratio');

    // 추가 차트 canvas
    const urlAnalysisCanvas = document.getElementById('url-analysis-chart');

    // 추가 차트 객체
    let urlAnalysisChart = null;
    // Chart objects
    let urlClassificationChart = null;
    let jobTypesChart = null;
    let timelineChart = null;
    const API_STATS = 'http://localhost:8080/api/stats';

    // Initialize
    fetchStats();

    // Event listeners
    refreshButton.addEventListener('click', fetchStats);

    /**
     * 통계 데이터 가져오기
     */
    async function fetchStats() {
        try {
            // API 호출하여 통계 데이터 가져오기
            const response = await fetch(API_STATS);
            if (!response.ok) {
                throw new Error('통계 데이터를 가져오는데 실패했습니다.');
            }

            const result = await response.json();

            // 서버 응답에서 data 속성 추출
            if (!result.success || !result.data) {
                throw new Error('서버 응답 형식이 올바르지 않습니다.');
            }

            const statsData = result.data;

            // 데이터 업데이트 시간 표시
            lastUpdatedElement.textContent = new Date().toLocaleString();

            // 통계 요약 정보 업데이트
            updateStatsSummary(statsData);
            if (statsData.visitUrlStats) {
                renderUrlAnalysisChart(statsData.visitUrlStats);
            }
            // 차트 렌더링
            renderRecruitmentChart(statsData.recruitmentStats);
            renderJobTypesChart(statsData.jobTypeStats);
            renderTimelineChart(statsData.timelineStats);

        } catch (error) {
            console.error('Error fetching stats:', error);
            alert('통계 데이터를 불러오는 중 오류가 발생했습니다: ' + error.message);
        }
    }

    /**
     * 통계 요약 정보 업데이트
     */
    function updateStatsSummary(data) {
        const { recruitmentStats, jobTypeStats, experienceStats } = data;

        // 채용공고 수 표시
        const totalRecruitments = recruitmentStats.total;
        totalUrlsElement.textContent = totalRecruitments.toLocaleString();
        recruitUrlsElement.textContent = totalRecruitments.toLocaleString();

        // 비채용공고와 미분류는 이제 사용하지 않음 - UI 호환성을 위해 0으로 설정
        nonRecruitUrlsElement.textContent = '0';
        unclassifiedUrlsElement.textContent = '0';

        // 직무 유형 요약 업데이트
        jobTypesSummaryElement.innerHTML = '';

        // 상위 5개 직무 유형만 표시 (정렬 후)
        const sortedTypes = Object.entries(jobTypeStats.types)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // 각 직무 유형별 개수 표시
        sortedTypes.forEach(([type, count]) => {
            const jobTypeElement = document.createElement('div');
            jobTypeElement.className = 'stat-item';
            jobTypeElement.innerHTML = `
                <span class="stat-label">${type || 'Not specified'}:</span>
                <span class="stat-value">${count.toLocaleString()}</span>
            `;
            jobTypesSummaryElement.appendChild(jobTypeElement);
        });

               // URL 통계 정보 추가
        if (data.visitUrlStats) {
            const urlStats = data.visitUrlStats;
            totalVisitsElement.textContent = urlStats.total_visits.toLocaleString();
            totalSubUrlsElement.textContent = urlStats.total_sub_urls.toLocaleString();
            analyzedUrlsElement.textContent = urlStats.analyzed_urls.toLocaleString();
            recruitSubUrlsElement.textContent = urlStats.recruit_urls.toLocaleString();
            nonRecruitSubUrlsElement.textContent = urlStats.non_recruit_urls.toLocaleString();
            analysisRatioElement.textContent = `${urlStats.analysis_ratio}%`;
        }
    }

    /**
     * URL 분석 통계 차트 렌더링
     */
    function renderUrlAnalysisChart(urlStats) {
        // 기존 차트 제거
        if (urlAnalysisChart) {
            urlAnalysisChart.destroy();
        }

        // 데이터 준비
        const data = {
            labels: ['채용공고 URL', '비채용공고 URL', '미분석 URL'],
            datasets: [{
                data: [
                    urlStats.recruit_urls,
                    urlStats.non_recruit_urls,
                    urlStats.total_sub_urls - urlStats.analyzed_urls
                ],
                backgroundColor: [
                    '#4caf50',  // 채용공고 - 녹색
                    '#f44336',  // 비채용공고 - 빨간색
                    '#9e9e9e'   // 미분석 - 회색
                ],
                borderWidth: 1
            }]
        };

        // 차트 옵션
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: `총 URL: ${urlStats.total_sub_urls.toLocaleString()} / 분석 비율: ${urlStats.analysis_ratio}%`
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed;
                            const total = urlStats.total_sub_urls;
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${context.label}: ${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        };

        // 차트 생성
        urlAnalysisChart = new Chart(urlAnalysisCanvas, {
            type: 'pie',
            data: data,
            options: options
        });
    }
    /**
     * 채용공고 차트 렌더링 (이전 URL 분류 차트 대체)
     */
    function renderRecruitmentChart(recruitmentStats) {
        // 기존 차트 제거
        if (urlClassificationChart) {
            urlClassificationChart.destroy();
        }

        // 대체 데이터: 경력 수준별 통계나 직무 유형을 표시
        // 여기서는 단순히 채용공고 전체 숫자를 원형 차트로 표시
        const data = {
            labels: ['채용공고'],
            datasets: [{
                data: [recruitmentStats.total],
                backgroundColor: ['#4caf50'],  // 채용공고 - 녹색
                borderWidth: 1
            }]
        };

        // 차트 옵션
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: '채용공고 수: ' + recruitmentStats.total.toLocaleString()
                }
            }
        };

        // 차트 생성
        urlClassificationChart = new Chart(urlClassificationCanvas, {
            type: 'pie',
            data: data,
            options: options
        });
    }

    /**
     * 직무 유형 차트 렌더링
     */
    function renderJobTypesChart(jobTypeStats) {
        // 기존 차트 제거
        if (jobTypesChart) {
            jobTypesChart.destroy();
        }

        // 상위 5개 직무 유형만 표시 (정렬 후)
        const sortedTypes = Object.entries(jobTypeStats.types)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const labels = sortedTypes.map(item => item[0] || 'Not specified');
        const values = sortedTypes.map(item => item[1]);

        // 색상 배열
        const backgroundColors = [
            '#4caf50', '#2196f3', '#9c27b0', '#ff9800', '#795548'
        ];

        // 데이터 준비
        const data = {
            labels: labels,
            datasets: [{
                label: 'Job Type Count',
                data: values,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        };

        // 차트 옵션
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        };

        // 차트 생성
        jobTypesChart = new Chart(jobTypesCanvas, {
            type: 'bar',
            data: data,
            options: options
        });
    }

    /**
     * 시간별 채용공고 차트 렌더링
     */
    function renderTimelineChart(timelineData) {
        // 기존 차트 제거
        if (timelineChart) {
            timelineChart.destroy();
        }

        // 날짜 및 카운트 데이터 준비
        const labels = timelineData.map(item => item.date);
        const counts = timelineData.map(item => item.count);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: '채용공고 수',
                    data: counts,
                    backgroundColor: 'rgba(76, 175, 80, 0.5)',
                    borderColor: '#4caf50',
                    borderWidth: 1
                }
            ]
        };

        // 차트 옵션
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '날짜'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '채용공고 수'
                    }
                }
            }
        };

        // 차트 생성
        timelineChart = new Chart(timelineCanvas, {
            type: 'bar',
            data: data,
            options: options
        });
    }
});