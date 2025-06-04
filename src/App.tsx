import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AuthCallback from './pages/index/components/auth/AuthCallback';
import MainPage from './pages/index/index';
import SignIn from './pages/signIn/SignIn';
import SignUp from './pages/signUp/SignUp';
import LandingPage from './pages/landing/index';
import LoadingPage from './pages/loading/index';
import UploadPage from './pages/upload/Upload';
import Dashboard from './pages/index/components/admin/dashboard/Dashboard';
import Bookmark from './pages/index/components/bookmark/Bookmark';
import MyCv from './pages/index/components/myCv/MyCv';
import JobManage from './pages/index/components/admin/manage/JobManage';
import CustomerFeedback from './pages/index/components/admin/customerService/CustomerFeedback';
import Manage from './pages/index/components/manage/Manage';
import RecommendJob from './pages/index/components/jobList/RecommendJob';
import SearchPage from './pages/index/components/search/SearchPage';
import { CheckoutPage } from './components/common/billing/Checkout';
import { SuccessPage } from './components/common/billing/Success';
import { FailPage } from './components/common/billing/Fail';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/main" element={<MainPage />}>
                    <Route path="bookmark" element={<Bookmark />}></Route>
                    <Route path="manage" element={<Manage />}></Route>
                    <Route path="recommend" element={<RecommendJob />}></Route>
                    <Route path="mycv" element={<MyCv />}></Route>
                    <Route path="searchResult" element={<SearchPage />}></Route>
                    <Route path="admin/dashboard" element={<Dashboard />}></Route>
                    <Route path="admin/jobManage" element={<JobManage />}></Route>
                    <Route path="admin/feedback" element={<CustomerFeedback />}></Route>
                </Route>
                <Route index path="/upload" element={<UploadPage />}></Route>
                <Route index path="/auth/callback" element={<AuthCallback />}></Route>
                <Route index path="/loading" element={<LoadingPage />}></Route>
                <Route index path="/" element={<LandingPage />}></Route>
                <Route index path="/signIn" element={<SignIn />}></Route>
                <Route index path="/signUp" element={<SignUp />}></Route>
                <Route path="/payments" element={<CheckoutPage />}></Route>
                <Route path="/success" element={<SuccessPage />}></Route>
                <Route path="/fail" element={<FailPage />}></Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
