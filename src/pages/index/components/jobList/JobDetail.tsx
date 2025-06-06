import { useEffect, useState } from 'react';
import useJobStore from '../../../../store/jobStore';
import style from './styles/JobDetail.module.scss';
import { Bookmark, Share2, MapPin, Calendar, Clock, Briefcase, Bot } from 'lucide-react';
import Feedback from './FeedbackDialog';
import useApplyStore from '../../../../store/applyStore';
import LoadingSpinner from '../../../../components/common/loading/LoadingSpinner';
import useBookmarkStore from '../../../../store/bookmarkStore';
import { useNavigate } from 'react-router-dom';

function JobDetail() {
    const { getSelectedJobDetail, getFeedback } = useJobStore();
    const applications = useApplyStore((state) => state.applications);
    const { setApplications, deleteApplications, getApplications } = useApplyStore();
    const selectedJobDetail = useJobStore((state) => state.selectedJobDetail);
    const feedbackText = useJobStore((state) => state.feedback);
    const job = useJobStore((state) => state.selectedJobDetail);
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(job?.isBookmarked || false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [isManaging, setIsManaging] = useState(false);
    // const [showManageModal, setShowManageModal] = useState(false);
    const [manageButtonClicked, setManageButtonClicked] = useState(false);
    const bookmarkedList = useBookmarkStore((state) => state.bookmarkList);
    const { addBookmark, removeBookmark, getBookmark } = useBookmarkStore();
    const selectedCVId = useJobStore((state) => state.selectedCVId);

    const navigate = useNavigate();

    useEffect(() => {
        setIsFeedbackLoading(false); // 다른 공고 선택하면 피드백 로딩 제거
        const initializeApplications = async () => {
            await getApplications();
        };
        getSelectedJobDetail();
        initializeApplications();
    }, [selectedJobDetail]);

    /** 유저가 관리 버튼 클릭 */
    useEffect(() => {
        if (selectedJobDetail && applications) {
            const isCurrentJobManaged = applications.some(
                (app) => app.jobId === selectedJobDetail.id
            );
            setIsManaging(isCurrentJobManaged);
            console.log(isCurrentJobManaged);
        }
    }, [applications, selectedJobDetail]);

    /** 유저가 북마크 버튼 클릭 */
    useEffect(() => {
        if (bookmarkedList && selectedJobDetail) {
            const isCurrentJobBookmarked = bookmarkedList.some(
                (bookmark) => bookmark.id === selectedJobDetail.id
            );
            setIsBookmarked(isCurrentJobBookmarked);
        }
    }, [bookmarkedList, selectedJobDetail]);

    const handleApply = () => {
        window.open(`${job?.url}`, '_blank');
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator
                .share({
                    title: job?.title,
                    text: `${job?.companyName}의 ${job?.title} 채용공고`,
                    url: window.location.href,
                })
                .catch((err) => {
                    console.log('공유하기 실패:', err);
                });
        } else {
            // 클립보드에 URL 복사
            navigator.clipboard
                .writeText(window.location.href)
                .then(() => {
                    alert('URL이 클립보드에 복사되었습니다.');
                })
                .catch((err) => {
                    console.log('클립보드 복사 실패:', err);
                });
        }
    };
    const handleUploadCV = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate('/upload');
    };

    const handleFeedback = async (jobId: number) => {
        const icon = document.querySelector(`#bot-icon-${jobId}`);
        icon?.classList.add(style.bounce);

        try {
            setIsFeedbackLoading(true);

            if (selectedCVId !== null && (await getFeedback(jobId, selectedCVId)) === 200) {
                setShowFeedbackModal(true);
            }
        } catch (error) {
            console.error('피드백 요청 에러: ', error);
            throw error;
        } finally {
            setIsFeedbackLoading(false);
            icon?.classList.remove(style.bounce);
        }
    };

    const handleManagement = async (jobId: number) => {
        try {
            if (isManaging) {
                console.log('관리 이력 삭제 시도');
                const res = await deleteApplications(jobId);
                if (res === 204) {
                    setIsManaging(false);
                    setManageButtonClicked(false);
                    console.log('관리 해제 완료:', res);
                    setManageButtonClicked(false); // 지우기
                    // 지원 목록 다시 가져오기
                    await useApplyStore.getState().getApplications();
                }
            } else {
                console.log('관리 이력 추가 시도');
                const res = await setApplications(jobId);
                if (res === 201) {
                    setIsManaging(true);
                    setManageButtonClicked(true);
                    console.log('관리 등록 완료:', res);
                    // 지원 목록 다시 가져오기
                    await useApplyStore.getState().getApplications();
                }
            }
        } catch (error) {
            console.log('관리 상태 변경 에러:', error);
        }
    };

    const toggleBookmark = async (jobId: number) => {
        const currentBookmarks = bookmarkedList || [];
        const isBookmarked = currentBookmarks.some((job) => job.id === jobId);

        try {
            // 현재 북마크 상태 반전
            const newBookmarkState = !isBookmarked;

            // UI 즉시 업데이트 (낙관적 업데이트)
            setIsBookmarked(newBookmarkState);

            // 서버에 북마크 상태 변경 요청
            if (isBookmarked) {
                await removeBookmark(jobId);
            } else {
                await addBookmark(jobId);
            }
            // 북마크 목록 갱신
            await getBookmark();
        } catch (error) {
            console.error('북마크 토글 중 오류 발생:', error);
            setIsBookmarked(!isBookmarked); // 북마크 상태 되돌리기
        }
    };

    /** 로딩 시 스켈레톤 UI 출력 */
    if (!job) {
        return <JobDetailSkeleton />;
    }

    return (
        <div className={style.container}>
            <div className={style.header}>
                <div className={style.header__company}>
                    {job.favicon && (
                        <img
                            className={style.header__logo}
                            src={`data:image/x-icon;base64,${job.favicon}`}
                            alt={`${job.companyName} 로고`}
                        />
                    )}
                    <h3 className={style.header__companyName}>{job.companyName}</h3>
                </div>
                <div className={style.header__actions}>
                    <button
                        className={`${style.header__actionButton} ${
                            isBookmarked ? style.active : ''
                        }`}
                        onClick={() =>
                            selectedJobDetail?.id && toggleBookmark(selectedJobDetail.id)
                        }
                        aria-label={isBookmarked ? '북마크 해제' : '북마크 추가'}>
                        <Bookmark size={20} />
                    </button>
                    <button
                        className={style.header__actionButton}
                        onClick={handleShare}
                        aria-label="공유하기">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            <div className={style.titleContainer}>
                <h1 className={style.title}>{job.title}</h1>
                <div className={style.metaInfo}>
                    {job.regionText && (
                        <div className={style.metaInfo__item}>
                            <MapPin size={16} className={style.metaInfo__icon} />
                            <span>{job.regionText}</span>
                        </div>
                    )}
                    {job.applyEndDate && (
                        <div className={style.metaInfo__item}>
                            <Calendar size={16} className={style.metaInfo__icon} />
                            <span>{job.applyEndDate} 마감</span>
                        </div>
                    )}
                    {job.jobType && (
                        <div className={style.metaInfo__item}>
                            <Clock size={16} className={style.metaInfo__icon} />
                            <span>{job.jobType}</span>
                        </div>
                    )}
                    {job.jobType && (
                        <div className={style.metaInfo__item}>
                            <Briefcase size={16} className={style.metaInfo__icon} />
                            <span>{job.requireExperience}</span>
                        </div>
                    )}
                </div>

                {job.score && (
                    <div className={style.scoreContainer}>
                        <div className={style.score}>
                            {job.score?.toFixed(0) === '0' ? (
                                <button
                                    className={style.jobCard__score__isZero}
                                    onClick={handleUploadCV}>
                                    CV 등록하여 점수 확인하기
                                </button>
                            ) : (
                                <>
                                    <span className={style.score__label}>매칭 점수</span>
                                    <span className={style.score__value}>
                                        {job.score.toFixed(2)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className={style.actionButtons}>
                <button className={style.actionButtons__apply} onClick={handleApply}>
                    지원하기
                </button>
                <button
                    className={`${style.actionButtons__feedback} ${
                        isFeedbackLoading ? 'loading' : ''
                    }`}
                    onClick={() => handleFeedback(job.id)}>
                    <Bot
                        size={20}
                        className={style.actionButtons__icon}
                        id={`bot-icon-${job.id}`}
                    />
                    {isFeedbackLoading ? '' : '피드백 받기'}
                </button>

                <button
                    className={`${style.actionButtons__manage} ${
                        manageButtonClicked ? '' : style.clicked
                    }`}
                    onClick={() => selectedJobDetail && handleManagement(selectedJobDetail.id)}>
                    {isManaging ? '관리중' : '관리 시작'}
                </button>
            </div>
            <div className={style.content}>
                {job.jobDescription && (
                    <section className={style.section}>
                        <h2 className={style.section__title}>업무</h2>
                        <p className={style.section__text}>{job.jobDescription}</p>
                    </section>
                )}

                {job.requirements && (
                    <section className={style.section}>
                        <h2 className={style.section__title}>이런 경험이 있어야 해요</h2>
                        <p className={style.section__text}>{job.requirements}</p>
                    </section>
                )}

                {job.preferredQualifications && (
                    <section className={style.section}>
                        <h2 className={style.section__title}>이런 경험이 있으면 좋아요</h2>
                        <p className={style.section__text}>{job.preferredQualifications}</p>
                    </section>
                )}

                {job.requireExperience && (
                    <section className={style.section}>
                        <h2 className={style.section__title}>경력 사항</h2>
                        <p className={style.section__text}>{job.requireExperience}</p>
                    </section>
                )}
            </div>
            {job && (
                <Feedback
                    feedback={feedbackText}
                    isOpen={showFeedbackModal}
                    onClose={() => setShowFeedbackModal(false)}
                />
            )}
        </div>
    );
}

// 스켈레톤 UI 컴포넌트
function JobDetailSkeleton() {
    return (
        <div className={`${style.container} ${style.skeletonContainer}`}>
            <div className={style.header}>
                <div className={style.header__company}>
                    <div className={`${style.header__logo} ${style.skeleton}`}></div>
                    <div className={`${style.header__companyName} ${style.skeleton}`}></div>
                </div>
                <div className={style.header__actions}>
                    <div className={`${style.header__actionButton} ${style.skeleton}`}></div>
                    <div className={`${style.header__actionButton} ${style.skeleton}`}></div>
                </div>
            </div>

            <div className={style.titleContainer}>
                <div className={`${style.title} ${style.skeleton}`}></div>
                <div className={style.metaInfo}>
                    <div className={`${style.metaInfo__item} ${style.skeleton}`}></div>
                    <div className={`${style.metaInfo__item} ${style.skeleton}`}></div>
                    <div className={`${style.metaInfo__item} ${style.skeleton}`}></div>
                </div>

                <div className={style.scoreContainer}>
                    <div className={`${style.score} ${style.skeleton}`}></div>
                </div>
            </div>

            <div className={style.actionButtons}>
                <div className={`${style.actionButtons__apply} ${style.skeleton}`}></div>
                <div className={`${style.actionButtons__feedback} ${style.skeleton}`}></div>
                <div className={`${style.actionButtons__manage} ${style.skeleton}`}></div>
            </div>

            <div className={style.content}>
                <section className={style.section}>
                    <div className={`${style.section__title} ${style.skeleton}`}></div>
                    <div className={`${style.section__text} ${style.skeleton}`}>
                        <div className={style.skeleton}></div>
                        <div className={style.skeleton}></div>
                        <div className={style.skeleton}></div>
                        <div className={style.skeleton}></div>
                        <div className={style.skeleton} style={{ width: '80%' }}></div>
                    </div>
                </section>

                <section className={style.section}>
                    <div className={`${style.section__title} ${style.skeleton}`}></div>
                    <div className={`${style.section__text} ${style.skeleton}`}>
                        <div className={style.skeleton}></div>
                        <div className={style.skeleton}></div>
                        <div className={style.skeleton}></div>
                        <div className={style.skeleton} style={{ width: '70%' }}></div>
                    </div>
                </section>

                <section className={style.section}>
                    <div className={`${style.section__title} ${style.skeleton}`}></div>
                    <div className={`${style.section__text} ${style.skeleton}`}>
                        <div className={style.skeleton}></div>
                        <div className={style.skeleton}></div>
                        <div className={style.skeleton} style={{ width: '60%' }}></div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default JobDetail;
