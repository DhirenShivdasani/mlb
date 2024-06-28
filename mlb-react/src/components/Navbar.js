import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ lastUpdated, sport, setSport, toggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await fetch('/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        navigate('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleSportChange = (newSport) => {
    setSport(newSport);
    navigate(`/${newSport}`);
  };

  return (
    <div class="navbar-container">
      <div class="navbar"></div>
        <div className="navbar bg-base-100 shadow-lg px-4 py-2 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={toggleSidebar} className="btn btn-ghost">
              ☰
            </button>
            <a className="btn btn-ghost normal-case text-xl" href="/">Live Odds Tracker</a>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">Last updated: {lastUpdated}</div>
            <button 
              className={`btn ${sport === 'mlb' ? 'btn-primary' : 'btn-secondary wnba-link'}`} 
              onClick={() => handleSportChange('mlb')}
            >
              MLB
            </button>
            <button 
              className={`btn ${sport === 'wnba' ? 'btn-primary' : 'btn-secondary mlb-link'}`} 
              onClick={() => handleSportChange('wnba')}
            >
              WNBA
            </button>
            <button className="btn btn-primary" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <div class="navbar-border"></div>
    </div>
  );
};

export default Navbar;
