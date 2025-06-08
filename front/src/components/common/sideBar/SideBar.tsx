import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    ClipboardList,
    Star,
    Bookmark,
    User,
    Crown,
    LayoutDashboard,
    Briefcase,
    Sticker,
} from 'lucide-react';
import usePageStore from '../../../store/pageStore';
import style from './SideBar.module.scss';
import useUserStore from '../../../store/userStore';
import SideBarProfileDialog from '../dialog/SideBarProfileDialog';
import { useEffect, useState } from 'react'; // useState 추가
import useAuthStore from '../../../store/authStore';
import PricingDialog from '../pricing/PricingDialog'; // PricingDialog import 추가

function SideBar() {
    const { name, email, fetchUserData } = useUserStore();
    const userPlan = useUserStore((state) => state.plan);
    const isAdmin = useUserStore((state) => state.isAdmin);
    const [activeContent, setActiveContent] = useState('');
    const isCompactMenu = usePageStore((state) => state.isCompactMenu);
    const setPreviousPage = usePageStore((state) => state.setPreviousPage);
    const navigate = useNavigate();
    type userPageContent = (typeof userMenuItems)[number]['id'];
    type adminPageContent = (typeof adminMenuItems)[number]['id'];
    const location = useLocation();
    const path = location.pathname;

    const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false); // 다이얼로그 상태 추가

    useEffect(() => {
        const currentMenu = (path: string) => {
            if (path.includes('recommend')) return '추천 공고';
            if (path.includes('bookmark')) return '북마크';
            if (path.includes('manage')) return '지원 관리';
            if (path.includes('mycv')) return '나의 CV';
            if (path.includes('dashboard')) return '대시보드';
            if (path.includes('jobManage')) return '공고 관리';
            if (path.includes('feedback')) return '피드백 관리';
        };
        const current = currentMenu(path);
        setActiveContent(current ?? '');
    }, [path]);

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

        // {
        //     id: 'CV 생성',
        //     path: '/main',
        //     icon: FileUser,
        // },
    ] as const;

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
        const accessToken = useAuthStore.getState().accessToken;
        if (accessToken) {
            fetchUserData(accessToken);
        }
    }, [fetchUserData]);

    const handleUpgradeClick = () => {
        setPreviousPage(location.pathname);
        setIsPricingDialogOpen(true);
    };

    return (
        <>
            {' '}
            {/* Fragment로 감싸서 PricingDialog를 형제 요소로 추가 */}
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
                                              <span className={style.sidebar__menuText}>
                                                  {item.id}
                                              </span>
                                          </Link>
                                      </li>
                                  ))
                                : userMenuItems.map((item) => (
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
                                              <span className={style.sidebar__menuText}>
                                                  {item.id}
                                              </span>
                                          </Link>
                                      </li>
                                  ))}
                        </ul>

                        <div className={style.sidebar__subConatiner}>
                            {isAdmin || userPlan === '베이직' ? (
                                ''
                            ) : (
                                <div className={style.plan}>
                                    <div className={style.plan__textContainer}>
                                        <h3>
                                            <Crown size={16} className={style.planIcon} />
                                            스타터 플랜
                                        </h3>
                                        <p>제한적인 추천과 관리만 제공됩니다</p>
                                    </div>
                                    <button
                                        className={style.plan__upgrade}
                                        onClick={handleUpgradeClick} // onClick 핸들러 연결
                                    >
                                        업그레이드
                                    </button>
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
            {/* TODO: 추후 유저 플랜에 따라 UI 조정 가능 */}
            {userPlan === '스타터' ? (
                <PricingDialog
                    isOpen={isPricingDialogOpen}
                    onClose={() => setIsPricingDialogOpen(false)}
                />
            ) : (
                ''
            )}
        </>
    );
}

export default SideBar;
