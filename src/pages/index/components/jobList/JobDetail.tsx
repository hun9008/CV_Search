import { useState } from 'react';
import useJobStore from '../../../../store/jobStore';
import style from './styles/JobDetail.module.scss';
import { Bookmark, Share2, ExternalLink, MapPin, Calendar, Clock } from 'lucide-react';

function JobDetail() {
    const job = useJobStore((state) => state.getSelectedJob());
    const [isBookmarked, setIsBookmarked] = useState(job?.isBookmarked || false);

    if (!job) {
        return <JobDetailSkeleton />;
    }

    const handleApply = () => {
        window.open(`${job?.url}`, '_blank');
    };

    const handleBookmark = () => {
        setIsBookmarked(!isBookmarked);
        // 여기에 북마크 상태를 저장하는 로직 추가
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator
                .share({
                    title: job.title,
                    text: `${job.companyName}의 ${job.title} 채용공고`,
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

    const handleFeedback = () => {
        // 피드백 기능 구현
    };

    const handleManagement = () => {
        // 관리 시작 기능 구현
    };

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
                        onClick={handleBookmark}
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
                </div>

                {/* {job.score && (
                    <div className={style.scoreContainer}>
                        <div className={style.score}>
                            <span className={style.score__label}>매칭 점수</span>
                            <span className={style.score__value}>{job.score}</span>
                        </div>
                    </div>
                )} */}
            </div>

            <div className={style.actionButtons}>
                <button className={style.actionButtons__apply} onClick={handleApply}>
                    지원하기
                    <ExternalLink size={16} className={style.actionButtons__icon} />
                </button>
                <button className={style.actionButtons__feedback} onClick={handleFeedback}>
                    피드백
                </button>
                <button className={style.actionButtons__manage} onClick={handleManagement}>
                    관리 시작
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
