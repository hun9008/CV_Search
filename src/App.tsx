import { useState } from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainPage from '@pages/index/index';
import TempPage from './pages/index/components/tempPage';

function App() {
    const [count, setCount] = useState(0);

    return (
        <BrowserRouter>
            <Routes>
                <Route index path="/" element={<MainPage />}></Route>
                <Route index path="/tempPage" element={<TempPage />}></Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
