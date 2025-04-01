import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainPage from './pages/index/index';
import AuthCallback from './pages/index/components/auth/AuthCallback';
import TempPage from './pages/index/components/auth/tempPage';
import LandingPage from './pages/landing/index';
import SignIn from './pages/signIn/SignIn';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route index path="/" element={<SignIn />}></Route>
                <Route index path="/tempPage" element={<TempPage />}></Route>
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
