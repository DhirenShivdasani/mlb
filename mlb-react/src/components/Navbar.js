import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Navbar = ({ lastUpdated }) => {
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

export default Navbar;
