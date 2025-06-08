import { useRef, useState } from 'react';
import style from './styles/UserFeedbackDialog.module.scss';
import { X } from 'lucide-react';
import useUserFeedbackStore from '../../../store/userFeedbackStore';

interface BaseProps {
    onClose: () => void;
}

function UserFeedbackDialog(props: BaseProps) {
    const { postUserFeedback } = useUserFeedbackStore();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [userFeedbackText, setUserFeedbackText] = useState('');
    const [userFeedbackScore, setUserFeedbackScore] = useState(0);
    const [submitPlease, setSubmitPlease] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);

    const handleSubmit = async () => {
        if (userFeedbackScore === 0) {
            setSubmitPlease(true);
            return;
        }
        await postUserFeedback({ content: userFeedbackText, satisfactionScore: userFeedbackScore });
    };

    return (
        <div className={style.overlay}>
            <div className={style.dialog} ref={dialogRef}>
                <div className={style.header}>
                    <h3 className={style.header__title}>goodJob의 추천 공고는 어떠셨나요?</h3>
                    <button className={style.closeButton} onClick={props.onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className={style.renameInputContainer} onClick={(e) => e.stopPropagation()}>
                    <textarea
                        ref={inputRef}
                        value={userFeedbackText}
                        onChange={(e) => setUserFeedbackText(e.target.value)}
                        className={style.renameInput}
                        maxLength={100}
                        rows={3}
                        placeholder="피드백을 입력해주세요 (최대 100자)"
                    />
                </div>
                <div className={style.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((score) => (
                        <button
                            key={score}
                            type="button"
                            className={`${style.ratingButton} ${
                                userFeedbackScore === score ? style.selected : ''
                            }`}
                            onClick={() => {
                                setUserFeedbackScore(score);
                                setSubmitPlease(false);
                            }}>
                            {score}
                        </button>
                    ))}
                </div>
                <div className={style.actionButtons}>
                    <button
                        className={`${
                            submitPlease ? style.actionButtons__please : style.actionButtons__apply
                        }`}
                        onClick={handleSubmit}
                        disabled={submitPlease}>
                        {submitPlease ? '피드백 점수를 체크해주세요' : '제출'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UserFeedbackDialog;
