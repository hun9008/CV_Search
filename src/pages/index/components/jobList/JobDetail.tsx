import { useState } from 'react';
import useJobStore from '../../../../store/jobStore';
import style from './styles/JobDetail.module.scss';
import { Bookmark, Share2, ExternalLink, MapPin, Calendar, Clock, Briefcase } from 'lucide-react';
import Feedback from './Feedback';

function JobDetail() {
    const job = useJobStore((state) => state.getSelectedJob());
    const [isBookmarked, setIsBookmarked] = useState(job?.isBookmarked || false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    if (!job) {
        return <JobDetailSkeleton />;
    }

    const testText = `## 좋은 점:
- React, TypeScript, Next.js 등 토스뱅크에서 사용하는 코어 기술들을 모두 보유하고 계시며, 특히 Zustand와 같은 상태관리 라이브러리도 사용 경험이 있어 기술적 적합성이 높습니다.
- 'goodJob' 프로젝트에서 React와 TypeScript 기반의 컴포넌트 설계 및 페이지 개발 경험은 토스뱅크의 웹 기반 은행 서비스 개발에 직접적으로 활용할 수 있는 역량입니다.
- GitHub Actions와 Vercel을 활용한 CI/CD 자동 배포 구성 경험은 토스뱅크의 개발 환경과 유사하여 실무 적응에 도움이 될 것입니다.
- "사용자 경험(UX)을 고려한 UI 구현"이라는 자기소개는 토스뱅크가 요구하는 "사용자 경험을 최우선으로 생각하는" 가치와 일치합니다.
- WebSocket을 이용한 실시간 기능 개발 경험은 금융 서비스에서 필요한 실시간 데이터 처리 역량을 보여줍니다.

## 부족한 점:
- 토스뱅크는 Frontend Developer Lead 포지션을 모집하고 있으나, 이력서에서 리더십 경험이나 팀 관리 경험이 명확히 드러나지 않습니다.
- 채용 공고에서는 "기술적 논의를 이끌 수 있는 능력"을 중요시하지만, 이력서에서 기술적 의사결정이나 아키텍처 설계 경험이 구체적으로 드러나지 않습니다.
- 토스뱅크에서 사용하는 React-Query, Emotion, Jotai 등의 기술 스택 경험이 이력서에 명시되어 있지 않습니다.
- 대규모 프로젝트나 복잡한 애플리케이션 개발 경험이 부족해 보이며, 금융 서비스 관련 도메인 지식이나 경험이 드러나지 않습니다.
- "동료 개발자들의 역량 성장, 커리어 개발 및 동기부여"와 관련된 경험이 이력서에 포함되어 있지 않습니다.

## 추가 팁:
- 프로젝트 경험에서 팀 내 역할이나 협업 과정에서의 리더십 경험을 구체적으로 추가하시면 좋겠습니다. 예를 들어, 프로젝트에서 기술적 의사결정을 주도했거나 다른 개발자들과 협업한 경험을 강조하세요.
- 토스뱅크에서 사용하는 React-Query, Emotion과 같은 기술에 대한 학습 경험이나 관심을 이력서에 추가하는 것이 좋겠습니다.
- 서비스 성능 최적화나 접근성 향상 경험을 구체적인 수치나 사례와 `;

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
        setShowFeedbackModal(true);
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
                            <span className={style.score__label}>매칭 점수</span>
                            <span className={style.score__value}>{job.score}</span>
                        </div>
                    </div>
                )}
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
            {job && (
                <Feedback
                    feedback={testText}
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
