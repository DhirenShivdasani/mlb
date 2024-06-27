import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import OddsPage from './pages/OddsPage';
import LoginPage from './pages/LoginPage';
import './App.css';

function App() {
  const [lastUpdated, setLastUpdated] = useState('N/A');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sport, setSport] = useState('mlb'); // State for selected sport

  const updateLastUpdated = (date) => {
    setLastUpdated(date);
  };

  const handleLogin = (username) => {
    setIsLoggedIn(true);
    console.log(`User ${username} logged in.`);
  };

  return (
    <Router>
      <div className="App">
        <ConditionalNavbar isLoggedIn={isLoggedIn} lastUpdated={lastUpdated} sport={sport} setSport={setSport} />

        <Routes>
          <Route 
            path="/" 
            element={
              isLoggedIn ? (
                <OddsPage updateLastUpdated={updateLastUpdated} sport={sport} />
              ) : (
                <LoginPage onLogin={handleLogin} />
              )
            } 
          />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route 
            path="/:sport" 
            element={
              isLoggedIn ? (
                <OddsPage updateLastUpdated={updateLastUpdated} sport={sport} />
              ) : (
                <LoginPage onLogin={handleLogin} />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

const ConditionalNavbar = ({ isLoggedIn, lastUpdated, sport, setSport }) => {
  const location = useLocation();

  if (location.pathname === '/login') {
    return null;
  }

  return isLoggedIn && <Navbar lastUpdated={lastUpdated} sport={sport} setSport={setSport} />;
};

export default App;
