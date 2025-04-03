import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AuthCallback from './pages/index/components/auth/AuthCallback';
import TempPage from './pages/index/components/auth/tempPage';
import SignIn from './pages/signIn/SignIn';
import SignUp from './pages/signUp/SignUp';
import LandingPage from './pages/landing/index';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route index path="/" element={<LandingPage />}></Route>
                <Route index path="/tempPage" element={<TempPage />}></Route>
                <Route index path="/signIn" element={<SignIn />}></Route>
                <Route index path="/signUp" element={<SignUp />}></Route>
                <Route
                    index
                    path="/auth/callback"
                    element={<AuthCallback />}
                ></Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
