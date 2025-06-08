import style from './UniversalDialog.module.scss';
import type feedback from '../../../types/feedback';
import { useEffect, useRef } from 'react';
import { Briefcase, Calendar, Clock, ExternalLink, MapPin, X } from 'lucide-react';
import Job from '../../../types/job';
import { JobContent } from '../../../types/searchResult';

interface BaseProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FeedbackProps extends BaseProps {
    feedback?: feedback | undefined;
    job?: Job | undefined;
}

interface JobProps extends BaseProps {
    feedback?: feedback | undefined;
    job: Job | JobContent | undefined;
}

type UniversalDialogProps = FeedbackProps | JobProps;

function UniversalDialog(props: UniversalDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    const handleApply = (job: Job | JobContent | undefined) => {
        window.open(`${job?.url}`, '_blank');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
                props.onClose();
            }
        };

        if (props.isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = '';
        };
    }, [props.isOpen, props.onClose]);

    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                props.onClose();
            }
        };

        if (props.isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [props.isOpen, props.onClose]);

    if (!props.isOpen) return null;

    if (props.feedback) {
        return (
            <div className={style.overlay}>
                <div className={style.dialog} ref={dialogRef}>
                    <div className={style.header}>
                        <h3>{`${props.feedback.userName}(${props.feedback.userId})의 피드백`}</h3>
                        <button className={style.closeButton} onClick={props.onClose}>
                            <X size={24} />
                        </button>
                    </div>
                    <div className={style.content}>
                        <p>{props.feedback.content}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (props.job) {
        return (
            <div className={style.overlay}>
                <div className={style.dialog} ref={dialogRef}>
                    <div className={style.header}>
                        <div className={style.header__company}>
                            {props.job.favicon && (
                                <img
                                    className={style.header__logo}
                                    src={`data:image/x-icon;base64,${props.job.favicon}`}
                                    alt={`${props.job.companyName} 로고`}
                                />
                            )}
                            <h3 className={style.header__companyName}>{props.job.companyName}</h3>
                        </div>
                        <button className={style.closeButton} onClick={props.onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className={style.titleContainer}>
                        <h1 className={style.title}>{props.job.title}</h1>
                        <div className={style.metaInfo}>
                            {props.job.regionText && (
                                <div className={style.metaInfo__item}>
                                    <MapPin size={16} className={style.metaInfo__icon} />
                                    <span>{props.job.regionText}</span>
                                </div>
                            )}
                            {props.job.applyEndDate && (
                                <div className={style.metaInfo__item}>
                                    <Calendar size={16} className={style.metaInfo__icon} />
                                    <span>{props.job.applyEndDate} 마감</span>
                                </div>
                            )}
                            {props.job.jobType && (
                                <div className={style.metaInfo__item}>
                                    <Clock size={16} className={style.metaInfo__icon} />
                                    <span>{props.job.jobType}</span>
                                </div>
                            )}
                            {props.job.jobType && (
                                <div className={style.metaInfo__item}>
                                    <Briefcase size={16} className={style.metaInfo__icon} />
                                    <span>{props.job.requireExperience}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={style.actionButtons}>
                        <button
                            className={style.actionButtons__apply}
                            onClick={() => handleApply(props.job)}>
                            지원하기
                            <ExternalLink size={16} className={style.actionButtons__icon} />
                        </button>
                    </div>

                    <div className={style.content}>
                        {props.job.jobDescription && (
                            <section className={style.section}>
                                <h2 className={style.section__title}>업무</h2>
                                <p className={style.section__text}>{props.job.jobDescription}</p>
                            </section>
                        )}

                        {props.job.requirements && (
                            <section className={style.section}>
                                <h2 className={style.section__title}>이런 경험이 있어야 해요</h2>
                                <p className={style.section__text}>{props.job.requirements}</p>
                            </section>
                        )}

                        {props.job.preferredQualifications && (
                            <section className={style.section}>
                                <h2 className={style.section__title}>이런 경험이 있으면 좋아요</h2>
                                <p className={style.section__text}>
                                    {props.job.preferredQualifications}
                                </p>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default UniversalDialog;
