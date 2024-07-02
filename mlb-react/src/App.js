import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import OddsPage from './pages/OddsPage';
import LoginPage from './pages/LoginPage';
import Notification from './components/Notification';
import './App.css';
import { requestNotificationPermission } from './firebase';

function App() {
  const [lastUpdated, setLastUpdated] = useState('N/A');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sport, setSport] = useState('mlb');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationContent, setNotificationContent] = useState('');
  const [favorites, setFavorites] = useState({ mlb: [], wnba: [] });
  const [oddsData, setOddsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const updateLastUpdated = (date) => {
    setLastUpdated(date);
  };

  const handleLogin = async (username) => {
    setIsLoggedIn(true);
    await fetchFavoriteProps(sport);
  };

  const fetchFavoriteProps = async (sport) => {
    try {
      const response = await fetch(`/get_favorite_props?sport=${sport}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const favoriteProps = await response.json();
        const newFavorites = { mlb: [], wnba: [] };
        favoriteProps.forEach(fav => {
          newFavorites[sport].push(`${fav.player_name}${fav.prop}${fav.over_under}`);
        });
        setFavorites(prevFavorites => ({ ...prevFavorites, ...newFavorites }));
      }
    } catch (error) {
      console.error('Error fetching favorite props:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleReload = () => {
    setShowNotification(false);
    fetchOdds();
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  const fetchOdds = async () => {
    try {
      const response = await fetch(`/merged_data?sport=${sport}`);
      const data = await response.json();
      console.log('Fetched odds data:', data);
      setOddsData(data);
      setFilteredData(data);
      updateLastUpdated(formatDate(new Date()));
    } catch (error) {
      console.error('Error fetching odds data:', error);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleString('en-US', {
      hour12: true,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', sport === 'mlb' ? 'forest' : 'valentine');
  }, [sport]);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:5000/events');
    eventSource.onmessage = function(event) {
      console.log('New message:', event.data);
      setNotificationContent(event.data);
      setShowNotification(true);
    };
    eventSource.onerror = function(err) {
      console.error('SSE error:', err);
    };
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <Router>
      <div className={`App ${sport}`}>
        <ConditionalNavbar isLoggedIn={isLoggedIn} lastUpdated={lastUpdated} sport={sport} setSport={setSport} toggleSidebar={toggleSidebar} />
        <div className="main-content">
          {showNotification && (
            <Notification
              message={notificationContent}
              onReload={handleReload}
              onDismiss={handleDismiss}
            />
          )}
          <Routes>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/" element={isLoggedIn ? <Navigate to="/mlb" /> : <Navigate to="/login" />} />
            <Route path="/mlb" element={isLoggedIn ? <OddsPage updateLastUpdated={updateLastUpdated} sport="mlb" favorites={favorites} setFavorites={setFavorites} /> : <Navigate to="/login" />} />
            <Route path="/wnba" element={isLoggedIn ? <OddsPage updateLastUpdated={updateLastUpdated} sport="wnba" favorites={favorites} setFavorites={setFavorites} /> : <Navigate to="/login" />} />
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
