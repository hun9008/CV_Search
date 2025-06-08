import type React from 'react';
import { Bookmark } from 'lucide-react';
import style from './SearchCard.module.scss';
import { JobContent } from '../../../../types/searchResult';
import JobDetailDialog from '../bookmark/JobDetailDialog';
import { useState } from 'react';
import useJobStore from '../../../../store/jobStore';

interface SearchCardProp {
    job: JobContent;
    onToggleBookmark: () => void;
    isSelected: boolean;
}

function SearchCard({ job, onToggleBookmark, isSelected }: SearchCardProp) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
    const { setSelectedJobDetail } = useJobStore();

    const handleBookmarkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleBookmark();
    };

    const handleCardClick = () => {
        setSelectedJobId(job.id);
        setSelectedJobDetail(job);
        setIsDialogOpen(true);
    };

    return (
        <>
            {isDialogOpen && selectedJobId && (
                <JobDetailDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
            )}
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
                    </div>
                </div>
            </div>
        </>
    );
}

export default SearchCard;
