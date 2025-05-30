import useUserStore from '../store/userStore';
import useAuthStore from '../store/authStore';

function verifyAdmin() {
    const fetchUserData = useUserStore.getState().fetchUserData;
    const accessToken = useAuthStore.getState().accessToken;

    const verify = async (accessToken: string | null) => {
        const res = await fetchUserData(accessToken);
        return res;
    };
    return verify(accessToken);
}

export default verifyAdmin;
