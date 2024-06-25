import logo from './logo.svg';
import './App.css';
import StatCard from './components/StatCard';
import { useState } from 'react';
import OddsPage from './pages/OddsPage';

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';



function App() {
  const [lastUpdated, setLastUpdated] = useState('N/A');
  
  const updateLastUpdated = (date) => {
    setLastUpdated(date);
  };

  return (
    <Router>
      <div className="App">
        <Navbar lastUpdated={lastUpdated} />
        <Routes>
          
          <Route path="/" element={<OddsPage updateLastUpdated={updateLastUpdated} />} />
          {/* Add more routes as needed */}
        </Routes>
      </div>
    </Router>
  );
}

const Navbar = ({ lastUpdated }) => {
  const handleLogout = () => {
    // Logic for logout
    console.log('Logged out');
  };

  return (
    <div className="navbar bg-base-100 shadow-lg px-4 py-2 flex justify-between items-center">
      <div>
        <a className="btn btn-ghost normal-case text-xl" href="/">Live Odds Tracker</a>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-400">Last updated: {lastUpdated}</div>
        <button className="btn btn-primary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default App;