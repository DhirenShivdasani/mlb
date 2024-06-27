import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate

const Navbar = ({ lastUpdated, sport, setSport }) => {
  const navigate = useNavigate(); // Initialize navigate

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

  const handleSportChange = (e) => {
    const selectedSport = e.target.value;
    setSport(selectedSport);
    navigate(`/${selectedSport}`);
  };

  return (
    <div className="navbar bg-base-100 shadow-lg px-4 py-2 flex justify-between items-center">
      <div>
        <a className="btn btn-ghost normal-case text-xl" href="/">Live Odds Tracker</a>
      </div>
      <div className="flex items-center space-x-4">
        <select 
          value={sport} 
          onChange={handleSportChange} 
          className="sport-selector"
        >
          <option value="mlb">MLB</option>
          <option value="wnba">WNBA</option>
        </select>
        <div className="text-sm text-gray-400">Last updated: {lastUpdated}</div>
        <button className="btn btn-primary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;

