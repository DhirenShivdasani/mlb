import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import OddsPage from './pages/OddsPage';
import LoginPage from './pages/LoginPage';
import './App.css';

function App() {
  const [lastUpdated, setLastUpdated] = useState('N/A');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sport, setSport] = useState('mlb');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const updateLastUpdated = (date) => {
    setLastUpdated(date);
  };

  const handleLogin = (username) => {
    setIsLoggedIn(true);
    console.log(`User ${username} logged in.`);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', sport === 'mlb' ? 'forest' : 'valentine');
  }, [sport]);

  return (
    <Router>
      <div className={`App ${sport}`}>
        <ConditionalNavbar isLoggedIn={isLoggedIn} lastUpdated={lastUpdated} sport={sport} setSport={setSport} toggleSidebar={toggleSidebar} />
        <div className="main-content">
          <Routes>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/" element={isLoggedIn ? <Navigate to="/mlb" /> : <Navigate to="/login" />} />
            <Route path="/mlb" element={isLoggedIn ? <OddsPage updateLastUpdated={updateLastUpdated} sport="mlb" /> : <Navigate to="/login" />} />
            <Route path="/wnba" element={isLoggedIn ? <OddsPage updateLastUpdated={updateLastUpdated} sport="wnba" /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

const ConditionalNavbar = ({ isLoggedIn, lastUpdated, sport, setSport, toggleSidebar }) => {
  const location = useLocation();

  if (location.pathname === '/login') {
    return null;
  }

  return isLoggedIn && <Navbar lastUpdated={lastUpdated} sport={sport} setSport={setSport} toggleSidebar={toggleSidebar} />;
};

export default App;
