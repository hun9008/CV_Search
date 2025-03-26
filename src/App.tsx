import { useState } from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainPage from '@pages/index/index';

function App() {
    const [count, setCount] = useState(0);

    return (
        <BrowserRouter>
            <Routes>
                <Route index path="/" element={<MainPage />}></Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
