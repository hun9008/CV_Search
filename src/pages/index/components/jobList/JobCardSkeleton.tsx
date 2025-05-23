import style from './styles/JobCardSkeleton.module.scss';

function JobCardSkeleton() {
    return (
        <div className={style.skeletonContainer}>
            <div className={`${style.skeleton} ${style.skeleton__icon}`}></div>
            <div className={style.skeletonContainer__content}>
                <div className={style.skeletonContainer__header}>
                    <div>
                        <div className={`${style.skeleton} ${style.skeleton__title}`}></div>
                        <div className={`${style.skeleton} ${style.skeleton__company}`}></div>
                    </div>
                    <div>
                        <div className={`${style.skeleton} ${style.skeleton__bookmark}`}></div>
                        <div className={`${style.skeleton} ${style.skeleton__score}`}></div>
                    </div>
                </div>
                <div className={style.skeletonContainer__tagsContainer}>
                    <div className={style.skeletonContainer__tagsContainer__left}>
                        <div className={`${style.skeleton} ${style.skeleton__tags__tag}`}></div>
                        <div className={`${style.skeleton} ${style.skeleton__tags__tag}`}></div>
                    </div>
                    <div className={`${style.skeleton} ${style.skeleton__tags__location}`}></div>
                </div>
            </div>
        </div>
    );
}

export default JobCardSkeleton;
