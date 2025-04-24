import style from './styles/AccountDialog.module.scss';
import { X } from 'lucide-react';

function AccountDialog() {
    const handlePrev = () => {};
    return (
        <dialog>
            <div className={style.container}>
                <div className={style.header}>
                    <div className={style.header__title}>계정 설정</div>
                    <button className={style.header__icon} onClick={handlePrev}>
                        <X />
                    </button>
                </div>
                <div className={style.contents}>
                    <div className={style.contents__navigation}>
                        <ul>
                            <li>A</li>
                            <li>B</li>
                            <li>C</li>
                        </ul>
                    </div>
                    <div className={style.contents__discription}>
                        <button>회원 탈퇴</button>
                    </div>
                </div>
            </div>
        </dialog>
    );
}

export default AccountDialog;
