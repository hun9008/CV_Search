import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AuthCallback from './pages/index/components/auth/AuthCallback';
import MainPage from './pages/index/index';
import SignIn from './pages/signIn/SignIn';
import SignUp from './pages/signUp/SignUp';
import LandingPage from './pages/landing/index';
import LoadingPage from './pages/loading/index';
import UploadPage from './pages/upload/Upload';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route index path="/" element={<LandingPage />}></Route>
                <Route index path="/main" element={<MainPage />}></Route>
                <Route index path="/signIn" element={<SignIn />}></Route>
                <Route index path="/signUp" element={<SignUp />}></Route>
                <Route index path="/loading" element={<LoadingPage />}></Route>
                <Route index path="/auth/callback" element={<AuthCallback />}></Route>
                <Route index path="/upload" element={<UploadPage />}></Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
