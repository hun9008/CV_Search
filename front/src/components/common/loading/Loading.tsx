import style from './Loading.module.scss';

interface loadingContent {
    content: string;
}
function Loading({ content }: loadingContent) {
    const loadingText = (content: string) => {
        switch (content) {
            case 'Summary':
                return '요약 내용을 불러오는 중입니다...';
            case 'submit':
                return '제출 중입니다...';
            default:
                return content;
        }
    };
    return (
        <div>
            <div className={style.loadingSpinner}></div>
            <div className={style.text}>{loadingText(content)}</div>
        </div>
    );
}

export default Loading;
