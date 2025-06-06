import { useEffect, useRef, useState } from 'react';
import style from './styles/ProfileDialog.module.scss';
import { User, UserCircle, Crown, LogOut, ChevronRight } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import { useNavigate } from 'react-router-dom';
import AccountDialog from './AccountDialog';
import useUserStore from '../../../store/userStore';

function ProfileDialog() {
    const [hidden, setHidden] = useState(true);
    const [accountHidden, setAccountHidden] = useState(true);
    const { clearTokens, setLogout, withdraw } = useAuthStore();
    const dropDownRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLButtonElement>(null);
    const navigate = useNavigate();
    const accessToken = useAuthStore.getState().accessToken;
    const { name, email } = useUserStore();

    const handleDropDownMenu = () => {
        setHidden((state) => !state);
    };

    const handleOutsideClick = (e: MouseEvent) => {
        if (
            dropDownRef.current &&
            profileRef.current &&
            !dropDownRef.current.contains(e.target as Node) &&
            !profileRef.current.contains(e.target as Node)
        ) {
            setHidden(true);
        }
    };

    const handleLogout = () => {
        setLogout(accessToken);
        clearTokens();

        navigate('/', { replace: true });
    };

    const handleWithdrawal = async () => {
        await withdraw(accessToken);
        clearTokens();
        navigate('/', { replace: true });
    };

    const hanldeAccountDialog = () => {
        setHidden((state) => !state); // 드롭 다운 메뉴 숨기기
        setAccountHidden(false);
    };

    useEffect(() => {
        document.addEventListener('click', handleOutsideClick);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, []);

    return (
        <>
            {accountHidden ? '' : <AccountDialog />}
            <div className={style.container}>
                <button className={style.userIcon} ref={profileRef} onClick={handleDropDownMenu}>
                    <User size={24} />
                </button>
            </div>
            <div
                className={`${style.dropdown} ${
                    hidden ? style.container__hidden : style.container__fadeIn
                }`}
                ref={dropDownRef}>
                <nav>
                    <div className={style.profile}>
                        <h2 className={style.profile__name}>{name}</h2>
                        <p className={style.profile__email}>{email}</p>
                    </div>
                    <span className={style.divider}></span>
                    <ul>
                        <li onClick={hanldeAccountDialog}>
                            <UserCircle size={18} className={style.menuIcon} />
                            계정
                            <ChevronRight size={16} className={style.menuArrow} />
                        </li>
                    </ul>

                    <span className={style.divider}></span>

                    <span className={style.divider}></span>
                    <div className={style.logout} onClick={handleLogout}>
                        <LogOut size={18} className={style.logoutIcon} />
                        로그아웃
                    </div>
                    <div className={style.logout} onClick={handleWithdrawal}>
                        <LogOut size={18} className={style.logoutIcon} />
                        탈퇴
                    </div>
                </nav>
            </div>
        </>
    );
}

export default ProfileDialog;
