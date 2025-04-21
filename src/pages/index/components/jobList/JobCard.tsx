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
        e.stopPropagation(); // 카드 선택 이벤트 전파 방지
        onToggleBookmark();
    };

    return (
        <div
            className={`${styles.jobCard} ${isSelected ? styles.selected : ''}`}
            onClick={onSelect}>
            <div className={styles.jobCard__icon}>
                {/* <Briefcase size={24} /> */}
                <img src="https://static.toss.im/tds/favicon/favicon-48x48.png"></img>
            </div>

            <div className={styles.jobCard__content}>
                <div className={styles.jobCard__header}>
                    <div className={styles.jobCard__header__title}>
                        <h3 className={styles.jobCard__title}>{job.title}</h3>
                        <p className={styles.jobCard__company}>{job.company}</p>
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
                        {job.tags.map((tag, index) => (
                            <p key={index} className={styles.jobCard__tags__tag}>
                                {tag}
                            </p>
                        ))}
                        <p className={styles.jobCard__tags__location}>{job.location}</p>
                    </>
                </div>
            </div>
        </div>
    );
}

export default JobCard;
