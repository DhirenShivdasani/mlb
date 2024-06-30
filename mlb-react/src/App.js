import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import OddsPage from './pages/OddsPage';
import LoginPage from './pages/LoginPage';
import './App.css';
import { requestNotificationPermission } from './firebase';
import { getMessaging, onMessage } from 'firebase/messaging';

function App() {
  const [lastUpdated, setLastUpdated] = useState('N/A');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sport, setSport] = useState('mlb');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [favorites, setFavorites] = useState({ mlb: [], wnba: [] });

  const updateLastUpdated = (date) => {
    setLastUpdated(date);
  };

  const handleLogin = async (username) => {
    setIsLoggedIn(true);
    console.log(`User ${username} logged in.`);
    await fetchFavoriteProps(sport);
  };

  const fetchFavoriteProps = async (sport) => {
    try {
      const response = await fetch(`/get_favorite_props?sport=${sport}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const favoriteProps = await response.json();
        console.log("Fetched favorite props:", favoriteProps); // Debug print
        const newFavorites = { mlb: [], wnba: [] };
        favoriteProps.forEach(fav => {
          newFavorites[sport].push(`${fav.player_name}${fav.prop}${fav.over_under}`);
        });
        setFavorites(prevFavorites => ({ ...prevFavorites, ...newFavorites }));
      } else {
        console.error('Failed to fetch favorite props');
      }
    } catch (error) {
      console.error('Error fetching favorite props:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', sport === 'mlb' ? 'forest' : 'valentine');
  }, [sport]);

  useEffect(() => {
    const fetchToken = async () => {
      const token = await requestNotificationPermission();
      if (token) {
        console.log('FCM Token:', token);
        // Optionally, send the token to your server
      }
    };
    fetchToken();

    const messaging = getMessaging();
    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      setNotifications((prev) => [...prev, payload.notification]);
      alert(`Notification received: ${payload.notification.title} - ${payload.notification.body}`);
    });
  }, []);

  return (
    <Router>
      <div className={`App ${sport}`}>
        <ConditionalNavbar isLoggedIn={isLoggedIn} lastUpdated={lastUpdated} sport={sport} setSport={setSport} toggleSidebar={toggleSidebar} />
        <div className="main-content">
          <Routes>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/" element={isLoggedIn ? <Navigate to="/mlb" /> : <Navigate to="/login" />} />
            <Route path="/mlb" element={isLoggedIn ? <OddsPage updateLastUpdated={updateLastUpdated} sport="mlb" favorites={favorites} setFavorites={setFavorites} /> : <Navigate to="/login" />} />
            <Route path="/wnba" element={isLoggedIn ? <OddsPage updateLastUpdated={updateLastUpdated} sport="wnba" favorites={favorites} setFavorites={setFavorites} /> : <Navigate to="/login" />} />
          </Routes>
          <ul>
            {notifications.map((notification, index) => (
              <li key={index}>
                <strong>{notification.title}</strong>: {notification.body}
              </li>
            ))}
          </ul>
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
