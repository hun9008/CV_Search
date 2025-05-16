import type React from 'react';

import { Bookmark, ExternalLink } from 'lucide-react';
import type Job from '../../../../../types/job';
import style from './styles/BookmarkCard.module.scss';
import JobDetail from '../jobList/JobDetail';
import useJobStore from '../../../../store/jobStore';
import { useState } from 'react';

interface BookmarkCardProp {
    job: Job;
    onToggleBookmark: () => void;
    isSelected: boolean;
    setHidden: () => void;
}

function BookmarkCard({ job, onToggleBookmark, isSelected, setHidden }: BookmarkCardProp) {
    const { setSelectedJob } = useJobStore();
    const handleBookmarkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleBookmark();
    };

    const handleCardClick = () => {
        setSelectedJob(job.id);
        setHidden();
    };

    return (
        <>
            <div
                className={`${style.jobCard} ${isSelected ? style.selected : ''}`}
                onClick={handleCardClick}>
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
                    <button
                        className={`${style.jobCard__bookmark} ${
                            job.isBookmarked ? style.active : ''
                        }`}
                        onClick={handleBookmarkClick}
                        aria-label={job.isBookmarked ? '북마크 취소' : '북마크 추가'}>
                        <Bookmark size={24} fill={job.isBookmarked ? '#f4b11f' : 'none'} />
                    </button>
                </div>

                <div className={style.jobCard__content}>
                    <h3 className={style.jobCard__title}>{job.title}</h3>

                    <div className={style.jobCard__meta}>
                        {job.score && (
                            <div className={style.jobCard__score}>{job.score.toFixed(1)}</div>
                        )}

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
                        {job.regionText && (
                            <p className={style.jobCard__location}>{job.regionText}</p>
                        )}
                        <button className={style.jobCard__viewButton} onClick={() => {}}>
                            <ExternalLink size={16} />
                            <span>관리하기</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default BookmarkCard;
