import { Link, useNavigate } from 'react-router-dom';
import {
    ClipboardList,
    Star,
    Bookmark,
    User,
    Crown,
    FileUser,
    LayoutDashboard,
    Briefcase,
    Sticker,
} from 'lucide-react';
import usePageStore from '../../../store/pageStore';
import style from './SideBar.module.scss';
import useUserStore from '../../../store/userStore';
import SideBarProfileDialog from '../dialog/SideBarProfileDialog';
import { useEffect } from 'react';
import useAuthStore from '../../../store/authStore';
function SideBar() {
    const { setActiveContent } = usePageStore();
    const { name, email, fetchUserData } = useUserStore();
    const isAdmin = useUserStore((state) => state.isAdmin);
    const activeContent = usePageStore((state) => state.activeContent);
    const isCompactMenu = usePageStore((state) => state.isCompactMenu);
    const navigate = useNavigate();
    type userPageContent = (typeof userMenuItems)[number]['id'];
    type adminPageContent = (typeof adminMenuItems)[number]['id'];

    const userMenuItems = [
        {
            id: '지원 관리',
            path: 'manage',
            icon: ClipboardList,
        },
        {
            id: '추천 공고',
            path: 'recommend',
            icon: Star,
        },
        {
            id: '북마크',
            path: 'bookmark',
            icon: Bookmark,
        },
        {
            id: '나의 CV',
            path: 'mycv',
            icon: User,
        },

        {
            id: 'CV 생성',
            path: '/main',
            icon: FileUser,
        },
    ] as const; // as const를 붙이면 타입을 추론하는 것이 아니라 리터럴 자체로 고정됨

    const adminMenuItems = [
        {
            id: '대시보드',
            path: 'admin/dashboard',
            icon: LayoutDashboard,
        },
        {
            id: '공고 관리',
            path: 'admin/jobManage',
            icon: Briefcase,
        },
        { id: '피드백 관리', path: 'admin/feedback', icon: Sticker },
    ] as const;

    const handleMenuClick = (menuId: userPageContent | adminPageContent) => {
        setActiveContent(menuId);
    };

    const handleLogoClick = () => {
        navigate('/');
    };

    useEffect(() => {
        const accessToken = useAuthStore.getState().accessToken; // 쿠키에서 가져오든, 로컬 변수든
        if (accessToken) {
            fetchUserData(accessToken);
        }
    }, []);

    return (
        <div className={`${style.sidebar} ${isCompactMenu ? style.sidebar__hidden : ''}`}>
            <div className={style.sidebar__container}>
                {isAdmin ? (
                    <div className={style.sidebar__logo}>goodJob</div>
                ) : (
                    <div className={style.sidebar__logo} onClick={handleLogoClick}>
                        goodJob
                    </div>
                )}

                <div className={style.sidebar__navigation}>
                    <ul className={style.sidebar__menu}>
                        {isAdmin
                            ? adminMenuItems.map((item) => (
                                  <li key={item.id} className={style.sidebar__menuItem}>
                                      <Link
                                          to={item.path}
                                          className={`${style.sidebar__menuLink} ${
                                              activeContent === item.id ? style.active : ''
                                          }`}
                                          onClick={() => handleMenuClick(item.id)}>
                                          <item.icon
                                              className={style.sidebar__menuIcon}
                                              size={24}
                                          />
                                          <span className={style.sidebar__menuText}>{item.id}</span>
                                      </Link>
                                  </li>
                              ))
                            : userMenuItems.map((item) => (
                                  <li key={item.id} className={style.sidebar__menuItem}>
                                      <Link // 이후 삭제할 것
                                          to={item.path}
                                          className={`${style.sidebar__menuLink} ${
                                              activeContent === item.id ? style.active : ''
                                          }`}
                                          onClick={() => handleMenuClick(item.id)}>
                                          <item.icon
                                              className={style.sidebar__menuIcon}
                                              size={24}
                                          />
                                          <span className={style.sidebar__menuText}>{item.id}</span>
                                      </Link>
                                  </li>
                              ))}
                    </ul>

                    <div className={style.sidebar__subConatiner}>
                        {isAdmin ? (
                            ''
                        ) : (
                            <div className={style.plan}>
                                <div className={style.plan__textContainer}>
                                    <h3>
                                        <Crown size={16} className={style.planIcon} />
                                        베이직 플랜
                                    </h3>
                                    <p>제한적인 추천과 관리만 제공됩니다</p>
                                </div>
                                <button className={style.plan__upgrade}>업그레이드</button>
                            </div>
                        )}

                        <span className={style.divider}></span>
                        <div className={style.sidebar__profile}>
                            <SideBarProfileDialog />
                            <div className={style.sidebar__profile__textArea}>
                                <p className={style.userName}>{name}</p>
                                <p className={style.userEmail}>{email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SideBar;
