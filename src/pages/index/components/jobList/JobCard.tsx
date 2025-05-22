import type React from 'react';
import { Bookmark } from 'lucide-react';
import style from './styles/JobCard.module.scss';
import type Job from '../../../../../types/job';

interface JobCardProps {
    job: Job;
    isSelected: boolean;
    onSelect: () => void;
    onToggleBookmark: () => void;
}

function JobCard({ job, isSelected, onSelect, onToggleBookmark }: JobCardProps) {
    const handleBookmarkClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        onToggleBookmark();
    };

    return (
        <div className={`${style.jobCard} ${isSelected ? style.selected : ''}`} onClick={onSelect}>
            <div className={style.jobCard__icon}>
                <img rel="icon" src={`data:image/x-icon;base64,${job.favicon}`} />
            </div>

            <div className={style.jobCard__content}>
                <div className={style.jobCard__header}>
                    <div className={style.jobCard__header__title}>
                        <h3 className={style.jobCard__title}>{job.title}</h3>
                        <p className={style.jobCard__company}>{job.companyName}</p>
                    </div>

                    <div className={style.jobCard__actions}>
                        <button
                            className={`${style.jobCard__bookmark} ${
                                job.isBookmarked ? style.active : ''
                            }`}
                            onClick={handleBookmarkClick}
                            aria-label={job.isBookmarked ? '북마크 취소' : '북마크 추가'}>
                            <Bookmark size={30} fill={job.isBookmarked ? '#f4b11f' : 'none'} />
                        </button>
                        <div className={style.jobCard__score}>{job.score?.toFixed(1)}</div>
                    </div>
                </div>

                <div className={style.jobCard__tags}>
                    <>
                        <div className={style.jobCard__tags__container}>
                            {job.jobType && (
                                <p className={`${style.jobCard__tags__tag} ${style.type}`}>
                                    {job.jobType}
                                </p>
                            )}
                            {job.requireExperience && (
                                <p className={`${style.jobCard__tags__tag} ${style.experience}`}>
                                    {job.requireExperience}
                                </p>
                            )}
                        </div>

                        {job.regions?.length ? (
                            <p className={style.jobCard__tags__location}>
                                {job.regions[0].sido ?? ''} {job.regions[0].sigungu ?? ''}
                            </p>
                        ) : (
                            ''
                        )}
                    </>
                </div>
            </div>
        </div>
    );
}

export default JobCard;
