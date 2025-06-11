import { ExternalLink } from 'lucide-react';
import type Job from '../../../../types/job';
import style from './styles/SimilarJobCard.module.scss';
import { useState } from 'react';
import UniversalDialog from '../../../../components/common/dialog/UniversalDialog';

interface SimilarJobCardProp {
    job: Job;
}

function SimilarJobCard({ job }: SimilarJobCardProp) {
    // const { setSelectedJobDetail } = useJobStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // const handleBookmarkClick = (e: React.MouseEvent) => {
    //     e.stopPropagation();
    //     onToggleBookmark();
    // };

    const handleCardClick = () => {
        // setSelectedJobDetail(job);
        setIsDialogOpen(true);
    };
    return (
        <>
            {isDialogOpen ? (
                <UniversalDialog
                    job={job}
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                />
            ) : (
                ''
            )}
            <div className={style.jobCard} onClick={handleCardClick}>
                <div className={style.jobCard__header}>
                    <div className={style.jobCard__companyInfo}>
                        <div className={style.jobCard__icon}>
                            {job.favicon && (
                                <img
                                    rel="icon"
                                    src={`data:image/x-icon;base64,${job.favicon}`}
                                    alt={job.companyName}
                                />
                            )}
                        </div>
                        <div className={style.jobCard__companyName}>{job.companyName}</div>
                    </div>
                    {/* <button
                        className={`${style.jobCard__bookmark} ${
                            job.isBookmarked ? style.active : ''
                        }`}
                        onClick={handleBookmarkClick}
                        aria-label={job.isBookmarked ? '북마크 취소' : '북마크 추가'}>
                        <Bookmark size={24} fill={job.isBookmarked ? '#f4b11f' : 'none'} />
                    </button> */}
                </div>

                <div className={style.jobCard__content}>
                    <h3 className={style.jobCard__title}>{job.title}</h3>

                    <div className={style.jobCard__meta}>
                        <div className={style.jobCard__tags}>
                            <div className={style.jobCard__tags__container}>
                                {job.jobType && (
                                    <p className={`${style.jobCard__tags__tag} ${style.type}`}>
                                        {job.jobType}
                                    </p>
                                )}
                                {job.requireExperience && (
                                    <p
                                        className={`${style.jobCard__tags__tag} ${style.experience}`}>
                                        {job.requireExperience}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={style.jobCard__footer}>
                        {job.regions?.[0].sido && (
                            <p className={style.jobCard__location}>
                                {`${job.regions?.[0].sido ? job.regions?.[0].sido : ''} ${
                                    job.regions?.[0].sigungu ? job.regions?.[0].sigungu : ''
                                }`}
                            </p>
                        )}
                        <button className={style.jobCard__viewButton} onClick={handleCardClick}>
                            <ExternalLink size={16} />
                            <span>상세보기</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SimilarJobCard;
