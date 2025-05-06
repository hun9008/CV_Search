'use client';

import type React from 'react';

import { Bookmark } from 'lucide-react';
import styles from './styles/JobCard.module.scss';
import type Job from '../../types/job';

interface JobCardProps {
    job: Job;
    isSelected: boolean;
    onSelect: () => void;
    onToggleBookmark: () => void;
}

function JobCard({ job, isSelected, onSelect, onToggleBookmark }: JobCardProps) {
    // 북마크 클릭 이벤트 처리
    const handleBookmarkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleBookmark();
    };

    return (
        <div
            className={`${styles.jobCard} ${isSelected ? styles.selected : ''}`}
            onClick={onSelect}>
            <div className={styles.jobCard__icon}>
                <img rel="icon" src={`data:image/x-icon;base64,${job.favicon}`} />
            </div>

            <div className={styles.jobCard__content}>
                <div className={styles.jobCard__header}>
                    <div className={styles.jobCard__header__title}>
                        <h3 className={styles.jobCard__title}>{job.title}</h3>
                        <p className={styles.jobCard__company}>{job.companyName}</p>
                    </div>

                    <div className={styles.jobCard__actions}>
                        <button
                            className={`${styles.jobCard__bookmark} ${
                                job.isBookmarked ? styles.active : ''
                            }`}
                            onClick={handleBookmarkClick}
                            aria-label={job.isBookmarked ? '북마크 취소' : '북마크 추가'}>
                            <Bookmark size={30} />
                        </button>
                        <div className={styles.jobCard__score}>{job.score}</div>
                    </div>
                </div>

                <div className={styles.jobCard__tags}>
                    <>
                        <div className={styles.jobCard__tags__container}>
                            <p className={styles.jobCard__tags__tag}>{job.jobType}</p>
                            <p className={styles.jobCard__tags__tag}>{job.requireExperience}</p>
                        </div>

                        <p className={styles.jobCard__tags__location}>{job.regionText}</p>
                    </>
                </div>
            </div>
        </div>
    );
}

export default JobCard;
