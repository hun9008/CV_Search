import axios from 'axios';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../../store/authStore';
import useUserStore from '../../../../store/userStore';
import LoadingSpinner from '../../../../components/common/loading/LoadingSpinner';
import { SERVER_IP } from '../../../../constants/env';
import useJobStore from '../../../../store/jobStore';

function AuthCallback() {
    const navigate = useNavigate();
    const { setTokens, setIsLoggedIn } = useAuthStore();
    const { fetchUserData } = useUserStore();
    const { getSelectedCvId } = useJobStore();

    useEffect(() => {
        axios
            .get(`${SERVER_IP}/auth/callback-endpoint`, {
                withCredentials: true,
            })
            .then(async (res) => {
                console.log(res.data);
                const { accessToken, firstLogin } = res.data;

                if (!accessToken) {
                    console.error('Access token이 없습니다');
                    navigate('/signIn');
                    return;
                }

                setTokens(accessToken);
                setIsLoggedIn(true);
                const isAdmin = await fetchUserData(accessToken);

                if (isAdmin) {
                    navigate('/main/admin/dashboard', { replace: true });
                    return;
                }

                // 로컬 스토리지의 CV 여부 검사
                if (!localStorage.getItem('cv-storage')) {
                    try {
                        await getSelectedCvId();
                    } catch (error) {
                        console.error(error);
                        navigate('/upload', { replace: true });
                        return;
                    }
                }

                if (firstLogin) {
                    navigate('/upload', { replace: true });
                    return;
                } else {
                    navigate('/main/recommend', { replace: true });
                    return;
                }
            })
            .catch((err) => {
                console.error('콜백 처리 중 오류', err);
                navigate('/signIn', { replace: true });
            });
    }, [navigate, setTokens]);

    return <LoadingSpinner />;
}

export default AuthCallback;
